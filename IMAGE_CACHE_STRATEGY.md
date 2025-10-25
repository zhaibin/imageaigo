# 图片缓存策略 - 成本优化方案

## 🎯 核心目标

**最小化 Image Resizing API 调用次数，充分利用免费的 R2 和 CDN 缓存**

## 📊 三级缓存架构

```
用户请求
  ↓
┌─────────────────────────────────────────────────┐
│ 第一级：CDN 边缘缓存（Cloudflare CDN）           │
│ • 命中率目标：> 95%                             │
│ • 响应时间：< 10ms                              │
│ • 费用：免费                                    │
└─────────────────────────────────────────────────┘
  ↓ 未命中
┌─────────────────────────────────────────────────┐
│ 第二级：R2 缓存（存储转换结果）                  │
│ • 命中率目标：> 90%                             │
│ • 响应时间：50-100ms                            │
│ • 费用：$0.015/GB/月（存储）                    │
└─────────────────────────────────────────────────┘
  ↓ 未命中
┌─────────────────────────────────────────────────┐
│ 第三级：动态转换（Image Resizing API）          │
│ • 仅首次请求                                    │
│ • 响应时间：200-500ms                           │
│ • 费用：$1-5/1000次 转换                        │
│ • 转换后立即缓存到 R2                           │
└─────────────────────────────────────────────────┘
```

## 🔄 完整请求流程

### 场景 1：首次请求（冷启动）

```
1. 用户请求: /r2/images/photo-original.jpg?format=webp&width=800
   ↓
2. CDN 检查：未命中（首次请求）
   ↓
3. Worker 处理：
   a. 检查 R2 缓存: cache/images/photo-original-fwebp-w800.webp
   b. 未找到，需要转换
   c. 调用 Image Resizing API（💰 产生费用）
   d. 转换成功，获得 WebP 数据
   e. 异步存储到 R2 缓存（不阻塞响应）
   f. 立即返回给用户
   ↓
4. CDN 缓存转换结果（自动，基于 Cache-Control 头）
   ↓
5. R2 后台存储完成
```

**费用：** 1 次 Image Resizing API 调用（约 $0.001-0.005）

### 场景 2：第二次请求（CDN 命中）

```
1. 用户请求: /r2/images/photo-original.jpg?format=webp&width=800
   ↓
2. CDN 检查：✅ 命中！
   ↓
3. 直接返回缓存（不到达 Worker）
```

**费用：** 免费！

### 场景 3：CDN 缓存过期，R2 缓存命中

```
1. 用户请求: /r2/images/photo-original.jpg?format=webp&width=800
   ↓
2. CDN 检查：未命中（缓存过期或清除）
   ↓
3. Worker 处理：
   a. 检查 R2 缓存: cache/images/photo-original-fwebp-w800.webp
   b. ✅ 找到！直接读取
   c. 返回给用户（50-100ms）
   ↓
4. CDN 重新缓存
```

**费用：** R2 读取（Class A 操作，每月包含 1000万次免费）

## 💰 成本分析

### 示例：1000 张图片，每张 3 种尺寸

| 场景 | 请求数 | Image Resizing 调用 | R2 读取 | CDN 命中 | 总费用 |
|------|--------|---------------------|---------|----------|--------|
| **无缓存（每次转换）** | 100万次 | 100万次 | 0 | 0 | **$1000-5000** 💸 |
| **仅 CDN 缓存** | 100万次 | 3000次 | 97000次 | 99.7万次 | **$3-15** 💰 |
| **三级缓存（本方案）** | 100万次 | 3000次 | 100次 | 99.99万次 | **$3-15** ✅ |

### 费用对比

```
场景                        每百万请求费用
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
无缓存（每次转换）         $1,000 - $5,000 💸
只用 CDN 缓存              $3 - $15       💰
三级缓存（推荐）           $3 - $15       ✅
```

**节省成本：** 99.7% - 99.9%

## 📂 R2 缓存存储结构

```
R2 Bucket:
├── images/                           （原图和预处理图）
│   ├── 1234567890-abc-hash1-original.jpg
│   ├── 1234567890-abc-hash1-display.webp
│   └── ...
│
└── cache/images/                     （动态转换缓存）
    ├── 1234567890-abc-hash1-original-fwebp-w800.webp
    ├── 1234567890-abc-hash1-original-fwebp-w400.webp
    ├── 1234567890-abc-hash1-original-fwebp-w1200.webp
    ├── 1234567890-abc-hash1-original-fjpeg-w800-q90.jpg
    └── ...
```

### 缓存 Key 命名规则

```
cache/{原始路径}-{参数标识}.{扩展名}

参数标识格式：
- f{format}      格式（fwebp, fjpeg, fpng, favif）
- w{width}       宽度（w800, w1200）
- h{height}      高度（h600）
- fit{mode}      适配模式（fitcover, fitcrop）
- q{quality}     质量（q90, q75）

示例：
cache/images/123-abc-original-fwebp-w800.webp
cache/images/123-abc-original-fwebp-w400-h300-fitcover.webp
cache/images/123-abc-original-fjpeg-w1200-q95.jpg
```

## 🔍 缓存状态检查

### 响应头说明

| 响应头 | 值 | 说明 |
|--------|-----|------|
| `X-Content-Source` | `R2-Cached` | ✅ 从 R2 缓存读取（最快） |
| `X-Content-Source` | `R2-Transformed-Fresh` | 🔄 刚转换完成（首次） |
| `X-Image-Resizing` | `cached` | 缓存命中 |
| `X-Image-Resizing` | `enabled` | 刚转换完成 |

### 测试缓存效果

