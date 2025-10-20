/**
 * CSS Styles for ImageAI Go
 */

export const MAIN_STYLES = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

a {
    text-decoration: none;
    color: inherit;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    overflow-x: hidden;
}

.container {
    max-width: 95%;
    width: 100%;
    margin: 0 auto;
}

@media (min-width: 1920px) {
    .container {
        max-width: 1800px;
    }
}

header {
    text-align: center;
    color: white;
    margin-bottom: 40px;
}

h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.tagline {
    font-size: 1.2rem;
    opacity: 0.9;
}

.upload-section {
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    margin-bottom: 40px;
}

.upload-area {
    border: 3px dashed #667eea;
    border-radius: 15px;
    padding: 60px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;
    position: relative;
}

.upload-area:hover {
    background: #f8f9ff;
    border-color: #764ba2;
}

.upload-area.dragover {
    background: #f0f4ff;
    border-color: #764ba2;
    transform: scale(1.02);
}

.upload-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    pointer-events: none;
}

.upload-area h2,
.upload-area p {
    pointer-events: none;
}

input[type="file"] {
    display: none;
}

.url-input-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

input[type="url"] {
    flex: 1;
    padding: 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 1rem;
    transition: border 0.3s;
}

input[type="url"]:focus {
    outline: none;
    border-color: #667eea;
}

button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.loading {
    display: none;
    text-align: center;
    padding: 20px;
}

.loading p {
    margin: 5px 0;
    color: #666;
}

.loading .status {
    font-weight: 600;
    color: #667eea;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.categories {
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    margin-bottom: 40px;
}

.category-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
}

.category-pill {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    transition: transform 0.2s;
    font-size: 0.9rem;
    text-decoration: none;
    display: inline-block;
}

.category-pill:hover {
    transform: scale(1.05);
}

.category-pill.active {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.gallery {
    position: relative;
    width: 100%;
    overflow: visible;
    /* JavaScript会动态设置height */
    padding-top: 10px; /* 为第一行悬停效果留出空间 */
}

.image-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    cursor: pointer;
    position: absolute;
    box-sizing: border-box;
    /* width, left, top 由JavaScript设置 */
}

/* 已加载的卡片：正常悬停效果 */
.image-card.card-loaded {
    transition: transform 0.3s, box-shadow 0.3s;
}

/* 新卡片：使用Web Animations API控制，这里只是后备 */
.image-card.card-new {
    will-change: opacity, transform;
}

.image-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    z-index: 10;
    position: relative; /* 确保z-index生效 */
}

.image-card img {
    width: 100%;
    height: auto;
    display: block;
    max-width: 100%;
}

/* 图片加载占位符 */
.image-card img.img-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.image-card img.img-loaded {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.image-card-content {
    padding: 20px;
    position: relative;
    box-sizing: border-box;
}

.like-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: white;
    border: 2px solid #e74c3c;
    border-radius: 20px;
    padding: 4px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    margin-left: 8px;
}

.like-button:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.like-button.liked {
    background: #e74c3c;
    animation: likeAnimation 0.4s ease;
}

@keyframes likeAnimation {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.3); }
    50% { transform: scale(0.9); }
    75% { transform: scale(1.1); }
}

.image-user-info {
    position: absolute;
    top: -15px;
    right: 10px;
    background: white;
    border: 2px solid #667eea;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 0;
    overflow: hidden;
}

.image-user-info:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-avatar-small {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: none;
}

.user-name-small {
    display: none;
}

.like-count {
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
}

.like-button.liked .like-count {
    color: white;
}

.image-description {
    color: #333;
    margin-bottom: 15px;
    line-height: 1.5;
    font-size: 0.95rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    max-width: 100%;
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    max-width: 100%;
    align-items: center;
}

.tag {
    background: #f0f0f0;
    color: #555;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    transition: transform 0.2s, box-shadow 0.2s;
}

.tag:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.tag.level-1 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
}

.tag.level-1:hover {
    box-shadow: 0 2px 12px rgba(102, 126, 234, 0.4);
}

.tag.level-2 {
    background: #c7d2fe;
    color: #4338ca;
}

.tag.level-2:hover {
    background: #b4c6fc;
}

.tag.level-3 {
    background: #e0e7ff;
    color: #6366f1;
}

.tag.level-3:hover {
    background: #c7d2fe;
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    overflow-y: auto;
    padding: 20px;
}

