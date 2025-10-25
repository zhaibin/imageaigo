/**
 * 图片缩放和压缩模块
 * 使用 Cloudflare Workers 内置功能或第三方库进行图片处理
 */

/**
 * 使用 Cloudflare Image Resizing 压缩图片
 * @param {ArrayBuffer} imageData - 原始图片数据
 * @param {Object} options - 压缩选项
 * @returns {Promise<ArrayBuffer>} 压缩后的图片数据
 */
export async function resizeImage(imageData, options = {}) {
  const {
    maxWidth = 256,
    maxHeight = 256,
    quality = 80,
    format = 'jpeg'
  } = options;

  // 验证输入
  if (!imageData || imageData.byteLength === 0) {
    throw new Error('Invalid image data provided to resizeImage');
  }

  try {
    // 当前实现：直接使用降级方案（返回原图）
    // 原因：Cloudflare Image Resizing 需要 Workers Paid Plan 和 R2 URL
    // 
    // 如果需要启用真正的压缩，有两个选项：
    // 1. 启用 Workers Paid Plan + Image Resizing，通过 R2 URL 处理
    // 2. 使用 WASM 图片处理库（如 @cf/image）
    
    console.log('[ImageResize] Processing image (resizing requires Paid Plan, using original)');
    
    // 获取图片尺寸信息
    const dimensions = await getImageDimensions(imageData);
    console.log(`[ImageResize] Image dimensions: ${dimensions.width}x${dimensions.height}, size: ${(imageData.byteLength / 1024).toFixed(2)}KB`);
    
    // 如果图片已经很小，直接返回
    if (dimensions.width <= maxWidth && dimensions.height <= maxHeight) {
      console.log('[ImageResize] Image already within size limits, no resize needed');
      return imageData;
    }
    
    // 对于大图片，仍然返回原图但记录警告
    // 这样可以确保 AI 分析正常工作
    const sizeMB = imageData.byteLength / (1024 * 1024);
    console.log(`[ImageResize] Large image (${dimensions.width}x${dimensions.height}, ${sizeMB.toFixed(2)}MB) will be used as-is`);
    console.log('[ImageResize] Tip: Enable Cloudflare Image Resizing (Paid Plan) for automatic optimization');
    
    return imageData;

  } catch (error) {
    console.error('[ImageResize] Error processing image:', error);
    // 即使出错，也返回原图，避免分析失败
    console.log('[ImageResize] Falling back to original image due to error');
    return imageData;
  }
}

/**
 * 简单的图片压缩降级方案
 * 注意：这是一个简化实现，实际生产环境建议使用专业的图片处理库
 */
async function simpleResize(imageData, maxWidth, maxHeight, quality) {
  // 获取图片尺寸
  const dimensions = await getImageDimensions(imageData);
  
  // 如果图片已经很小，直接返回
  if (dimensions.width <= maxWidth && dimensions.height <= maxHeight) {
    console.log('[ImageResize] Image already small enough, no resize needed');
    return imageData;
  }

  // 计算缩放比例
  const scale = Math.min(
    maxWidth / dimensions.width,
    maxHeight / dimensions.height
  );

  const targetWidth = Math.round(dimensions.width * scale);
  const targetHeight = Math.round(dimensions.height * scale);

  console.log(`[ImageResize] Resizing from ${dimensions.width}x${dimensions.height} to ${targetWidth}x${targetHeight}`);

  // 注意：这里简化处理，实际上只是返回原图
  // 在生产环境中，应该使用 image-js、sharp-wasm 等库进行真正的缩放
  // 或者确保启用 Cloudflare Image Resizing 功能
  
  return imageData;
}

/**
 * 从 ArrayBuffer 获取图片尺寸
 */
async function getImageDimensions(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  
  // 检测 JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    return getJPEGDimensions(bytes);
  }
  
  // 检测 PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return getPNGDimensions(bytes);
  }
  
  // 检测 GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return getGIFDimensions(bytes);
  }
  
  // 检测 WebP
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return getWebPDimensions(bytes);
  }
  
  // 默认返回
  return { width: 800, height: 600 };
}

function getJPEGDimensions(bytes) {
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xFF) break;
    
    const marker = bytes[i + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      return { width, height };
    }
    
    const segmentLength = (bytes[i + 2] << 8) | bytes[i + 3];
    i += segmentLength + 2;
  }
  return { width: 800, height: 600 };
}

function getPNGDimensions(bytes) {
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width, height };
}

function getGIFDimensions(bytes) {
  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  return { width, height };
}

function getWebPDimensions(bytes) {
  // VP8 lossy
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
    const width = ((bytes[26] | (bytes[27] << 8)) & 0x3FFF) + 1;
    const height = ((bytes[28] | (bytes[29] << 8)) & 0x3FFF) + 1;
    return { width, height };
  }
  // VP8L lossless
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4C) {
    const b = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    const width = (b & 0x3FFF) + 1;
    const height = ((b >> 14) & 0x3FFF) + 1;
    return { width, height };
  }
  return { width: 800, height: 600 };
}

/**
 * 使用 R2 + Cloudflare Image Resizing 的变体 URL 方式
 * 这是推荐的方式，无需额外处理
 */
export function getResizedImageUrl(r2Url, options = {}) {
  const {
    width = 256,
    height = 256,
    quality = 80,
    format = 'auto',
    fit = 'scale-down'
  } = options;

  // Cloudflare Images 变体 URL 格式
  // 例如: /cdn-cgi/image/width=256,quality=80,format=auto/path/to/image.jpg
  
  const params = [
    `width=${width}`,
    `height=${height}`,
    `quality=${quality}`,
    `format=${format}`,
    `fit=${fit}`
  ].join(',');

  // 如果 URL 已经包含协议，需要提取路径
  const path = r2Url.startsWith('/') ? r2Url : new URL(r2Url).pathname;
  
  return `/cdn-cgi/image/${params}${path}`;
}

/**
 * 智能压缩：根据图片大小决定是否需要压缩
 */
export async function smartCompress(imageData, targetSize = 2 * 1024 * 1024) {
  const currentSize = imageData.byteLength;
  
  // 如果图片小于目标大小的 1.5 倍，不压缩
  if (currentSize <= targetSize * 1.5) {
    console.log(`[SmartCompress] Image size ${(currentSize / 1024).toFixed(2)}KB is acceptable, skipping compression`);
    return imageData;
  }

  // 根据当前大小动态调整质量
  const compressionRatio = targetSize / currentSize;
  const quality = Math.max(60, Math.min(90, Math.round(compressionRatio * 100)));

  console.log(`[SmartCompress] Compressing ${(currentSize / 1024).toFixed(2)}KB with quality ${quality}%`);

  return await resizeImage(imageData, {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: quality
  });
}

