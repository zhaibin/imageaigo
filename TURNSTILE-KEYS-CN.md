# 🔑 Turnstile 密钥配置说明

## 两个密钥的区别

Cloudflare Turnstile 使用两个密钥：

| 密钥类型 | 英文名称 | 用途 | 保密性 | 配置位置 | 当前状态 |
|---------|---------|------|--------|---------|---------|
| **站点密钥** | Site Key | 前端调用 widget | ❌ 公开 | 前端代码 | ✅ 已配置 |
| **密钥** | Secret Key | 后端验证 token | ✅ 保密 | Workers 环境变量 | ✅ 已配置 |

---

## 🎯 当前配置状态

### 1. 站点密钥（Site Key）

**位置**: `src/user-pages.js` 第 381 行

```javascript
sitekey: '0x4AAAAAAAzX8PJx0lF_CDHO'
```

✅ **已硬编码在前端**，无需通过环境变量配置

### 2. 密钥（Secret Key）

**位置**: Cloudflare Workers 环境变量

```bash
$ wrangler secret list
...
TURNSTILE_SECRET_KEY ✅
...
```

✅ **已配置**

---

## ❓ 我需要做什么？

### 答案：检查站点密钥是否匹配

1. **登录 Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/?to=/:account/turnstile
   ```

2. **查看你的 Turnstile 站点**
   - 找到你创建的站点（应该是 imageaigo.cc）
   - 查看 **Site Key**（站点密钥）

3. **对比密钥**

   | 你的站点密钥 | 代码中的密钥 | 需要操作 |
   |------------|------------|---------|
   | `0x4AAAAAAAzX8PJx0lF_CDHO` | `0x4AAAAAAAzX8PJx0lF_CDHO` | ✅ 无需操作 |
   | `0x4AAAAAAA...`（其他值） | `0x4AAAAAAAzX8PJx0lF_CDHO` | ⚠️ 需要更新 |

---

## 🔧 如果站点密钥不同怎么办？

### 方法 1: 使用更新脚本（推荐）

```bash
./update-sitekey.sh
```

按提示输入你的新站点密钥，脚本会自动更新代码。

### 方法 2: 手动更新

1. **编辑文件** `src/user-pages.js`

2. **找到这一行**（约第 381 行）：
   ```javascript
   sitekey: '0x4AAAAAAAzX8PJx0lF_CDHO',
   ```

3. **替换为你的站点密钥**：
   ```javascript
   sitekey: '你的站点密钥',
   ```

4. **部署更新**：
   ```bash
   wrangler deploy
   ```

---

## 📊 完整配置清单

### 前端配置

- [x] Turnstile 脚本已加载
  ```html
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
  ```

- [x] 站点密钥已配置
  ```javascript
  sitekey: '0x4AAAAAAAzX8PJx0lF_CDHO'
  ```

- [x] Widget 容器已创建
  ```html
  <div id="turnstile1"></div>
  <div id="turnstile2"></div>
  ```

- [x] 显式渲染逻辑已实现
  ```javascript
  turnstile.render('#turnstile1', { sitekey: '...', theme: 'light' })
  ```

### 后端配置

- [x] Secret Key 已配置
  ```bash
  wrangler secret put TURNSTILE_SECRET_KEY
  ```

- [x] 验证逻辑已实现
  ```javascript
  // src/brute-force-protection.js
  verifyTurnstile(token, ip, env)
  ```

---

## 🧪 验证配置

### 1. 快速检查

```bash
./check-turnstile.sh
```

应该显示全部 ✅

### 2. 功能测试

1. 访问 https://imageaigo.cc/login
2. 输入错误密码 2 次
3. Turnstile widget 应该出现
4. 完成验证后可以登录

### 3. 查看日志

```bash
wrangler tail
```

成功时应该看到：
```
[Turnstile] Verification successful
```

---

## 🎯 常见问题

### Q1: 我没有创建 Turnstile 站点怎么办？

**A**: 可以直接使用当前的站点密钥，或者创建自己的：

1. 访问 https://dash.cloudflare.com/?to=/:account/turnstile
2. 点击 **Add Site**
3. 输入域名: `imageaigo.cc`
4. 选择 Widget Mode: **Managed**
5. 获取 Site Key 和 Secret Key
6. 更新代码中的站点密钥
7. 更新 Workers 环境变量中的 Secret Key

### Q2: 站点密钥可以公开吗？

**A**: ✅ 可以！站点密钥本来就是公开的，用户可以在浏览器中看到。这是正常的。

**不能公开的是 Secret Key**（密钥），它必须保密，只能在后端使用。

### Q3: 如何知道当前使用的是哪个密钥？

**A**: 

**站点密钥**:
```bash
grep -n "sitekey:" src/user-pages.js
```

**Secret Key**:
```bash
wrangler secret list | grep TURNSTILE
```

### Q4: 可以使用测试密钥吗？

**A**: Cloudflare 提供测试密钥：

**测试站点密钥**:
```
1x00000000000000000000AA  # 总是通过
2x00000000000000000000AB  # 总是失败
3x00000000000000000000FF  # 强制交互
```

仅用于开发测试，生产环境必须使用真实密钥。

---

## 📝 总结

### 你需要做的事情

1. ✅ **确认站点密钥是否匹配**
   - 登录 Cloudflare Dashboard
   - 查看你的 Turnstile Site Key
   - 对比代码中的值

2. ✅ **如果密钥不同**
   - 运行 `./update-sitekey.sh` 更新
   - 或手动修改 `src/user-pages.js`
   - 部署: `wrangler deploy`

3. ✅ **如果密钥相同**
   - 无需任何操作
   - 直接测试功能

4. ✅ **测试验证**
   - 访问登录页面
   - 触发 Turnstile（失败 2 次）
   - 完成验证

### 你不需要做的事情

- ❌ 不需要配置站点密钥为环境变量
- ❌ 不需要把站点密钥设为 secret
- ❌ 不需要隐藏站点密钥（本来就是公开的）

---

**如果你的站点密钥就是 `0x4AAAAAAAzX8PJx0lF_CDHO`，那么配置已经完成，直接测试即可！** ✅

