/**
 * 图片缩放和压缩模块
 * 使用 Cloudflare Workers 内置功能或第三方库进行图片处理
 */

/**
 * 使用 Cloudflare Image Resizing 压缩图片
 * 需要通过 URL 访问图片才能使用 cf.image 选项
 * @param {string} imageUrl - 图片 URL（R2 或其他可访问的 URL）
 * @param {Object} options - 压缩选项
 * @returns {Promise<ArrayBuffer>} 压缩后的图片数据
 */
export async function resizeImageViaUrl(imageUrl, options = {}) {
  const {
    width = 256,
    height = 256,
    quality = 80,
    fit = 'scale-down',
    format = 'auto'
  } = options;

  // 验证输入
  if (!imageUrl) {
    throw new Error('Invalid image URL provided to resizeImageViaUrl');
  }

  try {
    console.log(`[ImageResize] Using Cloudflare Image Resizing for: ${imageUrl}`);
    
    // 使用 Cloudflare Image Resizing API
    // 文档: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
    const response = await fetch(imageUrl, {
      cf: {
        image: {
          width: width,
          height: height,
          quality: quality,
          fit: fit,
          format: format
        }
      }
    });

    if (!response.ok) {
      throw new Error(`Image resizing failed: HTTP ${response.status}`);
    }

    const resizedData = await response.arrayBuffer();
    
    console.log(`[ImageResize] Successfully resized image: ${(resizedData.byteLength / 1024).toFixed(2)}KB`);
    
    return resizedData;

  } catch (error) {
    console.error('[ImageResize] Error resizing via URL:', error);
    throw error;
  }
}

/**
 * 从 ArrayBuffer 压缩图片
 * 注意：由于 Cloudflare Image Resizing 需要 URL，此函数仅作为回退
 * 实际压缩请先上传到 R2 然后使用 resizeImageViaUrl()
 * 
 * @param {ArrayBuffer} imageData - 原始图片数据
 * @param {Object} options - 压缩选项
 * @returns {Promise<ArrayBuffer>} 原始图片数据（Workers 中无法直接压缩 ArrayBuffer）
 */
export async function resizeImage(imageData, options = {}) {
  // 验证输入
  if (!imageData || imageData.byteLength === 0) {
    throw new Error('Invalid image data provided to resizeImage');
  }

  console.log(`[ImageResize] Note: Direct ArrayBuffer resizing not available in Workers`);
  console.log(`[ImageResize] To use Image Resizing, upload to R2 first and use resizeImageViaUrl()`);
  console.log(`[ImageResize] Returning original image: ${(imageData.byteLength / 1024).toFixed(2)}KB`);
  
  // 在 Workers 中，我们不能直接使用 Blob URL
  // 必须先将图片上传到可访问的位置（如 R2），然后使用 URL 进行压缩
  return imageData;
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

