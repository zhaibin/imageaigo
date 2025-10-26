/**
 * Unsplash 自动同步模块 - 队列模式
 * 快速预处理（下载、去重）+ 队列异步处理（AI 分析）
 */

import { generateHash } from '../lib/utils.js';

/**
 * Cron 触发器 - 每天同步一次 Unsplash 随机图片
 * 快速预处理 + 队列异步处理，避免超时
 */
export async function handleUnsplashSync(env) {
  console.log('[UnsplashSync] Starting daily sync (queue mode)');
  
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
    
    // 生成批次ID用于进度追踪
    const syncBatchId = `unsplash_${Date.now()}`;
    
    // 初始化批次状态到 KV（让前端能看到进度）
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
    
    // 并发预处理：分批并发下载、检查重复、上传临时文件、发送到队列
    // 5 张图片并发下载，避免 HTTP 超时，大幅提升速度
    const downloadConcurrency = 5;
    const batches = [];
    
    // 将 photos 分成多个批次
    for (let i = 0; i < photos.length; i += downloadConcurrency) {
      batches.push(photos.slice(i, i + downloadConcurrency));
    }
    
    console.log(`[UnsplashSync] Processing ${photos.length} photos in ${batches.length} batches (${downloadConcurrency} concurrent)`);
    
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchStartIdx = batchIdx * downloadConcurrency;
      
      console.log(`[UnsplashSync] Batch ${batchIdx + 1}/${batches.length}: Processing ${batch.length} photos concurrently`);
      
      // 并发处理这批图片
      const batchResults = await Promise.allSettled(
        batch.map(async (photo, idx) => {
          const globalIdx = batchStartIdx + idx;
          const photoNum = globalIdx + 1;
          
          try {
            console.log(`[UnsplashSync:${photoNum}/${photos.length}] Downloading ${photo.id}...`);
            
            // 更新状态：正在下载
            await updateUnsplashBatchStatus(env, syncBatchId, globalIdx, 'processing', null, photo.id);
            
            // 1. 下载图片（10秒超时）
            const imageUrl = photo.urls.regular;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            
            const imageResponse = await fetch(imageUrl, { signal: controller.signal });
            clearTimeout(timeout);
            
            if (!imageResponse.ok) {
              throw new Error(`Download failed: HTTP ${imageResponse.status}`);
            }
            
            const imageData = await imageResponse.arrayBuffer();
            const sizeMB = imageData.byteLength / (1024 * 1024);
            
            // 2. 检查大小
            if (sizeMB > 20) {
              await updateUnsplashBatchStatus(env, syncBatchId, globalIdx, 'skipped', 'Too large (>20MB)', photo.id);
              console.warn(`[UnsplashSync:${photoNum}] Too large: ${sizeMB.toFixed(2)}MB, skipped`);
              return { status: 'skipped', reason: 'too_large' };
            }
            
            console.log(`[UnsplashSync:${photoNum}] Downloaded: ${sizeMB.toFixed(2)}MB`);
            
            // 3. 检查重复
            const imageHash = await generateHash(imageData);
            const existing = await env.DB.prepare(
              'SELECT id, slug FROM images WHERE image_hash = ?'
            ).bind(imageHash).first();
            
            if (existing) {
              await updateUnsplashBatchStatus(env, syncBatchId, globalIdx, 'skipped', `Duplicate: ${existing.slug}`, photo.id);
              console.log(`[UnsplashSync:${photoNum}] Duplicate: ${existing.slug}, skipped`);
              return { status: 'skipped', reason: 'duplicate' };
            }
            
            // 4. 上传到临时 R2
            const tempKey = `temp/unsplash/${syncBatchId}/${globalIdx}`;
            await env.R2.put(tempKey, imageData, {
              httpMetadata: { contentType: 'image/jpeg' },
              customMetadata: {
                hash: imageHash,
                fileName: `unsplash-${photo.id}.jpg`,
                unsplashId: photo.id,
                unsplashAuthor: photo.user?.name || 'Unknown',
                unsplashLink: photo.links?.html || '',
                sourceUrl: 'unsplash'
              }
            });
            
            // 5. 随机选择一个用户
            const randomUser = randomUsers.results[Math.floor(Math.random() * randomUsers.results.length)];
            const randomUserId = randomUser.id;
            
            // 6. 发送到队列
            await env.IMAGE_QUEUE.send({
              batchId: syncBatchId,
              fileIndex: globalIdx,
              fileName: `unsplash-${photo.id}.jpg`,
              imageHash: imageHash,
              contentType: 'image/jpeg',
              sourceType: 'unsplash',
              userId: randomUserId
            });
            
            console.log(`[UnsplashSync:${photoNum}] Queued for AI analysis`);
            return { status: 'queued' };
            
          } catch (error) {
            console.error(`[UnsplashSync:${photoNum}] Failed:`, error.message);
            await updateUnsplashBatchStatus(env, syncBatchId, globalIdx, 'failed', error.message, photo.id);
            return { status: 'failed', error: error.message };
          }
        })
      );
      
      // 统计这批的结果
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.status === 'queued') queued++;
          else if (result.value.status === 'skipped') skipped++;
          else if (result.value.status === 'failed') failed++;
        } else {
          failed++;
        }
      });
      
      // 批次间延迟，避免压力过大
      if (batchIdx < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`[UnsplashSync] Preprocessing done: ${queued} queued, ${skipped} skipped, ${failed} failed`);
    
    return {
      success: true,
      queued,
      skipped,
      failed,
      total: photos.length,
      batchId: syncBatchId,
      message: `${queued} photos queued for AI analysis, ${skipped} skipped (duplicates)`
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
 * 更新 Unsplash 同步批次状态
 */
async function updateUnsplashBatchStatus(env, batchId, fileIndex, status, error = null, photoId = null) {
  try {
    const statusKey = `batch:${batchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    
    if (!currentStatus) return;
    
    const batchStatus = JSON.parse(currentStatus);
    
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
    
    // 更新最后活动时间和当前文件
    batchStatus.lastActivity = Date.now();
    if (photoId) {
      batchStatus.currentFile = `unsplash-${photoId}.jpg`;
    }
    
    await env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 });
  } catch (err) {
    console.error(`[UpdateUnsplashBatchStatus] Error:`, err);
  }
}
