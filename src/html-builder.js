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
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://imageaigo.cc/">
    <meta property="og:title" content="ImageAI Go - AI-Powered Image Tagging">
    <meta property="og:description" content="Upload images and get instant AI analysis">
    <meta property="og:site_name" content="ImageAI Go">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    
    <!-- Canonical -->
    <link rel="canonical" href="https://imageaigo.cc/">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "ImageAI Go",
      "description": "AI-powered image tagging and analysis",
      "url": "https://imageaigo.cc",
      "applicationCategory": "MultimediaApplication"
    }
    </script>
    <style>${MAIN_STYLES}</style>
</head>
<body itemscope itemtype="https://schema.org/WebPage">
    <div class="container">
        <header role="banner">
            <h1 itemprop="name">🎨 ImageAI Go</h1>
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

    async function loadImages(category = null) {
        try {
            let url = '/api/images?limit=50';
            if (category) url += '&category=' + encodeURIComponent(category);

            console.log('[LoadImages] Fetching:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
            
            const data = await response.json();
            console.log('[LoadImages] Received:', data.images?.length || 0, 'images');

            if (!gallery) return;
            gallery.innerHTML = '';
            
            if (!data.images || data.images.length === 0) {
                gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px;">No images yet. Upload your first image to get started!</div>';
                return;
            }
            
            // 创建文档片段以提高性能
            const fragment = document.createDocumentFragment();
            
            data.images.forEach((image, index) => {
                try {
                    const card = createImageCard(image);
                    fragment.appendChild(card);
                } catch (err) {
                    console.error(\`Failed to create card \${index}:\`, err);
                }
            });
            
            // 一次性添加所有卡片
            gallery.appendChild(fragment);
            
            // 等待所有图片加载完成，确保瀑布流布局正确
            const imgs = gallery.querySelectorAll('img');
            let loadedCount = 0;
            const totalImages = imgs.length;
            
            const checkAllLoaded = () => {
                loadedCount++;
                if (loadedCount >= totalImages) {
                    console.log('[LoadImages] All images loaded, layout complete');
                    // 触发一次布局刷新
                    gallery.style.columnGap = '20px';
                }
            };
            
            imgs.forEach(img => {
                if (img.complete) {
                    checkAllLoaded();
                } else {
                    img.addEventListener('load', checkAllLoaded);
                    img.addEventListener('error', checkAllLoaded);
                }
            });
            
            // 备用：如果3秒后还没全部加载完，也触发刷新
            setTimeout(() => {
                if (loadedCount < totalImages) {
                    console.log('[LoadImages] Timeout, forcing layout refresh');
                    gallery.style.columnGap = '20px';
                }
            }, 3000);
            
            console.log('[LoadImages] Gallery updated with', data.images.length, 'cards');
        } catch (error) {
            console.error('[LoadImages] Error:', error);
            if (gallery) gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px;">Error loading images. Please refresh.</div>';
        }
    }

    function createImageCard(image) {
        const card = document.createElement('div');
        card.className = 'image-card';

        const img = document.createElement('img');
        img.src = image.image_url;
        img.alt = image.description || 'Image';
        
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
        content.appendChild(likeButton);

        const description = document.createElement('p');
        description.className = 'image-description';
        description.textContent = image.description || 'No description';

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags';

        if (image.tags) {
            [...(image.tags.primary || []), ...(image.tags.subcategories || []).slice(0, 3)].forEach(tag => {
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
            
            data.categories.forEach(cat => {
                const pill = document.createElement('a');
                pill.className = 'category-pill';
                pill.textContent = \`\${cat.name} (\${cat.count})\`;
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

    console.log('[Init] Loading images and categories...');
    loadImages();
    loadCategories();
    console.log('[Init] Setup complete');
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
  <style>${LEGAL_STYLES}</style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← Back to Home</a>
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

export function buildPageTemplate({ title, description, heading, subtitle, content, canonical, ogImage }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  <meta property="twitter:card" content="summary_large_image">
  <style>${PAGE_TEMPLATE_STYLES}</style>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="back-link">← Back to Home</a>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </header>
    <main class="gallery">
      ${content}
    </main>
    ${buildFooter()}
  </div>
  
  <script>
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
  </script>
</body>
</html>`;
}

export { PRIVACY_CONTENT, TERMS_CONTENT, ABOUT_CONTENT };

