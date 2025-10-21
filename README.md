# 🎨 ImageAI Go

> 基于 Cloudflare Workers 的 AI 图片分析与管理平台

[![部署状态](https://img.shields.io/badge/deploy-active-brightgreen)](https://imageaigo.cc)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个完全运行在 Cloudflare Edge 网络上的现代化图片管理平台，使用 AI 自动分析图片、生成描述和智能标签，提供优雅的瀑布流展示和强大的搜索功能。

## ✨ 核心特性

### 🤖 AI 智能分析
- **自动描述生成** - 基于 Llama 3.2 11B Vision 模型，生成精准的图片描述
- **三级标签体系** - 主分类、子分类、属性标签的层级化组织
- **智能去重** - SHA-256 哈希自动检测重复图片
- **尺寸识别** - 自动提取 JPEG/PNG/GIF/WebP 图片的宽高信息

### 🎨 现代化界面
- **响应式瀑布流** - 完美适配桌面端（4-8列）和移动端（2列）
- **保持宽高比** - 图片按原始比例显示，无裁剪变形
- **流畅交互** - 悬停效果、平滑动画、渐进式加载
- **PWA 支持** - 可安装、离线浏览、Service Worker 缓存

### 🔐 完整用户系统
- **用户注册登录** - 邮箱注册、密码加密、会话管理
- **密码找回** - 安全的密码重置流程
- **个人中心** - 用户资料、头像、图片管理
- **访问控制** - 核心功能需登录访问

### 🔍 强大搜索
- **全文搜索** - 支持描述和标签的模糊搜索
- **分类浏览** - 按主分类快速筛选
- **标签筛选** - 多维度标签组合查询
- **智能推荐** - 基于标签相似度的图片推荐

### 🛡️ 管理后台
- **数据统计** - 实时图片、标签、用户统计
- **图片管理** - 查看、搜索、删除、重新分析
- **标签管理** - 管理标签、查看使用情况
- **批量上传** - 支持拖拽、队列处理、实时进度
- **用户管理** - 用户信息管理和权限控制
- **系统清理** - R2 存储、KV 缓存、数据库清理

### ⚡ 极致性能
- **多级缓存** - 内存缓存 + KV 缓存 + 数据库，命中率 70%+
- **数据库优化** - 8 个关键索引，查询速度提升 60-80%
- **批量查询** - N+1 查询优化，从 21 次降至 2 次
- **智能压缩** - 上传时自动压缩用于 AI 分析
- **CDN 加速** - Cloudflare 全球 300+ 节点边缘缓存

### 🌐 SEO 优化
- **动态 Sitemap** - 自动生成符合 Google 规范的 Sitemap
- **结构化数据** - Schema.org 完整支持
- **Open Graph** - 社交媒体分享优化
- **语义化 HTML** - 完善的标签层级和 ARIA
- **Google Analytics** - GA4 集成和事件追踪

## 🚀 快速开始

### 前置要求

```bash
# Node.js 18+
node -v  # >= 18.0.0

# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/imageaigo.git
cd imageaigo

# 2. 安装依赖
npm install

# 3. 创建资源
wrangler d1 create imageaigo
wrangler r2 bucket create imageaigo
wrangler kv:namespace create "CACHE"

# 4. 初始化数据库
wrangler d1 execute imageaigo --remote --file=schema.sql

# 5. 设置环境变量
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SECRET

# 6. 部署
npm run deploy
```

### 配置说明

更新 `wrangler.toml` 中的资源 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "imageaigo"
database_id = "YOUR_D1_DATABASE_ID"  # 替换为实际 ID

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # 替换为实际 ID
```

## 📖 使用指南

### 用户端

1. **注册账号** - 访问 `/register`，填写邮箱和密码
2. **登录** - 访问 `/login`，使用注册的账号登录
3. **上传图片** - 登录后在首页拖拽或选择图片上传
4. **AI 分析** - 系统自动分析图片并生成描述和标签（10-30秒）
5. **浏览查看** - 在瀑布流中浏览所有图片
6. **搜索筛选** - 使用搜索框或点击标签进行筛选

### 管理端

1. **登录后台** - 访问 `/admin/login`，使用管理员密码登录
2. **批量上传** - 支持一次上传多张图片，队列自动处理
3. **管理图片** - 查看、搜索、删除、重新分析图片
4. **管理用户** - 查看和管理注册用户
5. **查看统计** - 实时查看系统数据统计

### API 接口

#### 公开接口

```bash
# 获取图片列表
GET /api/images?limit=20&page=1

# 搜索图片
GET /api/search?q=关键词

# 获取图片详情
GET /api/image?id=123

# 获取分类列表
GET /api/categories

# 点赞图片
POST /api/like { imageId: 123 }
```

#### 管理接口（需要 Token）

```bash
# 管理员登录
POST /api/admin/login
Body: { "password": "your_password" }

# 获取统计
GET /api/admin/stats
Header: Authorization: Bearer <token>

# 批量上传
POST /api/admin/batch-upload
Header: Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **运行时** | Cloudflare Workers | 全球边缘计算 |
| **数据库** | D1 (SQLite) | 关系型数据库 |
| **存储** | R2 | 对象存储（兼容 S3） |
| **缓存** | KV | 键值存储 |
| **队列** | Queue | 消息队列 |
| **AI** | Llama 3.2 11B Vision | 图片视觉模型 |
| **前端** | 原生 JavaScript | 无框架依赖 |

### 项目结构

```
imageaigo/
├── src/
│   ├── index.js              # 主路由和核心逻辑
│   ├── auth.js               # 用户认证模块
│   ├── auth-middleware.js    # 认证中间件
│   ├── analyzer.js           # AI 图片分析
│   ├── queue-handler.js      # 队列消息处理
│   ├── recommendations.js    # 推荐算法
│   ├── admin.js              # 管理后台页面
│   ├── admin-users.js        # 用户管理
│   ├── profile-page.js       # 个人中心
│   ├── user-pages.js         # 认证页面
│   ├── components/           # UI 组件库
│   │   └── index.js
│   ├── templates/            # 页面模板
│   │   └── layout.js
│   ├── client/               # 客户端脚本
│   │   └── gallery.js
│   ├── lib/                  # 工具库
│   │   ├── validation.js
│   │   └── performance.js
│   ├── html-builder.js       # HTML 构建器
│   ├── styles.js             # CSS 样式
│   └── utils.js              # 工具函数
├── public/
│   ├── sw.js                 # Service Worker
│   ├── offline.html          # 离线页面
│   └── manifest.json         # PWA 配置
├── schema.sql                # 数据库结构
├── wrangler.toml             # Cloudflare 配置
└── package.json              # 项目配置
```

## 🎯 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| **首屏加载** | < 1s | 多级缓存优化 |
| **API 响应** | 10-20ms | 缓存命中时 |
| **缓存命中率** | 70%+ | KV + 内存缓存 |
| **数据库查询** | 2 次/请求 | N+1 优化后 |
| **全球延迟** | < 50ms | 边缘节点加速 |

## 🔧 维护管理

### 修改管理员密码

```bash
# 方法1：使用脚本
./change-admin-password.sh

# 方法2：手动修改
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SECRET
wrangler deploy
```

### 清理缓存

```bash
# 清理 Sitemap 缓存
./clear-sitemap-cache.sh

# 通过管理后台清理
访问 /admin → 系统管理 → 选择清理选项
```

### 查看日志

```bash
# 实时查看 Worker 日志
wrangler tail

# 查看 Queue 状态
wrangler queues list
```

## 🔒 安全特性

- ✅ **密码加密** - SHA-256 哈希存储
- ✅ **会话安全** - HttpOnly、Secure、SameSite Cookie
- ✅ **访问控制** - Token 认证和权限管理
- ✅ **速率限制** - IP 级别上传限制（10次/小时）
- ✅ **输入验证** - 多层验证和 XSS 防护
- ✅ **防盗链** - R2 资源访问控制
- ✅ **机器人检测** - 识别可疑行为

## 📝 常见问题

**Q: 图片上传失败？**  
A: 检查格式（JPEG/PNG/GIF/WebP）和大小（<20MB）

**Q: AI 分析超时？**  
A: AI 负载高时可能超时，请稍后重试或压缩图片

**Q: 管理后台无法登录？**  
A: 确保已设置 `ADMIN_PASSWORD` 环境变量并重新部署

**Q: 提示速率限制？**  
A: 每 IP 每小时限制 10 次上传，请等待或使用管理后台批量上传

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

**开发流程：**
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

**开发规范：**
- 遵循现有代码风格
- 添加必要的注释
- 更新相关文档
- 确保测试通过

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) - Edge 计算平台
- [Llama 3.2 Vision](https://ai.meta.com/) - AI 视觉模型
- [D1 Database](https://developers.cloudflare.com/d1/) - SQLite 数据库
- [R2 Storage](https://developers.cloudflare.com/r2/) - 对象存储

---

⭐ 如果这个项目对你有帮助，欢迎 Star！

访问在线演示：[https://imageaigo.cc](https://imageaigo.cc)
