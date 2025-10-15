# Unsplash 自动同步配置指南

## 功能说明

ImageAI Go 支持自动从 Unsplash 同步最新的免费高质量图片：

- 🔄 每天凌晨 00:00 UTC 自动同步
- 📸 每次同步 10 张最新图片
- 🤖 自动 AI 分析和标签
- 🔍 自动检测重复图片

## 配置步骤

### 1. 获取 Unsplash API Key

1. 访问 [Unsplash Developers](https://unsplash.com/developers)
2. 注册/登录账号
3. 创建新应用（New Application）
4. 填写应用信息：
   - Application name: `ImageAI Go`
   - Description: `AI-powered image gallery`
5. 获取 **Access Key**

### 2. 配置 Worker Secret

```bash
# 设置 Unsplash API Key
wrangler secret put UNSPLASH_ACCESS_KEY
# 粘贴你的 Access Key，按回车
```

### 3. 重新部署

```bash
wrangler deploy
```

## 使用方法

### 自动同步

每天凌晨 00:00 UTC 自动运行，无需手动操作。

### 手动同步

1. 登录管理后台：https://imageaigo.cc/admin/login
2. 进入"系统管理"标签
3. 点击"🔄 立即同步 Unsplash 图片"按钮
4. 等待同步完成

## 同步结果

同步完成后会显示：

```
✅ 同步成功！
• 处理: 8 张
• 跳过: 2 张（重复）
• 失败: 0 张
• 总计: 10 张
```

## 注意事项

1. **API 限制**：
   - Unsplash 免费版：50 requests/hour
   - 建议使用 Demo 模式或升级到 Production

2. **图片来源**：
   - 所有图片来自 Unsplash
   - 自动记录作者信息
   - 符合 Unsplash License

3. **重复检测**：
   - 使用 SHA-256 哈希检测
   - 重复图片自动跳过
   - 不会重复分析

4. **费用优化**：
   - 仅处理新图片
   - AI 分析有缓存
   - 不会产生额外 AI 费用（重复图）

## 测试

手动触发测试：

```bash
# 查看 Cron 任务
wrangler tail --format=pretty

# 手动触发（测试）
curl -X POST https://imageaigo.cc/api/admin/unsplash-sync \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 故障排除

### 同步失败

1. 检查 API Key 是否正确：
   ```bash
   wrangler secret list
   ```

2. 查看日志：
   ```bash
   wrangler tail --format=pretty
   ```

3. 重新设置 Secret：
   ```bash
   wrangler secret put UNSPLASH_ACCESS_KEY
   ```

### API 限流

如果遇到限流错误：
- 等待 1 小时后重试
- 升级到 Unsplash Production（更高限额）

## Unsplash License

根据 [Unsplash License](https://unsplash.com/license)：
- ✅ 可以免费使用
- ✅ 可以用于商业用途
- ✅ 无需许可
- 📝 建议署名（自动记录）

## 进阶配置

### 修改同步数量

编辑 `src/unsplash-sync.js`：

```javascript
// 修改这一行（默认 10）
const perPage = 20; // 改为 20 张
```

### 修改同步频率

编辑 `wrangler.toml`：

```toml
# 每天 2 次（00:00 和 12:00 UTC）
crons = ["0 0,12 * * *"]

# 每 6 小时一次
crons = ["0 */6 * * *"]
```

### 修改图片质量

编辑 `src/unsplash-sync.js`：

```javascript
// 使用不同尺寸
const imageUrl = photo.urls.full;    // 完整尺寸（最大）
const imageUrl = photo.urls.regular; // 常规尺寸（默认）
const imageUrl = photo.urls.small;   // 小尺寸
```

## 监控

### 查看同步历史

```bash
# 查看日志
wrangler tail --format=pretty | grep UnsplashSync
```

### 查看统计

管理后台 → 统计面板 → 查看总图片数变化

## 支持

如有问题，请查看：
- [Unsplash API 文档](https://unsplash.com/documentation)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [项目 GitHub](https://github.com/zhaibin/imageaigo)

