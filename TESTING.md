# 测试指南

## 📋 测试概述

本文档提供了ImageAI Go项目的测试指南，包括手动测试清单和自动化测试建议。

## ✅ 手动测试清单

### 1. 组件系统测试

#### ImageCard 组件
- [ ] 图片正确显示
- [ ] 宽高比保持正常
- [ ] 懒加载生效
- [ ] 点击跳转到详情页
- [ ] 标签可点击并跳转
- [ ] 点赞按钮功能正常
- [ ] 错误图片显示占位符

#### NavButtons 组件
- [ ] 返回按钮正常工作
- [ ] 首页按钮正常工作
- [ ] 悬停效果正常
- [ ] 移动端显示正常

#### PageHeader 组件
- [ ] 标题正确显示
- [ ] Logo显示正常（如果启用）
- [ ] 搜索框功能正常（如果启用）
- [ ] 响应式布局正常

#### Footer 组件
- [ ] 所有链接可点击
- [ ] 链接指向正确
- [ ] 版权信息正确
- [ ] 响应式布局正常

### 2. 模版系统测试

#### BaseLayout 模版
- [ ] HTML结构完整
- [ ] Meta标签正确
- [ ] Open Graph标签完整
- [ ] Twitter Card标签完整
- [ ] 结构化数据正确
- [ ] Canonical URL正确

#### PageLayout 模版
- [ ] 导航按钮显示（如果启用）
- [ ] 页眉显示正常
- [ ] 主内容区域正常
- [ ] 页脚显示（如果启用）

#### GalleryLayout 模版
- [ ] 画廊容器正常
- [ ] 加载指示器显示
- [ ] 全部加载完成提示显示

### 3. 客户端功能测试

#### GalleryManager
- [ ] 瀑布流布局正确
- [ ] 响应式列数正确（1-5列）
- [ ] 图片卡片位置正确
- [ ] 无限滚动工作正常
- [ ] 窗口resize重新布局
- [ ] 空状态显示正常
- [ ] 加载状态显示正常
- [ ] 错误处理正常

#### 图片加载
- [ ] 首次加载正常
- [ ] 滚动加载更多
- [ ] 距离底部800px触发
- [ ] 图片懒加载生效
- [ ] 加载完成提示显示

### 4. 数据验证测试

#### ImageValidator
- [ ] 文件大小验证
  - [ ] 拒绝过大文件（>20MB）
  - [ ] 拒绝过小文件（<1KB）
  - [ ] 接受正常文件
- [ ] 文件类型验证
  - [ ] 接受JPEG
  - [ ] 接受PNG
  - [ ] 接受GIF
  - [ ] 接受WebP
  - [ ] 拒绝其他格式
- [ ] URL验证
  - [ ] 接受有效图片URL
  - [ ] 拒绝无效URL
  - [ ] 检测有效扩展名
- [ ] 尺寸验证
  - [ ] 拒绝过小尺寸
  - [ ] 拒绝过大尺寸
  - [ ] 拒绝异常宽高比

#### InputValidator
- [ ] 分页验证
  - [ ] 页码最小值为1
  - [ ] 限制每页最大100
- [ ] 搜索查询验证
  - [ ] 最小2个字符
  - [ ] 最大200字符
  - [ ] 检测SQL注入
- [ ] ID验证
  - [ ] 必须是正整数
  - [ ] 不超过INT32_MAX
- [ ] Slug验证
  - [ ] 只允许小写字母数字连字符
  - [ ] 长度限制

#### RateLimiter
- [ ] 速率限制生效
  - [ ] 10次/小时限制
  - [ ] 超限返回429
  - [ ] Retry-After头部正确
- [ ] 机器人检测
  - [ ] 识别常见爬虫
  - [ ] 允许合法爬虫
  - [ ] 记录可疑行为

### 5. 性能测试

#### 缓存系统
- [ ] 内存缓存工作（60s）
- [ ] KV缓存工作（配置TTL）
- [ ] 缓存命中正确
- [ ] 缓存失效正确
- [ ] 批量删除缓存

