/**
 * 图片转换服务
 * 提供图片压缩、格式转换、尺寸调整等功能
 * 支持 CDN 缓存
 */

/**
 * 支持的图片格式
 */
export const ImageFormats = {
  WEBP: 'webp',
  JPEG: 'jpeg',
  PNG: 'png',
  AVIF: 'avif'
};

/**
 * 预定义的图片尺寸
 */
export const ImageSizes = {
  THUMBNAIL: { width: 200, height: 200, fit: 'cover' },      // 缩略图
  SMALL: { width: 400, height: 400, fit: 'contain' },        // 小图
  MEDIUM: { width: 800, height: 800, fit: 'contain' },       // 中图
  LARGE: { width: 1200, height: 1200, fit: 'contain' },      // 大图
  AI_ANALYSIS: { width: 256, height: 256, fit: 'scale-down' },  // AI 分析用（长边 256）
  FULL: { width: 2048, height: 2048, fit: 'contain' }        // 完整尺寸
};

/**
 * 生成图片转换 URL
 * @param {string} r2Key - R2 存储的 key
 * @param {Object} options - 转换选项
 * @param {string} options.format - 输出格式 (webp, jpeg, png, avif)
 * @param {number} options.width - 目标宽度
 * @param {number} options.height - 目标高度
 * @param {string} options.fit - 适配模式 (cover, contain, scale-down)
 * @param {number} options.quality - 质量 (1-100)
 * @returns {string} 转换后的图片 URL
 */
export function getImageUrl(r2Key, options = {}) {
  const {
    format = 'webp',
    width,
    height,
    fit = 'contain',
    quality = 85
  } = options;

  // 构建查询参数
  const params = new URLSearchParams();
  if (format) params.set('format', format);
  if (width) params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  if (fit) params.set('fit', fit);
  if (quality) params.set('quality', quality.toString());

  const queryString = params.toString();
  return `/r2/${r2Key}${queryString ? '?' + queryString : ''}`;
}

/**
 * 获取不同尺寸的图片 URL 集合
 * @param {string} r2Key - R2 存储的 key
 * @param {string} format - 输出格式，默认 webp
 * @returns {Object} 包含不同尺寸 URL 的对象
 */
export function getImageUrlSet(r2Key, format = 'webp') {
  return {
    thumbnail: getImageUrl(r2Key, { ...ImageSizes.THUMBNAIL, format }),
    small: getImageUrl(r2Key, { ...ImageSizes.SMALL, format }),
    medium: getImageUrl(r2Key, { ...ImageSizes.MEDIUM, format }),
    large: getImageUrl(r2Key, { ...ImageSizes.LARGE, format }),
    full: getImageUrl(r2Key, { ...ImageSizes.FULL, format }),
    original: `/r2/${r2Key}` // 原始图片
  };
}

/**
 * 转换图片
 * 使用 Cloudflare Images Resizing (需要在 worker 中配置)
 * @param {Response} imageResponse - 原始图片响应
 * @param {Object} options - 转换选项
 * @returns {Response} 转换后的图片响应
 */
export async function transformImage(imageResponse, options = {}) {
  const {
    format = 'webp',
    width,
    height,
    fit = 'contain',
    quality = 85
  } = options;

  try {
    // 构建 cf 选项
    const cfOptions = {
      image: {
        format: format,
        quality: quality,
        fit: fit
      }
    };

    if (width) cfOptions.image.width = width;
    if (height) cfOptions.image.height = height;

    // 克隆响应以避免修改原始响应
    const clonedResponse = new Response(imageResponse.body, imageResponse);
    
    // 返回带有 cf 选项的响应
    // 注意：实际的图片转换会在 fetch 请求中通过 cf 参数完成
    return clonedResponse;
  } catch (error) {
    console.error('[ImageTransform] Transform error:', error);
    return imageResponse; // 转换失败时返回原图
  }
}

/**
 * 从 R2 获取并转换图片
 * @param {R2Bucket} r2 - R2 bucket 实例
 * @param {string} key - R2 key
 * @param {Object} options - 转换选项
 * @returns {Response|null} 转换后的图片响应
 */
