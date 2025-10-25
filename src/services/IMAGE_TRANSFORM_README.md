# 图片转换服务 (Image Transform Service)

## 概述

这是一个基于 Cloudflare Workers 的图片转换服务，提供图片压缩、格式转换、尺寸调整等功能，并支持 CDN 缓存。

## 功能特性

### 1. 图片格式转换
- 支持转换为 WebP、JPEG、PNG、AVIF 等格式
- 自动选择最优压缩质量
- 兼容性降级处理

### 2. 图片尺寸调整
- 支持自定义宽度和高度
- 多种适配模式：contain、cover、scale-down、crop
- 预定义尺寸：缩略图、小图、中图、大图、AI分析用图

### 3. CDN 缓存
- 自动使用 Cloudflare Cache API 进行 CDN 缓存
- 缓存时间：31536000 秒（1年）
- 缓存键基于原图 + 转换参数

### 4. 性能优化
- 防盗链保护
- 懒加载支持
- 渐进式图片显示
- ETag 支持

## 使用方法

### 基础用法

```javascript
import { getImageUrl, ImageSizes, ImageFormats } from './services/image-transform.js';

// 生成 WebP 格式的图片 URL
const webpUrl = getImageUrl('r2Key', {
  format: 'webp',
  width: 800,
  quality: 85
});

// 使用预定义尺寸
const thumbnailUrl = getImageUrl('r2Key', {
  ...ImageSizes.THUMBNAIL,
  format: 'webp'
});
```

### URL 参数

图片转换支持以下 URL 参数：

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `format` | string | 输出格式 (webp, jpeg, png, avif) | `format=webp` |
| `width` | number | 目标宽度 (1-4096) | `width=800` |
| `height` | number | 目标高度 (1-4096) | `height=600` |
| `fit` | string | 适配模式 (contain, cover, scale-down, crop) | `fit=contain` |
| `quality` | number | 质量 (1-100) | `quality=85` |

### 示例 URL

```
# 原图
/r2/images/abc123.jpg

# WebP 格式，宽度 800px
/r2/images/abc123.jpg?format=webp&width=800

# WebP 格式，宽度 800px，质量 90
/r2/images/abc123.jpg?format=webp&width=800&quality=90

# JPEG 格式，宽度 1200px，高度 800px，cover 模式
/r2/images/abc123.jpg?format=jpeg&width=1200&height=800&fit=cover
```

## 预定义尺寸

```javascript
export const ImageSizes = {
  THUMBNAIL: { width: 200, height: 200, fit: 'cover' },      // 缩略图
  SMALL: { width: 400, height: 400, fit: 'contain' },        // 小图
  MEDIUM: { width: 800, height: 800, fit: 'contain' },       // 中图
  LARGE: { width: 1200, height: 1200, fit: 'contain' },      // 大图
  AI_ANALYSIS: { width: 256, height: 256, fit: 'scale-down' },  // AI 分析用（长边 256）
  FULL: { width: 2048, height: 2048, fit: 'contain' }        // 完整尺寸
};
```

## 在项目中的应用

### 1. AI 图片分析

在进行 AI 分析前，图片会自动压缩，保持宽高比，长边缩放到 256 像素：

```javascript
// 前端压缩（客户端）
async function compressImage(file, maxSize = 256, quality = 0.8) {
  // 计算长边缩放到 maxSize（默认 256）
  const maxDimension = Math.max(width, height);
  if (maxDimension > maxSize) {
    const scale = maxSize / maxDimension;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  // 使用 Canvas API 压缩图片
  // 参见 src/pages/home.js 第 315-353 行
}
```

**优点：**
- 保持原始宽高比
- 减少 AI 处理时间
- 节省带宽
- 示例：1920x1080 → 256x144，1080x1920 → 144x256

### 2. 瀑布流展示

瀑布流中的图片使用 WebP 格式，宽度 800px：

```javascript
// src/pages/home.js
const webpUrl = getImageUrl(image.image_url, 'webp', 800);
```

### 3. 详情页展示

详情页使用 WebP 格式，宽度 1200px，质量 90：

```javascript
// src/index.js - handleImageDetailPage
const detailImageUrl = getWebPUrl(image.image_url, 1200);
```

### 4. 推荐图片

推荐图片使用 WebP 格式，宽度 400px：

```javascript
const recCards = recommendations.map(rec => `
  <a href="/image/${rec.slug}">
    <img src="${getWebPUrl(rec.image_url, 400)}" alt="..." loading="lazy">
  </a>
`);
```

## CDN 缓存策略

### 缓存层级

1. **浏览器缓存**：1 年（immutable）
2. **CDN 缓存**：1 年
3. **R2 存储**：永久

### 缓存键生成

```javascript
// 缓存键格式：r2Key|f:format|w:width|h:height|fit:mode|q:quality
// 示例：images/abc123.jpg|f:webp|w:800|q:85
const cacheKey = getCacheKey('images/abc123.jpg', {
  format: 'webp',
  width: 800,
  quality: 85
});
```

### 缓存命中率优化

- 使用标准化参数（避免参数顺序不同导致缓存未命中）
- 预定义常用尺寸
- URL 规范化处理

## 性能优化建议

### 1. 使用 WebP 格式

WebP 格式相比 JPEG 可以减少 25-35% 的文件大小：

```javascript
// 推荐：使用 WebP
const url = getImageUrl(r2Key, { format: 'webp', width: 800 });

// 不推荐：使用 JPEG（除非需要兼容性）
const url = getImageUrl(r2Key, { format: 'jpeg', width: 800 });
```

### 2. 合理设置质量

- 瀑布流：质量 85（默认）
- 详情页：质量 90
- 缩略图：质量 80

