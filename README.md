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
git clone https://github.com/zhaibin/imageaigo.git
cd imageaigo

# 2. 安装依赖
npm install

# 3. 创建 Cloudflare 资源
wrangler d1 create imageaigo                    # 创建 D1 数据库
wrangler r2 bucket create imageaigo             # 创建 R2 存储桶
wrangler kv:namespace create "CACHE"            # 创建 KV 命名空间
wrangler queues create image-processing-queue   # 创建消息队列

# 4. 更新 wrangler.toml 中的资源 ID
# 复制上述命令输出的 ID 到 wrangler.toml 中对应的位置

# 5. 初始化数据库
wrangler d1 execute imageaigo --remote --file=schema.sql

# 6. 配置环境变量（使用管理脚本，推荐）
./admin-setup.sh                                # 交互式配置管理员账号
./turnstile.sh                                  # 交互式配置 Turnstile

# 或手动配置环境变量
wrangler secret put ADMIN_PASSWORD              # 管理员密码
wrangler secret put ADMIN_SECRET                # 管理员会话密钥（32字符随机字符串）
wrangler secret put RESEND_API_TOKEN            # Resend 邮件服务 API Token
wrangler secret put TURNSTILE_SECRET_KEY        # Cloudflare Turnstile Secret Key

# 7. 部署到生产环境
npm run deploy
# 或
wrangler deploy

# 8. 验证部署
wrangler tail                                   # 查看实时日志
```

### 配置说明

#### 1. 更新资源 ID

创建资源后，更新 `wrangler.toml` 中的资源 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "imageaigo"
database_id = "YOUR_D1_DATABASE_ID"              # 替换为实际 ID

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"                      # 替换为实际 ID

[[r2_buckets]]
binding = "R2"
bucket_name = "imageaigo"

[[queues.producers]]
queue = "image-processing-queue"
binding = "IMAGE_QUEUE"

[[queues.consumers]]
queue = "image-processing-queue"
max_batch_size = 1
max_batch_timeout = 30
```

#### 2. 配置管理员账号（必需）

**方式1：使用管理脚本（推荐）**
```bash
./admin-setup.sh                                 # 交互式配置
# 选择操作：
# 1) 完整设置（首次使用）
# 2) 仅修改密码
# 3) 仅修改密钥
# 4) 检查配置
```

**方式2：手动配置**
```bash
wrangler secret put ADMIN_PASSWORD               # 设置管理员密码（至少8位）
wrangler secret put ADMIN_SECRET                 # 设置会话密钥（32字符随机字符串）
wrangler deploy                                  # 重新部署使配置生效
```

**生成安全的随机密钥**：
```bash
openssl rand -base64 32                          # 生成 32 字符随机字符串
```

#### 3. 配置 Cloudflare Turnstile（必需，用于防暴力破解）

**方式1：使用管理脚本（推荐）**
```bash
./turnstile.sh                                   # 交互式配置
# 选择操作：
# 1) 检查配置
# 2) 更新 Site Key
# 3) 测试指南
```

**方式2：手动配置**
```bash
# 步骤1：创建 Turnstile 站点
# 访问 https://dash.cloudflare.com/?to=/:account/turnstile
# 创建站点，获取 Site Key 和 Secret Key

# 步骤2：更新代码中的 Site Key
# 编辑 src/pages/user/auth-pages.js
# 搜索 'sitekey:' 并替换为你的 Site Key

# 步骤3：配置 Secret Key
wrangler secret put TURNSTILE_SECRET_KEY         # 输入你的 Secret Key

# 步骤4：部署
wrangler deploy
```

**当前配置的 Site Key**：`0x4AAAAAAACxIrRaibzD1pfM`

#### 4. 配置邮件服务（必需，用于验证码）