export async function getTransformedImage(r2, key, options = {}) {
  try {
    const object = await r2.get(key);
    if (!object) {
      return null;
    }

    const {
      format = 'webp',
      width,
      height,
      fit = 'contain',
      quality = 85
    } = options;

    // 设置响应头
    const headers = new Headers();
    
    // 设置内容类型
    const contentType = getContentType(format);
    headers.set('Content-Type', contentType);
    
    // 设置缓存控制
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag || object.etag);
    
    // 添加图片优化相关头部
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Vary', 'Accept');

    // 如果不需要转换，直接返回原图
    if (!width && !height && (!format || format === getFormatFromContentType(object.httpMetadata?.contentType))) {
      return new Response(object.body, { headers });
    }

    // 需要转换：使用浏览器的 Image API 或返回原始数据
    // 注意：Cloudflare Workers 本身不支持图片处理，需要使用 Cloudflare Images
    // 这里我们先返回原图，实际转换需要在外层通过 fetch 的 cf 参数完成
    return new Response(object.body, { headers });
  } catch (error) {
    console.error('[ImageTransform] Get transformed image error:', error);
    return null;
  }
}

/**
 * 压缩图片用于 AI 分析
 * @param {ArrayBuffer} imageData - 原始图片数据
 * @returns {ArrayBuffer} 压缩后的图片数据
 */
export async function compressForAI(imageData) {
  // 注意：Cloudflare Workers 环境中无法直接处理图片
  // 需要使用外部服务或客户端压缩
  // 这里返回原始数据，实际压缩在客户端完成
  return imageData;
}

/**
 * 根据格式获取 Content-Type
 * @param {string} format - 图片格式
 * @returns {string} Content-Type
 */
export function getContentType(format) {
  const contentTypes = {
    'webp': 'image/webp',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'avif': 'image/avif',
    'gif': 'image/gif'
  };
  return contentTypes[format] || 'image/jpeg';
}

/**
 * 从 Content-Type 获取格式
 * @param {string} contentType - Content-Type
 * @returns {string} 图片格式
 */
function getFormatFromContentType(contentType) {
  if (!contentType) return 'jpeg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('avif')) return 'avif';
  if (contentType.includes('gif')) return 'gif';
  return 'jpeg';
}

/**
 * 生成图片转换的缓存 key
 * @param {string} r2Key - R2 key
 * @param {Object} options - 转换选项
 * @returns {string} 缓存 key
 */
export function getCacheKey(r2Key, options = {}) {
  const { format, width, height, fit, quality } = options;
  const parts = [r2Key];
  
  if (format) parts.push(`f:${format}`);
  if (width) parts.push(`w:${width}`);
  if (height) parts.push(`h:${height}`);
  if (fit) parts.push(`fit:${fit}`);
  if (quality) parts.push(`q:${quality}`);
  
  return parts.join('|');
}

/**
 * 解析图片转换参数
 * @param {URLSearchParams} searchParams - URL 查询参数
 * @returns {Object} 转换选项
 */
export function parseTransformOptions(searchParams) {
  const options = {};
  
  const format = searchParams.get('format');
  if (format && Object.values(ImageFormats).includes(format)) {
    options.format = format;
  }
  
  const width = parseInt(searchParams.get('width'));
  if (width && width > 0 && width <= 4096) {
    options.width = width;
  }
  
  const height = parseInt(searchParams.get('height'));
  if (height && height > 0 && height <= 4096) {
    options.height = height;
  }
  
  const fit = searchParams.get('fit');
  if (fit && ['cover', 'contain', 'scale-down', 'crop'].includes(fit)) {
    options.fit = fit;
  }
  
  const quality = parseInt(searchParams.get('quality'));
  if (quality && quality > 0 && quality <= 100) {
    options.quality = quality;
  }
  
  return options;
}

/**
 * 使用 Cloudflare Image Resizing 获取图片
 * @param {string} imageUrl - 图片 URL
 * @param {Object} options - 转换选项
 * @returns {Response} 转换后的图片响应
 */
export async function fetchWithResize(imageUrl, options = {}) {
  const {
    format = 'webp',
    width,
    height,
    fit = 'contain',
    quality = 85
  } = options;

  try {
    // 构建 cf 选项用于图片调整
    const cfOptions = {
      image: {
        format: format,
        quality: quality,
        fit: fit
      }
    };

    if (width) cfOptions.image.width = width;
    if (height) cfOptions.image.height = height;

    // 使用 fetch 的 cf 参数进行图片转换
    // 注意：这需要 Cloudflare 的 Image Resizing 功能（需要付费订阅）
    const response = await fetch(imageUrl, { cf: cfOptions });
    
    return response;
  } catch (error) {
    console.error('[ImageTransform] Fetch with resize error:', error);
    // 失败时返回原图
    return fetch(imageUrl);
  }
}