#### 响应时间
- [ ] 首页加载 < 2s
- [ ] API响应 < 500ms
- [ ] 缓存命中 < 100ms
- [ ] 图片加载优化

#### 资源优化
- [ ] CSS内联正确
- [ ] 图片懒加载
- [ ] 预连接生效
- [ ] 压缩启用

### 6. SEO测试

#### Meta标签
- [ ] Title标签正确
- [ ] Description标签完整
- [ ] Keywords标签（可选）
- [ ] Author标签
- [ ] Canonical链接正确

#### Open Graph
- [ ] og:type正确
- [ ] og:url正确
- [ ] og:title正确
- [ ] og:description正确
- [ ] og:image正确（如有）

#### Twitter Card
- [ ] twitter:card正确
- [ ] twitter:title正确
- [ ] twitter:description正确
- [ ] twitter:image正确（如有）

#### 结构化数据
- [ ] WebApplication schema正确
- [ ] ImageObject schema正确
- [ ] BreadcrumbList正确（如有）
- [ ] 通过Google结构化数据测试

#### 语义化HTML
- [ ] 正确的标题层级（h1-h6）
- [ ] 语义化标签使用
- [ ] ARIA标签正确
- [ ] 无障碍性良好

### 7. 安全测试

#### 输入安全
- [ ] XSS防护生效
- [ ] SQL注入防护
- [ ] HTML转义正确
- [ ] 输入长度限制

#### 访问控制
- [ ] 速率限制生效
- [ ] Token认证正常
- [ ] 防盗链保护
- [ ] CORS配置正确

#### 错误处理
- [ ] 错误响应规范
- [ ] 不泄露敏感信息
- [ ] 日志记录完整
- [ ] 降级策略正常

### 8. 响应式测试

#### 桌面端（>1400px）
- [ ] 5列布局
- [ ] 导航正常
- [ ] 所有功能可用

#### 平板端（1024-1400px）
- [ ] 4列布局
- [ ] 导航正常
- [ ] 所有功能可用

#### 小平板（768-1024px）
- [ ] 3列布局
- [ ] 导航正常
- [ ] 所有功能可用

#### 移动端（<768px）
- [ ] 1列布局
- [ ] 导航按钮适配
- [ ] 所有功能可用
- [ ] 触摸操作正常

### 9. 浏览器兼容性

#### Chrome/Edge（推荐）
- [ ] 所有功能正常
- [ ] 性能良好

#### Firefox
- [ ] 所有功能正常
- [ ] 性能良好

#### Safari
- [ ] 所有功能正常
- [ ] 性能良好

#### 移动浏览器
- [ ] Chrome Mobile正常
- [ ] Safari Mobile正常
- [ ] 其他主流浏览器

## 🧪 自动化测试建议

### 单元测试

```javascript
// 组件测试示例
describe('ImageCard', () => {
  test('renders correctly with valid image data', () => {
    const mockImage = {
      id: 1,
      slug: 'test-image',
      image_url: 'https://example.com/image.jpg',
      description: 'Test image',
      width: 800,
      height: 600,
      likes_count: 5,
      tags: []
    }
    
    const html = ImageCard(mockImage, true)
    
    expect(html).toContain('image-card')
    expect(html).toContain('test-image')
    expect(html).toContain('Test image')
  })
  
  test('handles missing data gracefully', () => {
    const mockImage = {
      id: 1,
      slug: 'test',
      image_url: 'https://example.com/image.jpg'
    }
    
    const html = ImageCard(mockImage, true)
    
    expect(html).toContain('image-card')
    expect(html).not.toThrow()
  })
})

// 验证器测试示例
describe('ImageValidator', () => {
  test('rejects oversized files', () => {
    const largeFile = {
      size: 25 * 1024 * 1024, // 25MB
      type: 'image/jpeg'
    }
    
    const result = ImageValidator.validateImageFile(largeFile)
    
    expect(result.isValid).toBe(false)
    expect(result.errorMessage).toContain('过大')
  })
  
  test('accepts valid files', () => {
    const validFile = {
      size: 5 * 1024 * 1024, // 5MB
      type: 'image/jpeg'
    }
    
    const result = ImageValidator.validateImageFile(validFile)
    
    expect(result.isValid).toBe(true)
  })
})
```

