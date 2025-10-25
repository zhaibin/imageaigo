// Queue 消费者处理逻辑
import { analyzeImage, getImageDimensions } from './ai/analyzer.js';
import { generateHash } from '../lib/utils.js';

// 队列消费者 - 处理图片分析任务（并发处理，限制并发数）
export async function handleQueue(batch, env) {
  console.log(`[QueueConsumer] Processing batch of ${batch.messages.length} messages with concurrency limit`);
  
  // 并发处理消息，每次最多3个并发
  const concurrency = 3;
  const results = [];
  
  for (let i = 0; i < batch.messages.length; i += concurrency) {
    const messageBatch = batch.messages.slice(i, i + concurrency);
    console.log(`[QueueConsumer] Processing messages ${i + 1}-${i + messageBatch.length} (concurrent: ${messageBatch.length})`);
    
    // 并发处理这一组消息
    const batchResults = await Promise.allSettled(
      messageBatch.map(message => processQueueMessage(message, env))
    );
    
    results.push(...batchResults);
    
    // 组间稍微延迟，避免资源竞争
    if (i + concurrency < batch.messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`[QueueConsumer] Batch completed: ${succeeded} succeeded, ${failed} failed`);
}

// 处理单个队列消息
async function processQueueMessage(message, env) {
  const startTime = Date.now();
  const { batchId, fileIndex, fileName, imageHash, sourceType, userId } = message.body;
  
  try {
    console.log(`[QueueConsumer:${batchId}:${fileIndex}] Processing ${fileName} (source: ${sourceType || 'upload'})`);
    
    // 检查批次是否已取消
    const batchStatus = await getBatchStatus(env, batchId);
    if (!batchStatus || batchStatus.status === 'cancelled') {
      console.log(`[QueueConsumer:${batchId}] Batch cancelled, skipping message`);
      message.ack();
      return;
    }
    
    // 更新状态：正在处理
    await updateBatchStatus(env, batchId, fileIndex, 'processing', null, fileName);
    
    // 从 R2 获取临时图片数据（根据来源类型构建路径）
    const tempKey = sourceType === 'unsplash' 
      ? `temp/unsplash/${batchId}/${fileIndex}`
      : `temp/${batchId}/${fileIndex}`;
    
    console.log(`[QueueConsumer:${batchId}:${fileIndex}] Fetching from R2: ${tempKey}`);
    
    const r2Object = await Promise.race([
      env.R2.get(tempKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('R2 get timeout')), 10000)
      )
    ]);
    
    if (!r2Object) {
      throw new Error('Temporary file not found in R2');
    }
    
    const imageData = await r2Object.arrayBuffer();
    const metadata = r2Object.customMetadata || {};
    
    // 再次检查重复（防止并发问题）
    const existing = await env.DB.prepare('SELECT id, slug FROM images WHERE image_hash = ?')
      .bind(imageHash).first();
    
    if (existing) {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Duplicate found: ${existing.slug}`);
      await updateBatchStatus(env, batchId, fileIndex, 'skipped', `Duplicate of ${existing.slug}`, fileName);
      await env.R2.delete(tempKey);
      message.ack();
      return;
    }
    
    // 上传到永久存储
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const r2Key = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}.jpg`;
    
    await Promise.race([
      env.R2.put(r2Key, imageData, {
        httpMetadata: { 
          contentType: metadata.contentType || 'image/jpeg',
          cacheControl: 'public, max-age=31536000'
        },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          hash: imageHash,
          sourceUrl: metadata.sourceUrl || 'batch-upload',
          originalName: fileName
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('R2 upload timeout')), 30000)
      )
    ]);
    
    const finalUrl = `/r2/${r2Key}`;
    
    // 获取图片尺寸（从原图）
    const dimensions = await Promise.race([
      getImageDimensions(imageData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get dimensions timeout')), 10000)
      )
    ]);
    
    // 使用 Cloudflare Image Resizing 压缩大图片
    let compressedImageData = imageData;
    const sizeMB = imageData.byteLength / (1024 * 1024);
    
    if (sizeMB > 2) {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Large image: ${sizeMB.toFixed(2)}MB, attempting resize`);
      
      // 注意：这里不能直接使用内部 URL，需要等待 Image Resizing 功能完全配置
      // 暂时使用原图，但添加大小限制
      if (sizeMB > 10) {
        throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB (max 10MB for AI analysis)`);
      }
      
      console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Using original image (${sizeMB.toFixed(2)}MB) - Image Resizing not configured`);
    } else {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Small image: ${sizeMB.toFixed(2)}MB, no resize needed`);
    }
    
    // 验证数据
    if (!compressedImageData || compressedImageData.byteLength === 0) {
      throw new Error('Image processing failed: result is empty');
    }
    
    // AI 分析（使用压缩图，带超时保护）
    const analysis = await Promise.race([
      analyzeImage(compressedImageData, env.AI),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI analysis timeout (60s)')), 60000)
      )
    ]);
    
    if (!analysis) {
      throw new Error('AI analysis returned null');
    }
    
    analysis.dimensions = dimensions;
    
    // 存储到数据库（带 userId）
    const { imageId, slug } = await storeImageAnalysis(env.DB, finalUrl, imageHash, analysis, userId);
    
    // 删除临时文件
    await env.R2.delete(tempKey).catch(err => 
      console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Failed to delete temp file:`, err.message)
    );
    
    const duration = Date.now() - startTime;
    console.log(`[QueueConsumer:${batchId}:${fileIndex}] Success: ${slug} (${duration}ms)`);
    
    // 更新状态：完成
    await updateBatchStatus(env, batchId, fileIndex, 'completed');
    
    // 确认消息处理成功
    message.ack();
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[QueueConsumer:${batchId}:${fileIndex}] Failed after ${duration}ms:`, error.message);
    
    // 更新状态：失败
    await updateBatchStatus(env, batchId, fileIndex, 'failed', error.message);
    
    // 清理临时文件（根据来源类型构建路径）
    try {
      const tempKey = sourceType === 'unsplash' 
        ? `temp/unsplash/${batchId}/${fileIndex}`
        : `temp/${batchId}/${fileIndex}`;
      await env.R2.delete(tempKey);
    } catch (cleanupErr) {
      console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Cleanup failed:`, cleanupErr.message);
    }
    
    // 重试次数检查
    if (message.attempts >= 3) {
      console.error(`[QueueConsumer:${batchId}:${fileIndex}] Max retries reached, giving up`);
      message.ack(); // 确认消息，不再重试
    } else {
      // 重试（消息会自动重新入队）
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Will retry (attempt ${message.attempts + 1}/3)`);
      message.retry();
    }
  }
}