**步骤1：注册 Resend**
- 访问 [Resend.com](https://resend.com)
- 注册并验证账号

**步骤2：获取 API Token**
- 进入 API Keys 页面
- 创建新的 API Key
- 复制 Token（只显示一次）

**步骤3：配置域名（可选）**
- 添加并验证你的域名（如 `imageaigo.cc`）
- 配置 DNS 记录（SPF、DKIM）
- 验证通过后可使用自定义发件地址

**步骤4：配置密钥**
```bash
wrangler secret put RESEND_API_TOKEN             # 粘贴你的 API Token
wrangler deploy                                  # 重新部署
```

**默认发件地址**：`noreply@mail.imageaigo.cc`

#### 5. 环境变量总览

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `ADMIN_PASSWORD` | ✅ | 管理员密码 | `MySecurePass123` |
| `ADMIN_SECRET` | ✅ | 会话密钥（32字符） | `随机生成的字符串` |
| `RESEND_API_TOKEN` | ✅ | Resend API Token | `re_xxxxx` |
| `TURNSTILE_SECRET_KEY` | ✅ | Turnstile Secret Key | `0x4xxxxxx` |

**查看已配置的变量**：
```bash
wrangler secret list                             # 查看所有已配置的环境变量
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

#### 用户认证接口

```bash
# 发送邮箱验证码
POST /api/send-code
Body: { "email": "user@example.com", "type": "register|login|reset_password" }
Response: { "success": true, "message": "Verification code sent" }

# 用户注册
POST /api/register
Body: { 
  "username": "johndoe", 
  "email": "user@example.com", 
  "password": "password123",
  "verificationCode": "123456"
}
Response: { "success": true, "message": "Registration successful" }

# 用户登录（密码）
POST /api/login
Body: { 
  "emailOrUsername": "user@example.com", 
  "password": "password123",
  "turnstileToken": "xxx" 
}
Response: { "success": true, "message": "Login successful" }

# 用户登录（验证码）
POST /api/login-code
Body: { 
  "emailOrUsername": "user@example.com", 
  "verificationCode": "123456",
  "turnstileToken": "xxx"
}
Response: { "success": true, "message": "Login successful" }

# 请求密码重置
POST /api/request-reset
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "Reset link sent to email" }

# 重置密码
POST /api/reset-password
Body: { "token": "reset_token", "newPassword": "newpass123" }
Response: { "success": true, "message": "Password reset successful" }

# 修改密码（已登录）
POST /api/change-password
Body: { 
  "email": "user@example.com", 
  "newPassword": "newpass123",
  "verificationCode": "123456"
}
Header: Cookie: session_token=xxx
Response: { "success": true, "message": "Password changed" }

# 用户登出
POST /api/logout
Header: Cookie: session_token=xxx
Response: { "success": true }
```

#### 公开接口

```bash
# 获取图片列表（分页）
GET /api/images?limit=15&page=1&category=nature
Response: { 
  "images": [...], 
  "page": 1, 
  "limit": 15, 
  "hasMore": true 
}

# 搜索图片
GET /api/search?q=sunset&limit=20
Response: { "images": [...] }

# 获取图片详情（JSON）
GET /api/image-json/{slug}
Response: { 
  "image": {...}, 
  "tags": [...], 
  "recommendations": [...] 
}

# 获取标签列表
GET /api/tags
Response: { "tags": [...] }

# 点赞图片（需登录）
POST /api/like
Body: { "imageId": 123 }
Header: Cookie: session_token=xxx
Response: { "success": true, "likes": 5 }
```

#### 管理接口（需要 Admin Token）

```bash
# 管理员登录
POST /api/admin/login
Body: { "password": "admin_password" }
Response: { "success": true, "token": "admin_token" }

# 获取统计数据
GET /api/admin/stats
Header: Authorization: Bearer <admin_token>
Response: { 
  "images": 1234, 
  "tags": 567, 
  "users": 89,
  "storage": "1.2 GB"
}

# 批量上传图片
POST /api/admin/batch-upload
Header: Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
Body: files[]
Response: { 
  "success": true, 
  "queued": 5, 
  "message": "5 images queued" 
}

# 获取图片详情
GET /api/admin/image/{id}
Header: Authorization: Bearer <admin_token>
Response: { "image": {...}, "tags": [...] }

# 删除图片
DELETE /api/admin/image/{id}
Header: Authorization: Bearer <admin_token>
Response: { "success": true }

# 重新分析图片
POST /api/admin/reanalyze/{id}
Header: Authorization: Bearer <admin_token>
Response: { "success": true, "message": "Reanalysis queued" }

# 获取用户列表
GET /api/admin/users
Header: Authorization: Bearer <admin_token>
Response: { "users": [...] }

# 系统清理
POST /api/admin/cleanup
Header: Authorization: Bearer <admin_token>
Body: { "action": "r2|cache|database|all" }
Response: { "success": true, "deleted": {...} }
```

#### 速率限制

| 接口 | 限制 | 说明 |
|------|------|------|
| `/api/send-code` | IP: 20次/小时<br>邮箱: 1次/分钟 | 验证码发送 |
| `/api/login` | 2次失败后需验证码<br>10次失败锁定15分钟 | 暴力破解防护 |
| `/api/upload` | 10次/小时（普通用户） | 上传限制 |
| 其他公开接口 | 无限制 | 有 KV 缓存 |

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

### 管理员账号管理

使用 `admin-setup.sh` 脚本进行管理员账号管理：

```bash
./admin-setup.sh

