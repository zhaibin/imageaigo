/**
 * HTML Builder functions
 * Build complete HTML pages with inline styles and scripts
 */

import { MAIN_STYLES, LEGAL_STYLES, PAGE_TEMPLATE_STYLES } from './styles';
import { PRIVACY_CONTENT, TERMS_CONTENT, ABOUT_CONTENT } from './pages';
import { escapeHtml } from './templates';
import { buildFooter } from './footer-template';

export function buildMainHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ImageAI Go - AI-Powered Image Tagging & Analysis</title>
    <meta name="description" content="Upload images and get instant AI-powered analysis with intelligent hierarchical tags, descriptions, and smart recommendations. Powered by Llama 3.2 Vision AI.">
    <meta name="keywords" content="AI image analysis, image tagging, photo organization, AI vision, image recognition, automatic tagging">
    <meta name="author" content="ImageAI Go">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate icon" href="/favicon.ico">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#667eea">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="ImageAI Go">
    <link rel="apple-touch-icon" href="/favicon.svg">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://imageaigo.cc/">
    <meta property="og:title" content="ImageAI Go - AI-Powered Image Tagging">
    <meta property="og:description" content="Upload images and get instant AI analysis with intelligent hierarchical tags">
    <meta property="og:site_name" content="ImageAI Go">
    <meta property="og:image" content="https://imageaigo.cc/og-image.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="ImageAI Go - AI-Powered Image Analysis Platform">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@ImageAIGo">
    <meta property="twitter:title" content="ImageAI Go - AI-Powered Image Tagging">
    <meta property="twitter:description" content="Upload images and get instant AI analysis with intelligent hierarchical tags">
    <meta property="twitter:image" content="https://imageaigo.cc/og-image.jpg">
    <meta property="twitter:image:alt" content="ImageAI Go Platform">
    
    <!-- Canonical -->
    <link rel="canonical" href="https://imageaigo.cc/">
    
    <!-- Sitemap -->
    <link rel="sitemap" type="application/xml" href="https://imageaigo.cc/sitemap.xml">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ImageAI Go",
      "alternateName": "ImageAI Go - AI Image Analysis",
      "url": "https://imageaigo.cc",
      "description": "AI-powered image tagging and analysis platform",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://imageaigo.cc/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ImageAI Go",
        "url": "https://imageaigo.cc",
        "logo": {
          "@type": "ImageObject",
          "url": "https://imageaigo.cc/favicon.svg",
          "width": 64,
          "height": 64
        }
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "ImageAI Go",
      "description": "AI-powered image tagging and analysis",
      "url": "https://imageaigo.cc",
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": "AI image analysis, Automatic tagging, Smart recommendations, Image gallery"
    }
    </script>
    
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3399857146031237"
         crossorigin="anonymous"></script>
    
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-RGN9QJ4Y0Y', {
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure'
      });
    </script>
    
    <style>${MAIN_STYLES}</style>
</head>
<body itemscope itemtype="https://schema.org/WebPage">
    <div class="container">
        <header role="banner">
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
                <h1 itemprop="name" style="margin: 0;">ImageAI Go</h1>
            </div>
            <p class="tagline" itemprop="description">AI-Powered Image Analysis & Intelligent Tagging</p>
            <div class="header-search">
                <form action="/search" method="GET" style="max-width: 600px; margin: 20px auto;">
                    <input type="search" name="q" placeholder="🔍 Search images..." style="width: 100%; padding: 12px 20px; border: none; border-radius: 25px; font-size: 1rem;">
                </form>
            </div>
        </header>

        <section class="upload-section" aria-label="Upload and analyze images">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📸</div>
                <h2>Drop your image here or click to upload</h2>
                <p>Support for JPG, PNG, GIF, WebP</p>
                <p style="font-size: 0.85rem; color: #666; margin-top: 10px;">⚠️ Rate limit: 10 uploads per hour per IP</p>
                <input type="file" id="fileInput" accept="image/*">
            </div>
            
            <div class="url-input-group">
                <input type="url" id="urlInput" placeholder="Or paste an image URL here...">
                <button id="analyzeUrl">Analyze URL</button>
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p class="status" id="loadingStatus">Processing...</p>
                <p id="loadingDetails"></p>
            </div>
        </section>

        <nav class="categories" aria-label="Category navigation">
            <h2>Browse by Category</h2>
            <div class="category-pills" id="categories" role="navigation"></div>
        </nav>

        <main class="gallery" id="gallery" role="main" aria-label="Image gallery"></main>
        
        <!-- 加载提示 -->
        <div class="infinite-loading" id="infiniteLoading" style="display: none;">
            <div class="spinner"></div>
            <p>Loading more images...</p>
        </div>
        
        <!-- 全部加载完成提示 -->
        <div class="all-loaded" id="allLoaded" style="display: none;">
            <p>✓ All images loaded</p>
        </div>

        ${buildFooter()}
    </div>

    <div class="modal" id="modal">
        <div class="modal-content">
            <span class="close-modal" id="closeModal">&times;</span>
            <img class="modal-image" id="modalImage" src="" alt="">
            <div class="modal-details">
                <p class="image-description" id="modalDescription"></p>
                <div class="modal-tags">
                    <h3>Tags</h3>
                    <div class="tags" id="modalTags"></div>
                </div>
                <div class="recommendations">
                    <h3>Similar Images</h3>
                    <div class="recommendations-grid" id="recommendations"></div>
                </div>
            </div>
        </div>
    </div>

    ${getClientScript()}