// 辅助函数
async function getBatchStatus(env, batchId) {
  try {
    const statusKey = `batch:${batchId}`;
    const statusData = await env.CACHE.get(statusKey);
    return statusData ? JSON.parse(statusData) : null;
  } catch (err) {
    console.error('[GetBatchStatus] Error:', err);
    return null;
  }
}

async function updateBatchStatus(env, batchId, fileIndex, status, error = null, currentFile = null) {
  try {
    const statusKey = `batch:${batchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    
    if (!currentStatus) return;
    
    const batchStatus = JSON.parse(currentStatus);
    batchStatus.files[fileIndex].status = status;
    if (error) {
      batchStatus.files[fileIndex].error = error;
    }
    
    // 更新计数
    batchStatus.completed = batchStatus.files.filter(f => f.status === 'completed').length;
    batchStatus.failed = batchStatus.files.filter(f => f.status === 'failed').length;
    batchStatus.skipped = batchStatus.files.filter(f => f.status === 'skipped').length;
    batchStatus.processing = batchStatus.files.filter(f => f.status === 'processing').length;
    
    // 更新最后活动时间和当前文件
    batchStatus.lastActivity = Date.now();
    if (currentFile) {
      batchStatus.currentFile = currentFile;
    }
    
    // 检查是否全部完成
    const totalProcessed = batchStatus.completed + batchStatus.failed + batchStatus.skipped;
    if (totalProcessed === batchStatus.total && batchStatus.status === 'processing') {
      batchStatus.status = 'completed';
      batchStatus.endTime = Date.now();
      batchStatus.duration = batchStatus.endTime - batchStatus.startTime;
    }
    
    await env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 });
  } catch (err) {
    console.error('[UpdateBatchStatus] Error:', err);
  }
}

async function storeImageAnalysis(db, imageUrl, imageHash, analysis, userId = null) {
  const { description, tags, dimensions } = analysis;
  
  // 生成 slug
  const slug = await generateSlug(description, db);
  
  // 插入图片记录
  const result = await db.prepare(`
    INSERT INTO images (slug, image_url, image_hash, description, width, height, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    slug,
    imageUrl,
    imageHash,
    description,
    dimensions?.width || null,
    dimensions?.height || null,
    userId
  ).run();
  
  const imageId = result.meta.last_row_id;
  
  // 插入标签（正确处理层级结构）
  if (tags && tags.primary && Array.isArray(tags.primary)) {
    for (const primary of tags.primary) {
      // 存储 Level 1 标签（主分类）
      const primaryTagId = await getOrCreateTag(db, primary.name, 1);
      await db.prepare('INSERT INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 1)')
        .bind(imageId, primaryTagId, primary.weight || 0.8).run();
      
      // 存储 Level 2 标签（子分类）
      if (primary.subcategories && Array.isArray(primary.subcategories)) {
        for (const sub of primary.subcategories) {
          const subTagId = await getOrCreateTag(db, sub.name, 2);
          await db.prepare('INSERT INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 2)')
            .bind(imageId, subTagId, sub.weight || 0.7).run();
          
          // 存储 Level 3 标签（属性）
          if (sub.attributes && Array.isArray(sub.attributes)) {
            for (const attr of sub.attributes) {
              const attrTagId = await getOrCreateTag(db, attr.name, 3);
              await db.prepare('INSERT INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 3)')
                .bind(imageId, attrTagId, attr.weight || 0.6).run();
            }
          }
        }
      }
    }
  }
  
  return { imageId, slug };
}

// 获取或创建标签
async function getOrCreateTag(db, name, level) {
  // 先查询是否存在
  let tagRecord = await db.prepare('SELECT id FROM tags WHERE name = ? AND level = ?')
    .bind(name, level).first();
  
  if (tagRecord) {
    return tagRecord.id;
  }
  
  // 不存在则创建
  try {
    const result = await db.prepare('INSERT INTO tags (name, level) VALUES (?, ?)')
      .bind(name, level).run();
    return result.meta.last_row_id;
  } catch (error) {
    // 如果并发插入导致冲突，重新查询
    if (error.message.includes('UNIQUE constraint')) {
      const retry = await db.prepare('SELECT id FROM tags WHERE name = ? AND level = ?')
        .bind(name, level).first();
      if (retry) return retry.id;
    }
    throw error;
  }
}

async function generateSlug(description, db) {
  const base = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  let slug = base;
  let counter = 1;
  
  while (true) {
    const existing = await db.prepare('SELECT id FROM images WHERE slug = ?').bind(slug).first();
    if (!existing) break;
    slug = `${base}-${counter}`;
    counter++;
  }
  
  return slug;
}