# 功能选项：
# 1) 完整设置 - 首次部署或重新配置
# 2) 仅修改密码 - 修改管理员密码
# 3) 仅修改密钥 - 修改会话密钥
# 4) 检查配置 - 验证当前配置
```

**手动修改**（不推荐）：
```bash
wrangler secret put ADMIN_PASSWORD               # 输入新密码
wrangler secret put ADMIN_SECRET                 # 输入新密钥
wrangler deploy                                  # 重新部署
```

### Turnstile 配置管理

使用 `turnstile.sh` 脚本管理 Turnstile 配置：

```bash
./turnstile.sh

# 功能选项：
# 1) 检查配置 - 查看当前 Turnstile 配置
# 2) 更新 Site Key - 更新站点密钥
# 3) 测试指南 - 查看测试说明
```

**查看当前配置**：
```bash
./turnstile.sh                                   # 选择选项 1
```

**更新 Site Key**：
```bash
./turnstile.sh                                   # 选择选项 2
# 输入新的 Site Key
```

### 系统清理

使用 `cleanup.sh` 脚本清理系统资源：

```bash
./cleanup.sh

# 功能选项：
# 1) 清理 R2 存储 - 删除所有图片文件
# 2) 清理 KV 缓存 - 清空所有缓存
# 3) 清理 Sitemap 缓存 - 清空 Sitemap 缓存
# 4) 全部清理 - 清理所有资源（谨慎使用！）
# 5) 查看当前状态 - 查看资源使用情况
```

**通过 API 清理**：
```bash
# 清理 R2 存储
curl -X POST https://imageaigo.cc/api/admin/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "r2"}'

# 清理 KV 缓存
curl -X POST https://imageaigo.cc/api/admin/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "cache"}'

# 清理所有（危险操作！）
curl -X POST https://imageaigo.cc/api/admin/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "all"}'
```

### SEO 测试

使用 `test-seo.sh` 脚本测试 SEO 配置：

```bash
./test-seo.sh

# 功能选项：
# 1) 测试 Sitemap - 检查 Sitemap 结构和内容
# 2) 测试结构化数据 - 验证 Schema.org 标记
# 3) 完整测试 - 运行所有 SEO 测试
```

**测试结果**：
- ✅ Sitemap 格式正确
- ✅ 图片 URL 可访问
- ✅ 结构化数据有效
- ✅ Open Graph 标签完整

### 查看日志和状态

```bash
# 实时查看 Worker 日志
wrangler tail

# 查看最近的日志（带过滤）
wrangler tail --format pretty

# 查看 Queue 状态
wrangler queues list

# 查看 D1 数据库信息
wrangler d1 info imageaigo

# 查看 R2 存储使用情况
wrangler r2 bucket list

# 查看 KV 命名空间
wrangler kv:namespace list
```

### 数据库维护

```bash
# 备份数据库
wrangler d1 export imageaigo --output=backup.sql

# 执行 SQL 查询
wrangler d1 execute imageaigo --command="SELECT COUNT(*) FROM images"

# 查看数据库统计
wrangler d1 execute imageaigo --command="
  SELECT 
    (SELECT COUNT(*) FROM images) as total_images,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM tags) as total_tags
"

# 优化数据库（应用索引优化）
wrangler d1 execute imageaigo --file=schema-optimize.sql --remote
```

### 监控和告警

**性能监控**：
```bash
# 查看缓存命中率
wrangler tail | grep "Cache.*Hit"

# 查看 API 响应时间
wrangler tail | grep "Response time"

# 查看错误日志
wrangler tail --format pretty | grep "ERROR"
```

**资源使用监控**：
- 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
- 查看 Workers Analytics
- 监控 D1、R2、KV 使用量
- 设置用量告警

### 故障排查

**常见问题诊断**：

```bash
# 检查 Worker 部署状态
wrangler deployments list

# 检查环境变量配置
wrangler secret list

# 测试数据库连接
wrangler d1 execute imageaigo --command="SELECT 1"

# 测试 R2 存储访问
wrangler r2 object get imageaigo test.jpg

# 查看详细错误日志
wrangler tail --format json > logs.json
```

**回滚部署**：
```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback [deployment-id]
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
