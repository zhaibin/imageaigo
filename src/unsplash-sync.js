// Unsplash 自动同步模块（使用队列）
import { generateHash } from './utils.js';

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
      const errorText = await response.text();
      throw new Error(`Unsplash API error: ${response.status} - ${errorText}`);
    }
    
    const photos = await response.json();
    console.log(`[UnsplashSync] Fetched ${photos.length} photos from Unsplash`);
    
    // 生成同步批次ID
    const syncBatchId = `unsplash_${Date.now()}`;
    
    let queued = 0;
    let skipped = 0;
    let failed = 0;
    
    // 快速预处理：下载、检查重复、上传到临时存储、发送到队列
    const preprocessResults = await Promise.allSettled(
      photos.map(async (photo, index) => {
        try {
          console.log(`[UnsplashSync:${index}] Preprocessing ${photo.id}`);
          
          // 下载图片
          const imageUrl = photo.urls.regular;
          const imageResponse = await fetch(imageUrl);
          
          if (!imageResponse.ok) {
            throw new Error(`Failed to download: ${imageResponse.status}`);
          }
          
          const imageData = await imageResponse.arrayBuffer();
          
          // 检查大小
          if (imageData.byteLength > 20 * 1024 * 1024) {
            return { status: 'skipped', reason: 'Too large' };
          }
          
          // 生成哈希
          const hash = await generateHash(imageData);
          
          // 检查重复
          const existing = await env.DB.prepare('SELECT id, slug FROM images WHERE image_hash = ?')
            .bind(hash).first();
          
          if (existing) {
            console.log(`[UnsplashSync:${index}] Duplicate: ${existing.slug}`);
            return { status: 'skipped', reason: 'Duplicate' };
          }
          
          // 上传到临时 R2
          const tempKey = `temp/unsplash/${syncBatchId}/${index}`;
          await env.R2.put(tempKey, imageData, {
            httpMetadata: { contentType: 'image/jpeg' },
            customMetadata: {
              hash: hash,
              fileName: `unsplash-${photo.id}.jpg`,
              unsplashId: photo.id,
              unsplashAuthor: photo.user?.name || 'Unknown',
              unsplashLink: photo.links?.html || '',
              sourceUrl: 'unsplash'
            }
          });
          
          // 发送到队列
          await env.IMAGE_QUEUE.send({
            batchId: syncBatchId,
            fileIndex: index,
            fileName: `unsplash-${photo.id}.jpg`,
            imageHash: hash,
            contentType: 'image/jpeg',
            sourceType: 'unsplash'
          });
          
          console.log(`[UnsplashSync:${index}] Queued: ${photo.id}`);
          return { status: 'queued' };
          
        } catch (error) {
          console.error(`[UnsplashSync] Preprocessing failed for ${photo.id}:`, error.message);
          return { status: 'failed', error: error.message };
        }
      })
    );
    
    // 统计结果
    for (const result of preprocessResults) {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'queued') {
          queued++;
        } else if (result.value.status === 'skipped') {
          skipped++;
        } else if (result.value.status === 'failed') {
          failed++;
        }
      } else {
        failed++;
      }
    }
    
    console.log(`[UnsplashSync] Preprocessing completed: ${queued} queued, ${skipped} skipped, ${failed} failed`);
    
    return {
      success: true,
      queued,
      skipped,
      failed,
      total: photos.length,
      message: `${queued} photos queued for processing, ${skipped} skipped (duplicates)`
    };
    
  } catch (error) {
    console.error('[UnsplashSync] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