```bash
# 第一次请求（冷启动）
curl -I "https://imageaigo.cc/r2/images/test-original.jpg?format=webp&width=800"
# 期望：X-Content-Source: R2-Transformed-Fresh
# 期望：X-Image-Resizing: enabled

# 等待 1 秒（让 R2 缓存完成）

# 第二次请求（应该从 R2 缓存读取）
curl -I "https://imageaigo.cc/r2/images/test-original.jpg?format=webp&width=800"
# 期望：X-Content-Source: R2-Cached
# 期望：X-Image-Resizing: cached

# 第三次请求（应该从 CDN 读取，不到达 Worker）
curl -I "https://imageaigo.cc/r2/images/test-original.jpg?format=webp&width=800"
# 期望：极快响应（< 10ms）
```

## 📈 性能优化建议

### 1. 使用预定义尺寸

**推荐：**
```javascript
const SIZES = {
  thumbnail: 200,
  small: 400,
  medium: 800,
  large: 1200
};

// 使用预定义尺寸
<img src="/r2/images/photo.jpg?format=webp&width=800">
```

**避免：**
```javascript
// ❌ 每个用户不同的尺寸，缓存命中率低
<img src="/r2/images/photo.jpg?format=webp&width=847">
<img src="/r2/images/photo.jpg?format=webp&width=832">
```

### 2. 预处理常用尺寸

对于重要图片，在上传时预生成常用尺寸：

```javascript
// 上传时生成
const sizes = [400, 800, 1200];
for (const size of sizes) {
  await generateAndCache(imageKey, { format: 'webp', width: size });
}
```

### 3. 监控缓存命中率

```bash
# 查看日志，统计缓存命中率
wrangler tail | grep ImageTransform

# 目标：
# - "Cache HIT" 应该占 > 90%
# - "Cache MISS" 应该只在首次请求出现
```

## 🧹 缓存管理

### 查看缓存使用量

```bash
# 查看 R2 存储使用
wrangler r2 object list imageaigo --prefix cache/

# 统计缓存文件数量
wrangler r2 object list imageaigo --prefix cache/ | wc -l
```

### 清理缓存（如需要）

```javascript
// 清理特定图片的所有缓存
async function clearImageCache(imageKey) {
  const prefix = `cache/${imageKey.replace(/\.[^.]+$/, '')}`;
  const list = await env.R2.list({ prefix });
  
  for (const object of list.objects) {
    await env.R2.delete(object.key);
    console.log(`Deleted cache: ${object.key}`);
  }
}

// 清理所有缓存（慎用）
async function clearAllCache() {
  const list = await env.R2.list({ prefix: 'cache/' });
  
  for (const object of list.objects) {
    await env.R2.delete(object.key);
  }
  
  console.log(`Cleared ${list.objects.length} cached images`);
}
```

### 自动清理策略（可选）

```javascript
// 可以在 cron 任务中定期清理旧缓存
async function cleanupOldCache(env, maxAgeDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  
  const list = await env.R2.list({ prefix: 'cache/' });
  let deletedCount = 0;
  
  for (const object of list.objects) {
    if (object.uploaded < cutoffDate) {
      await env.R2.delete(object.key);
      deletedCount++;
    }
  }
  
  console.log(`Cleaned up ${deletedCount} old cached images`);
}
```

## 📊 监控指标

### 关键指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **CDN 缓存命中率** | > 95% | 大部分请求不到达 Worker |
| **R2 缓存命中率** | > 90% | 到达 Worker 的请求中命中缓存 |
| **Image Resizing 调用** | 首次请求 | 每个参数组合只调用一次 |
| **平均响应时间** | < 50ms | CDN 缓存命中 |

### 日志示例

```
✅ 正常情况（高缓存命中率）
[ImageTransform] Request: images/photo-original.jpg, cache key: cache/images/photo-original-fwebp-w800.webp
[ImageTransform] ✅ Cache HIT from R2: cache/images/photo-original-fwebp-w800.webp

🔄 首次请求（缓存未命中）
[ImageTransform] Request: images/photo-original.jpg, cache key: cache/images/photo-original-fwebp-w800.webp
[ImageTransform] Cache MISS, transforming: cache/images/photo-original-fwebp-w800.webp
[ImageTransform] ✅ Transform completed, response sent
[ImageTransform] ✅ Cached to R2: cache/images/photo-original-fwebp-w800.webp (245.32KB)
```

## 💡 最佳实践总结

1. **✅ 优先使用预处理图片**
   - 上传时生成的 `-display.webp`
   - 最快，零转换费用

2. **✅ 动态转换用于特殊场景**
   - 响应式图片（多尺寸）
   - 用户自定义尺寸
   - 首次请求后永久缓存

3. **✅ 使用预定义尺寸**
   - 提高缓存命中率
   - 减少存储空间

4. **✅ 充分利用 CDN**
   - 设置长缓存时间（1 年）
   - 使用 `immutable` 标记

5. **✅ 监控和优化**
   - 定期检查缓存命中率
   - 清理不常用的缓存

## 🎯 成本优化效果

### 实际案例

假设网站有：
- 1000 张图片
- 每张图片 3 种尺寸（400, 800, 1200）
- 每月 100 万次图片请求

**无缓存方案：**
- Image Resizing 调用：100 万次
- 费用：**$1,000 - $5,000/月** 💸

**三级缓存方案（本方案）：**
- Image Resizing 调用：3,000 次（仅首次）
- R2 读取：100 次（CDN 未命中时）
- CDN 命中：99.99 万次（免费）
- 费用：**$3 - $15/月** ✅

**节省：** 99.7% - 99.9%

---

**最后更新：** 2025-10-25  
**版本：** v1.0.0

