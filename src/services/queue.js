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
    
    // 上传原图到永久存储
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const baseKey = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}`;
    const r2Key = `${baseKey}-original.jpg`;
    
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
          originalName: fileName,
          type: 'original'
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('R2 upload timeout')), 30000)
      )
    ]);
    
    const finalUrl = `/r2/${r2Key}`;
    console.log(`[QueueConsumer:${batchId}:${fileIndex}] Uploaded original: ${r2Key}`);
    
    // 获取图片尺寸（从原图）
    const dimensions = await Promise.race([
      getImageDimensions(imageData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get dimensions timeout')), 10000)
      )
    ]);
    
    // 生成 AI 分析专用图（256px JPEG）
    let compressedImageData = imageData;
    let aiImageKey = null;
    const sizeMB = imageData.byteLength / (1024 * 1024);
    
    if (sizeMB > 2) {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Large image: ${sizeMB.toFixed(2)}MB, generating AI version`);
      
      try {
        // 使用 Image Resizing 转换 AI 分析图
        const hostname = 'imageaigo.cc'; // 使用主域名
        const publicUrl = `https://${hostname}${finalUrl}`;
        
        const aiResponse = await fetch(publicUrl, {
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
          const aiImageData = await aiResponse.arrayBuffer();
          
          // 存储 AI 分析图到 R2（临时）
          const aiTimestamp = Date.now();
          const aiRandomStr = Math.random().toString(36).substring(2, 8);
          aiImageKey = `temp/ai-${aiTimestamp}-${aiRandomStr}.jpg`;
          
          await env.R2.put(aiImageKey, aiImageData, {
            httpMetadata: { contentType: 'image/jpeg' },
            customMetadata: { type: 'ai-analysis', parentKey: r2Key }
          });
          
          compressedImageData = aiImageData;
          console.log(`[QueueConsumer:${batchId}:${fileIndex}] AI image generated: ${(aiImageData.byteLength / 1024).toFixed(2)}KB`);
        } else {
          throw new Error(`Image Resizing failed: HTTP ${aiResponse.status}`);
        }
      } catch (resizeError) {
        console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Image Resizing failed:`, resizeError.message);
        
        // 大图片必须压缩
        if (sizeMB > 10) {
          throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB (max 10MB for AI analysis)`);
        }
        
        console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Using original (${sizeMB.toFixed(2)}MB) for AI analysis`);
      }
    } else {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Small image: ${sizeMB.toFixed(2)}MB, using original for AI`);
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
    
    // 生成展示图（1080px WebP）如果需要
    let displayUrl = finalUrl; // 默认使用原图
    const maxDimension = Math.max(dimensions.width, dimensions.height);
    
    if (maxDimension > 1080) {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Generating display version (${maxDimension}px > 1080px)`);
      
      try {
        const hostname = 'imageaigo.cc';
        const publicUrl = `https://${hostname}${finalUrl}`;
        
        // 生成展示图：长边 1080px，WebP 格式
        const displayResponse = await fetch(publicUrl, {
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
          console.log(`[QueueConsumer:${batchId}:${fileIndex}] Display generated: ${(displayImageData.byteLength / 1024).toFixed(2)}KB WebP`);
        } else {
          console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Display generation failed: HTTP ${displayResponse.status}`);
        }
      } catch (displayError) {
        console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Display error:`, displayError.message);
      }
    } else {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Image ${maxDimension}px <= 1080px, using original for display`);
    }
    
    // 存储到数据库（带 userId 和 displayUrl）
    const { imageId, slug } = await storeImageAnalysis(env.DB, finalUrl, displayUrl, imageHash, analysis, userId);
    
    // 清理临时文件
    await env.R2.delete(tempKey).catch(err => 
      console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Failed to delete temp file:`, err.message)
    );
    
    // 清理 AI 临时图片（如果生成了）
    if (aiImageKey) {
      await env.R2.delete(aiImageKey).catch(err => 
        console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Failed to delete AI temp file:`, err.message)
      );
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Deleted AI temp image: ${aiImageKey}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[QueueConsumer:${batchId}:${fileIndex}] Success: ${slug} (${duration}ms)`);
    
    // 更新状态：完成
    await updateBatchStatus(env, batchId, fileIndex, 'completed');
    
    // 确认消息处理成功
    message.ack();
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[QueueConsumer:${batchId}:${fileIndex}] Failed after ${duration}ms:`, error.message);
    
    // 检查错误类型
    const isAIError = error.message.includes('AI') || error.message.includes('timeout') || error.message.includes('analysis');
    const isDuplicate = error.message.includes('Duplicate');
    
    if (isAIError) {
      // AI 分析失败：直接跳过，不重试 ✅
      console.warn(`[QueueConsumer:${batchId}:${fileIndex}] AI analysis failed, skipping`);
      await updateBatchStatus(env, batchId, fileIndex, 'skipped', `AI failed: ${error.message}`);
      message.ack(); // 确认消息，不再重试
    } else if (isDuplicate) {
      // 重复图片：跳过
      await updateBatchStatus(env, batchId, fileIndex, 'skipped', error.message);
      message.ack();
    } else {
      // 其他错误：标记为失败
      await updateBatchStatus(env, batchId, fileIndex, 'failed', error.message);
      
      // 重试次数检查
      if (message.attempts >= 3) {
        console.error(`[QueueConsumer:${batchId}:${fileIndex}] Max retries reached, giving up`);
        message.ack(); // 确认消息，不再重试
      } else {
        // 重试（消息会自动重新入队）
        console.log(`[QueueConsumer:${batchId}:${fileIndex}] Will retry (attempt ${message.attempts + 1}/3)`);
        message.retry();
        return; // 重试时不清理临时文件
      }
    }
    
    // 清理临时文件（根据来源类型构建路径）
    try {
      const tempKey = sourceType === 'unsplash' 
        ? `temp/unsplash/${batchId}/${fileIndex}`
        : `temp/${batchId}/${fileIndex}`;
      await env.R2.delete(tempKey);
      
      // 清理 AI 临时图片（如果存在）
      if (aiImageKey) {
        await env.R2.delete(aiImageKey);
      }
    } catch (cleanupErr) {
      console.warn(`[QueueConsumer:${batchId}:${fileIndex}] Cleanup failed:`, cleanupErr.message);
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
    
    // 初始化缓存和节流器
    if (!globalThis.batchStatusCache) {
      globalThis.batchStatusCache = new Map();
    }
    if (!globalThis.kvUpdateQueue) {
      globalThis.kvUpdateQueue = new Map();
    }
    
    let batchStatus = globalThis.batchStatusCache.get(statusKey);
    
    if (!batchStatus) {
      const currentStatus = await env.CACHE.get(statusKey);
      if (!currentStatus) return;
      batchStatus = JSON.parse(currentStatus);
      globalThis.batchStatusCache.set(statusKey, batchStatus);
    }
    
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
    
    // 节流机制：减少 KV 写入频率
    const shouldUpdate = 
      totalProcessed % 5 === 0 || // 每 5 个更新一次
      totalProcessed === batchStatus.total || // 最后一个
      status === 'failed'; // 失败立即更新
    
    if (shouldUpdate) {
      // 取消之前的更新队列
      const existingTimeout = globalThis.kvUpdateQueue.get(statusKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // 延迟 1 秒后更新，合并多个请求
      const timeout = setTimeout(() => {
        env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 })
          .then(() => {
            console.log(`[UpdateBatchStatus] KV updated: ${totalProcessed}/${batchStatus.total}`);
            globalThis.kvUpdateQueue.delete(statusKey);
          })
          .catch(err => {
            console.warn('[UpdateBatchStatus] KV update failed:', err.message);
          });
      }, 1000);
      
      globalThis.kvUpdateQueue.set(statusKey, timeout);
    }
    
  } catch (err) {
    console.error('[UpdateBatchStatus] Error:', err.message);
  }
}

async function storeImageAnalysis(db, imageUrl, displayUrl, imageHash, analysis, userId = null) {
  const { description, tags, dimensions } = analysis;
  
  // 生成 slug
  const slug = await generateSlug(description, db);
  
  // 插入图片记录（包含 display_url）
  const result = await db.prepare(`
    INSERT INTO images (slug, image_url, display_url, image_hash, description, width, height, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    slug,
    imageUrl,
    displayUrl,
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

