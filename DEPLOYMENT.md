# 部署指南

## 📦 部署前检查清单

### 1. 代码检查
- [ ] 所有TODO已完成
- [ ] 代码已提交到Git
- [ ] 无linter错误
- [ ] 文档已更新

### 2. 环境变量检查
```bash
# 必需的环境变量
wrangler secret list

# 应该包含:
# - ADMIN_PASSWORD
# - ADMIN_SECRET
# - UNSPLASH_ACCESS_KEY (可选)
```

### 3. 配置文件检查
- [ ] `wrangler.toml` 配置正确
- [ ] D1数据库绑定正确
- [ ] R2存储桶绑定正确
- [ ] KV命名空间绑定正确
- [ ] Queue配置正确

### 4. 依赖检查
```bash
npm install
npm audit
```

## 🚀 部署步骤

### 方法1：直接部署（推荐）

```bash
# 1. 确保登录
wrangler login

# 2. 部署到生产环境
wrangler deploy

# 3. 查看部署日志
wrangler tail

# 4. 访问网站验证
open https://imageaigo.cc
```

### 方法2：通过Git部署

```bash
# 1. 提交代码
git add .
git commit -m "feat: v2.1.0 架构优化"
git push origin main

# 2. 部署
wrangler deploy

# 3. 创建标签
git tag v2.1.0
git push origin v2.1.0
```

## 🔍 部署后验证

### 1. 基础功能检查

```bash
# 测试主页
curl -I https://imageaigo.cc/

# 测试API
curl https://imageaigo.cc/api/images?page=1&limit=5

# 测试图片详情
curl https://imageaigo.cc/api/image?slug=test-slug
```

### 2. 性能检查

```bash
# 使用 Lighthouse CLI
npm install -g lighthouse
lighthouse https://imageaigo.cc --view

# 或使用在线工具
# https://pagespeed.web.dev/
```

### 3. SEO检查

访问以下工具验证SEO优化：
- Google Search Console
- Google结构化数据测试工具
- Facebook分享调试器
- Twitter Card验证器

### 4. 功能测试清单

#### 前端功能
- [ ] 首页加载正常
- [ ] 瀑布流布局正确
- [ ] 无限滚动工作
- [ ] 图片详情页正常
- [ ] 搜索功能正常
- [ ] 分类筛选正常
- [ ] 标签筛选正常

#### 组件测试
- [ ] 图片卡片显示正常
- [ ] 导航按钮工作正常
- [ ] 页脚链接正确
- [ ] 加载指示器显示

#### API测试
- [ ] 图片列表API
- [ ] 图片详情API
- [ ] 搜索API
- [ ] 分类API
- [ ] 点赞功能

#### 管理后台
- [ ] 登录正常
- [ ] 统计数据正确
- [ ] 图片管理功能
- [ ] 批量上传功能
- [ ] 标签管理功能

## 📊 监控配置

### 1. Cloudflare Analytics
```
访问 Cloudflare Dashboard
Workers & Pages → imageaigo → Analytics
```

### 2. 日志监控
```bash
# 实时日志
wrangler tail

# 过滤错误日志
wrangler tail --format=pretty | grep ERROR
```

### 3. 性能监控

关键指标：
- 请求成功率 > 99%
- 平均响应时间 < 500ms
- P99响应时间 < 2s
- 缓存命中率 > 90%

### 4. 错误告警

建议设置告警规则：
- 5xx错误率 > 1%
- 平均响应时间 > 1s
- 缓存命中率 < 80%

## 🔄 回滚计划

### 如果部署出现问题

#### 方法1：快速回滚到上一版本
```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback [DEPLOYMENT_ID]
```

#### 方法2：使用Git回滚
```bash
# 回滚代码
git revert HEAD
git push origin main

# 重新部署
wrangler deploy
```

#### 方法3：从备份恢复
```bash
# 切换到备份分支
git checkout backup/v2.0.5
wrangler deploy
```

## 🐛 常见部署问题

### 问题1：环境变量缺失
```
错误: ADMIN_PASSWORD is not defined
解决: wrangler secret put ADMIN_PASSWORD
```

### 问题2：数据库连接失败
```
错误: binding "DB" not found
解决: 检查 wrangler.toml 中的 database_id
```

### 问题3：Queue未配置
```
错误: binding "IMAGE_QUEUE" not found
解决: 创建 Queue 并更新 wrangler.toml
```

### 问题4：部署超时
```
解决: 
1. 检查网络连接
2. 使用 wrangler deploy --dry-run 测试
3. 分批部署文件
```

## 📝 部署记录

### 当前版本：v2.1.0

**部署时间**: 2024-10-16

**主要变更**:
- ✅ 组件化架构
- ✅ 模版系统
- ✅ 性能优化
- ✅ SEO优化
- ✅ 安全增强

**验证结果**:
- [ ] 所有功能正常
- [ ] 性能指标达标
- [ ] SEO检查通过
- [ ] 安全测试通过

**负责人**: [Your Name]

**备注**: 
- 首次部署建议使用--dry-run测试
- 建议在低峰时段部署
- 部署后密切监控日志

## 🎯 生产环境最佳实践

### 1. 定期备份
```bash
# 备份数据库
wrangler d1 backup create imageaigo

# 导出配置
wrangler d1 export imageaigo --output=backup.sql
```

### 2. 性能优化
- 启用所有缓存
- 配置CDN
- 优化图片格式
- 启用HTTP/3

### 3. 安全加固
- 定期更新密钥
- 启用速率限制
- 监控可疑活动
- 定期安全审计

### 4. 监控告警
- 配置错误告警
- 配置性能告警
- 配置安全告警
- 定期查看日志

## 🚨 紧急联系

如果遇到生产环境问题：

1. **立即回滚** - 使用上面的回滚方法
2. **查看日志** - `wrangler tail`
3. **检查监控** - Cloudflare Analytics
4. **联系团队** - [Your Contact Info]

## 📚 相关资源

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [项目README](README.md)
- [架构文档](ARCHITECTURE.md)
- [测试指南](TESTING.md)

---

**维护者**: ImageAI Go Team  
**最后更新**: 2024年10月16日

