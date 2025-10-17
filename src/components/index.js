/**
 * 前端组件系统
 * 提供可复用的UI组件，便于维护和更新界面模版
 */

/**
 * 图片卡片组件
 * 用于在瀑布流中显示单张图片
 * @param {Object} image - 图片数据对象
 * @param {boolean} lazyLoad - 是否启用懒加载
 * @returns {string} HTML字符串
 */
export function ImageCard(image, lazyLoad = true) {
  const {
    id,
    slug,
    image_url,
    description = '',
    width,
    height,
    likes_count = 0,
    tags = [],
    user_id,
    username,
    display_name,
    avatar_url
  } = image;

  // 处理标签显示（只显示1个category和1个其他标签）
  const allTags = Array.isArray(tags) ? tags : 
                  (tags.primary || []).concat(tags.subcategories || [], tags.attributes || []);
  
  const categoryTag = allTags.find(t => t.level === 1);
  const otherTag = allTags.find(t => t.level > 1);
  const displayTags = [categoryTag, otherTag].filter(Boolean);

  // 生成标签HTML（包含点赞按钮）
  const tagsHTML = displayTags.length > 0 ? `
    <div class="tags">
      ${displayTags.map(tag => `
        <a href="${tag.level === 1 ? '/category/' : '/tag/'}${encodeURIComponent(tag.name)}" 
           class="tag level-${tag.level}" 
           onclick="event.stopPropagation()">
          ${escapeHtml(tag.name)}
        </a>
      `).join('')}
      ${LikeButton(id, likes_count)}
    </div>
  ` : `<div class="tags">${LikeButton(id, likes_count)}</div>`;

  // 宽高比样式
  const aspectRatioStyle = width && height ? 
    `style="aspect-ratio: ${width} / ${height}"` : '';

  // 用户信息HTML - 显示在右上角
  const userHTML = username ? `
    <a href="/user/${encodeURIComponent(username)}" class="image-user-info" onclick="event.stopPropagation()" title="${escapeHtml(display_name || username)}">
      <img 
        src="${avatar_url || 'https://randomuser.me/api/portraits/men/1.jpg'}" 
        alt="${escapeHtml(display_name || username)}"
        class="user-avatar-small"
        onerror="this.src='https://randomuser.me/api/portraits/men/1.jpg'"
      >
    </a>
  ` : '';

  return `
    <div class="image-card" data-image-id="${id}">
      <a href="/image/${slug || id}">
        <img 
          src="${image_url}" 
          alt="${escapeHtml(description || 'Image')}"
          ${lazyLoad ? 'loading="lazy" decoding="async"' : ''}
          ${aspectRatioStyle}
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'250\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'300\\' height=\\'250\\'/%3E%3Ctext fill=\\'%23999\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3EImage not available%3C/text%3E%3C/svg%3E'"
        >
      </a>
      <div class="image-card-content">
        ${userHTML}
        <p class="image-description" onclick="window.location.href='/image/${slug || id}'">
          ${escapeHtml(description)}
        </p>
        ${tagsHTML}
      </div>
    </div>
  `;
}

/**
 * 点赞按钮组件
 * @param {number} imageId - 图片ID
 * @param {number} likesCount - 点赞数量
 * @returns {string} HTML字符串
 */
export function LikeButton(imageId, likesCount = 0) {
  return `
    <div class="like-button" onclick="event.stopPropagation(); toggleLike(${imageId}, this)">
      ❤️
      <span class="like-count">${likesCount}</span>
    </div>
  `;
}

/**
 * 导航按钮组件（返回和首页按钮）
 * @returns {string} HTML字符串
 */
export function NavButtons() {
  return `
    <div class="nav-buttons">
      <a href="javascript:history.back()" class="back-btn" title="返回上一页" aria-label="返回上一页">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </a>
      <a href="/" class="home-btn" title="返回首页" aria-label="返回首页">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      </a>
    </div>
  `;
}

/**
 * 页面头部组件
 * @param {Object} options - 配置选项
 * @returns {string} HTML字符串
 */