### 3. 使用预定义尺寸

使用预定义尺寸可以提高缓存命中率：

```javascript
// 推荐：使用预定义尺寸
const url = getImageUrl(r2Key, { ...ImageSizes.MEDIUM, format: 'webp' });

// 不推荐：使用自定义尺寸（降低缓存命中率）
const url = getImageUrl(r2Key, { format: 'webp', width: 789 });
```

### 4. 懒加载

对于瀑布流中的图片，启用懒加载：

```html
<img src="..." loading="lazy" decoding="async">
```

## 防盗链保护

图片服务内置防盗链保护，只允许以下来源访问：

- `imageaigo.cc`
- `*.workers.dev`
- 直接访问（无 Referer）

## 注意事项

### 1. Cloudflare Image Resizing

✅ **当前实现已启用 Cloudflare Image Resizing 服务**

实现方式：
- 使用 `fetch` 的 `cf.image` 参数进行真正的服务端转换
- 自动降级：如果 Image Resizing 失败，返回原图
- CDN 缓存：转换后的图片缓存 1 年

```javascript
// 使用 fetch 的 cf 参数触发 Image Resizing
const response = await fetch(originalUrl, {
  cf: {
    image: {
      format: 'webp',
      width: 800,
      quality: 85,
      fit: 'contain'
    }
  }
});
```

**重要：**
- 需要在 Cloudflare Dashboard 中启用 Image Resizing 功能
- 这是一个付费服务（包含在某些套餐中）
- 不使用 Cloudflare Images 的分发，而是使用 CDN 缓存
- 响应头 `X-Image-Resizing` 显示是否成功使用了 Image Resizing

### 2. 客户端压缩

AI 分析用的图片压缩在客户端完成（使用 Canvas API），原因：
- 减少上传流量和服务器负载
- 加快 AI 分析速度
- 用户体验更好
- 压缩策略：长边缩放到 256 像素，保持宽高比
  - 示例：1920x1080 → 256x144
  - 示例：1080x1920 → 144x256
  - 示例：1024x1024 → 256x256

### 3. 浏览器兼容性

WebP 格式支持情况：
- Chrome 23+
- Firefox 65+
- Safari 14+
- Edge 18+

对于不支持 WebP 的浏览器，可以使用降级方案：

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="...">
</picture>
```

## API 文档

### getImageUrl(r2Key, options)

生成图片转换 URL。

**参数：**
- `r2Key` (string): R2 存储的 key
- `options` (object): 转换选项
  - `format` (string): 输出格式，默认 'webp'
  - `width` (number): 目标宽度
  - `height` (number): 目标高度
  - `fit` (string): 适配模式，默认 'contain'
  - `quality` (number): 质量，默认 85

**返回值：** (string) 转换后的图片 URL

### getImageUrlSet(r2Key, format)

获取不同尺寸的图片 URL 集合。

**参数：**
- `r2Key` (string): R2 存储的 key
- `format` (string): 输出格式，默认 'webp'

**返回值：** (object) 包含不同尺寸 URL 的对象
```javascript
{
  thumbnail: '/r2/...?format=webp&width=200&height=200',
  small: '/r2/...?format=webp&width=400',
  medium: '/r2/...?format=webp&width=800',
  large: '/r2/...?format=webp&width=1200',
  full: '/r2/...?format=webp&width=2048',
  original: '/r2/...'
}
```

### parseTransformOptions(searchParams)

解析 URL 查询参数为转换选项。

**参数：**
- `searchParams` (URLSearchParams): URL 查询参数

**返回值：** (object) 转换选项

### getCacheKey(r2Key, options)

生成图片转换的缓存键。

**参数：**
- `r2Key` (string): R2 存储的 key
- `options` (object): 转换选项

**返回值：** (string) 缓存键

## 监控和调试

### 缓存命中日志

```javascript
console.log(`[ImageCache] Hit: ${cacheKey}`);
console.log(`[ImageTransform] Transform: ${r2Key}, format: ${format}, width: ${width}`);
```

### 响应头

- `X-Cache`: HIT (缓存命中) / MISS (缓存未命中)
- `X-Content-Source`: R2 / R2-Transformed
- `X-Transform-Options`: 转换参数（JSON 格式）
- `Cache-Control`: 缓存策略
- `ETag`: 资源版本标识

## 更新日志

### v1.0.0 (2024-10-21)

初始版本：
- ✅ 图片格式转换（WebP、JPEG、PNG、AVIF）
- ✅ 图片尺寸调整
- ✅ CDN 缓存支持
- ✅ 防盗链保护
- ✅ 懒加载支持
- ✅ AI 分析前图片压缩
- ✅ 瀑布流和详情页 WebP 格式支持

## 常见问题

### Q: 为什么图片还是显示原格式？

A: 检查以下几点：
1. URL 是否包含正确的 `format` 参数
2. 浏览器是否支持 WebP 格式
3. CDN 缓存是否已更新（可以尝试清除缓存）

### Q: 如何清除图片缓存？

A: 
```bash
# 使用管理员 API 清除缓存
curl -X POST https://imageaigo.cc/api/admin/cleanup?action=cache
```

### Q: 图片转换会增加延迟吗？

A: 
- 首次访问：会有轻微延迟（CDN 缓存未命中）
- 后续访问：直接从 CDN 返回，延迟极低
- 优化建议：使用预定义尺寸提高缓存命中率

## 贡献指南

如需改进图片转换服务，请遵循以下步骤：

1. 修改 `src/services/image-transform.js`
2. 更新相关调用代码
3. 添加测试用例
4. 更新此文档

## 许可证

MIT License

