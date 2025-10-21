# ImageAI Go 源代码结构

> 代码模块说明与维护指南

## 📁 目录结构

```
src/
├── index.js                    # 🚀 主入口，路由处理
│
├── auth/                       # ✅ 认证模块（5个文件）
│   ├── auth.js                 # 用户认证核心（注册、登录、密码管理）
│   ├── middleware.js           # 认证中间件（会话验证、权限控制）
│   ├── verification.js         # 验证码管理（发送、验证、清理）
│   ├── brute-force.js          # 暴力破解防护（Turnstile、失败追踪）
│   └── email.js                # 邮件服务（Resend API 集成）
│
├── pages/                      # ✅ 页面模块（6个文件）
│   ├── admin/
│   │   ├── index.js            # 管理后台（仪表板、图片管理）
│   │   └── users.js            # 用户管理（查看、编辑、删除用户）
│   ├── user/
│   │   ├── auth-pages.js       # 用户认证页面（登录、注册、密码重置）
│   │   └── profile.js          # 个人中心（用户资料、图片管理）
│   ├── home.js                 # 首页构建（瀑布流、搜索、分类）
│   └── ../pages.js             # 页面路由和内容（关于、隐私、条款）
│
├── services/                   # ✅ 服务层（5个文件）
│   ├── ai/
│   │   ├── analyzer.js         # AI 图片分析（Llama Vision、标签生成）
│   │   └── recommendations.js  # 推荐系统（基于标签相似度）
│   ├── queue.js                # 队列处理（批量上传、异步处理）
│   ├── unsplash.js             # Unsplash 同步（定时任务）
│   └── slug.js                 # URL 生成（SEO 友好的 slug）
│
├── templates/                  # ✅ 模板系统（4个文件）
│   ├── index.js                # 模板函数（HTML 转义、格式化）
│   ├── footer.js               # 页脚模板（导航、链接）
│   ├── layout.js               # 页面布局（通用HTML结构）
│   └── ../styles.js            # CSS 样式（全局样式、响应式）
│
├── lib/                        # ✅ 工具库（3个文件）
│   ├── utils.js                # 通用工具（CORS、哈希、缓存）
│   ├── performance.js          # 性能优化（缓存策略、批量查询）
│   └── validation.js           # 数据验证（输入检查）
│
├── client/                     # 客户端（1个文件）
│   └── gallery.js              # 画廊客户端（瀑布流、懒加载）
│
├── components/                 # 组件（1个文件）
│   └── index.js                # 组件集合
│
├── pages.js                    # 页面内容
└── styles.js                   # 全局样式
```

---

## 🎯 核心模块说明

### 1. 主入口 (index.js)

**职责**:
- 路由分发（API、页面、资源）
- 请求处理（CORS、认证、错误处理）
- 静态资源服务

**主要路由**:
- `/` - 首页
- `/api/*` - API 接口
- `/admin/*` - 管理后台
- `/login`, `/register` - 用户认证
- `/profile` - 个人中心

**关键函数**:
- `fetch(request, env, ctx)` - Workers 主函数
- `handleRequest(request, env)` - 请求处理器

---

### 2. 认证模块

#### auth.js
**核心功能**:
- 用户注册（邮箱验证）
- 用户登录（密码/验证码双模式）
- 密码管理（重置、修改）
- 会话管理（token 生成、验证）

**主要函数**:
- `registerUser(email, username, password, verificationCode, env)`
- `loginUser(emailOrUsername, password, ip, env)`
- `loginUserWithCode(email, code, ip, env)`
- `requestPasswordReset(email, env)`
- `resetPassword(resetToken, newPassword, env)`
- `changePassword(userId, verificationCode, newPassword, env)`
- `verifySession(token, env)`

#### auth-middleware.js
**核心功能**:
- 会话验证中间件
- 权限控制
- 响应包装（带/不带会话）

**主要函数**:
- `requireAuth(request, env)` - 需要登录
- `optionalAuth(request, env)` - 可选登录
- `createResponseWithSession(content, sessionToken, type, headers)`
- `createResponseWithoutSession(content, type, headers)`

