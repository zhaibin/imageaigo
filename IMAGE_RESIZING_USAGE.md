# Cloudflare Image Resizing 使用和验证指南

## 快速验证

### 方法 1：使用验证脚本（推荐）

```bash
# 运行交互式验证工具
./image-resizing-check.sh
```

验证脚本提供以下功能：
- ✅ 检查 wrangler.toml 配置
- ✅ 检查代码实现
- ✅ 测试实际图片转换
- ✅ 查看实时日志
- ✅ 显示使用统计
- ✅ 配置建议

### 方法 2：手动检查响应头

```bash
# 测试图片转换（替换为实际域名和图片路径）
curl -I "https://imageaigo.cc/r2/images/example-original.jpg?format=webp&width=800"
```

**关键响应头说明：**

| 响应头 | 值 | 说明 |
|--------|-----|------|
| `X-Image-Resizing` | `enabled` | ✅ Image Resizing 成功应用 |
| `X-Image-Resizing` | `fallback` | ⚠️ 降级返回原图（功能未启用或超配额） |
| `X-Image-Resizing` | `error` | ❌ 转换失败 |
| `X-Image-Resizing` | `not-applicable` | ℹ️ 非图片文件或无需转换 |
| `X-Transform-Options` | `{...}` | 使用的转换参数（JSON 格式） |
| `X-Content-Source` | `R2-Transformed` | 图片已转换 |
| `Content-Type` | `image/webp` | 输出格式 |

### 方法 3：查看实时日志

```bash
# 实时查看所有日志
wrangler tail

# 过滤图片转换相关日志
wrangler tail | grep -i 'ImageTransform'
```

**日志示例：**

```
[ImageTransform] Transform: images/123-hash-original.jpg, options: { format: 'webp', width: 800, quality: 85 }
[ImageTransform] Cloudflare Image Resizing applied successfully
```

## 启用步骤

### 1. 在 Cloudflare Dashboard 中启用

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择您的账户
3. 进入 **Speed** → **Optimization** → **Image Resizing**
4. 启用 **Image Resizing**

> ⚠️ **注意：** Image Resizing 是付费功能，需要相应套餐支持

### 2. （可选）在 wrangler.toml 中添加配置

```toml
# wrangler.toml
[image_resizing]
enabled = true
```

> ℹ️ **说明：** 即使不在 wrangler.toml 中启用，只要在 Dashboard 中启用了，代码也能正常使用 Image Resizing

### 3. 部署 Worker

```bash
wrangler deploy
```

## 使用示例

### URL 参数说明

| 参数 | 类型 | 范围 | 说明 | 示例 |
|------|------|------|------|------|
| `format` | string | webp, jpeg, png, avif | 输出格式 | `format=webp` |
| `width` | number | 1-4096 | 目标宽度（像素） | `width=800` |
| `height` | number | 1-4096 | 目标高度（像素） | `height=600` |
| `fit` | string | contain, cover, scale-down, crop, pad | 适配模式 | `fit=contain` |
| `quality` | number | 1-100 | 图片质量 | `quality=85` |

### 基础用法

```html
<!-- 原图 -->
<img src="/r2/images/example-original.jpg">

<!-- 转换为 WebP，宽度 800px -->
<img src="/r2/images/example-original.jpg?format=webp&width=800">

<!-- 转换为 WebP，800x600，质量 90 -->
<img src="/r2/images/example-original.jpg?format=webp&width=800&height=600&quality=90">
```

### 响应式图片

```html
<img 
  src="/r2/images/example-original.jpg?format=webp&width=800"
  srcset="
    /r2/images/example-original.jpg?format=webp&width=400 400w,
    /r2/images/example-original.jpg?format=webp&width=800 800w,
    /r2/images/example-original.jpg?format=webp&width=1200 1200w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  loading="lazy"
  alt="Example"
>
```

### JavaScript 动态生成

```javascript
// 生成图片 URL
function getImageUrl(originalUrl, options = {}) {
  const { format = 'webp', width, height, quality = 85, fit = 'contain' } = options;
  const baseUrl = originalUrl.split('?')[0];
  const params = new URLSearchParams();
  
  if (format) params.set('format', format);
  if (width) params.set('width', width.toString());
  if (height) params.set('height', height.toString());
  if (quality) params.set('quality', quality.toString());
  if (fit) params.set('fit', fit);
  
  return `${baseUrl}?${params.toString()}`;
}

// 使用
const webpUrl = getImageUrl('/r2/images/example-original.jpg', {
  format: 'webp',
  width: 800,
  quality: 85
});

console.log(webpUrl);
// 输出: /r2/images/example-original.jpg?format=webp&width=800&quality=85&fit=contain
```

## 测试命令

### 基础测试

```bash
# 测试 WebP 转换
curl -I "https://imageaigo.cc/r2/images/example-original.jpg?format=webp&width=800"

# 测试 JPEG 转换
curl -I "https://imageaigo.cc/r2/images/example-original.jpg?format=jpeg&width=800&quality=90"

# 测试 AVIF 转换（最新格式，更小文件）
curl -I "https://imageaigo.cc/r2/images/example-original.jpg?format=avif&width=800"
```