</body>
</html>`;
}

function getClientScript() {
  return `<script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const urlInput = document.getElementById('urlInput');
    const analyzeUrlBtn = document.getElementById('analyzeUrl');
    const loading = document.getElementById('loading');
    const loadingStatus = document.getElementById('loadingStatus');
    const loadingDetails = document.getElementById('loadingDetails');
    const gallery = document.getElementById('gallery');
    const categoriesContainer = document.getElementById('categories');
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('closeModal');

    function showSuccessMessage(message, isError = false) {
        const msgEl = document.createElement('div');
        msgEl.className = 'success-message';
        msgEl.textContent = message;
        if (isError) msgEl.style.background = '#e74c3c';
        document.body.appendChild(msgEl);
        setTimeout(() => {
            msgEl.style.opacity = '0';
            msgEl.style.transform = 'translateX(400px)';
            setTimeout(() => msgEl.remove(), 300);
        }, 3000);
    }

    function updateLoadingStatus(status, details = '') {
        if (loadingStatus) loadingStatus.textContent = status;
        if (loadingDetails) loadingDetails.textContent = details;
    }

    async function toggleLike(imageId, button) {
        const isLiked = button.classList.contains('liked');
        const endpoint = isLiked ? '/api/unlike' : '/api/like';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId })
            });
            const data = await response.json();
            if (data.success || data.liked !== undefined) {
                button.classList.toggle('liked', data.liked);
                const countEl = button.querySelector('.like-count');
                if (countEl) countEl.textContent = data.likesCount || 0;
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    }

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function(e) {
            console.log('[Upload] Click detected on:', e.target);
            if (e.target.id === 'fileInput') return; // 避免重复触发
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            console.log('[Upload] Files dropped:', files.length);
            if (files.length > 0) handleFileUpload(files[0]);
        });

        fileInput.addEventListener('change', (e) => {
            console.log('[Upload] File selected');
            if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
        });
    }

    if (analyzeUrlBtn) {
        analyzeUrlBtn.addEventListener('click', () => {
            const url = urlInput?.value?.trim();
            if (url) handleUrlAnalysis(url);
        });
    }

    async function compressImage(file, maxSize = 256, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width, height = img.height;
                    const maxDimension = Math.max(width, height);
                    if (maxDimension > maxSize) {
                        const scale = maxSize / maxDimension;
                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log(\`Image compressed: \${(file.size / 1024).toFixed(2)}KB → \${(blob.size / 1024).toFixed(2)}KB\`);
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async function handleFileUpload(file) {
        try {
            if (loading) loading.style.display = 'block';
            updateLoadingStatus('Preparing image...', \`Original size: \${(file.size / 1024).toFixed(2)} KB\`);
            updateLoadingStatus('Compressing for AI...', 'Creating optimized version');
            const compressedFile = await compressImage(file);
            updateLoadingStatus('Uploading...', \`Original: \${(file.size / 1024).toFixed(0)}KB, AI version: \${(compressedFile.size / 1024).toFixed(0)}KB\`);
            const formData = new FormData();
            formData.append('original', file);
            formData.append('compressed', compressedFile);
            await analyzeImage(formData);
        } catch (error) {
            if (loading) loading.style.display = 'none';
            console.error('Error processing image:', error);
            showSuccessMessage('❌ Failed: ' + error.message, true);
        }
    }

    async function handleUrlAnalysis(url) {
        try {
            if (loading) loading.style.display = 'block';
            updateLoadingStatus('Fetching image from URL...');
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Failed to fetch image');
            const blob = await response.blob();
            const originalFile = new File([blob], 'url-image.jpg', { type: blob.type });
            updateLoadingStatus('Compressing for AI...');
            const compressedFile = await compressImage(originalFile);
            updateLoadingStatus('Uploading...');
            const formData = new FormData();
            formData.append('original', originalFile);
            formData.append('compressed', compressedFile);
            formData.append('sourceUrl', url);
            await analyzeImage(formData);
        } catch (error) {
            console.error('Error processing URL:', error);
            const formData = new FormData();
            formData.append('url', url);
            await analyzeImage(formData);
        }
    }

    async function analyzeImage(formData) {
        if (loading) loading.style.display = 'block';
        updateLoadingStatus('Analyzing with AI...', 'This may take 5-15 seconds');
        if (analyzeUrlBtn) analyzeUrlBtn.disabled = true;

        try {
            const response = await fetch('/api/analyze', { method: 'POST', body: formData });
            const data = await response.json();
            
            if (response.ok) {
                // 检查是否是重复图片
                if (data.duplicate) {
                    showSuccessMessage('⚠️ This image already exists! Redirecting...', false);
                    setTimeout(() => {
                        window.location.href = data.redirectUrl;
                    }, 1500);
                    return;
                }
                
                if (urlInput) urlInput.value = '';
                await loadImages();
                await loadCategories();
                showSuccessMessage('✅ Image analyzed successfully!');
                setTimeout(() => {
                    if (gallery) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            } else {
                // 处理速率限制错误
                if (response.status === 429) {
                    const retryAfter = Math.ceil(data.retryAfter / 60);
                    showSuccessMessage(\`⚠️ Rate limit exceeded. Please try again in \${retryAfter} minutes.\`, true);
                } else {
                    showSuccessMessage('❌ Error: ' + data.error, true);
                }
            }
        } catch (error) {
            showSuccessMessage('❌ Failed: ' + error.message, true);
            console.error('Analysis error:', error);
        } finally {
            if (loading) loading.style.display = 'none';
            if (analyzeUrlBtn) analyzeUrlBtn.disabled = false;
        }
    }

    // 无限滚动状态
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;
    let currentCategory = null;
    let isPreloading = false;
    
    const infiniteLoading = document.getElementById('infiniteLoading');
    const allLoaded = document.getElementById('allLoaded');
    
    // 瀑布流布局管理
    let columnHeights = [];
    let columnCount = 0;
    let columnWidth = 0;
    let columnGap = 20;
    let cardPositions = new Map(); // 存储每个卡片的列索引和顶部位置
    
    // 根据设备类型和容器实际宽度确定列数和列宽
    function getMasonryConfig() {
        if (!gallery) return { columns: 4, columnWidth: 280, gap: 20, pageSize: 30 };
        
        const containerWidth = gallery.offsetWidth || gallery.clientWidth;
        const screenWidth = window.innerWidth;
        
        let columns, minColumnWidth, gap, pageSize;
        
        // 根据屏幕宽度确定基础配置
        if (screenWidth < 768) {
            columns = 1;
            minColumnWidth = 280;
            gap = 15;
            pageSize = 10;
        } else if (screenWidth < 1024) {
            columns = 3;
            minColumnWidth = 200;
            gap = 18;
            pageSize = 20;
        } else if (screenWidth < 1400) {
            columns = 4;
            minColumnWidth = 250;
            gap = 20;
            pageSize = 30;
        } else {
            columns = 5;
            minColumnWidth = 280;
            gap = 25;
            pageSize = 30;
        }
        
        // 根据实际容器宽度计算列宽
        const totalGapWidth = (columns - 1) * gap;
        const availableWidth = containerWidth - totalGapWidth;
        const calculatedColumnWidth = Math.floor(availableWidth / columns);
        
        // 如果计算出的列宽小于最小值，减少列数
        if (calculatedColumnWidth < minColumnWidth && columns > 1) {
            columns = columns - 1;
            const newTotalGapWidth = (columns - 1) * gap;
            const newAvailableWidth = containerWidth - newTotalGapWidth;
            const finalColumnWidth = Math.floor(newAvailableWidth / columns);
            return { columns, columnWidth: finalColumnWidth, gap, pageSize };
        }
        
        return { columns, columnWidth: calculatedColumnWidth, gap, pageSize };
    }
    
    function getPageSize() {
        return getMasonryConfig().pageSize;
    }
    
    // 初始化瀑布流布局
    function initMasonry() {
        const config = getMasonryConfig();
        columnCount = config.columns;
        columnWidth = config.columnWidth;
        columnGap = config.gap;
        columnHeights = new Array(columnCount).fill(0);
        
        // 计算总宽度验证
        const totalWidth = columnCount * columnWidth + (columnCount - 1) * columnGap;
        const containerWidth = gallery?.offsetWidth || 0;
        
        console.log('[Masonry] Init:', config);
        console.log('[Masonry] Container width:', containerWidth);
        console.log('[Masonry] Calculated total width:', totalWidth);
        console.log('[Masonry] Overflow:', totalWidth > containerWidth ? 'YES ⚠️' : 'NO ✓');
    }
    
    // 获取最短的列
    function getShortestColumn() {
        let minHeight = columnHeights[0];
        let minIndex = 0;
        for (let i = 1; i < columnHeights.length; i++) {
            if (columnHeights[i] < minHeight) {
                minHeight = columnHeights[i];
                minIndex = i;
            }
        }
        return minIndex;
    }
    
    
    // 更新gallery的总高度
    function updateGalleryHeight() {
        if (gallery) {
            const maxHeight = Math.max(...columnHeights);
            gallery.style.height = maxHeight + 'px';
        }
    }
    
    // 显示/隐藏加载提示
    function showLoadingIndicator(show) {
        if (infiniteLoading) {
            infiniteLoading.style.display = show ? 'block' : 'none';
        }
    }
    
    // 显示全部加载完成提示
    function showAllLoadedIndicator(show) {
        if (allLoaded) {
            allLoaded.style.display = show ? 'block' : 'none';
        }
    }

    async function loadImages(category = null, reset = false) {
        if (isLoading || (!hasMore && !reset)) {
            if (!hasMore && !reset) {
                showAllLoadedIndicator(true);
            }
            return;
        }
        
        try {
            isLoading = true;
            showLoadingIndicator(true);
            showAllLoadedIndicator(false);
            
            // 如果category变化或reset，重置状态
            if (reset || category !== currentCategory) {
                currentPage = 1;
                hasMore = true;
                currentCategory = category;
                if (gallery) {
                    gallery.innerHTML = '';
                    gallery.style.height = '0px';
                }
                initMasonry();
            }
            
            const pageSize = getPageSize();
            let url;
            
            // 根据页面类型构建不同的 API URL
            if (typeof PAGE_TYPE !== 'undefined' && PAGE_TYPE === 'search') {
                // 搜索页面
                const query = PAGE_PARAMS.query || '';
                url = \`/api/search?q=\${encodeURIComponent(query)}&page=\${currentPage}&limit=\${pageSize}\`;
            } else if (typeof PAGE_TYPE !== 'undefined' && PAGE_TYPE === 'category') {
                // 分类页面
                const categoryName = PAGE_PARAMS.category || '';
                url = \`/api/category/\${encodeURIComponent(categoryName)}/images?page=\${currentPage}&limit=\${pageSize}\`;
            } else if (typeof PAGE_TYPE !== 'undefined' && PAGE_TYPE === 'tag') {
                // 标签页面
                const tagName = PAGE_PARAMS.tag || '';
                url = \`/api/tag/\${encodeURIComponent(tagName)}/images?page=\${currentPage}&limit=\${pageSize}\`;
            } else {
                // 首页
                url = \`/api/images?page=\${currentPage}&limit=\${pageSize}\`;
                if (category) url += '&category=' + encodeURIComponent(category);
            }

            console.log(\`[LoadImages] Fetching page \${currentPage}:\`, url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
            
            const data = await response.json();
            console.log('[LoadImages] Received:', data.images?.length || 0, 'images');

            if (!gallery) return;
            
            if (currentPage === 1 && (!data.images || data.images.length === 0)) {
                gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px; position: relative;">No images yet. Upload your first image to get started!</div>';
                hasMore = false;
                showLoadingIndicator(false);
                showAllLoadedIndicator(true);
                return;
            }
            
            // 创建新卡片并等待图片加载
            const newCards = [];
            const imageLoadPromises = [];
            
            data.images.forEach((image, index) => {
                try {
                    const card = createImageCard(image, true);
                    card.classList.add('card-new');
                    card.style.visibility = 'hidden';
                    gallery.appendChild(card);
                    newCards.push(card);
                    
                    // 等待图片加载
                    const img = card.querySelector('img');
                    if (img) {
                        const promise = new Promise((resolve) => {
                            if (img.complete) {
                                resolve();
                            } else {
                                img.addEventListener('load', resolve);
                                img.addEventListener('error', resolve);
                                // 超时保护：最多等待2秒
                                setTimeout(resolve, 2000);
                            }
                        });
                        imageLoadPromises.push(promise);
                    }
                } catch (err) {
                    console.error(\`Failed to create card \${index}:\`, err);
                }
            });
            
            // 等待所有图片加载完成（或超时）
            await Promise.all(imageLoadPromises);
            
            console.log('[LoadImages] Images loaded, layouting...');
            
            // 隐藏加载提示
            showLoadingIndicator(false);
            
            // 图片加载完成后，使用实际高度精确布局
            requestAnimationFrame(() => {
                newCards.forEach((card, index) => {
                    // 显示卡片用于获取真实高度
                    card.style.visibility = 'visible';
                    
                    // 使用真实高度布局
                    const columnIndex = getShortestColumn();
                    const left = columnIndex * (columnWidth + columnGap);
                    const top = columnHeights[columnIndex];
                    
                    card.style.left = left + 'px';
                    card.style.top = top + 'px';
                    card.style.width = columnWidth + 'px';
                    
                    // 存储位置
                    cardPositions.set(card, { columnIndex, top });
                    
                    // 使用实际高度更新列高度
                    const actualHeight = card.offsetHeight;
                    columnHeights[columnIndex] = top + actualHeight + columnGap;
                    
                    // 渐进式显示
                    setTimeout(() => {
                        card.classList.add('card-visible');
                        card.classList.remove('card-new');
                    }, index * 20);
                });
                
                updateGalleryHeight();
            });
            
            // 更新状态
            hasMore = data.hasMore || false;
            currentPage++;
            
            // 如果没有更多图片，显示完成提示
            if (!hasMore) {
                setTimeout(() => showAllLoadedIndicator(true), 500);
            }
            
            console.log(\`[LoadImages] Page loaded. HasMore: \${hasMore}, NextPage: \${currentPage}\`);
        } catch (error) {
            console.error('[LoadImages] Error:', error);
            if (currentPage === 1 && gallery) {
                gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px; position: relative;">Error loading images. Please refresh.</div>';
            }
        } finally {
            isLoading = false;
        }
    }

    function createImageCard(image, lazyLoad = false) {
        const card = document.createElement('div');
        card.className = 'image-card';

        const img = document.createElement('img');
        
        // 懒加载优化和占位符
        if (lazyLoad) {
            img.loading = 'lazy';
            img.decoding = 'async';
            // 添加占位符样式
            img.style.backgroundColor = '#f5f5f5';
            img.style.minHeight = '200px';
            // 添加占位符类
            img.classList.add('img-loading');
        }
        
        img.src = image.image_url;
        
        // 图片加载完成后移除占位符
        img.onload = () => {
            img.classList.remove('img-loading');
            img.classList.add('img-loaded');
        };
        // 优化的 alt 标签 - 包含描述和关键标签
        const tags = image.tags ? 
          [...(image.tags.primary || []), ...(image.tags.subcategories || []), ...(image.tags.attributes || [])]
            .slice(0, 3)
            .map(t => t.name)
            .join(', ') : '';
        img.alt = (image.description || 'Image') + (tags ? ' - ' + tags : '');
        
        // Set aspect ratio to prevent layout shift
        if (image.width && image.height) {
            img.style.aspectRatio = image.width + ' / ' + image.height;
        }
        
        img.onclick = () => window.location.href = '/image/' + (image.slug || image.id);
        img.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="250"%3E%3Crect fill="%23ddd" width="300" height="250"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
        };

        const content = document.createElement('div');
        content.className = 'image-card-content';
        
        // 添加用户头像 - 显示在右上角
        if (image.username || image.display_name) {
            const userInfo = document.createElement('a');
            userInfo.href = '/user/' + encodeURIComponent(image.username);
            userInfo.className = 'image-user-info';
            userInfo.title = image.display_name || image.username;
            userInfo.onclick = (e) => e.stopPropagation();
            
            const userAvatar = document.createElement('img');
            userAvatar.src = image.avatar_url || 'https://randomuser.me/api/portraits/men/1.jpg';
            userAvatar.alt = image.display_name || image.username;
            userAvatar.className = 'user-avatar-small';
            userAvatar.onerror = () => { userAvatar.src = 'https://randomuser.me/api/portraits/men/1.jpg'; };
            
            userInfo.appendChild(userAvatar);
            content.appendChild(userInfo);
        }

        const description = document.createElement('p');
        description.className = 'image-description';
        description.textContent = image.description || 'No description';
        description.style.cursor = 'pointer';
        description.onclick = () => window.location.href = '/image/' + (image.slug || image.id);

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags';

        if (image.tags) {
            // 只显示1个category（level-1）和1个tag（level-2或level-3）
            const categoryTag = (image.tags.primary || [])[0];
            const otherTag = [...(image.tags.subcategories || []), ...(image.tags.attributes || [])][0];
            
            [categoryTag, otherTag].filter(Boolean).forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = \`tag level-\${tag.level}\`;
                tagEl.textContent = tag.name;
                
                // 使标签可点击跳转到对应分类页面
                tagEl.style.cursor = 'pointer';
                tagEl.onclick = (e) => {
                    e.stopPropagation();
                    // Level 1 标签跳转到 category 页面，其他跳转到 tag 页面
                    if (tag.level === 1) {
                        window.location.href = '/category/' + encodeURIComponent(tag.name);
                    } else {
                        window.location.href = '/tag/' + encodeURIComponent(tag.name);
                    }
                };
                
                tagsContainer.appendChild(tagEl);
            });
        }
        
        // 添加点赞按钮到标签行
        const likeButton = document.createElement('div');
        likeButton.className = 'like-button';
        likeButton.innerHTML = '❤️';
        const likeCount = document.createElement('span');
        likeCount.className = 'like-count';
        likeCount.textContent = image.likes_count || 0;
        likeButton.appendChild(likeCount);
        likeButton.onclick = (e) => {
            e.stopPropagation();
            toggleLike(image.id, likeButton);
        };
        tagsContainer.appendChild(likeButton);

        content.appendChild(description);
        content.appendChild(tagsContainer);
        card.appendChild(img);
        card.appendChild(content);
        return card;
    }

    async function showModal(imageSlug) {
        try {
            const response = await fetch(\`/api/image?slug=\${imageSlug}\`);
            const image = await response.json();

            const modalImage = document.getElementById('modalImage');
            const modalDescription = document.getElementById('modalDescription');
            const modalTags = document.getElementById('modalTags');

            if (modalImage) modalImage.src = image.image_url;
            if (modalDescription) modalDescription.textContent = image.description;

            if (modalTags) {
                modalTags.innerHTML = '';
                if (image.tags) {
                    const allTags = [
                        ...(image.tags.primary || []),
                        ...(image.tags.subcategories || []),
                        ...(image.tags.attributes || [])
                    ];
                    allTags.forEach(tag => {
                        const tagEl = document.createElement('span');
                        tagEl.className = \`tag level-\${tag.level}\`;
                        tagEl.textContent = \`\${tag.name} (\${(tag.weight * 100).toFixed(0)}%)\`;
                        modalTags.appendChild(tagEl);
                    });
                }
            }

            const recResponse = await fetch(\`/api/recommendations?slug=\${imageSlug}\`);
            const recData = await recResponse.json();
            const recsContainer = document.getElementById('recommendations');
            if (recsContainer) {
                recsContainer.innerHTML = '';
                recData.recommendations.forEach(rec => {
                    const recItem = document.createElement('div');
                    recItem.className = 'recommendation-item';
                    recItem.onclick = () => showModal(rec.slug || rec.id);
                    const recImg = document.createElement('img');
                    recImg.src = rec.image_url;
                    recImg.alt = rec.description || 'Recommendation';
                    recItem.appendChild(recImg);
                    recsContainer.appendChild(recItem);
                });
            }

            if (modal) modal.style.display = 'block';
        } catch (error) {
            console.error('Failed to load image details:', error);
        }
    }

    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (!categoriesContainer) return;

            categoriesContainer.innerHTML = '<div class="category-pill active" data-category="">All</div>';
            
            // 只显示图片数量>=5的分类，且不显示数字
            data.categories.filter(cat => cat.count >= 5).forEach(cat => {
                const pill = document.createElement('a');
                pill.className = 'category-pill';
                pill.textContent = cat.name;
                pill.href = \`/category/\${encodeURIComponent(cat.name)}\`;
                pill.dataset.category = cat.name;
                categoriesContainer.appendChild(pill);
            });
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    if (closeModal) {
        closeModal.onclick = () => {
            if (modal) modal.style.display = 'none';
        };
    }

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    // 无限滚动监听（提前预加载）
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const clientHeight = document.documentElement.clientHeight;
            
            // 距离底部800px时开始预加载（提前触发）
            if (scrollTop + clientHeight >= scrollHeight - 800) {
                if (!isLoading && hasMore && !isPreloading) {
                    console.log('[InfiniteScroll] Preloading more images...');
                    isPreloading = true;
                    loadImages(currentCategory).finally(() => {
                        isPreloading = false;
                    });
                }
            }
        }, 100);
    });
    
    // 窗口大小改变时重新布局
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('[Resize] Window resized, relaying out...');
            const oldConfig = { columns: columnCount, columnWidth, gap: columnGap };
            const newConfig = getMasonryConfig();
            
            // 只有在列数或列宽变化时才重新布局
            if (oldConfig.columns !== newConfig.columns || oldConfig.columnWidth !== newConfig.columnWidth) {
                initMasonry();
                const allCards = Array.from(gallery.querySelectorAll('.image-card'));
                
                // 重新布局所有卡片
                allCards.forEach(card => {
                    const columnIndex = getShortestColumn();
                    const left = columnIndex * (columnWidth + columnGap);
                    const top = columnHeights[columnIndex];
                    
                    card.style.left = left + 'px';
                    card.style.top = top + 'px';
                    card.style.width = columnWidth + 'px';
                    
                    cardPositions.set(card, { columnIndex, top });
                    
                    const actualHeight = card.offsetHeight;
                    columnHeights[columnIndex] = top + actualHeight + columnGap;
                });
                
                updateGalleryHeight();
            }
        }, 500);
    });

    // 检查用户登录状态并显示footer导航
    async function checkUserAuth() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        const footerUserNav = document.getElementById('footerUserNav');
        if (!footerUserNav) return;
        
        if (data.success && data.user) {
          // 已登录，显示用户信息和退出
          footerUserNav.innerHTML = 
            '<a href="/profile" style="color: white; margin: 0 15px; text-decoration: none;">👤 ' + (data.user.username || 'User') + '</a>' +
            '<a href="#" onclick="logout(); return false;" style="color: white; margin: 0 15px; text-decoration: none;">Logout</a>';
        } else {
          // 未登录，显示登录和注册按钮
          footerUserNav.innerHTML = 
            '<a href="/login" style="color: white; margin: 0 15px; text-decoration: none;">Login</a>' +
            '<a href="/register" style="color: white; margin: 0 15px; text-decoration: none;">Sign Up</a>';
        }
      } catch (error) {
        console.log('[Auth] Not logged in');
        const footerUserNav = document.getElementById('footerUserNav');
        if (footerUserNav) {
          footerUserNav.innerHTML = 
            '<a href="/login" style="color: white; margin: 0 15px; text-decoration: none;">Login</a>' +
            '<a href="/register" style="color: white; margin: 0 15px; text-decoration: none;">Sign Up</a>';
        }
      }
    }
    
    // 退出登录
    async function logout() {
      if (confirm('Are you sure you want to logout?')) {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
          window.location.reload();
        } catch (error) {
          console.error('Logout error:', error);
          window.location.reload();
        }
      }
    }

    console.log('[Init] Initializing masonry layout...');
    
    // 确保DOM完全加载后再初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initMasonry();
            loadImages(null, true);
            loadCategories();
            checkUserAuth();
        });
    } else {
        // 延迟一帧确保gallery宽度已确定
        requestAnimationFrame(() => {
            initMasonry();
            console.log('[Init] Container width:', gallery?.parentElement?.offsetWidth);
            console.log('[Init] Gallery width:', gallery?.offsetWidth);
            loadImages(null, true);
            loadCategories();
            checkUserAuth();
        });
    }
    
    console.log('[Init] Setup complete, infinite scroll enabled');
</script>`;
}

export function buildLegalPage(title, heading, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="robots" content="index, follow">
  
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3399857146031237"
       crossorigin="anonymous"></script>
  
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RGN9QJ4Y0Y', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  
  <style>${LEGAL_STYLES}</style>
</head>
<body>
  <div class="nav-buttons">
    <a href="javascript:history.back()" class="back-btn" title="Back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </a>
    <a href="/" class="home-btn" title="Home">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    </a>
  </div>
  <div class="container">
    <header>
      <h1>${heading}</h1>
    </header>
    <main>
      ${content}
    </main>
    ${buildFooter()}
  </div>
</body>
</html>`;
}

export function buildPageTemplate({ title, description, heading, subtitle, content, canonical, ogImage, searchBox = false, searchQuery = '', pageType = 'page', pageParams = {}, structuredData = null }) {
  // 生成关键词
  let keywords = 'AI image analysis, image tagging, photo organization';
  if (pageType === 'category' && pageParams.category) {
    keywords = `${pageParams.category}, ${pageParams.category} images, AI ${pageParams.category} analysis, ${keywords}`;
  } else if (pageType === 'tag' && pageParams.tag) {
    keywords = `${pageParams.tag}, ${pageParams.tag} photos, ${keywords}`;
  } else if (pageType === 'search') {
    keywords = `image search, photo search, ${keywords}`;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${keywords}">
  <link rel="canonical" href="${canonical}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="ImageAI Go">
  <meta property="og:image" content="${ogImage || 'https://imageaigo.cc/og-image.jpg'}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage || 'https://imageaigo.cc/og-image.jpg'}">
  <meta name="twitter:site" content="@ImageAIGo">
  
  ${structuredData ? `
  <!-- Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData)}
  </script>
  ` : ''}
  
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3399857146031237"
       crossorigin="anonymous"></script>
  
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RGN9QJ4Y0Y"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RGN9QJ4Y0Y', {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure'
    });
  </script>
  
  <style>${MAIN_STYLES}</style>
</head>
<body>
  <div class="nav-buttons">
    <a href="javascript:history.back()" class="back-btn" title="Back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </a>
    <a href="/" class="home-btn" title="Home">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    </a>
  </div>
  <div class="container">
    <header>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      ${searchBox ? `
        <form method="GET" action="/search" style="margin-top: 20px; max-width: 600px; margin-left: auto; margin-right: auto;">
          <input type="search" name="q" placeholder="🔍 Search images..." value="${escapeHtml(searchQuery)}" style="width: 100%; padding: 12px 20px; border: none; border-radius: 25px; font-size: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        </form>
      ` : ''}
    </header>
    <main class="gallery" id="gallery">
      ${content || '<!-- 图片将通过 JavaScript 动态加载 -->'}
    </main>
    
    <!-- 加载提示 -->
    <div class="infinite-loading" id="infiniteLoading" style="display: none;">
      <div class="loading-spinner"></div>
      <p>Loading more images...</p>
    </div>
    
    <!-- 全部加载完成提示 -->
    <div class="all-loaded" id="allLoaded" style="display: none;">
      <p>✨ All images loaded</p>
    </div>
    
    ${buildFooter()}
  </div>
  
  <script>
    // 页面配置
    const PAGE_TYPE = '${pageType}';
    const PAGE_PARAMS = ${JSON.stringify(pageParams)};
    
    // 点赞功能
    async function toggleLike(imageId, button, event) {
      if (event) event.preventDefault();
      
      try {
        const isLiked = button.classList.contains('liked');
        const endpoint = isLiked ? '/api/unlike' : '/api/like';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId })
        });
        
        const data = await response.json();
        
        if (data.success || data.liked !== undefined) {
          button.classList.toggle('liked', data.liked);
          const countEl = button.querySelector('.like-count');
          if (countEl) {
            countEl.textContent = data.likesCount || 0;
          }
        }
      } catch (error) {
        console.error('Like error:', error);
      }
    }
    
    const gallery = document.getElementById('gallery');
    
    // 无限滚动状态
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;
    let currentCategory = null;
    
    const infiniteLoading = document.getElementById('infiniteLoading');
    const allLoaded = document.getElementById('allLoaded');
    
    // 瀑布流布局管理
    let columnHeights = [];
    let columnCount = 0;
    let columnWidth = 0;
    let columnGap = 20;
    let cardPositions = new Map();
    
    // 根据设备类型和容器实际宽度确定列数和列宽
    function getMasonryConfig() {
        if (!gallery) return { columns: 4, columnWidth: 280, gap: 20, pageSize: 30 };
        
        const containerWidth = gallery.offsetWidth || gallery.clientWidth;
        const screenWidth = window.innerWidth;
        
        let columns, minColumnWidth, gap, pageSize;
        
        if (screenWidth < 768) {
            columns = 1;
            minColumnWidth = 280;
            gap = 15;
            pageSize = 10;
        } else if (screenWidth < 1024) {
            columns = 3;
            minColumnWidth = 200;
            gap = 18;
            pageSize = 20;
        } else if (screenWidth < 1400) {
            columns = 4;
            minColumnWidth = 250;
            gap = 20;
            pageSize = 30;
        } else {
            columns = 5;
            minColumnWidth = 280;
            gap = 25;
            pageSize = 30;
        }
        
        const totalGapWidth = (columns - 1) * gap;
        const availableWidth = containerWidth - totalGapWidth;
        const calculatedColumnWidth = Math.floor(availableWidth / columns);
        
        if (calculatedColumnWidth < minColumnWidth && columns > 1) {
            columns = columns - 1;
            const newTotalGapWidth = (columns - 1) * gap;
            const newAvailableWidth = containerWidth - newTotalGapWidth;
            const finalColumnWidth = Math.floor(newAvailableWidth / columns);
            return { columns, columnWidth: finalColumnWidth, gap, pageSize };
        }
        
        return { columns, columnWidth: calculatedColumnWidth, gap, pageSize };
    }
    
    function getPageSize() {
        return getMasonryConfig().pageSize;
    }
    
    function initMasonry() {
        const config = getMasonryConfig();
        columnCount = config.columns;
        columnWidth = config.columnWidth;
        columnGap = config.gap;
        columnHeights = new Array(columnCount).fill(0);
        
        console.log('[Masonry] Init:', config);
    }
    
    function getShortestColumn() {
        let minHeight = columnHeights[0];
        let minIndex = 0;
        for (let i = 1; i < columnHeights.length; i++) {
            if (columnHeights[i] < minHeight) {
                minHeight = columnHeights[i];
                minIndex = i;
            }
        }
        return minIndex;
    }
    
    function updateGalleryHeight() {
        if (gallery) {
            const maxHeight = Math.max(...columnHeights);
            gallery.style.height = maxHeight + 'px';
        }
    }
    
    function showLoadingIndicator(show) {
        if (infiniteLoading) {
            infiniteLoading.style.display = show ? 'block' : 'none';
        }
    }
    
    function showAllLoadedIndicator(show) {
        if (allLoaded) {
            allLoaded.style.display = show ? 'block' : 'none';
        }
    }

    async function loadImages(category = null, reset = false) {
        if (isLoading || (!hasMore && !reset)) {
            if (!hasMore && !reset) {
                showAllLoadedIndicator(true);
            }
            return;
        }
        
        try {
            isLoading = true;
            showLoadingIndicator(true);
            showAllLoadedIndicator(false);
            
            if (reset || category !== currentCategory) {
                currentPage = 1;
                hasMore = true;
                currentCategory = category;
                if (gallery) {
                    gallery.innerHTML = '';
                    gallery.style.height = '0px';
                }
                initMasonry();
            }
            
            const pageSize = getPageSize();
            let url;
            
            if (typeof PAGE_TYPE !== 'undefined' && PAGE_TYPE === 'search') {
                const query = PAGE_PARAMS.query || '';
                url = \`/api/search?q=\${encodeURIComponent(query)}&page=\${currentPage}&limit=\${pageSize}\`;
            } else if (typeof PAGE_TYPE !== 'undefined' && PAGE_TYPE === 'category') {
                const categoryName = PAGE_PARAMS.category || '';
                url = \`/api/category/\${encodeURIComponent(categoryName)}/images?page=\${currentPage}&limit=\${pageSize}\`;
            } else if (typeof PAGE_TYPE !== 'undefined' && PAGE_TYPE === 'tag') {
                const tagName = PAGE_PARAMS.tag || '';
                url = \`/api/tag/\${encodeURIComponent(tagName)}/images?page=\${currentPage}&limit=\${pageSize}\`;
            } else {
                url = \`/api/images?page=\${currentPage}&limit=\${pageSize}\`;
                if (category) url += '&category=' + encodeURIComponent(category);
            }

            console.log(\`[LoadImages] Fetching page \${currentPage}:\`, url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
            
            const data = await response.json();
            console.log('[LoadImages] Received:', data.images?.length || 0, 'images');

            if (!gallery) return;
            
            if (currentPage === 1 && (!data.images || data.images.length === 0)) {
                gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px; position: relative;">No images found.</div>';
                hasMore = false;
                showLoadingIndicator(false);
                showAllLoadedIndicator(true);
                return;
            }
            
            const newCards = [];
            const imageLoadPromises = [];
            
            data.images.forEach((image, index) => {
                try {
                    const card = createImageCard(image);
                    card.classList.add('card-new');
                    card.style.visibility = 'hidden';
                    gallery.appendChild(card);
                    newCards.push(card);
                    
                    const img = card.querySelector('img');
                    if (img) {
                        const promise = new Promise((resolve) => {
                            if (img.complete) {
                                resolve();
                            } else {
                                img.addEventListener('load', resolve);
                                img.addEventListener('error', resolve);
                                setTimeout(resolve, 3000);
                            }
                        });
                        imageLoadPromises.push(promise);
                    }
                } catch (err) {
                    console.error(\`Failed to create card \${index}:\`, err);
                }
            });
            
            // 隐藏加载提示
            showLoadingIndicator(false);
            
            // 立即布局和显示卡片（使用占位符），不等待图片加载
            requestAnimationFrame(() => {
                data.images.forEach((image, index) => {
                    try {
                        const card = createImageCard(image);
                        card.classList.add('card-new');
                        
                        // 立即布局（使用预估高度）
                        const columnIndex = getShortestColumn();
                        const left = columnIndex * (columnWidth + columnGap);
                        const top = columnHeights[columnIndex];
                        
                        card.style.left = left + 'px';
                        card.style.top = top + 'px';
                        card.style.width = columnWidth + 'px';
                        
                        // 添加到DOM
                        gallery.appendChild(card);
                        
                        // 使用预估高度（根据宽高比）
                        let estimatedHeight = 400;
                        if (image.width && image.height) {
                            const aspectRatio = image.height / image.width;
                            estimatedHeight = columnWidth * aspectRatio + 150;
                        }
                        
                        // 更新列高度
                        columnHeights[columnIndex] = top + estimatedHeight + columnGap;
                        cardPositions.set(card, { columnIndex, top });
                        
                        // 渐进式显示
                        setTimeout(() => {
                            card.classList.add('card-visible');
                            card.classList.remove('card-new');
                        }, index * 20);
                        
                        // 图片加载完成后重新调整布局
                        const img = card.querySelector('img');
                        if (img) {
                            const handleImageLoad = () => {
                                const actualHeight = card.offsetHeight;
                                const heightDiff = actualHeight - estimatedHeight;
                                
                                if (Math.abs(heightDiff) > 5) {
                                    columnHeights[columnIndex] = top + actualHeight + columnGap;
                                    
                                    // 调整同列后续卡片
                                    const allCards = Array.from(gallery.querySelectorAll('.image-card'));
                                    allCards.forEach(c => {
                                        const pos = cardPositions.get(c);
                                        if (pos && pos.columnIndex === columnIndex && pos.top > top) {
                                            const newTop = parseFloat(c.style.top) + heightDiff;
                                            c.style.top = newTop + 'px';
                                            cardPositions.set(c, { ...pos, top: newTop });
                                        }
                                    });
                                    
                                    updateGalleryHeight();
                                }
                            };
                            
                            if (img.complete) {
                                handleImageLoad();
                            } else {
                                img.addEventListener('load', handleImageLoad);
                                img.addEventListener('error', handleImageLoad);
                            }
                        }
                    } catch (err) {
                        console.error(\`Failed to create card \${index}:\`, err);
                    }
                });
                
                updateGalleryHeight();
            });
            
            hasMore = data.hasMore || false;
            currentPage++;
            
            if (!hasMore) {
                setTimeout(() => showAllLoadedIndicator(true), 500);
            }
            
            console.log(\`[LoadImages] Page loaded. HasMore: \${hasMore}, NextPage: \${currentPage}\`);
        } catch (error) {
            console.error('[LoadImages] Error:', error);
            if (currentPage === 1 && gallery) {
                gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px; position: relative;">Error loading images. Please refresh.</div>';
            }
            showLoadingIndicator(false);
        } finally {
            isLoading = false;
        }
    }

    function createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const link = document.createElement('a');
        link.href = '/image/' + image.slug;
        
        const img = document.createElement('img');
        img.src = image.image_url;
        // 优化的 alt 标签 - 包含描述和关键标签
        const imgTags = (Array.isArray(image.tags) && image.tags.length > 0) ? 
          image.tags.slice(0, 3).map(t => t.name).join(', ') : '';
        img.alt = (image.description || 'Image') + (imgTags ? ' - Tags: ' + imgTags : '');
        img.title = image.description || 'Image';
        img.loading = 'lazy';
        img.decoding = 'async';
        // 添加占位符
        img.classList.add('img-loading');
        img.style.backgroundColor = '#f5f5f5';
        img.style.minHeight = '200px';
        
        // 图片加载完成
        img.onload = () => {
            img.classList.remove('img-loading');
            img.classList.add('img-loaded');
        };
        if (image.width && image.height) {
            img.style.aspectRatio = image.width + ' / ' + image.height;
        }
        
        link.appendChild(img);
        
        const content = document.createElement('div');
        content.className = 'image-card-content';
        
        // 添加用户头像 - 显示在右上角
        if (image.username || image.display_name) {
            const userInfo = document.createElement('a');
            userInfo.href = '/user/' + encodeURIComponent(image.username);
            userInfo.className = 'image-user-info';
            userInfo.title = image.display_name || image.username;
            userInfo.onclick = (e) => e.stopPropagation();
            
            const userAvatar = document.createElement('img');
            userAvatar.src = image.avatar_url || 'https://randomuser.me/api/portraits/men/1.jpg';
            userAvatar.alt = image.display_name || image.username;
            userAvatar.className = 'user-avatar-small';
            userAvatar.onerror = () => { userAvatar.src = 'https://randomuser.me/api/portraits/men/1.jpg'; };
            
            userInfo.appendChild(userAvatar);
            content.appendChild(userInfo);
        }
        
        const desc = document.createElement('p');
        desc.className = 'image-description';
        desc.textContent = image.description || '';
        desc.style.cursor = 'pointer';
        desc.onclick = (e) => {
            e.preventDefault();
            window.location.href = '/image/' + image.slug;
        };
        
        content.appendChild(desc);
        
        if (Array.isArray(image.tags) && image.tags.length > 0) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'tags';
            // 只显示1个category（level-1）和1个tag（level-2或level-3）
            const categoryTag = image.tags.find(t => t.level === 1);
            const otherTag = image.tags.find(t => t.level > 1);
            
            [categoryTag, otherTag].filter(Boolean).forEach(tag => {
                const tagLink = document.createElement('a');
                tagLink.href = (tag.level === 1 ? '/category/' : '/tag/') + encodeURIComponent(tag.name);
                tagLink.className = 'tag level-' + tag.level;
                tagLink.textContent = tag.name;
                tagsDiv.appendChild(tagLink);
            });
            
            // 添加点赞按钮到标签行
            const likeButton = document.createElement('div');
            likeButton.className = 'like-button';
            likeButton.innerHTML = '❤️';
            likeButton.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleLike(image.id, likeButton, e);
            };
            const likeCount = document.createElement('span');
            likeCount.className = 'like-count';
            likeCount.textContent = image.likes_count || 0;
            likeButton.appendChild(likeCount);
            tagsDiv.appendChild(likeButton);
            
            content.appendChild(tagsDiv);
        } else {
            // 如果没有标签，也显示点赞按钮
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'tags';
            
            const likeButton = document.createElement('div');
            likeButton.className = 'like-button';
            likeButton.innerHTML = '❤️';
            likeButton.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleLike(image.id, likeButton, e);
            };
            const likeCount = document.createElement('span');
            likeCount.className = 'like-count';
            likeCount.textContent = image.likes_count || 0;
            likeButton.appendChild(likeCount);
            tagsDiv.appendChild(likeButton);
            
            content.appendChild(tagsDiv);
        }
        
        card.appendChild(link);
        card.appendChild(content);
        return card;
    }

    // 无限滚动
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (isLoading || !hasMore) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollTop + windowHeight >= documentHeight - 800) {
                console.log('[Scroll] Near bottom, loading more...');
                loadImages();
            }
        }, 100);
    });
    
    // 窗口大小改变时重新布局
    let resizeTimeout;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('[Resize] Window resized, relaying out...');
            const oldConfig = { columns: columnCount, columnWidth, gap: columnGap };
            const newConfig = getMasonryConfig();
            
            if (oldConfig.columns !== newConfig.columns || oldConfig.columnWidth !== newConfig.columnWidth) {
                initMasonry();
                const allCards = Array.from(gallery.querySelectorAll('.image-card'));
                
                allCards.forEach(card => {
                    const columnIndex = getShortestColumn();
                    const left = columnIndex * (columnWidth + columnGap);
                    const top = columnHeights[columnIndex];
                    
                    card.style.left = left + 'px';
                    card.style.top = top + 'px';
                    card.style.width = columnWidth + 'px';
                    
                    cardPositions.set(card, { columnIndex, top });
                    
                    const actualHeight = card.offsetHeight;
                    columnHeights[columnIndex] = top + actualHeight + columnGap;
                });
                
                updateGalleryHeight();
            }
        }, 500);
    });

    console.log('[Init] Initializing masonry layout...');
    
    // 检查是否有预渲染的内容
    const hasPrerenderedContent = gallery && gallery.children.length > 0;
    
    // 对预渲染内容进行布局
    function layoutPrerenderedCards() {
        if (!gallery || !hasPrerenderedContent) return;
        
        initMasonry();
        const cards = Array.from(gallery.querySelectorAll('.image-card'));
        
        console.log('[Prerendered] Layouting', cards.length, 'cards');
        
        cards.forEach((card, index) => {
            const columnIndex = getShortestColumn();
            const left = columnIndex * (columnWidth + columnGap);
            const top = columnHeights[columnIndex];
            
            card.style.left = left + 'px';
            card.style.top = top + 'px';
            card.style.width = columnWidth + 'px';
            
            const actualHeight = card.offsetHeight;
            columnHeights[columnIndex] = top + actualHeight + columnGap;
        });
        
        updateGalleryHeight();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            requestAnimationFrame(() => {
                if (hasPrerenderedContent) {
                    layoutPrerenderedCards();
                } else {
                    initMasonry();
                    loadImages();
                }
            });
        });
    } else {
        requestAnimationFrame(() => {
            if (hasPrerenderedContent) {
                layoutPrerenderedCards();
            } else {
                initMasonry();
                loadImages();
            }
        });
    }
  </script>
</body>
</html>`;
}

export { PRIVACY_CONTENT, TERMS_CONTENT, ABOUT_CONTENT };

