/**
 * 图片转换服务使用示例
 * 
 * 本文件展示了如何在项目中使用图片转换服务
 */

import { getImageUrl, getImageUrlSet, ImageSizes, ImageFormats } from '../src/services/image-transform.js';

// ==================== 示例 1: 基础用法 ====================

// 生成 WebP 格式的图片 URL
const r2Key = 'images/example123.jpg';
const webpUrl = getImageUrl(r2Key, {
  format: 'webp',
  width: 800,
  quality: 85
});
console.log('WebP URL:', webpUrl);
// 输出: /r2/images/example123.jpg?format=webp&width=800&quality=85

// ==================== 示例 2: 使用预定义尺寸 ====================

// 生成缩略图
const thumbnailUrl = getImageUrl(r2Key, {
  ...ImageSizes.THUMBNAIL,
  format: 'webp'
});
console.log('Thumbnail URL:', thumbnailUrl);
// 输出: /r2/images/example123.jpg?format=webp&width=200&height=200&fit=cover

// 生成中等尺寸图片
const mediumUrl = getImageUrl(r2Key, {
  ...ImageSizes.MEDIUM,
  format: 'webp'
});
console.log('Medium URL:', mediumUrl);
// 输出: /r2/images/example123.jpg?format=webp&width=800&height=800&fit=contain

// ==================== 示例 3: 获取完整的 URL 集合 ====================

const urlSet = getImageUrlSet(r2Key, 'webp');
console.log('URL Set:', urlSet);
// 输出:
// {
//   thumbnail: '/r2/images/example123.jpg?format=webp&width=200&height=200&fit=cover',
//   small: '/r2/images/example123.jpg?format=webp&width=400&height=400&fit=contain',
//   medium: '/r2/images/example123.jpg?format=webp&width=800&height=800&fit=contain',
//   large: '/r2/images/example123.jpg?format=webp&width=1200&height=1200&fit=contain',
//   full: '/r2/images/example123.jpg?format=webp&width=2048&height=2048&fit=contain',
//   original: '/r2/images/example123.jpg'
// }

// ==================== 示例 4: 在 HTML 中使用 ====================

// 瀑布流中的图片卡片
function createImageCard(image) {
  const webpUrl = getImageUrl(image.r2Key, {
    format: 'webp',
    width: 800,
    quality: 85
  });
  
  return `
    <div class="image-card">
      <img src="${webpUrl}" 
           alt="${image.description}" 
           loading="lazy" 
           decoding="async">
      <p>${image.description}</p>
    </div>
  `;
}

// ==================== 示例 5: 响应式图片（srcset） ====================

function createResponsiveImage(image) {
  const urls = getImageUrlSet(image.r2Key, 'webp');
  
  return `
    <img 
      src="${urls.medium}" 
      srcset="
        ${urls.small} 400w,
        ${urls.medium} 800w,
        ${urls.large} 1200w
      "
      sizes="
        (max-width: 640px) 100vw,
        (max-width: 1024px) 50vw,
        33vw
      "
      alt="${image.description}"
      loading="lazy"
    >
  `;
}

// ==================== 示例 6: Picture 元素（格式降级） ====================

function createPictureElement(image) {
  const webpUrl = getImageUrl(image.r2Key, { format: 'webp', width: 800 });
  const jpegUrl = getImageUrl(image.r2Key, { format: 'jpeg', width: 800 });
  
  return `
    <picture>
      <source srcset="${webpUrl}" type="image/webp">
      <img src="${jpegUrl}" alt="${image.description}">
    </picture>
  `;
}

// ==================== 示例 7: 不同场景的最佳实践 ====================

// AI 分析场景 - 客户端压缩（在浏览器中）
// 长边 256 像素，保持宽高比
async function compressForAI(file, maxSize = 256) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      let width = img.width, height = img.height;
      // 计算长边缩放到 maxSize（默认 256）
      const maxDimension = Math.max(width, height);
      if (maxDimension > maxSize) {
        const scale = maxSize / maxDimension;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        console.log(`[AI] Compressed: ${width}x${height}, ${(blob.size / 1024).toFixed(2)}KB`);
        resolve(compressedFile);
      }, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