### 集成测试

```javascript
// API测试示例
describe('Image API', () => {
  test('GET /api/images returns image list', async () => {
    const response = await fetch('/api/images?page=1&limit=20')
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    
    const data = await response.json()
    
    expect(data.images).toBeInstanceOf(Array)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(20)
  })
  
  test('GET /api/image returns single image', async () => {
    const response = await fetch('/api/image?slug=test-image')
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    
    expect(data.slug).toBe('test-image')
    expect(data.image_url).toBeTruthy()
  })
})
```

### E2E测试

```javascript
// Playwright测试示例
test('user can view images in gallery', async ({ page }) => {
  await page.goto('/')
  
  // 等待画廊加载
  await page.waitForSelector('.gallery .image-card')
  
  // 检查图片卡片存在
  const cards = await page.$$('.image-card')
  expect(cards.length).toBeGreaterThan(0)
  
  // 点击第一张图片
  await cards[0].click()
  
  // 验证跳转到详情页
  await page.waitForURL(/\/image\/.*/)
})

test('infinite scroll loads more images', async ({ page }) => {
  await page.goto('/')
  
  // 等待初始加载
  await page.waitForSelector('.gallery .image-card')
  
  const initialCount = await page.$$eval('.image-card', cards => cards.length)
  
  // 滚动到底部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  
  // 等待加载更多
  await page.waitForTimeout(2000)
  
  const finalCount = await page.$$eval('.image-card', cards => cards.length)
  
  expect(finalCount).toBeGreaterThan(initialCount)
})
```

### 性能测试

```javascript
// 负载测试示例（使用k6）
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 }
  ]
}

export default function() {
  const res = http.get('https://imageaigo.cc/api/images?page=1&limit=20')
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })
  
  sleep(1)
}
```

## 📊 测试报告模板

### 测试环境
- 浏览器: Chrome 118
- 操作系统: macOS 14
- 网络: WiFi
- 测试日期: 2024-10-16

### 测试结果

| 测试项 | 结果 | 备注 |
|-------|------|------|
| 组件渲染 | ✅ 通过 | 所有组件正常渲染 |
| 数据验证 | ✅ 通过 | 验证器工作正常 |
| 性能测试 | ✅ 通过 | 响应时间<500ms |
| SEO检查 | ✅ 通过 | 结构化数据正确 |
| 安全测试 | ✅ 通过 | 无安全漏洞 |
| 响应式 | ✅ 通过 | 所有屏幕尺寸正常 |

### 发现的问题
1. 无

### 建议
1. 添加自动化测试
2. 实施CI/CD流程
3. 定期性能审计

## 🔄 测试流程

### 开发测试
1. 本地开发时测试新功能
2. 检查代码lint
3. 运行单元测试
4. 手动测试关键功能

### 提交前测试
1. 运行完整测试套件
2. 检查所有组件功能
3. 验证响应式布局
4. 测试SEO标签

### 部署前测试
1. Staging环境完整测试
2. 性能基准测试
3. 安全扫描
4. 浏览器兼容性测试

### 上线后验证
1. 生产环境smoke test
2. 监控性能指标
3. 检查错误日志
4. 用户反馈收集

## 🛠️ 测试工具推荐

### 单元测试
- Jest
- Vitest

### E2E测试
- Playwright
- Cypress

### 性能测试
- Lighthouse
- WebPageTest
- k6

### SEO测试
- Google Search Console
- Schema Markup Validator
- PageSpeed Insights

### 安全测试
- OWASP ZAP
- Snyk
- npm audit

## 📝 总结

完成以上测试清单后，应该能够确保：
- ✅ 所有组件正常工作
- ✅ 数据验证完整有效
- ✅ 性能符合预期
- ✅ SEO优化到位
- ✅ 安全性得到保障
- ✅ 用户体验良好

建议定期执行完整测试，特别是在：
- 新功能开发后
- 重大重构后
- 依赖升级后
- 部署到生产前

---

**维护者**: ImageAI Go Team  
**最后更新**: 2024年10月16日

