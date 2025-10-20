/**
 * Service Worker - 离线支持和缓存策略
 * ImageAI Go PWA
 */

const CACHE_VERSION = 'imageaigo-v2.3.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_PAGE = '/offline.html';

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  OFFLINE_PAGE
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.error('[SW] Precache failed:', err);
          // 即使某些资源失败也继续安装
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting(); // 立即激活新版本
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 删除不属于当前版本的缓存
              return cacheName.startsWith('imageaigo-') && 
                     !cacheName.startsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // 立即控制所有页面
      })
  );
});

// Fetch 事件 - 实施缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只缓存 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过后台管理页面 - 不缓存任何后台路径
  if (url.pathname.startsWith('/admin')) {
    return;
  }

  // 只处理同源请求和图片请求
  if (url.origin !== location.origin && !request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    return;
  }

  // API 请求 - Network First 策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // 图片请求 - Cache First 策略
  if (request.destination === 'image' || request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // HTML 页面 - Network First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 其他静态资源 - Cache First 策略
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

/**
 * Cache First 策略 - 优先使用缓存
 * 适合：静态资源、图片
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return fetch(request);
    }

    // 1. 尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    // 2. 缓存未命中，从网络获取
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    // 3. 只缓存成功的 GET 响应
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      // 克隆响应，因为响应流只能使用一次
      cache.put(request, networkResponse.clone()).catch((err) => {
        console.warn('[SW] Cache put failed:', err.message);
      });
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    
    // 如果是图片请求失败，返回占位图
    if (request.destination === 'image') {
      return createPlaceholderImage();
    }
    
    throw error;
  }
}

/**
 * Network First 策略 - 优先使用网络
 * 适合：API 请求（仅 GET）
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return fetch(request);
    }

    // 1. 尝试从网络获取
    const networkResponse = await fetch(request);
    
    // 2. 只缓存成功的 GET 响应
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone()).catch((err) => {
        console.warn('[SW] Cache put failed:', err.message);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // 3. 网络失败，回退到缓存（仅 GET）
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

/**
 * Network First with Offline Fallback
 * 适合：HTML 页面（仅 GET）
 */
async function networkFirstWithOffline(request) {
  try {
    // 只处理 GET 请求
    if (request.method !== 'GET') {
      return fetch(request);
    }

    // 1. 尝试从网络获取
    const networkResponse = await fetch(request);
    
    // 2. 缓存成功的响应
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone()).catch((err) => {
        console.warn('[SW] Cache put failed:', err.message);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for navigation');
    
    // 3. 尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 4. 返回离线页面
    const offlineResponse = await caches.match(OFFLINE_PAGE);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // 5. 创建简单的离线响应
    return new Response(
      createOfflineHTML(),
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * 创建占位图片（SVG）
 */
function createPlaceholderImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect fill="#f0f0f0" width="400" height="300"/>
      <text fill="#999" font-family="Arial, sans-serif" font-size="18" 
            text-anchor="middle" x="200" y="150">
        📷 Image unavailable
      </text>
      <text fill="#ccc" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" x="200" y="175">
        Please check your connection
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * 创建离线页面 HTML
 */
function createOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>离线模式 - ImageAI Go</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 500px;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 15px;
        }
        p {
          font-size: 1.1rem;
          opacity: 0.9;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 15px 40px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
        }
        button:active {
          transform: translateY(0);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>当前处于离线模式</h1>
        <p>看起来你的网络连接有问题。别担心，你可以浏览已缓存的内容，或者稍后重试。</p>
        <button onclick="location.reload()">重新加载</button>
      </div>
    </body>
    </html>
  `;
}

// 后台同步事件（未来功能）
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-images') {
    event.waitUntil(syncImages());
  }
});

async function syncImages() {
  console.log('[SW] Syncing images...');
  // TODO: 实现后台图片同步逻辑
}

// 推送通知事件（未来功能）
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: 'imageaigo-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification('ImageAI Go', options)
  );
});

console.log('[SW] Service Worker loaded');

