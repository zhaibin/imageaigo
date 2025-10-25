# Cloudflare Image Resizing 配置指南

本项目已集成 Cloudflare Image Resizing 服务进行真正的服务端图片转换。

## 概述

项目使用 Cloudflare 的 Image Resizing 功能，通过 `fetch` 的 `cf.image` 参数实现：
- ✅ 服务端图片格式转换（WebP、JPEG、PNG、AVIF）
- ✅ 服务端图片尺寸调整
- ✅ CDN 缓存（不使用 Cloudflare Images 的分发）
- ✅ 自动降级机制

## 配置步骤

### 1. 启用 Image Resizing

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的账户
3. 进入 **Speed** → **Optimization** → **Image Resizing**
4. 启用 **Image Resizing**

**注意：** Image Resizing 是一个付费功能，某些付费套餐中包含此功能。

### 2. 验证功能是否启用

部署 Worker 后，访问一个带转换参数的图片 URL：

```bash
# 测试 URL
https://your-domain.com/r2/images/example.jpg?format=webp&width=800

# 检查响应头
curl -I "https://your-domain.com/r2/images/example.jpg?format=webp&width=800"
```

查看响应头：
- `X-Image-Resizing: enabled` - 成功使用 Image Resizing ✅
- `X-Image-Resizing: fallback` - 降级使用原图 ⚠️
- `X-Image-Resizing: error` - 转换失败 ❌

### 3. 监控使用情况

在 Cloudflare Dashboard 中监控：
1. **Analytics** → **Workers** - 查看 Worker 请求量
2. **Analytics** → **Image Resizing** - 查看图片转换使用量
3. **Billing** - 查看费用

## 工作原理

### 服务端转换流程

```javascript
// 1. 请求带转换参数的图片
GET /r2/images/example.jpg?format=webp&width=800

// 2. Worker 解析参数
const options = parseTransformOptions(url.searchParams);
// { format: 'webp', width: 800, quality: 85 }

// 3. 使用 fetch 的 cf 参数触发 Image Resizing
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

// 4. 返回转换后的图片并缓存到 CDN
```

### 自动降级机制

如果 Image Resizing 失败（例如未启用或超出配额），系统会自动降级：

```javascript
try {
  // 尝试使用 Image Resizing
  transformedResponse = await fetch(originalUrl, { cf: cfOptions });
  resizingApplied = true;
} catch (resizeError) {
  // 降级：返回原图
  transformedResponse = new Response(imageData, { headers });
  resizingApplied = false;
}
```

## 费用说明

### Image Resizing 定价

根据你的 Cloudflare 套餐：

| 套餐 | 包含量 | 超出费用 |
|------|--------|----------|
| Free | 不包含 | - |
| Pro | 不包含 | $5 / 1000 次 |
| Business | 5,000 次/月 | $1 / 1000 次 |
| Enterprise | 自定义 | 自定义 |

### 优化建议

1. **使用 CDN 缓存** - 已自动配置，缓存时间 1 年
2. **使用预定义尺寸** - 提高缓存命中率
3. **启用浏览器缓存** - 已自动配置

## 配置参数

### 支持的转换参数

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `format` | string | 输出格式 | `webp`, `jpeg`, `png`, `avif` |
| `width` | number | 目标宽度（1-4096） | `800` |
| `height` | number | 目标高度（1-4096） | `600` |
| `fit` | string | 适配模式 | `contain`, `cover`, `scale-down`, `crop` |
| `quality` | number | 质量（1-100） | `85` |

### 预定义尺寸

```javascript
ImageSizes.THUMBNAIL   // 200x200, cover
ImageSizes.SMALL       // 400x400, contain
ImageSizes.MEDIUM      // 800x800, contain
ImageSizes.LARGE       // 1200x1200, contain
ImageSizes.AI_ANALYSIS // 256x256, scale-down（长边 256）
ImageSizes.FULL        // 2048x2048, contain
```

## 使用示例

### 前端调用

```javascript
// 生成 WebP 格式的图片 URL
function getImageUrl(originalUrl, format = 'webp', width = 800) {
  const baseUrl = originalUrl.split('?')[0];
  const params = new URLSearchParams();
  params.set('format', format);
  params.set('width', width.toString());
  return `${baseUrl}?${params.toString()}`;
}

// 使用
const webpUrl = getImageUrl(image.image_url, 'webp', 800);
```

