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
- **双重登录方式** - 邮箱验证码登录 + 密码登录
- **邮箱验证** - 注册、登录、密码重置均支持验证码
- **密码安全** - SHA-256 加密、密码重置链接（1小时有效）
- **会话管理** - JWT-like token、自动过期、多设备登录
- **用户名/邮箱登录** - 支持使用用户名或邮箱登录
- **个人中心** - 用户资料、头像、图片管理
- **访问控制** - 核心功能需登录访问

### 🛡️ 安全特性
- **暴力破解防护** - Cloudflare Turnstile 人机验证
  - 登录失败 2 次后显示验证码
  - 失败 10 次后锁定 15 分钟
  - IP + 账户双重追踪
- **速率限制** - 验证码发送限制（IP: 20/小时，邮箱: 1/分钟）
- **邮件服务** - Resend.com API 集成，专业 HTML 邮件模板

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
wrangler secret put ADMIN_PASSWORD        # 管理员密码
wrangler secret put ADMIN_SECRET          # 管理员会话密钥
wrangler secret put RESEND_API_TOKEN      # Resend 邮件服务 API Token
wrangler secret put TURNSTILE_SECRET_KEY  # Cloudflare Turnstile 密钥

# 6. 部署
npm run deploy
```

### 配置说明

#### 1. 更新资源 ID

更新 `wrangler.toml` 中的资源 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "imageaigo"
database_id = "YOUR_D1_DATABASE_ID"  # 替换为实际 ID

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # 替换为实际 ID

[[r2_buckets]]
binding = "R2"
bucket_name = "imageaigo"
```

#### 2. 配置 Turnstile（可选但推荐）

1. 访问 [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile)
2. 创建站点，获取 **Site Key** 和 **Secret Key**
3. 更新 `src/user-pages.js` 中的站点密钥：
   ```javascript
   // 找到第 381 行，替换为你的 Site Key
   sitekey: 'YOUR_SITE_KEY'
   ```
4. 配置密钥：`wrangler secret put TURNSTILE_SECRET_KEY`
5. 验证配置：`./check-turnstile.sh`

#### 3. 配置邮件服务（必需）

1. 注册 [Resend](https://resend.com) 账号
2. 获取 API Token
3. 配置域名验证（可选，用于发送域名邮件）
4. 配置密钥：`wrangler secret put RESEND_API_TOKEN`

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
├── src/                      # 源代码目录（模块化架构）
│   ├── index.js              # 🚀 主路由和核心逻辑
│   │
│   ├── auth/                 # 🔐 认证模块（5个文件）
│   │   ├── auth.js           # 用户认证核心
│   │   ├── middleware.js     # 认证中间件
│   │   ├── verification.js   # 验证码管理
│   │   ├── brute-force.js    # 暴力破解防护
│   │   └── email.js          # 邮件服务（Resend API）
│   │
│   ├── pages/                # 📄 页面模块（6个文件）
│   │   ├── admin/            # 管理后台
│   │   │   ├── index.js      # 管理仪表板
│   │   │   └── users.js      # 用户管理
│   │   ├── user/             # 用户页面
│   │   │   ├── auth-pages.js # 登录/注册/密码重置
│   │   │   └── profile.js    # 个人中心
│   │   └── home.js           # 首页构建（瀑布流）
│   │
│   ├── services/             # 🛠️ 服务层（5个文件）
│   │   ├── ai/               # AI 服务
│   │   │   ├── analyzer.js   # 图片分析（Llama Vision）
│   │   │   └── recommendations.js  # 推荐算法
│   │   ├── queue.js          # 队列处理
│   │   ├── unsplash.js       # Unsplash 同步
│   │   └── slug.js           # URL 生成
│   │
│   ├── templates/            # 🎨 模板系统（3个文件）
│   │   ├── index.js          # 模板函数
│   │   ├── footer.js         # 页脚模板
│   │   └── layout.js         # 页面布局
│   │
│   ├── lib/                  # 🔧 工具库（3个文件）
│   │   ├── utils.js          # 通用工具（CORS、哈希）
│   │   ├── validation.js     # 数据验证
│   │   └── performance.js    # 性能优化
│   │
│   ├── components/           # 🧩 组件（1个文件）
│   │   └── index.js          # UI 组件库
│   │
│   ├── pages.js              # 页面内容（关于、隐私、条款）
│   ├── styles.js             # 全局 CSS 样式
│   └── README.md             # 源代码模块说明
│
├── public/                   # 静态资源
│   ├── sw.js                 # Service Worker
│   ├── offline.html          # 离线页面
│   ├── manifest.json         # PWA 配置
│   └── favicon.svg           # 网站图标
│
├── schema.sql                # 数据库结构
├── wrangler.toml             # Cloudflare Workers 配置
├── package.json              # 项目依赖配置
│
├── admin-setup.sh            # 管理员设置工具
├── turnstile.sh              # Turnstile 管理工具
├── cleanup.sh                # 系统清理工具
├── test-seo.sh               # SEO 测试工具
│
├── README.md                 # 项目主文档
├── CHANGELOG.md              # 版本历史
└── LICENSE                   # MIT 许可证
```

**模块说明**:

- **auth/** - 完整的用户认证系统（注册、登录、验证码、安全防护）
- **pages/** - 所有页面的 HTML 构建（管理后台、用户页面、公共页面）
- **services/** - 业务逻辑服务层（AI 分析、推荐、队列、同步）
- **templates/** - 页面模板和布局系统
- **lib/** - 可复用的工具函数库
- **components/** - UI 组件集合

### 架构特点

- ✅ **模块化设计** - 清晰的 7 个功能模块
- ✅ **职责分离** - auth、pages、services 三层架构
- ✅ **易于维护** - 相关功能组织在一起
- ✅ **扩展性强** - 新增功能有明确归属

详细的源代码架构说明请查看：[src/README.md](src/README.md)

## 🎯 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| **首屏加载** | < 1s | 多级缓存优化 |
| **API 响应** | 10-30ms | 缓存命中时 |
| **详情页加载** | 40-80ms | 平均响应时间（优化后提升80%） |
| **缓存命中率** | 70%+ | KV + 浏览器 + CDN 多层缓存 |
| **数据库查询** | 0-4 次/请求 | 缓存命中时为0，N+1 已优化 |
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