.modal-content {
    background: white;
    max-width: 1200px;
    margin: 40px auto;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 2rem;
    color: white;
    cursor: pointer;
    z-index: 10;
    background: rgba(0,0,0,0.5);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s;
}

.close-modal:hover {
    background: rgba(0,0,0,0.8);
}

.modal-image {
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    background: #000;
}

.modal-details {
    padding: 30px;
}

.modal-tags {
    margin: 20px 0;
}

.recommendations {
    margin-top: 30px;
}

.recommendations h3 {
    margin-bottom: 20px;
    color: #333;
}

.recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
}

.recommendation-item {
    cursor: pointer;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.2s;
}

.recommendation-item:hover {
    transform: scale(1.05);
}

.recommendation-item img {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.success-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* 无限滚动加载提示 */
.infinite-loading {
    text-align: center;
    padding: 40px 20px;
    color: white;
    animation: fadeIn 0.3s ease-in;
}

.infinite-loading .spinner {
    border: 3px solid rgba(255,255,255,0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

.infinite-loading p {
    font-size: 1rem;
    opacity: 0.9;
}

/* 全部加载完成提示 */
.all-loaded {
    text-align: center;
    padding: 40px 20px;
    color: white;
    opacity: 0.7;
    animation: fadeIn 0.5s ease-in;
}

.all-loaded p {
    font-size: 1.1rem;
    font-weight: 500;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.gallery {
    transition: opacity 0.3s ease-in-out;
}

/* 导航按钮 */
.nav-buttons {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 999;
    pointer-events: none;
}

.nav-buttons > * {
    pointer-events: auto;
}

.back-btn, .home-btn {
    width: 45px;
    height: 45px;
    background: rgba(255,255,255,0.95);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #667eea;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.back-btn:hover, .home-btn:hover {
    background: white;
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.back-btn svg, .home-btn svg {
    display: block;
}

@media (max-width: 768px) {
    h1 {
        font-size: 2rem;
    }

    .upload-section {
        padding: 20px;
    }

    .url-input-group {
        flex-direction: column;
        gap: 10px;
    }

    .url-input-group input[type="url"] {
        width: 100%;
    }

    .url-input-group button {
        width: 100%;
        padding: 15px;
    }

    .nav-buttons {
        top: 15px;
        left: 15px;
        right: 15px;
    }

    .back-btn, .home-btn {
        width: 40px;
        height: 40px;
    }

    .back-btn svg, .home-btn svg {
        width: 18px;
        height: 18px;
    }
}
`;

export const LEGAL_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
a { text-decoration: none; color: inherit; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
  overflow-x: hidden;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
header {
  text-align: center;
  margin-bottom: 40px;
}
h1 {
  color: #667eea;
  font-size: 2.5rem;
  margin-bottom: 10px;
}
h2 {
  color: #667eea;
  font-size: 1.5rem;
  margin: 30px 0 15px;
}
p, li {
  color: #333;
  line-height: 1.8;
  margin-bottom: 15px;
}
ul {
  margin-left: 30px;
  margin-bottom: 20px;
}
/* 导航按钮 */
.nav-buttons {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 999;
  pointer-events: none;
}
.nav-buttons > * {
  pointer-events: auto;
}
.back-btn, .home-btn {
  width: 45px;
  height: 45px;
  background: rgba(255,255,255,0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.back-btn:hover, .home-btn:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}
.back-btn svg, .home-btn svg {
  display: block;
}
@media (max-width: 768px) {
  .nav-buttons {
    top: 15px;
    left: 15px;
    right: 15px;
  }
  .back-btn, .home-btn {
    width: 40px;
    height: 40px;
  }
  .back-btn svg, .home-btn svg {
    width: 18px;
    height: 18px;
  }
}
.update-date {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
  color: #666;
  text-align: center;
}
footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
  color: #666;
}
`;

export const PAGE_TEMPLATE_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
a { text-decoration: none; color: inherit; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
  overflow-x: hidden;
}
.container { max-width: 95%; width: 100%; margin: 0 auto; }
@media (min-width: 1920px) {
  .container { max-width: 1800px; }
}
header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}
h1, h2, h3 { color: white; }
/* 导航按钮容器 - 固定定位 */
.nav-buttons {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 999;
  pointer-events: none;
}
.nav-buttons > * {
  pointer-events: auto;
}
.back-btn, .home-btn {
  width: 45px;
  height: 45px;
  background: rgba(255,255,255,0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}
.back-btn:hover, .home-btn:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}
.back-btn svg, .home-btn svg {
  display: block;
}
@media (max-width: 768px) {
  .nav-buttons {
    top: 15px;
    left: 15px;
    right: 15px;
  }
  .back-btn, .home-btn {
    width: 40px;
    height: 40px;
  }
  .back-btn svg, .home-btn svg {
    width: 18px;
    height: 18px;
  }
}
.gallery {
  columns: 4 280px;
  column-gap: 20px;
  width: 100%;
  padding-top: 10px; /* 为第一行悬停效果留出空间 */
}
@media (max-width: 768px) {
  .gallery {
    columns: 2 160px;
    column-gap: 15px;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .gallery {
    columns: 3 220px;
    column-gap: 18px;
  }
}
@media (min-width: 1400px) {
  .gallery {
    columns: 5 300px;
    column-gap: 25px;
  }
}
.image-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 20px;
    display: inline-block;
    width: 100%;
    box-sizing: border-box;
}
.image-card:hover { 
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.3);
  z-index: 10;
  position: relative; /* 确保z-index生效 */
}
.image-card img {
  width: 100%;
  height: auto;
  display: block;
}
.image-card-content {
  padding: 20px;
  position: relative;
}
.like-button {
  position: absolute;
  top: -15px;
  right: 10px;
  background: white;
  border: 2px solid #e74c3c;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.3rem;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.like-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}
.like-button.liked {
  background: #e74c3c;
  animation: likeAnimation 0.4s ease;
}
@keyframes likeAnimation {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
}
.like-count {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: #667eea;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}
.image-description {
  color: #333;
  margin-bottom: 15px;
  line-height: 1.5;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
}
.tag {
  background: #f0f0f0;
  color: #555;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.tag.level-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}
.tag.level-1:hover {
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.4);
}
.tag.level-2 {
  background: #c7d2fe;
  color: #4338ca;
}
.tag.level-2:hover {
  background: #b4c6fc;
}
.tag.level-3 {
  background: #e0e7ff;
  color: #6366f1;
}
.tag.level-3:hover {
  background: #c7d2fe;
}
/* 图片详情页响应式布局 */
.image-detail-layout {
  width: 100%;
}

.image-detail-main {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

@media (min-width: 1024px) {
  .image-detail-main {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
}

.detail-image-wrapper {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  max-height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image {
  width: 100%;
  height: auto;
  max-height: 800px;
  display: block;
  object-fit: contain;
}

.detail-info-wrapper {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  position: relative;
}

.detail-like-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  border: 2px solid #e74c3c;
  border-radius: 25px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.detail-like-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.4);
}

.detail-like-button.liked {
  background: #e74c3c;
  animation: likeAnimation 0.4s ease;
}

.detail-like-button .like-icon {
  font-size: 1.2rem;
}

.detail-like-button .like-count {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.detail-like-button.liked .like-count {
  color: white;
}

.detail-info-wrapper h2 {
  color: #333;
  margin-bottom: 20px;
  margin-right: 100px;
  font-size: 1.3rem;
  font-weight: normal;
  line-height: 1.6;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-meta span {
  color: #666;
  font-size: 0.85rem;
  background: #f8f9ff;
  padding: 6px 12px;
  border-radius: 15px;
  font-weight: normal;
}

.detail-tags {
  margin-top: 20px;
}

.detail-tags h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1rem;
  font-weight: 600;
}

.detail-recommendations {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.detail-recommendations h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 600;
}

.detail-recommendations .recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.detail-recommendations .recommendations-grid a {
  display: block;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s;
}

.detail-recommendations .recommendations-grid a:hover {
  transform: scale(1.05);
}

.detail-recommendations .recommendations-grid img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}
.tag {
  background: #f0f0f0;
  color: #555;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  text-decoration: none;
  transition: transform 0.2s;
}
.tag:hover { transform: scale(1.05); }
.tag.level-1 {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
}
.tag.level-2 {
  background: #c7d2fe;
  color: #4338ca;
}
.tag.level-3 {
  background: #e0e7ff;
  color: #6366f1;
}
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}
.recommendation-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  transition: transform 0.2s;
}
.recommendation-item:hover img { transform: scale(1.05); }
`;