// 瀑布流场景 - WebP 800px
function getGalleryImageUrl(r2Key) {
  return getImageUrl(r2Key, {
    format: 'webp',
    width: 800,
    quality: 85
  });
}

// 详情页场景 - WebP 1200px 高质量
function getDetailImageUrl(r2Key) {
  return getImageUrl(r2Key, {
    format: 'webp',
    width: 1200,
    quality: 90
  });
}

// 推荐图片场景 - WebP 400px
function getRecommendationImageUrl(r2Key) {
  return getImageUrl(r2Key, {
    format: 'webp',
    width: 400,
    quality: 85
  });
}

// ==================== 示例 8: 动态生成 URL（前端） ====================

// 在前端 JavaScript 中使用
function getImageUrl(originalUrl, format = 'webp', width = null, height = null, quality = 85) {
  if (!originalUrl) return '';
  
  // 移除现有参数
  const baseUrl = originalUrl.split('?')[0];
  
  // 构建查询参数
  const params = new URLSearchParams();
  if (format) params.set('format', format);
  if (width) params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  if (quality !== 85) params.set('quality', quality.toString());
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// 使用示例
const imageUrl = '/r2/images/example.jpg';
const optimizedUrl = getImageUrl(imageUrl, 'webp', 800);
console.log('Optimized URL:', optimizedUrl);
// 输出: /r2/images/example.jpg?format=webp&width=800

// ==================== 示例 9: 性能优化技巧 ====================

// 1. 使用预定义尺寸（提高缓存命中率）
const goodPractice = getImageUrl(r2Key, { ...ImageSizes.MEDIUM, format: 'webp' });

// 2. 避免使用自定义尺寸（降低缓存命中率）
const badPractice = getImageUrl(r2Key, { format: 'webp', width: 789 });

// 3. 使用懒加载
const lazyLoadImage = `<img src="${webpUrl}" loading="lazy" decoding="async">`;

// 4. 设置正确的 aspect-ratio（避免布局偏移）
const aspectRatioImage = `
  <img 
    src="${webpUrl}" 
    style="aspect-ratio: 16 / 9"
    loading="lazy"
  >
`;

// ==================== 示例 10: 错误处理 ====================

function createImageWithFallback(image) {
  const webpUrl = getImageUrl(image.r2Key, { format: 'webp', width: 800 });
  const jpegUrl = getImageUrl(image.r2Key, { format: 'jpeg', width: 800 });
  
  return `
    <img 
      src="${webpUrl}" 
      onerror="this.src='${jpegUrl}'"
      alt="${image.description}"
      loading="lazy"
    >
  `;
}

// ==================== 总结 ====================

/*
最佳实践：

1. 优先使用 WebP 格式（减少 25-35% 文件大小）
2. 使用预定义尺寸（提高缓存命中率）
3. 启用懒加载（loading="lazy"）
4. 设置 aspect-ratio（避免布局偏移）
5. 提供格式降级（picture 元素）
6. 合理设置质量参数：
   - 瀑布流：85
   - 详情页：90
   - 缩略图：80

性能收益：

- WebP 格式：减少 25-35% 文件大小
- 尺寸调整：按需加载，减少带宽
- CDN 缓存：缓存命中后响应时间 < 10ms
- 懒加载：减少初始加载时间

URL 参数规范：

format=webp|jpeg|png|avif  # 输出格式
width=1-4096               # 目标宽度
height=1-4096              # 目标高度
fit=contain|cover|scale-down|crop  # 适配模式
quality=1-100              # 质量（1=最低，100=最高）

注意事项：

1. 当前实现不使用 Cloudflare 付费的 Image Resizing 功能
2. 实际的图片转换需要在客户端完成（AI 分析场景）
3. 服务端主要提供 URL 参数解析和 CDN 缓存
4. 如需真正的服务端转换，需要订阅 Cloudflare Image Resizing
*/

export {
  getGalleryImageUrl,
  getDetailImageUrl,
  getRecommendationImageUrl,
  compressForAI,
  createImageCard,
  createResponsiveImage,
  createPictureElement
};