### HTML

```html
<!-- 基础用法 -->
<img src="/r2/images/example.jpg?format=webp&width=800" loading="lazy">

<!-- 响应式图片 -->
<img 
  src="/r2/images/example.jpg?format=webp&width=800"
  srcset="
    /r2/images/example.jpg?format=webp&width=400 400w,
    /r2/images/example.jpg?format=webp&width=800 800w,
    /r2/images/example.jpg?format=webp&width=1200 1200w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  loading="lazy"
>
```

## 性能优化

### 1. CDN 缓存策略

已配置：
- 浏览器缓存：1 年（immutable）
- CDN 缓存：1 年
- 缓存键：基于 URL + 转换参数

### 2. 缓存命中率优化

- ✅ 使用预定义尺寸
- ✅ URL 参数规范化
- ✅ 避免使用自定义尺寸

### 3. 性能收益

- WebP 格式减少 25-35% 文件大小
- CDN 缓存命中后响应时间 < 10ms
- 带宽节省 30-40%

## 故障排查

### 问题：响应头显示 `X-Image-Resizing: fallback`

**原因：**
- Image Resizing 未启用
- 超出使用配额
- 图片格式不支持

**解决方案：**
1. 检查 Cloudflare Dashboard 中 Image Resizing 是否启用
2. 检查账户配额使用情况
3. 查看 Worker 日志：`wrangler tail`

### 问题：图片未转换

**原因：**
- URL 参数错误
- CDN 缓存了旧版本

**解决方案：**
1. 检查 URL 参数格式
2. 清除 CDN 缓存：
   ```bash
   curl -X POST https://your-domain.com/api/admin/cleanup \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"action": "cache"}'
   ```

### 问题：转换失败（error）

**原因：**
- 原图损坏或格式不支持
- 转换参数超出限制

**解决方案：**
1. 检查原图是否可正常访问
2. 检查转换参数是否在支持范围内
3. 查看详细错误日志

## 监控和日志

### 查看实时日志

```bash
# 查看 Worker 日志
wrangler tail

# 过滤图片转换相关日志
wrangler tail | grep ImageTransform
```

### 关键日志

```
[ImageTransform] Transform: images/abc.jpg, format: webp, width: 800, height: null
[ImageTransform] Cloudflare Image Resizing applied successfully
[ImageCache] Hit: images/abc.jpg|f:webp|w:800|q:85
```

## AI 分析图片尺寸

### 优化说明

**之前：** 固定 512x512，可能造成图片变形

**现在：** 长边 256 像素，保持宽高比

**示例：**
- 1920x1080 → 256x144
- 1080x1920 → 144x256
- 1024x1024 → 256x256

**优点：**
- 保持原始宽高比，AI 分析更准确
- 减少文件大小和上传时间
- 降低 AI 处理成本
- 更快的分析速度

## 相关文档

- [图片转换服务文档](src/services/IMAGE_TRANSFORM_README.md)
- [使用示例](examples/image-transform-usage.js)
- [主 README](README.md)
- [Cloudflare Image Resizing 官方文档](https://developers.cloudflare.com/images/image-resizing/)

## 常见问题

**Q: 是否需要额外配置？**
A: 只需在 Cloudflare Dashboard 中启用 Image Resizing 功能即可，代码已集成。

**Q: 如何禁用 Image Resizing？**
A: 在 Dashboard 中禁用即可，系统会自动降级返回原图。

**Q: 是否使用 Cloudflare Images 的分发？**
A: 不使用。我们使用 Image Resizing 进行转换，然后通过 CDN 缓存分发。

**Q: 如何检查是否成功使用了 Image Resizing？**
A: 查看响应头 `X-Image-Resizing: enabled`。

## 支持

如有问题，请：
1. 查看 [Cloudflare 文档](https://developers.cloudflare.com/images/image-resizing/)
2. 检查 Worker 日志：`wrangler tail`
3. 提交 Issue

---

最后更新：2024-10-21
版本：v3.6.0