export function PageHeader({ 
  title, 
  subtitle, 
  showSearchBox = false, 
  searchQuery = '',
  showLogo = false 
}) {
  const logoHTML = showLogo ? `
    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
      <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fff;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#fff;stop-opacity:0.7" />
          </linearGradient>
        </defs>
        <rect x="14" y="20" width="36" height="28" rx="4" fill="url(#logoGrad)"/>
        <rect x="18" y="24" width="28" height="20" rx="2" fill="white" opacity="0.5"/>
        <circle cx="32" cy="34" r="8" fill="white" opacity="0.3"/>
        <circle cx="32" cy="34" r="5" fill="white" opacity="0.6"/>
        <path d="M44 18 L46 20 L44 22 L42 20 Z" fill="white"/>
        <path d="M48 22 L49 23 L48 24 L47 23 Z" fill="white"/>
        <path d="M44 26 L45 27 L44 28 L43 27 Z" fill="white"/>
      </svg>
      <h1 itemprop="name" style="margin: 0;">${escapeHtml(title)}</h1>
    </div>
  ` : `<h1>${escapeHtml(title)}</h1>`;

  const searchBoxHTML = showSearchBox ? `
    <form method="GET" action="/search" style="margin-top: 20px; max-width: 600px; margin-left: auto; margin-right: auto;">
      <input 
        type="search" 
        name="q" 
        placeholder="🔍 搜索图片..." 
        value="${escapeHtml(searchQuery)}"
        style="width: 100%; padding: 12px 20px; border: none; border-radius: 25px; font-size: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
        aria-label="搜索图片"
      >
    </form>
  ` : '';

  return `
    <header role="banner">
      ${logoHTML}
      ${subtitle ? `<p class="tagline" itemprop="description">${escapeHtml(subtitle)}</p>` : ''}
      ${searchBoxHTML}
    </header>
  `;
}

/**
 * 页脚组件
 * @returns {string} HTML字符串
 */
export function Footer() {
  return `
    <footer role="contentinfo" style="text-align: center; color: white; margin-top: 60px; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.2);">
      <p style="margin-bottom: 15px;">&copy; 2024 ImageAI Go. All rights reserved.</p>
      <nav aria-label="页脚导航">
        <a href="/about" style="color: white; margin: 0 15px; text-decoration: none;">关于</a>
        <a href="/privacy" style="color: white; margin: 0 15px; text-decoration: none;">隐私</a>
        <a href="/terms" style="color: white; margin: 0 15px; text-decoration: none;">条款</a>
        <a href="/search" style="color: white; margin: 0 15px; text-decoration: none;">搜索</a>
      </nav>
      <p style="margin-top: 15px; opacity: 0.8; font-size: 0.9rem;">
        Powered by Cloudflare Workers & AI | <a href="https://imageaigo.cc" style="color: white; text-decoration: none;">imageaigo.cc</a>
      </p>
    </footer>
  `;
}

/**
 * 加载指示器组件
 * @param {string} message - 加载消息
 * @returns {string} HTML字符串
 */
export function LoadingIndicator(message = '加载中...') {
  return `
    <div class="infinite-loading">
      <div class="spinner"></div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * 空状态组件
 * @param {string} message - 空状态消息
 * @returns {string} HTML字符串
 */
export function EmptyState(message = '暂无数据') {
  return `
    <div class="empty-state" style="color: white; text-align: center; padding: 60px 20px; position: relative;">
      <svg width="120" height="120" viewBox="0 0 120 120" style="opacity: 0.3; margin-bottom: 20px;">
        <circle cx="60" cy="60" r="50" stroke="white" stroke-width="2" fill="none"/>
        <path d="M40 50 L50 60 L40 70 M80 50 L70 60 L80 70" stroke="white" stroke-width="2" fill="none"/>
        <circle cx="45" cy="60" r="3" fill="white"/>
        <circle cx="75" cy="60" r="3" fill="white"/>
      </svg>
      <p style="font-size: 1.2rem; opacity: 0.8;">${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * 错误提示组件
 * @param {string} message - 错误消息
 * @returns {string} HTML字符串
 */
export function ErrorMessage(message) {
  return `
    <div class="error-message" style="background: #e74c3c; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <strong>❌ 错误</strong><br>
      ${escapeHtml(message)}
    </div>
  `;
}

/**
 * 成功提示组件
 * @param {string} message - 成功消息
 * @returns {string} HTML字符串
 */
export function SuccessMessage(message) {
  return `
    <div class="success-message" style="background: #27ae60; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
      <strong>✓ 成功</strong><br>
      ${escapeHtml(message)}
    </div>
  `;
}

/**
 * 分类标签组件
 * @param {Array} categories - 分类列表
 * @param {string} activeCategory - 当前激活的分类
 * @returns {string} HTML字符串
 */
export function CategoryPills(categories, activeCategory = null) {
  const pills = categories.map(cat => {
    const isActive = cat.name === activeCategory;
    return `
      <a 
        href="/category/${encodeURIComponent(cat.name)}" 
        class="category-pill ${isActive ? 'active' : ''}"
        data-category="${escapeHtml(cat.name)}"
      >
        ${escapeHtml(cat.name)} (${cat.count || 0})
      </a>
    `;
  }).join('');

  return `
    <div class="category-pills">
      <a href="/" class="category-pill ${!activeCategory ? 'active' : ''}" data-category="">
        全部
      </a>
      ${pills}
    </div>
  `;
}

/**
 * HTML转义函数（防XSS）
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

