/**
 * HTML Templates for ImageAI Go
 * Separated from main index.js for better maintainability
 */

export function generateMainHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ImageAI Go - AI-Powered Image Tagging & Analysis</title>
    <meta name="description" content="Upload images and get instant AI-powered analysis with intelligent hierarchical tags, descriptions, and smart recommendations. Powered by Llama 3.2 Vision AI.">
    <meta name="keywords" content="AI image analysis, image tagging, photo organization, AI vision, image recognition, automatic tagging">
    <meta name="author" content="ImageAI Go">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://imageaigo.cc/">
    <meta property="og:title" content="ImageAI Go - AI-Powered Image Tagging">
    <meta property="og:description" content="Upload images and get instant AI analysis with intelligent tags and descriptions.">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://imageaigo.cc/">
    <meta property="twitter:title" content="ImageAI Go - AI-Powered Image Tagging">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://imageaigo.cc/">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "ImageAI Go",
      "description": "AI-powered image tagging and analysis application",
      "url": "https://imageaigo.cc",
      "applicationCategory": "MultimediaApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    </script>
    <link rel="stylesheet" href="/styles.css">
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

        <footer role="contentinfo" style="text-align: center; color: white; margin-top: 60px; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="margin-bottom: 15px;">&copy; 2024 ImageAI Go. All rights reserved.</p>
            <nav aria-label="Footer navigation">
                <a href="/about" style="color: white; margin: 0 15px; text-decoration: none;">About</a>
                <a href="/privacy" style="color: white; margin: 0 15px; text-decoration: none;">Privacy</a>
                <a href="/terms" style="color: white; margin: 0 15px; text-decoration: none;">Terms</a>
                <a href="/search" style="color: white; margin: 0 15px; text-decoration: none;">Search</a>
            </nav>
            <p style="margin-top: 15px; opacity: 0.8; font-size: 0.9rem;">
                Powered by Cloudflare Workers & AI | <a href="https://imageaigo.cc" style="color: white;">imageaigo.cc</a>
            </p>
        </footer>
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

    <script src="/app.js"></script>
</body>
</html>`;
}

export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generatePageTemplate({ title, description, heading, subtitle, content, canonical, ogImage }) {
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
  <meta property="twitter:title" content="${escapeHtml(title)}">
  
  <link rel="stylesheet" href="/styles.css">
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
  </div>
</body>
</html>`;
}

export function generateLegalPage({ title, heading, content }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="robots" content="index, follow">
  <link rel="stylesheet" href="/legal-styles.css">
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
    <footer>
      <p>&copy; 2024 ImageAI Go. All rights reserved.</p>
      <p>
        <a href="/privacy" style="color: #667eea; margin: 0 10px;">Privacy Policy</a> |
        <a href="/terms" style="color: #667eea; margin: 0 10px;">Terms of Service</a> |
        <a href="/about" style="color: #667eea; margin: 0 10px;">About</a>
      </p>
    </footer>
  </div>
</body>
</html>`;
}