#### verification-code.js
**核心功能**:
- 验证码生成（6位数字）
- 验证码发送（邮件）
- 验证码验证
- 失败追踪和锁定

**主要函数**:
- `sendCode(emailOrUsername, purpose, env)` - 发送验证码
- `verifyCode(email, code, purpose, env)` - 验证验证码
- `cleanupExpiredCodes(env)` - 清理过期验证码

**验证码用途**:
- `register` - 注册
- `login` - 登录
- `reset_password` - 密码重置
- `change_password` - 密码修改

#### brute-force-protection.js
**核心功能**:
- Cloudflare Turnstile 集成
- 登录失败追踪（IP + 账户）
- 账户锁定（15分钟）
- 验证码触发（2次失败）

**主要函数**:
- `verifyTurnstile(token, remoteIP, env)` - 验证 Turnstile
- `shouldRequireCaptcha(identifier, ip, env)` - 是否需要验证码
- `recordLoginFailure(identifier, ip, env)` - 记录失败
- `clearLoginFailures(identifier, ip, env)` - 清除失败记录
- `isLockedOut(identifier, ip, env)` - 检查锁定状态

#### email-service.js
**核心功能**:
- Resend API 集成
- 验证码邮件
- 密码重置邮件
- HTML 邮件模板

**主要函数**:
- `sendVerificationEmail(email, code, purpose, env)` - 发送验证码
- `sendPasswordResetEmail(email, resetLink, env)` - 发送重置链接

---

### 3. 页面模块

#### html-builder.js
**核心功能**:
- 首页构建（瀑布流）
- 图片详情页
- 分类/标签页
- SEO 优化

**主要函数**:
- `buildMainHTML(images, env, options)` - 构建首页
- `buildImageDetailPage(image, env)` - 图片详情
- `buildCategoryPage(category, images, env)` - 分类页
- `buildTagPage(tag, images, env)` - 标签页

#### user-pages.js
**核心功能**:
- 登录页面（密码/验证码双模式）
- 注册页面（邮箱验证）
- 密码重置页面

**主要函数**:
- `buildLoginPage(message, error)` - 登录页
- `buildRegisterPage(message, error)` - 注册页
- `buildForgotPasswordPage(message, error)` - 忘记密码页
- `buildResetPasswordPage(token, message, error)` - 重置密码页

#### profile-page.js
**核心功能**:
- 用户资料展示
- 图片管理
- 账户设置

**主要函数**:
- `buildProfilePage(user, userImages, env)` - 个人中心页

#### admin.js
**核心功能**:
- 管理后台登录
- 仪表板（统计、图片管理）
- 批量上传

**主要函数**:
- `buildAdminLoginPage(error)` - 管理员登录页
- `buildAdminDashboard(stats, images, env)` - 仪表板

#### admin-users.js
**核心功能**:
- 用户列表
- 用户详情
- 用户编辑/删除

**主要函数**:
- `handleAdminUsers(request, env)` - 用户列表
- `handleAdminUserDetail(request, env, userId)` - 用户详情
- `handleAdminUpdateUser(request, env, userId)` - 更新用户
- `handleAdminDeleteUser(request, env, userId)` - 删除用户

#### pages.js
**核心功能**:
- 静态页面内容
- 关于、隐私政策、服务条款

**导出内容**:
- `ABOUT_CONTENT` - 关于页面
- `PRIVACY_CONTENT` - 隐私政策
- `TERMS_CONTENT` - 服务条款

---

### 4. 服务层

#### analyzer.js
**核心功能**:
- AI 图片分析（Llama 3.2 11B Vision）
- 描述生成
- 标签提取
- 图片尺寸检测

**主要函数**:
- `analyzeImage(imageArrayBuffer, env)` - 分析图片
- `getImageDimensions(arrayBuffer)` - 获取尺寸

#### recommendations.js
**核心功能**:
- 基于标签的图片推荐
- 相似度计算

**主要函数**:
- `getRecommendations(imageId, env)` - 获取推荐

#### queue-handler.js
**核心功能**:
- 队列任务处理
- 批量图片上传
- 异步分析

**主要函数**:
- `handleQueue(batch, env)` - 处理队列

