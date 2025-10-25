// Unsplash 自动同步模块（使用队列）
import { generateHash } from '../lib/utils.js';

// Cron 触发器 - 每天同步一次 Unsplash 随机图片
export async function handleUnsplashSync(env) {
  console.log('[UnsplashSync] Starting daily Unsplash sync');
  
  const UNSPLASH_ACCESS_KEY = env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    console.error('[UnsplashSync] UNSPLASH_ACCESS_KEY not configured');
    return { success: false, error: 'API key not configured' };
  }
  
  try {
    // 获取50张随机高质量图片
    // 注意：Unsplash API的random端点一次最多返回30张，所以我们分2次请求
    const count = 50;
    const photosPerRequest = 30;
    const requests = Math.ceil(count / photosPerRequest);
    
    let allPhotos = [];
    
    for (let i = 0; i < requests; i++) {
      const requestCount = Math.min(photosPerRequest, count - allPhotos.length);
      console.log(`[UnsplashSync] Fetching batch ${i + 1}/${requests} (${requestCount} photos)`);
      
      const response = await fetch(
        `https://api.unsplash.com/photos/random?count=${requestCount}&orientation=landscape`,
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
      
      const batchPhotos = await response.json();
      allPhotos = allPhotos.concat(batchPhotos);
      
      // 避免API限流，批次之间稍微延迟
      if (i < requests - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const photos = allPhotos;
    console.log(`[UnsplashSync] Fetched ${photos.length} random photos from Unsplash`);
    
    // 生成同步批次ID
    const syncBatchId = `unsplash_${Date.now()}`;
    
    // 初始化批次状态到 KV（重要！队列消费者需要）
    const batchStatus = {
      batchId: syncBatchId,
      total: photos.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      processing: 0,
      status: 'processing',
      startTime: Date.now(),
      lastActivity: Date.now(),
      currentFile: '',
      sourceType: 'unsplash',
      files: photos.map(p => ({ name: `unsplash-${p.id}.jpg`, status: 'pending' }))
    };
    
    await env.CACHE.put(`batch:${syncBatchId}`, JSON.stringify(batchStatus), { expirationTtl: 3600 });
    console.log(`[UnsplashSync] Batch status initialized: ${syncBatchId}`);
    
    let queued = 0;
    let skipped = 0;
    let failed = 0;
    
    // 快速预处理：下载、检查重复、上传到临时存储、发送到队列
    // 使用批次处理减少并发，避免 KV 429 错误
    const batchSize = 10; // 每批10张，减少并发
    const batches = [];
    for (let i = 0; i < photos.length; i += batchSize) {
      batches.push(photos.slice(i, i + batchSize));
    }
    
    let allResults = [];
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      console.log(`[UnsplashSync] Processing batch ${batchIdx + 1}/${batches.length}`);
      
      const batchPhotos = batches[batchIdx];
      const startIndex = batchIdx * batchSize;
      
      const batchResults = await Promise.allSettled(
        batchPhotos.map(async (photo, idx) => {
          const index = startIndex + idx;
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
            await updateBatchFileStatus(env, syncBatchId, index, 'failed', 'Too large');
            return { status: 'skipped', reason: 'Too large' };
          }
          
          // 生成哈希
          const hash = await generateHash(imageData);
          
          // 检查重复
          const existing = await env.DB.prepare('SELECT id, slug FROM images WHERE image_hash = ?')
            .bind(hash).first();
          
          if (existing) {
            console.log(`[UnsplashSync:${index}] Duplicate: ${existing.slug}`);
            await updateBatchFileStatus(env, syncBatchId, index, 'skipped', `Duplicate: ${existing.slug}`);
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
          // 随机分配给随机用户（is_random=1）
          // 查询所有随机用户的ID
          const randomUsers = await env.DB.prepare(
            'SELECT id FROM users WHERE is_random = 1 ORDER BY id'
          ).all();
          
          if (!randomUsers.results || randomUsers.results.length === 0) {
            console.warn('[UnsplashSync] No random users found, skipping');
            return { status: 'error', message: 'No random users available' };
          }
          
          // 随机选择一个用户
          const randomUser = randomUsers.results[Math.floor(Math.random() * randomUsers.results.length)];
          const randomUserId = randomUser.id;
          
          await env.IMAGE_QUEUE.send({
            batchId: syncBatchId,
            fileIndex: index,
            fileName: `unsplash-${photo.id}.jpg`,
            imageHash: hash,
            contentType: 'image/jpeg',
            sourceType: 'unsplash',
            userId: randomUserId
          });
          
            console.log(`[UnsplashSync:${index}] Queued: ${photo.id}`);
            return { status: 'queued', index };
            
          } catch (error) {
            console.error(`[UnsplashSync] Preprocessing failed for ${photo.id}:`, error.message);
            await updateBatchFileStatus(env, syncBatchId, index, 'failed', error.message);
            return { status: 'failed', error: error.message };
          }
        })
      );
      
      allResults = allResults.concat(batchResults);
      
      // 批次间稍微延迟，避免速率限制
      if (batchIdx < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const preprocessResults = allResults;
    
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
    
    // 更新批次状态中的实际计数
    const statusKey = `batch:${syncBatchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    if (currentStatus) {
      const batchData = JSON.parse(currentStatus);
      batchData.total = photos.length;
      await env.CACHE.put(statusKey, JSON.stringify(batchData), { expirationTtl: 3600 });
    }
    
    return {
      success: true,
      queued,
      skipped,
      failed,
      total: photos.length,
      batchId: syncBatchId,
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

// 更新批次文件状态（优化版本，减少 KV 写入频率）
async function updateBatchFileStatus(env, batchId, fileIndex, status, error = null) {
  try {
    const statusKey = `batch:${batchId}`;
    
    // 使用本地缓存，减少 KV 读取
    if (!globalThis.batchStatusCache) {
      globalThis.batchStatusCache = new Map();
    }
    
    let batchStatus = globalThis.batchStatusCache.get(statusKey);
    
    if (!batchStatus) {
      const currentStatus = await env.CACHE.get(statusKey);
      if (!currentStatus) return;
      batchStatus = JSON.parse(currentStatus);
      globalThis.batchStatusCache.set(statusKey, batchStatus);
    }
    
    if (batchStatus.files[fileIndex]) {
      batchStatus.files[fileIndex].status = status;
      if (error) {
        batchStatus.files[fileIndex].error = error;
      }
    }
    
    // 更新计数
    batchStatus.completed = batchStatus.files.filter(f => f.status === 'completed').length;
    batchStatus.failed = batchStatus.files.filter(f => f.status === 'failed').length;
    batchStatus.skipped = batchStatus.files.filter(f => f.status === 'skipped').length;
    batchStatus.processing = batchStatus.files.filter(f => f.status === 'processing').length;
    batchStatus.lastActivity = Date.now();
    
    // 异步更新 KV，不等待完成（避免 429 错误）
    // 使用 Promise 但不 await，减少并发压力
    env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 })
      .catch(err => {
        console.warn('[UpdateBatchFileStatus] KV update failed (non-blocking):', err.message);
      });
    
  } catch (err) {
    console.error('[UpdateBatchFileStatus] Error:', err.message);
  }
}
