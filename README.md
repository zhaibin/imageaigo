# 🎨 ImageAI Go

基于 Cloudflare Workers 的 AI 图片分析与管理平台，采用瀑布流布局展示，支持智能标签、描述生成和图片管理。

[![部署状态](https://img.shields.io/badge/deploy-active-brightgreen)](https://imageaigo.cc)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ 核心功能

### 1. AI 图片分析
- **智能描述生成**：使用 Llama 3.2 11B Vision 模型生成简洁的图片描述（~50字符）⭐
- **层级化标签系统**：自动生成主分类、子分类和属性标签，便于检索和分类
- **图片尺寸提取**：自动识别 JPEG/PNG/GIF/WebP 格式并提取宽高信息
- **智能压缩**：上传图片自动压缩至 256px 长边用于 AI 分析 ⭐
- **去重功能**：基于图片哈希自动检测重复图片，自动跳转到已存在图片
- **防滥用保护**：IP 速率限制（10次/小时）、机器人检测、行为分析

### 2. 瀑布流展示
- **响应式布局**：PC 端自动 4-8 列，手机端 2 列，完全自适应屏幕宽度
- **保持宽高比**：图片按原始宽高比显示，无裁剪变形
- **流畅加载**：CSS columns 实现的真正瀑布流，性能优异
- **平滑动画**：悬停效果和过渡动画提升用户体验

### 3. 搜索与分类
- **全文搜索**：支持描述和标签的模糊搜索
- **标签筛选**：按主分类、子分类和属性标签浏览
- **分类浏览**：自动统计各分类图片数量
- **点赞功能**：用户可以点赞喜欢的图片

### 4. 管理后台 ⭐️ 新增
- **登录认证**：基于 Token 的安全认证系统
- **数据统计**：实时显示图片、标签、点赞和上传统计
- **图片管理**：查看、搜索、删除图片，查看详细信息
- **标签管理**：管理标签，查看使用次数，清理无用标签
- **系统管理**：清空 R2 存储、KV 缓存或所有数据
- **响应式设计**：支持PC和移动端访问
- **安全保护**：Token 24小时过期，环境变量存储密码

### 5. 性能与安全
- **多级缓存**：KV 缓存 + 图片哈希缓存，减少数据库查询（响应时间降低 80%）⭐
- **智能压缩**：上传时自动压缩图片用于 AI 分析，原图存储到 R2
- **防盗链保护**：R2 图片资源防盗链，仅允许本站访问
- **速率限制**：每 IP 每小时 10 次上传限制 ⭐
- **防滥用**：机器人检测、行为分析、可疑活动日志 ⭐
- **SEO 优化**：静态页面生成、Open Graph 标签、结构化数据

## 🚀 技术栈

- **运行环境**：Cloudflare Workers (Edge Runtime)
- **数据库**：D1 (SQLite)
- **存储**：R2 (兼容 S3)
- **缓存**：KV (键值存储)
- **AI 模型**：Llama 3.2 11B Vision Instruct
- **前端**：原生 JavaScript + CSS (无框架依赖)

## 📦 部署指南

### 1. 前置要求

```bash
# 安装 Node.js 18+
node -v  # >= 18.0.0

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare 账号
wrangler login
```

### 2. 克隆项目

```bash
git clone https://github.com/yourusername/imageaigo.git
cd imageaigo
npm install
```

### 3. 创建资源

```bash
# 创建 D1 数据库
wrangler d1 create imageaigo

# 创建 R2 存储桶
wrangler r2 bucket create imageaigo

# 创建 KV 命名空间
wrangler kv:namespace create "CACHE"
```

### 4. 配置 wrangler.toml

更新 `wrangler.toml` 中的资源 ID：

```toml
name = "imageaigo"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "imageaigo"
database_id = "YOUR_D1_DATABASE_ID"  # 替换为实际 ID

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # 替换为实际 ID

[ai]
binding = "AI"

[[r2_buckets]]
binding = "R2"
bucket_name = "imageaigo"
```

### 5. 初始化数据库

```bash
# 在远程数据库执行 schema
wrangler d1 execute imageaigo --remote --file=schema.sql
```

### 6. 部署

```bash
# 部署到生产环境
npm run deploy

# 或本地开发
npm run dev
```

## 📊 项目结构

```
imageaigo/
├── src/
│   ├── index.js           # 主入口文件，路由和业务逻辑
│   ├── admin.js           # 管理后台页面构建
│   ├── analyzer.js        # AI 分析和图片尺寸提取
│   ├── html-builder.js    # HTML 页面构建
│   ├── footer-template.js # Footer 统一模板
│   ├── recommendations.js # 推荐算法
│   ├── slug-generator.js  # URL 友好的 slug 生成
│   ├── styles.js          # CSS 样式
│   ├── pages.js           # 静态页面内容
│   ├── templates.js       # HTML 模板
│   └── utils.js           # 工具函数
├── schema.sql             # 数据库结构
├── wrangler.toml          # Cloudflare Workers 配置
├── package.json           # 项目依赖
├── cleanup.sh             # 数据清理脚本
├── setup-admin.sh         # 管理后台快速设置
├── change-admin-password.sh # 密码修改工具
├── README.md              # 项目文档
├── CHANGELOG.md           # 更新日志
└── LICENSE                # 开源协议
```

## 🎯 使用方法

### 上传图片

1. 访问网站首页
2. 拖拽图片或点击上传区域选择文件
3. 等待 AI 分析（10-30 秒）
4. 图片会自动显示在瀑布流中

### 搜索图片

```
# 搜索页面
/search?q=关键词

# 按标签浏览
/tag/Nature

# 按分类浏览
/category/Landscape
```

### 管理后台

#### 快速设置

```bash
# 1. 设置管理员密码
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SECRET

# 2. 部署
wrangler deploy

# 3. 访问后台
# https://your-domain.com/admin/login
```

#### 功能

- **数据统计**：图片、标签、点赞数量统计
- **图片管理**：浏览、搜索、删除图片
- **批量上传**：一次上传最多 10 张图片（异步处理）⭐ 新增
- **标签管理**：管理标签，查看使用次数
- **系统清理**：清空 R2 存储、KV 缓存

#### 默认密码

⚠️ 如未设置环境变量，默认密码为 `admin123`（**生产环境必须修改！**）

### API 接口

#### 公开接口

```bash
# 上传并分析图片
POST /api/analyze
Content-Type: multipart/form-data
Body: { original: File, compressed: File }

# 获取图片列表
GET /api/images?limit=20&page=1

# 获取单张图片详情
GET /api/image?id=123

# 搜索图片
GET /api/search?q=关键词

# 获取分类列表
GET /api/categories

# 点赞/取消点赞
POST /api/like { imageId: 123 }
POST /api/unlike { imageId: 123 }

# 数据清理（需要密钥）
POST /api/cleanup
Body: { action: "all", secret: "YOUR_SECRET" }
```

#### 管理后台接口 ⭐️ 新增

所有管理接口都需要在 Header 中携带 Token：
```
Authorization: Bearer <token>
```

```bash
# 管理员登录
POST /api/admin/login
Body: { "password": "your_password" }

# 获取统计数据
GET /api/admin/stats

# 获取图片列表
GET /api/admin/images?page=1&limit=20&search=keyword

# 获取图片详情
GET /api/admin/image/{id}

# 删除图片
DELETE /api/admin/image/{id}

# 获取标签列表
GET /api/admin/tags?search=keyword

# 删除标签
DELETE /api/admin/tag/{id}

# 批量上传（异步处理）⭐ 新增
POST /api/admin/batch-upload
Content-Type: multipart/form-data
Body: file_0, file_1, file_2, ... (最多10个)

# 获取图片 JSON 数据（仅描述和标签）⭐ 新增
GET /api/image-json/{slug}
返回：{ "description": "...", "tags": {...} }
```

## ⚙️ 配置选项

### 环境变量 ⭐️ 更新

推荐使用 `wrangler secret` 命令设置敏感信息：

```bash
# 管理员密码（必需）
wrangler secret put ADMIN_PASSWORD

# Token 签名密钥（必需）
wrangler secret put ADMIN_SECRET
```

或在 Dashboard 中设置环境变量：

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `ADMIN_PASSWORD` | 管理员登录密码 | `admin123` | **强烈推荐** |
| `ADMIN_SECRET` | Token 签名密钥 | `default-secret-change-in-production` | **强烈推荐** |

⚠️ **生产环境必须修改默认值！**

### 缓存策略

- **图片缓存**：R2 图片 1 年缓存
- **KV 缓存**：分析结果缓存 24 小时
- **HTML 缓存**：静态页面 5-10 分钟

## 🔧 维护

### 修改管理员密码

```bash
# 使用脚本
./change-admin-password.sh

# 或手动修改
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SECRET
wrangler deploy
```

### 数据清理

在管理后台 → 系统管理 → 选择清理选项

或使用 API：
```bash
curl -X POST https://your-domain/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"action": "all", "secret": "cleanup-imageaigo-2024"}'
```

### 监控日志

```bash
wrangler tail
```

## 📈 性能优化

### 已实现的优化

- ✅ 图片压缩：上传时自动压缩到合适大小
- ✅ KV 缓存：缓存 AI 分析结果，避免重复分析
- ✅ 图片去重：基于哈希值避免重复存储
- ✅ 懒加载：图片按需加载，提升首屏速度
- ✅ 防盗链：R2 资源访问控制
- ✅ 瀑布流优化：CSS columns 原生实现，性能优异

### 性能指标

- **首屏加载**：< 2s
- **图片上传**：10-30s（含 AI 分析）
- **搜索响应**：< 500ms
- **缓存命中率**：> 80%

## 🐛 常见问题

**图片上传失败**：检查格式（JPEG/PNG/GIF/WebP）和大小（<20MB）

**AI 分析超时**：AI 负载高，请稍后重试或压缩图片

**管理后台无法登录**：确保已设置 `ADMIN_PASSWORD` 并重新部署

**提示速率限制**：每 IP 每小时限制 10 次上传，请等待或使用管理后台批量上传 ⭐

**重复图片上传**：系统会自动检测并跳转到已存在的图片，无需重复上传 ⭐

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

开发流程：Fork → 创建分支 → 提交更改 → PR

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 技术栈

- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge 计算
- [Llama 3.2 Vision](https://ai.meta.com/) - AI 视觉模型
- [D1 Database](https://developers.cloudflare.com/d1/) - SQLite
- [R2 Storage](https://developers.cloudflare.com/r2/) - 对象存储

---

⭐ 如果这个项目对你有帮助，欢迎 Star！
