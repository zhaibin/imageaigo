// Unsplash 自动同步模块
import { generateHash } from './utils.js';
import { analyzeImage, getImageDimensions } from './analyzer.js';
import { generateSlug } from './slug-generator.js';

// Cron 触发器 - 每天同步一次 Unsplash 最新图片
export async function handleUnsplashSync(env) {
  console.log('[UnsplashSync] Starting daily Unsplash sync');
  
  const UNSPLASH_ACCESS_KEY = env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('[UnsplashSync] UNSPLASH_ACCESS_KEY not configured');
    return { success: false, error: 'API key not configured' };
  }
  
  try {
    // 获取最新的高质量图片（每天10张）
    const perPage = 10;
    const response = await fetch(
      `https://api.unsplash.com/photos?page=1&per_page=${perPage}&order_by=latest`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const photos = await response.json();
    console.log(`[UnsplashSync] Fetched ${photos.length} photos from Unsplash`);
    
    let processed = 0;
    let skipped = 0;
    let failed = 0;
    
    // 并发处理图片（每次3张）
    const concurrency = 3;
    for (let i = 0; i < photos.length; i += concurrency) {
      const batch = photos.slice(i, i + concurrency);
      
      const results = await Promise.allSettled(
        batch.map(photo => processUnsplashPhoto(photo, env))
      );
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.status === 'completed') {
            processed++;
          } else if (result.value.status === 'skipped') {
            skipped++;
          }
        } else {
          failed++;
          console.error('[UnsplashSync] Photo processing failed:', result.reason);
        }
      }
      
      // 批次间延迟
      if (i + concurrency < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`[UnsplashSync] Completed: ${processed} processed, ${skipped} skipped, ${failed} failed`);
    
    return {
      success: true,
      processed,
      skipped,
      failed,
      total: photos.length
    };
    
  } catch (error) {
    console.error('[UnsplashSync] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 处理单张 Unsplash 图片
async function processUnsplashPhoto(photo, env) {
  const startTime = Date.now();
  
  try {
    console.log(`[UnsplashSync] Processing photo: ${photo.id} - ${photo.alt_description || 'Untitled'}`);
    
    // 下载图片（使用 regular 尺寸，平衡质量和大小）
    const imageUrl = photo.urls.regular;
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const imageData = await imageResponse.arrayBuffer();
    
    // 检查大小
    if (imageData.byteLength > 20 * 1024 * 1024) {
      console.warn(`[UnsplashSync] Photo ${photo.id} too large, skipping`);
      return { status: 'skipped', reason: 'File too large' };
    }
    
    // 生成哈希
    const imageHash = await generateHash(imageData);
    console.log(`[UnsplashSync] Generated hash for ${photo.id}: ${typeof imageHash}, length: ${imageHash?.length}`);
    
    // 确保 imageHash 是字符串
    if (typeof imageHash !== 'string' || !imageHash) {
      throw new Error(`Invalid image hash: ${typeof imageHash}`);
    }
    
    // 检查是否已存在
    const existing = await env.DB.prepare('SELECT id, slug FROM images WHERE image_hash = ?')
      .bind(imageHash).first();
    
    if (existing) {
      console.log(`[UnsplashSync] Photo ${photo.id} already exists: ${existing.slug}`);
      return { status: 'skipped', reason: 'Duplicate' };
    }
    
    // 上传到 R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const hashPrefix = imageHash.substring(0, 12);
    const r2Key = `images/${timestamp}-${randomStr}-${hashPrefix}.jpg`;
    
    await env.R2.put(r2Key, imageData, {
      httpMetadata: { 
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        hash: imageHash,
        sourceUrl: 'unsplash',
        unsplashId: photo.id,
        unsplashAuthor: photo.user.name,
        unsplashLink: photo.links.html
      }
    });
    
    const finalUrl = `/r2/${r2Key}`;
    
    // 获取图片尺寸
    const dimensions = await getImageDimensions(imageData);
    
    // AI 分析
    const analysis = await analyzeImage(imageData, env.AI);
    analysis.dimensions = dimensions;
    
    // 添加来源信息到描述
    if (photo.user && photo.user.name) {
      analysis.unsplashCredit = `Photo by ${photo.user.name} on Unsplash`;
    }
    
    // 存储到数据库
    const slug = await generateSlug(analysis.description, env.DB);
    
    const result = await env.DB.prepare(`
      INSERT INTO images (slug, image_url, image_hash, description, width, height, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      slug,
      finalUrl,
      imageHash,
      analysis.description,
      dimensions?.width || null,
      dimensions?.height || null
    ).run();
    
    const imageId = result.meta.last_row_id;
    
    // 插入标签
    if (analysis.tags) {
      const allTags = [
        ...(analysis.tags.primary || []),
        ...(analysis.tags.subcategories || []),
        ...(analysis.tags.attributes || [])
      ];
      
      for (const tag of allTags) {
        let tagRecord = await env.DB.prepare('SELECT id FROM tags WHERE name = ? AND level = ?')
          .bind(tag.name, tag.level).first();
        
        if (!tagRecord) {
          const tagResult = await env.DB.prepare('INSERT INTO tags (name, level) VALUES (?, ?)')
            .bind(tag.name, tag.level).run();
          tagRecord = { id: tagResult.meta.last_row_id };
        }
        
        await env.DB.prepare('INSERT INTO image_tags (image_id, tag_id, weight) VALUES (?, ?, ?)')
          .bind(imageId, tagRecord.id, tag.confidence || 0.5).run();
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[UnsplashSync] Photo ${photo.id} processed successfully: ${slug} (${duration}ms)`);
    
    return { status: 'completed', imageId, slug };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[UnsplashSync] Photo ${photo.id} failed after ${duration}ms:`, error.message);
    throw error;
  }
}
