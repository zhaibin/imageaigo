/**
 * Unsplash 自动同步模块 - 串行处理版本
 * 一张一张处理，逻辑与单张上传完全一致，避免超时
 */

import { generateHash } from '../lib/utils.js';
import { analyzeImage, getImageDimensions } from './ai/analyzer.js';
import { generateSlug } from './slug.js';

/**
 * Cron 触发器 - 每天同步一次 Unsplash 随机图片
 * 串行处理每张图片，避免超时和并发问题
 */
export async function handleUnsplashSync(env) {
  console.log('[UnsplashSync] Starting daily sync (serial mode)');
  
  const UNSPLASH_ACCESS_KEY = env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('[UnsplashSync] UNSPLASH_ACCESS_KEY not configured');
    return { success: false, error: 'API key not configured' };
  }
  
  try {
    // 获取 30 张随机图片（Unsplash API 限制）
    const count = 30;
    console.log(`[UnsplashSync] Fetching ${count} photos from Unsplash`);
    
    const response = await fetch(
      `https://api.unsplash.com/photos/random?count=${count}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
    }
    
    const photos = await response.json();
    console.log(`[UnsplashSync] Fetched ${photos.length} photos`);
    
    // 查询随机用户（一次查询，避免重复）
    const randomUsers = await env.DB.prepare(
      'SELECT id FROM users WHERE is_random = 1 ORDER BY id'
    ).all();
    
    if (!randomUsers.results || randomUsers.results.length === 0) {
      console.warn('[UnsplashSync] No random users found');
      return { success: false, error: 'No random users available' };
    }
    
    let completed = 0;
    let skipped = 0;
    let failed = 0;
    
    // 串行处理：一张一张处理
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoNum = i + 1;
      
      try {
        console.log(`[UnsplashSync:${photoNum}/${photos.length}] Processing ${photo.id}`);
        
        // 1. 下载图片（10秒超时）
        const imageUrl = photo.urls.regular;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const imageResponse = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!imageResponse.ok) {
          console.warn(`[UnsplashSync:${photoNum}] Download failed: HTTP ${imageResponse.status}`);
          failed++;
          continue; // 跳过这张，继续下一张
        }
        
        const imageData = await imageResponse.arrayBuffer();
        const sizeMB = imageData.byteLength / (1024 * 1024);
        
        // 2. 检查大小
        if (sizeMB > 20) {
          console.warn(`[UnsplashSync:${photoNum}] Too large: ${sizeMB.toFixed(2)}MB, skipped`);
          skipped++;
          continue;
        }
        
        console.log(`[UnsplashSync:${photoNum}] Downloaded: ${sizeMB.toFixed(2)}MB`);
        
        // 3. 检查重复
        const imageHash = await generateHash(imageData);
        const existing = await env.DB.prepare(
          'SELECT id, slug FROM images WHERE image_hash = ?'
        ).bind(imageHash).first();
        
        if (existing) {
          console.log(`[UnsplashSync:${photoNum}] Duplicate: ${existing.slug}, skipped`);
          skipped++;
          continue; // 重复直接跳过，不进行 AI 分析 ✅
        }
        
        // 4. 处理图片（与单张上传逻辑完全一致）
        const result = await processSingleUnsplashImage(
          env,
          imageData,
          imageHash,
          randomUsers.results,
          photo
        );
        
        if (result.success) {
          console.log(`[UnsplashSync:${photoNum}] ✅ Success: ${result.slug}`);
          completed++;
        } else {
          console.warn(`[UnsplashSync:${photoNum}] ❌ AI failed, skipped: ${result.error}`);
          skipped++; // AI 分析失败也跳过 ✅
        }
        
      } catch (error) {
        console.error(`[UnsplashSync:${photoNum}] Error: ${error.message}, skipped`);
        failed++;
        // 继续处理下一张
      }
    }
    
    console.log(`[UnsplashSync] Completed: ${completed} success, ${skipped} skipped, ${failed} failed`);
    
    return {
      success: true,
      completed,
      skipped,
      failed,
      total: photos.length,
      message: `${completed} photos processed, ${skipped} skipped`
    };
    
  } catch (error) {
    console.error('[UnsplashSync] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 处理单张 Unsplash 图片
 * 逻辑与前端单张上传完全一致
 */
async function processSingleUnsplashImage(env, imageData, imageHash, randomUsers, photo) {
  try {
    // 随机选择一个用户
    const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
    const userId = randomUser.id;
    
    // 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const baseKey = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}`;
    const r2Key = `${baseKey}-original.jpg`;
    
    // 1. 上传原图到 R2
    await env.R2.put(r2Key, imageData, {
      httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        hash: imageHash,
        type: 'original',
        source: 'unsplash',
        unsplashId: photo.id,
        unsplashAuthor: photo.user?.name || 'Unknown'
      }
    });
    
    const finalUrl = `/r2/${r2Key}`;
    
    // 2. 获取原图尺寸
    const dimensions = await getImageDimensions(imageData);
    const maxDimension = Math.max(dimensions.width, dimensions.height);
    
    // 3. 生成展示图（1080px WebP）如果需要
    let displayUrl = finalUrl;
    if (maxDimension > 1080) {
      try {
        const displayResponse = await fetch(`https://imageaigo.cc${finalUrl}`, {
          cf: {
            image: {
              width: 1080,
              height: 1080,
              quality: 85,
              fit: 'scale-down',
              format: 'webp'
            }
          }
        });
        
        if (displayResponse.ok) {
          const displayImageData = await displayResponse.arrayBuffer();
          const displayKey = `${baseKey}-display.webp`;
          
          await env.R2.put(displayKey, displayImageData, {
            httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' },
            customMetadata: {
              uploadedAt: new Date().toISOString(),
              hash: imageHash,
              type: 'display',
              originalKey: r2Key
            }
          });
          
          displayUrl = `/r2/${displayKey}`;
          console.log(`  Display: ${(displayImageData.byteLength / 1024).toFixed(2)}KB WebP`);
        }
      } catch (err) {
        console.warn('  Display generation failed:', err.message);
      }
    }
    
    // 4. 生成 AI 分析图（256px JPEG）
    let aiImageData = imageData;
    const sizeMB = imageData.byteLength / (1024 * 1024);
    
    if (sizeMB > 2) {
      try {
        const aiResponse = await fetch(`https://imageaigo.cc${finalUrl}`, {
          cf: {
            image: {
              width: 256,
              height: 256,
              quality: 80,
              fit: 'scale-down',
              format: 'jpeg'
            }
          }
        });
        
        if (aiResponse.ok) {
          aiImageData = await aiResponse.arrayBuffer();
          console.log(`  AI image: ${(aiImageData.byteLength / 1024).toFixed(2)}KB`);
        } else if (sizeMB > 10) {
          // 大图片必须压缩
          throw new Error(`Image too large (${sizeMB.toFixed(2)}MB) and resizing failed`);
        }
      } catch (err) {
        if (sizeMB > 10) {
          throw err; // 大图片必须压缩，失败则抛出
        }
        console.warn('  AI image generation failed, using original');
      }
    }
    
    // 5. AI 分析（60秒超时）
    let analysis;
    try {
      analysis = await Promise.race([
        analyzeImage(aiImageData, env.AI),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout (60s)')), 60000)
        )
      ]);
      
      if (!analysis || !analysis.description) {
        throw new Error('AI analysis returned invalid result');
      }
      
      analysis.dimensions = dimensions;
      console.log(`  AI analysis: OK`);
      
    } catch (aiError) {
      console.error('  AI analysis failed:', aiError.message);
      // AI 分析失败则跳过此图片 ✅
      return { success: false, error: aiError.message };
    }
    
    // 6. 存储到数据库
    const slug = generateSlug(analysis.description, imageHash);
    
    const insertResult = await env.DB.prepare(
      'INSERT INTO images (slug, image_url, display_url, image_hash, description, width, height, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))'
    ).bind(
      slug,
      finalUrl,
      displayUrl,
      imageHash,
      analysis.description,
      dimensions.width,
      dimensions.height,
      userId
    ).run();
    
    const imageId = insertResult.meta.last_row_id;
    
    // 7. 存储标签
    await storeTags(env.DB, imageId, analysis.tags);
    
    console.log(`  Stored: ${slug}`);
    
    return { success: true, slug, imageId };
    
  } catch (error) {
    console.error('  Processing error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 存储标签
 */
async function storeTags(db, imageId, tagsStructure) {
  if (!tagsStructure || !tagsStructure.primary) return;
  
  for (const primary of tagsStructure.primary || []) {
    const tagId = await getOrCreateTag(db, primary.name, 1, null);
    await db.prepare(
      'INSERT OR REPLACE INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 1)'
    ).bind(imageId, tagId, primary.weight || 1.0).run();

    if (primary.subcategories) {
      for (const sub of primary.subcategories) {
        const subTagId = await getOrCreateTag(db, sub.name, 2, tagId);
        await db.prepare(
          'INSERT OR REPLACE INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 2)'
        ).bind(imageId, subTagId, sub.weight || 1.0).run();

        if (sub.attributes) {
          for (const attr of sub.attributes) {
            const attrTagId = await getOrCreateTag(db, attr.name, 3, subTagId);
            await db.prepare(
              'INSERT OR REPLACE INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 3)'
            ).bind(imageId, attrTagId, attr.weight).run();
          }
        }
      }
    }
  }
}

/**
 * 获取或创建标签
 */
async function getOrCreateTag(db, name, level, parentId) {
  const existing = await db.prepare(
    'SELECT id FROM tags WHERE name = ? AND level = ?'
  ).bind(name, level).first();
  
  if (existing) return existing.id;

  try {
    const result = await db.prepare(
      'INSERT INTO tags (name, level, parent_id) VALUES (?, ?, ?)'
    ).bind(name, level, parentId).run();
    return result.meta.last_row_id;
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      const retry = await db.prepare(
        'SELECT id FROM tags WHERE name = ? AND level = ?'
      ).bind(name, level).first();
      if (retry) return retry.id;
    }
    throw error;
  }
}
