# 🧪 Cloudflare Turnstile 测试指南

## ✅ 修复完成

**问题**: Turnstile widget 没有正确渲染  
**原因**: 使用了自动渲染，但 widget 容器初始为 `display: none`  
**解决方案**: 改为显式渲染（`turnstile.render()`）

---

## 🔍 测试步骤

### 测试 1: 检查 Turnstile 脚本加载

1. 访问登录页面: https://imageaigo.cc/login
2. 打开浏览器控制台 (F12)
3. 检查网络请求，应该看到:
   ```
   ✅ challenges.cloudflare.com/turnstile/v0/api.js
   ```

### 测试 2: 触发 Turnstile (密码登录)

1. 访问 https://imageaigo.cc/login
2. 在 **Password Login** 标签页
3. 输入**任意邮箱/用户名**
4. 输入**错误密码**
5. 点击 **Login**
6. 重复步骤 3-5 （第二次失败）
7. **Turnstile 验证框应该出现** ✅

**预期结果**:
```
🛡️ Human Verification Required
[Turnstile Widget 显示在这里]
```

### 测试 3: 触发 Turnstile (验证码登录)

1. 访问 https://imageaigo.cc/login
2. 切换到 **Code Login** 标签页
3. 输入**任意邮箱/用户名**
4. 输入**错误验证码**（6位数字）
5. 点击 **Login**
6. 重复步骤 3-5 （第二次失败）
7. **Turnstile 验证框应该出现** ✅

### 测试 4: 完成 Turnstile 验证

1. 触发 Turnstile（参考测试 2 或 3）
2. **等待 Turnstile 自动验证**或**完成验证**
3. 输入**正确的凭证**
4. 点击 **Login**
5. **应该成功登录** ✅

### 测试 5: Turnstile 重置

1. 触发 Turnstile
2. 完成验证
3. **再次输入错误凭证**
4. **Turnstile 应该重置**并要求重新验证 ✅

---

## 🐛 故障排除

### 问题 1: Turnstile 没有出现

**检查项**:
1. 浏览器控制台是否有错误？
2. `challenges.cloudflare.com` 是否被屏蔽？
3. 是否真的失败了 2 次？

**解决方案**:
```javascript
// 在浏览器控制台检查失败次数
console.log('Password Fail Count:', passwordFailCount);
console.log('Code Fail Count:', codeFailCount);
```

### 问题 2: Turnstile 显示但无法交互

**检查项**:
1. 控制台是否有 JavaScript 错误？
2. Site Key 是否正确？

**解决方案**:
```bash
# 检查前端代码
grep -r "0x4AAAAAAACxIrRaibzD1pfM" src/user-pages.js

# 应该在 showTurnstile 函数中看到
```

### 问题 3: "Invalid site key" 错误

**原因**: Site Key 不正确或已过期

**解决方案**:
1. 登录 Cloudflare Dashboard
2. 前往 Turnstile 设置
3. 确认 Site Key: `0x4AAAAAAACxIrRaibzD1pfM`
4. 如果不同，更新 `src/user-pages.js` 中的 `sitekey` 值

### 问题 4: 后端验证失败

**症状**: 即使完成 Turnstile，登录仍失败

**检查**:
```bash
# 查看 Worker 日志
wrangler tail

# 应该看到:
# [Turnstile] Verification successful
```

**解决方案**:
```bash
# 确认 Secret Key 已配置
wrangler secret list

# 如果缺失，添加
wrangler secret put TURNSTILE_SECRET_KEY
```

---

## 📊 技术细节

### 显式渲染 vs 自动渲染

**之前（自动渲染）**:
```html
<div class="cf-turnstile" 
     data-sitekey="0x4AAAAAAACxIrRaibzD1pfM" 
     data-theme="light" 
     id="turnstile1">
</div>
```
❌ **问题**: 容器初始为 `display: none`，Turnstile 无法初始化

**现在（显式渲染）**:
```html
<div id="turnstile1"></div>
```
```javascript
function showTurnstile(widgetId, containerId) {
  const container = document.getElementById(containerId);
  container.classList.add('show'); // 先显示容器
  
  // 显式渲染
  const newWidgetId = turnstile.render('#turnstile1', {
    sitekey: '0x4AAAAAAACxIrRaibzD1pfM',
    theme: 'light'
  });
  
  return newWidgetId;
}
```
✅ **解决**: 在容器显示后再渲染 widget

### Widget ID 管理

```javascript
let turnstileWidget1 = null; // 密码登录的 widget ID
let turnstileWidget2 = null; // 验证码登录的 widget ID

// 首次渲染
turnstileWidget1 = turnstile.render('#turnstile1', {...});

// 后续重置
turnstile.reset(turnstileWidget1);

// 获取响应
const token = turnstile.getResponse(turnstileWidget1);
```

---

## 🎯 验证清单

登录页面测试:

- [ ] Turnstile 脚本成功加载
- [ ] 第 1 次失败：不显示 Turnstile
- [ ] 第 2 次失败：显示 Turnstile
- [ ] Turnstile widget 正确渲染
- [ ] 可以完成 Turnstile 验证
- [ ] 完成验证后可以登录
- [ ] 失败后 Turnstile 正确重置
- [ ] 密码登录和验证码登录都正常

浏览器兼容性:

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 📝 更新记录

**日期**: 2025-10-21  
**版本**: 3.3.1  
**更改**:
- ✅ 修复 Turnstile widget 不显示的问题
- ✅ 从自动渲染改为显式渲染
- ✅ 改进 widget ID 管理
- ✅ 添加错误处理和日志
- ✅ 部署到生产环境

**测试状态**: ⏳ 等待用户确认

---

## 🚀 下一步

1. **用户测试**: 按照上述测试步骤验证
2. **监控日志**: `wrangler tail` 查看实时日志
3. **收集反馈**: 报告任何问题
4. **调整配置**: 根据需要调整触发阈值

---

**注意**: 如果仍有问题，请检查浏览器控制台的错误信息，并运行 `wrangler tail` 查看后端日志。