#### unsplash-sync.js
**核心功能**:
- Unsplash 图片同步
- 定时任务（cron）

**主要函数**:
- `handleUnsplashSync(env)` - 同步图片

#### slug-generator.js
**核心功能**:
- SEO 友好的 URL 生成
- 拼音转换
- slug 去重

**主要函数**:
- `generateSlug(text, id)` - 生成图片 slug
- `generateTagSlug(tag)` - 生成标签 slug

---

### 5. 模板系统

#### templates.js
**核心功能**:
- HTML 转义
- 文本格式化
- 模板函数

**主要函数**:
- `escapeHtml(unsafe)` - HTML 转义
- `formatDate(date)` - 日期格式化

#### footer-template.js
**核心功能**:
- 通用页脚
- 导航链接
- 用户状态

**主要函数**:
- `buildFooter(showNav)` - 构建页脚

#### styles.js
**核心功能**:
- 全局 CSS 样式
- 响应式设计
- 瀑布流布局

#### templates/layout.js
**核心功能**:
- 页面布局模板
- HTML 结构
- SEO 标签

---

### 6. 工具库

#### utils.js
**核心功能**:
- CORS 处理
- SHA-256 哈希
- 缓存管理

**主要函数**:
- `handleCORS()` - CORS 响应头
- `generateHash(text)` - 生成哈希

#### lib/performance.js
**核心功能**:
- 性能优化
- 缓存策略
- 批量查询优化

#### lib/validation.js
**核心功能**:
- 输入验证
- 数据清洗

---

## 🔄 数据流

### 用户注册流程
```
1. 用户填写表单 (user-pages.js)
2. 发送验证码 (verification-code.js → email-service.js)
3. 提交注册 (index.js → auth.js)
4. 验证验证码 (verification-code.js)
5. 创建用户 (auth.js → DB)
6. 生成会话 (auth.js)
7. 返回成功 (auth-middleware.js)
```

### 图片上传流程
```
1. 用户上传图片 (html-builder.js)
2. 验证会话 (auth-middleware.js)
3. 保存到 R2 (index.js)
4. 创建数据库记录 (index.js → DB)
5. 加入队列 (queue-handler.js)
6. AI 分析 (analyzer.js)
7. 更新数据库 (analyzer.js → DB)
```

### 登录流程
```
1. 用户输入凭证 (user-pages.js)
2. 检查失败次数 (brute-force-protection.js)
3. 显示 Turnstile（如需要）(brute-force-protection.js)
4. 验证凭证 (auth.js)
5. 生成会话 (auth.js)
6. 设置 Cookie (auth-middleware.js)
7. 重定向 (index.js)
```

---

## 📦 依赖关系

### 核心依赖
- Cloudflare Workers - 运行时环境
- Cloudflare D1 - SQLite 数据库
- Cloudflare R2 - 对象存储
- Cloudflare KV - 键值存储
- Cloudflare AI - Llama Vision 模型

### 外部服务
- Resend.com - 邮件发送
- Cloudflare Turnstile - 人机验证

---

## 🧪 测试

### 本地开发
```bash
wrangler dev
```

### 部署
```bash
wrangler deploy
```

### 测试工具
```bash
./test-seo.sh          # SEO 测试
./turnstile.sh check   # Turnstile 配置检查
./cleanup.sh status    # 系统状态
```

---

## 📝 维护指南

### 添加新功能
1. 确定功能所属模块
2. 在相应文件中添加函数
3. 在 index.js 中添加路由
4. 更新此文档

### 修改现有功能
1. 找到对应的模块文件
2. 修改相关函数
3. 测试功能
4. 更新文档

### 代码规范
- 使用 ES6+ 语法
- 函数命名清晰
- 添加必要注释
- 保持代码整洁

---

## 🔗 相关文档

- [README.md](../README.md) - 项目主文档
- [CHANGELOG.md](../CHANGELOG.md) - 版本历史
- [CODE-STRUCTURE.md](../CODE-STRUCTURE.md) - 代码结构优化建议

---

**最后更新**: 2025-10-21  
**维护者**: ImageAI Go Team

