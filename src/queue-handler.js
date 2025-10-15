// Queue 消费者处理逻辑
import { analyzeImage, getImageDimensions } from './analyzer.js';
import { generateHash } from './utils.js';

// 队列消费者 - 处理图片分析任务
export async function handleQueue(batch, env) {
  console.log(`[QueueConsumer] Processing batch of ${batch.messages.length} messages`);
  
  for (const message of batch.messages) {
    const startTime = Date.now();
    const { batchId, fileIndex, fileName } = message.body;
    
    try {
      console.log(`[QueueConsumer:${batchId}:${fileIndex}] Processing ${fileName}`);
      
      // 检查批次是否已取消
      const batchStatus = await getBatchStatus(env, batchId);
      if (!batchStatus || batchStatus.status === 'cancelled') {
        console.log(`[QueueConsumer:${batchId}] Batch cancelled, skipping message`);
        message.ack();
        continue;
      }
      
      // 更新状态：正在处理
      await updateBatchStatus(env, batchId, fileIndex, 'processing', null, fileName);
      
      // 从 R2 获取临时图片数据
      const tempKey = `temp/${batchId}/${fileIndex}`;
      const r2Object = await env.R2.get(tempKey);
      
      if (!r2Object) {
        throw new Error('Temporary file not found in R2');
      }
      
      const imageData = await r2Object.arrayBuffer();
      const metadata = r2Object.customMetadata || {};
      const imageHash = metadata.hash;
      
      // 检查是否已存在（再次确认，防止并发重复）
      const existing = await env.DB.prepare('SELECT id, slug FROM images WHERE image_hash = ?')
        .bind(imageHash).first();
      
      if (existing) {
        console.log(`[QueueConsumer:${batchId}:${fileIndex}] Duplicate found: ${existing.slug}`);
        await updateBatchStatus(env, batchId, fileIndex, 'skipped', `Duplicate of ${existing.slug}`, fileName);
        
        // 删除临时文件
        await env.R2.delete(tempKey);
        message.ack();
        continue;
      }
      
      // 上传到永久存储
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const r2Key = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}.jpg`;
      
      await env.R2.put(r2Key, imageData, {
        httpMetadata: { 
          contentType: metadata.contentType || 'image/jpeg',
          cacheControl: 'public, max-age=31536000'
        },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          hash: imageHash,
          sourceUrl: 'batch-upload',
          originalName: fileName
        }
      });
      
      const finalUrl = `/r2/${r2Key}`;
      
      // 获取图片尺寸
      const dimensions = await getImageDimensions(imageData);
      
      // AI 分析（带超时保护）
      const analysis = await Promise.race([
        analyzeImage(imageData, env.AI),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI analysis timeout (60s)')), 60000)
        )
      ]);
      
      if (!analysis) {
        throw new Error('AI analysis returned null');
      }
      
      analysis.dimensions = dimensions;
      
      // 存储到数据库
      const { imageId, slug } = await storeImageAnalysis(env.DB, finalUrl, imageHash, analysis);
      
      // 删除临时文件
      await env.R2.delete(tempKey);
      
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
  
  console.log(`[QueueConsumer] Batch processing completed`);
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

async function storeImageAnalysis(db, imageUrl, imageHash, analysis) {
  const { description, tags, dimensions } = analysis;
  
  // 生成 slug
  const slug = await generateSlug(description, db);
  
  // 插入图片记录
  const result = await db.prepare(`
    INSERT INTO images (slug, image_url, image_hash, description, width, height, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    slug,
    imageUrl,
    imageHash,
    description,
    dimensions?.width || null,
    dimensions?.height || null
  ).run();
  
  const imageId = result.meta.last_row_id;
  
  // 插入标签
  if (tags) {
    const allTags = [
      ...(tags.primary || []),
      ...(tags.subcategories || []),
      ...(tags.attributes || [])
    ];
    
    for (const tag of allTags) {
      // 获取或创建标签
      let tagRecord = await db.prepare('SELECT id FROM tags WHERE name = ? AND level = ?')
        .bind(tag.name, tag.level).first();
      
      if (!tagRecord) {
        const tagResult = await db.prepare('INSERT INTO tags (name, level) VALUES (?, ?)')
          .bind(tag.name, tag.level).run();
        tagRecord = { id: tagResult.meta.last_row_id };
      }
      
      // 关联标签和图片
      await db.prepare('INSERT INTO image_tags (image_id, tag_id, weight) VALUES (?, ?, ?)')
        .bind(imageId, tagRecord.id, tag.confidence || 0.5).run();
    }
  }
  
  return { imageId, slug };
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

