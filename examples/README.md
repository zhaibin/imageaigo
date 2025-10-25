# 使用示例

本目录包含 ImageAI Go 项目的各种使用示例。

## 文件列表

### image-transform-usage.js

图片转换服务的完整使用示例，包括：

1. **基础用法** - 如何生成转换后的图片 URL
2. **预定义尺寸** - 使用系统预定义的标准尺寸
3. **URL 集合** - 一次获取多个尺寸的 URL
4. **HTML 集成** - 在 HTML 中使用图片转换
5. **响应式图片** - 使用 srcset 和 sizes 属性
6. **格式降级** - 使用 picture 元素支持旧浏览器
7. **场景最佳实践** - 不同场景的最优配置
8. **前端动态生成** - 在客户端生成转换 URL
9. **性能优化** - 缓存命中率优化技巧
10. **错误处理** - 图片加载失败的降级处理

## 快速开始

### 基础示例

```javascript
import { getImageUrl, ImageSizes } from '../src/services/image-transform.js';

// 生成 WebP 格式，800px 宽度的图片 URL
const url = getImageUrl('images/example.jpg', {
  format: 'webp',
  width: 800,
  quality: 85
});

console.log(url);
// 输出: /r2/images/example.jpg?format=webp&width=800&quality=85
```

### 在 HTML 中使用

```html
<!-- 基础用法 -->
<img src="/r2/images/example.jpg?format=webp&width=800" alt="示例图片" loading="lazy">

<!-- 响应式图片 -->
<img 
  src="/r2/images/example.jpg?format=webp&width=800" 
  srcset="
    /r2/images/example.jpg?format=webp&width=400 400w,
    /r2/images/example.jpg?format=webp&width=800 800w,
    /r2/images/example.jpg?format=webp&width=1200 1200w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="示例图片"
  loading="lazy"
>

<!-- 格式降级 -->
<picture>
  <source srcset="/r2/images/example.jpg?format=webp&width=800" type="image/webp">
  <img src="/r2/images/example.jpg?format=jpeg&width=800" alt="示例图片">
</picture>
```

## 不同场景的配置

### AI 分析场景

```javascript
// 客户端压缩，长边 256 像素，保持宽高比
const aiImageSize = ImageSizes.AI_ANALYSIS; // { width: 256, height: 256, fit: 'scale-down' }

// 示例压缩结果：
// 1920x1080 → 256x144
// 1080x1920 → 144x256
// 1024x1024 → 256x256
```

### 瀑布流展示

```javascript
const galleryUrl = getImageUrl(r2Key, {
  format: 'webp',
  width: 800,
  quality: 85
});
```

### 详情页展示

```javascript
const detailUrl = getImageUrl(r2Key, {
  format: 'webp',
  width: 1200,
  quality: 90
});
```

### 推荐图片

```javascript
const recommendationUrl = getImageUrl(r2Key, {
  format: 'webp',
  width: 400,
  quality: 85
});
```

## 性能优化建议

### 1. 使用预定义尺寸

✅ **推荐**：
```javascript
const url = getImageUrl(r2Key, { ...ImageSizes.MEDIUM, format: 'webp' });
```

❌ **不推荐**：
```javascript
const url = getImageUrl(r2Key, { format: 'webp', width: 789 });
```

原因：使用预定义尺寸可以提高 CDN 缓存命中率。

### 2. 优先使用 WebP 格式

WebP 格式相比 JPEG 可以减少 25-35% 的文件大小，同时保持相似的视觉质量。

```javascript
// 推荐
const url = getImageUrl(r2Key, { format: 'webp', width: 800 });

// 不推荐（除非需要兼容性）
const url = getImageUrl(r2Key, { format: 'jpeg', width: 800 });
```

### 3. 合理设置质量参数

| 场景 | 推荐质量 | 说明 |
|------|----------|------|
| 缩略图 | 80 | 较小尺寸，质量要求不高 |
| 瀑布流 | 85 | 平衡质量和文件大小 |
| 详情页 | 90 | 高质量展示 |
| 打印用途 | 95 | 最高质量 |

### 4. 启用懒加载

```html
<img src="..." loading="lazy" decoding="async">
```

### 5. 设置 aspect-ratio

避免布局偏移（CLS）：

```html
<img src="..." style="aspect-ratio: 16 / 9" loading="lazy">
```

## 浏览器兼容性

### WebP 支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 23+ |
| Firefox | 65+ |
| Safari | 14+ |
| Edge | 18+ |

### 降级方案

对于不支持 WebP 的浏览器，使用 `<picture>` 元素：

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="...">
</picture>
```

## URL 参数说明

| 参数 | 类型 | 范围 | 默认值 | 说明 |
|------|------|------|--------|------|
| `format` | string | webp, jpeg, png, avif | webp | 输出格式 |
| `width` | number | 1-4096 | - | 目标宽度（像素） |
| `height` | number | 1-4096 | - | 目标高度（像素） |
| `fit` | string | contain, cover, scale-down, crop | contain | 适配模式 |
| `quality` | number | 1-100 | 85 | 图片质量 |

### fit 参数说明

- `contain`: 保持宽高比，完整显示图片（可能有留白）
- `cover`: 保持宽高比，填满容器（可能裁剪）
- `scale-down`: 只在图片大于目标尺寸时缩小
- `crop`: 裁剪到目标尺寸

## 更多资源

- [图片转换服务文档](../src/services/IMAGE_TRANSFORM_README.md)
- [主 README](../README.md)
- [API 文档](../README.md#api-接口)

## 常见问题

### Q: 如何清除图片缓存？

A: 使用管理员 API：
```bash
curl -X POST https://imageaigo.cc/api/admin/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action": "cache"}'
```

### Q: 图片转换会增加延迟吗？

A: 
- 首次访问：轻微延迟（CDN 缓存未命中）
- 后续访问：直接从 CDN 返回，延迟极低（< 10ms）

### Q: 如何测试图片 URL 是否正确？

A: 直接在浏览器中访问生成的 URL，检查图片是否正常显示。

## 贡献

欢迎提交更多使用示例！请遵循以下规范：

1. 代码清晰，注释详细
2. 包含实际可运行的示例
3. 说明使用场景和最佳实践
4. 更新本 README 文件

## 许可证

MIT License