### 下载并验证

```bash
# 下载转换后的图片
curl -o converted.webp "https://imageaigo.cc/r2/images/example-original.jpg?format=webp&width=800"

# 验证文件类型
file converted.webp
# 输出: converted.webp: RIFF (little-endian) data, Web/P image

# 查看文件大小
ls -lh converted.webp
```

### 比较大小

```bash
# 下载原图
curl -o original.jpg "https://imageaigo.cc/r2/images/example-original.jpg"

# 下载转换后的图片
curl -o converted.webp "https://imageaigo.cc/r2/images/example-original.jpg?format=webp&width=800"

# 比较大小
ls -lh original.jpg converted.webp

# 计算压缩率
du -h original.jpg converted.webp
```

## 性能优化

### 预定义尺寸（推荐）

使用预定义的常用尺寸可以提高 CDN 缓存命中率：

```javascript
// 推荐的预定义尺寸
const SIZES = {
  thumbnail: 200,   // 缩略图
  small: 400,       // 小图
  medium: 800,      // 中图（默认）
  large: 1200,      // 大图
  xlarge: 1600      // 超大图
};

// 使用
const url = `/r2/images/example.jpg?format=webp&width=${SIZES.medium}`;
```

### 缓存策略

项目已自动配置最优缓存策略：

- **浏览器缓存：** 1 年（immutable）
- **CDN 缓存：** 1 年
- **缓存键：** 基于完整 URL（包含所有参数）

### 格式选择建议

| 格式 | 文件大小 | 浏览器支持 | 推荐场景 |
|------|----------|------------|----------|
| **WebP** | 中（-25-35%） | 95%+ | 🌟 默认推荐 |
| **AVIF** | 小（-50%） | 70%+ | 新项目 |
| **JPEG** | 大 | 100% | 兼容性优先 |
| **PNG** | 最大 | 100% | 需要透明度 |

## 监控和统计

### Cloudflare Dashboard

1. **Worker 统计**
   - 路径：Analytics → Workers
   - 查看：请求量、错误率、响应时间

2. **Image Resizing 使用量**
   - 路径：Analytics → Image Resizing
   - 查看：转换次数、带宽节省

3. **费用统计**
   - 路径：Billing
   - 查看：当前用量、预计费用

### 日志监控

```bash
# 实时监控
wrangler tail --format pretty

# 监控特定功能
wrangler tail | grep 'ImageTransform'

# 监控错误
wrangler tail | grep -i 'error'
```

## 故障排查

### 问题 1：响应头显示 `X-Image-Resizing: fallback`

**可能原因：**
- Image Resizing 功能未在 Cloudflare Dashboard 启用
- 超出账户配额
- 图片格式不支持转换

**解决方案：**
1. 检查 Dashboard 中 Image Resizing 是否启用
2. 查看账户配额使用情况
3. 查看日志：`wrangler tail | grep ImageTransform`

### 问题 2：响应头显示 `X-Image-Resizing: error`

**可能原因：**
- 原图损坏或格式异常
- 转换参数超出限制
- 网络问题

**解决方案：**
1. 验证原图可正常访问
2. 检查参数范围（宽高 1-4096，质量 1-100）
3. 查看详细错误日志

### 问题 3：图片未转换

**可能原因：**
- URL 参数拼写错误
- CDN 缓存了旧版本
- 参数值超出范围

**解决方案：**
1. 检查 URL 参数是否正确
2. 清除浏览器缓存（Ctrl+Shift+R）
3. 验证参数值在有效范围内

## 费用说明

### Cloudflare Image Resizing 定价

| 套餐 | 包含量 | 超出费用 |
|------|--------|----------|
| Free | ❌ 不包含 | - |
| Pro | ❌ 不包含 | $5 / 1000 次 |
| Business | ✅ 5,000 次/月 | $1 / 1000 次 |
| Enterprise | ✅ 自定义 | 自定义 |

### 成本优化建议

1. **最大化 CDN 缓存命中率**
   - 使用预定义尺寸
   - 避免动态参数
   - URL 参数保持一致

2. **合理使用转换**
   - 仅在需要时转换
   - 考虑预生成常用尺寸
   - 使用 WebP 减少重复转换

3. **监控用量**
   - 定期检查 Dashboard 统计
   - 设置用量提醒
   - 分析转换模式

## 相关文档

- [完整配置指南](CLOUDFLARE_IMAGE_RESIZING_SETUP.md)
- [图片转换服务文档](src/services/IMAGE_TRANSFORM_README.md)
- [使用示例代码](examples/image-transform-usage.js)
- [Cloudflare 官方文档](https://developers.cloudflare.com/images/image-resizing/)

## 支持

遇到问题？

1. 运行验证脚本：`./image-resizing-check.sh`
2. 查看日志：`wrangler tail`
3. 检查 [Cloudflare 文档](https://developers.cloudflare.com/images/image-resizing/)
4. 提交 Issue

---

**最后更新：** 2025-10-25  
**版本：** v1.0.0

