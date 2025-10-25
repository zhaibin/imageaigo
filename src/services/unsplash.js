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
    
    // 快速预处理：下载、检查重复、上传临时文件、发送到队列
    // 避免 HTTP 超时，让队列异步处理 AI 分析
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoNum = i + 1;
      
      try {
        console.log(`[UnsplashSync:${photoNum}/${photos.length}] Preprocessing ${photo.id}`);
        
        // 1. 下载图片（10秒超时）
        const imageUrl = photo.urls.regular;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const imageResponse = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!imageResponse.ok) {
          console.warn(`[UnsplashSync:${photoNum}] Download failed: HTTP ${imageResponse.status}`);
          await updateUnsplashBatchStatus(env, syncBatchId, i, 'failed', `Download failed: ${imageResponse.status}`, photo.id);
          failed++;
          continue;
        }
        
        const imageData = await imageResponse.arrayBuffer();
        const sizeMB = imageData.byteLength / (1024 * 1024);
        
        // 2. 检查大小
        if (sizeMB > 20) {
          console.warn(`[UnsplashSync:${photoNum}] Too large: ${sizeMB.toFixed(2)}MB, skipped`);
          await updateUnsplashBatchStatus(env, syncBatchId, i, 'skipped', 'Too large (>20MB)', photo.id);
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
          await updateUnsplashBatchStatus(env, syncBatchId, i, 'skipped', `Duplicate: ${existing.slug}`, photo.id);
          skipped++;
          continue; // 重复直接跳过，不进行 AI 分析 ✅
        }
        
        // 4. 上传到临时 R2
        const tempKey = `temp/unsplash/${syncBatchId}/${i}`;
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
          fileIndex: i,
          fileName: `unsplash-${photo.id}.jpg`,
          imageHash: imageHash,
          contentType: 'image/jpeg',
          sourceType: 'unsplash',
          userId: randomUserId
        });
        
        console.log(`[UnsplashSync:${photoNum}] Queued for AI analysis`);
        queued++;
        
      } catch (error) {
        console.error(`[UnsplashSync:${photoNum}] Preprocessing failed:`, error.message);
        await updateUnsplashBatchStatus(env, syncBatchId, i, 'failed', error.message, photo.id);
        failed++;
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
