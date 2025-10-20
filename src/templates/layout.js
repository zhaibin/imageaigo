/**
 * 页面布局模版系统
 * 提供统一的页面结构，便于维护和SEO优化
 */

import { NavButtons, Footer } from '../components/index.js';
import { MAIN_STYLES } from '../styles.js';

/**
 * 基础HTML布局模版
 * @param {Object} options - 配置选项
 * @returns {string} 完整的HTML页面
 */
export function BaseLayout({
  title,
  description,
  canonical,
  ogImage = null,
  keywords = '',
  structuredData = null,
  styles = MAIN_STYLES,
  bodyContent,
  headExtra = '',
  bodyClass = '',
  lang = 'zh-CN'
}) {
  // 生成结构化数据
  const structuredDataHTML = structuredData ? `
    <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
    </script>
  ` : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(description)}">
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
  <meta name="author" content="ImageAI Go">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" href="/favicon.ico">
  
  <!-- SEO优化 -->
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${canonical}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="ImageAI Go">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonical}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
  
  <!-- 结构化数据 -->
  ${structuredDataHTML}
  
  <!-- 预连接优化 -->
  <link rel="preconnect" href="https://imageaigo.cc">
  <link rel="dns-prefetch" href="https://imageaigo.cc">
  
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3399857146031237"
       crossorigin="anonymous"></script>
  
  ${headExtra}
  
  <style>${styles}</style>
</head>
<body class="${bodyClass}" itemscope itemtype="https://schema.org/WebPage">
  ${bodyContent}
</body>
</html>`;
}

/**
 * 页面容器模版（带导航和页脚）
 * @param {Object} options - 配置选项
 * @returns {string} 页面HTML
 */
export function PageLayout({
  showNavButtons = true,
  header,
  mainContent,
  footer = true,
  maxWidth = '95%'
}) {
  return `
    ${showNavButtons ? NavButtons() : ''}
    <div class="container" style="max-width: ${maxWidth};">
      ${header || ''}
      <main role="main" aria-label="主要内容">
        ${mainContent}
      </main>
      ${footer ? Footer() : ''}
    </div>
  `;
}

/**
 * 图片画廊布局模版
 * @param {Object} options - 配置选项
 * @returns {string} HTML字符串
 */
export function GalleryLayout({
  header,
  galleryId = 'gallery',
  showLoadingIndicator = true,
  showAllLoadedIndicator = true
}) {
  return `
    ${header || ''}
    
    <main class="gallery" id="${galleryId}" role="main" aria-label="图片画廊">
      <!-- 图片将通过JavaScript动态加载 -->
    </main>
    
    ${showLoadingIndicator ? `
    <div class="infinite-loading" id="infiniteLoading" style="display: none;">
      <div class="spinner"></div>
      <p>加载更多图片...</p>
    </div>
    ` : ''}
    
    ${showAllLoadedIndicator ? `
    <div class="all-loaded" id="allLoaded" style="display: none;">
      <p>✨ 已加载全部图片</p>
    </div>
    ` : ''}
  `;
}

/**
 * 错误页面布局
 * @param {number} statusCode - HTTP状态码
 * @param {string} message - 错误消息
 * @returns {string} 完整的HTML页面
 */
export function ErrorPageLayout(statusCode, message) {
  const errorMessages = {
    404: {
      title: '页面未找到',
      description: '抱歉，您访问的页面不存在。',
      emoji: '🔍'
    },
    500: {
      title: '服务器错误',
      description: '服务器遇到了问题，请稍后再试。',
      emoji: '⚠️'
    },
    403: {
      title: '访问被拒绝',
      description: '您没有权限访问此页面。',
      emoji: '🚫'
    }
  };

  const errorInfo = errorMessages[statusCode] || {
    title: '错误',
    description: message || '发生了未知错误',
    emoji: '❌'
  };

  const bodyContent = PageLayout({
    header: `
      <header style="text-align: center; color: white; padding: 80px 20px;">
        <div style="font-size: 120px; margin-bottom: 20px;">${errorInfo.emoji}</div>
        <h1 style="font-size: 3rem; margin-bottom: 20px;">${errorInfo.title}</h1>
        <p style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 30px;">${errorInfo.description}</p>
        <p style="font-size: 0.9rem; opacity: 0.7; margin-bottom: 40px;">错误代码: ${statusCode}</p>
        <a href="/" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 10px; text-decoration: none; font-weight: 600; transition: transform 0.2s;">
          返回首页
        </a>
      </header>
    `,
    mainContent: ''
  });

  return BaseLayout({
    title: `${errorInfo.title} | ImageAI Go`,
    description: errorInfo.description,
    canonical: 'https://imageaigo.cc/',
    bodyContent
  });
}

/**
 * SEO结构化数据生成器
 */
export const StructuredDataGenerator = {
  /**
   * 网站主页结构化数据
   */
  homePage: () => ({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ImageAI Go",
    "description": "AI驱动的图片分析与标签管理平台",
    "url": "https://imageaigo.cc",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://imageaigo.cc/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }),

  /**
   * 图片详情页结构化数据
   */
  imagePage: (image) => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": image.image_url,
    "description": image.description,
    "name": image.description,
    "uploadDate": image.created_at,
    "width": image.width,
    "height": image.height,
    "url": `https://imageaigo.cc/image/${image.slug}`,
    "author": {
      "@type": "Organization",
      "name": "ImageAI Go"
    }
  }),

  /**
   * 面包屑导航结构化数据
   */
  breadcrumb: (items) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }),

  /**
   * 图片集合结构化数据
   */
  imageCollection: (name, description, images) => ({
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": name,
    "description": description,
    "numberOfItems": images.length,
    "image": images.slice(0, 10).map(img => ({
      "@type": "ImageObject",
      "contentUrl": img.image_url,
      "description": img.description
    }))
  })
};

/**
 * HTML转义函数
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

