// 服务层
import { analyzeImage, getImageDimensions } from './services/ai/analyzer.js';
import { getRecommendations } from './services/ai/recommendations.js';
import { generateSlug, generateTagSlug } from './services/slug.js';
import { handleQueue } from './services/queue.js';
import { handleUnsplashSync } from './services/unsplash.js';

// 工具库
import { handleCORS, generateHash as utilsGenerateHash } from './lib/utils.js';

// 页面模块
import { buildMainHTML, buildLegalPage, buildPageTemplate } from './pages/home.js';
import { PRIVACY_CONTENT, TERMS_CONTENT, ABOUT_CONTENT } from './pages.js';
import { buildLoginPage, buildRegisterPage, buildForgotPasswordPage, buildResetPasswordPage } from './pages/user/auth-pages.js';
import { buildProfilePage } from './pages/user/profile.js';
import { buildAdminLoginPage, buildAdminDashboard } from './pages/admin/index.js';
import { handleAdminUsers, handleAdminUserDetail, handleAdminUpdateUser, handleAdminDeleteUser } from './pages/admin/users.js';

// 模板系统
import { escapeHtml } from './templates/index.js';
import { buildFooter } from './templates/footer.js';

// 认证模块
import { registerUser, loginUser, loginUserWithCode, logoutUser, requestPasswordReset, resetPassword, getUserInfo, verifySession, changePassword } from './auth/auth.js';
import { requireAuth, createResponseWithSession, createResponseWithoutSession, optionalAuth } from './auth/middleware.js';
import { sendCode } from './auth/verification.js';
import { sendPasswordResetEmail } from './auth/email.js';
import { verifyTurnstile, shouldRequireCaptcha } from './auth/brute-force.js';

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const requestId = crypto.randomUUID().substring(0, 8);

    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    console.log(`[${requestId}] ${request.method} ${path}`);

    try {
      // Homepage
      if (path === '/' || path === '/index.html' || path === '/index') {
        return new Response(buildMainHTML(), {
          headers: { 
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=300'
          }
        });
      }

      // Pseudo-static pages
      if (path === '/images' || path === '/images.html') {
        return await handleImagesPage(request, env);
      }

      if (path.startsWith('/image/')) {
        const imageSlug = path.replace('/image/', '').replace('.html', '');
        return await handleImageDetailPage(request, env, imageSlug);
      }

      if (path.startsWith('/category/')) {
        return await handleCategoryPage(request, env, path);
      }

      if (path.startsWith('/tag/')) {
        const tagName = decodeURIComponent(path.replace('/tag/', '').replace('.html', ''));
        return await handleTagPage(request, env, tagName);
      }

      if (path === '/search' || path === '/search.html') {
        return await handleSearchPage(request, env);
      }

      // Sitemap
      if (path === '/sitemap.xml') {
        return await handleSitemapIndex(env);
      }
      
      // Sitemap pages
      if (path.startsWith('/sitemap-')) {
        return await handleSitemapPage(env, path);
      }

      // Robots.txt
      if (path === '/robots.txt') {
        return new Response(getRobotsTxt(), {
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      // PWA Manifest
      if (path === '/manifest.json') {
        return new Response(getManifestJson(), {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      // Legal pages
      if (path === '/privacy' || path === '/privacy.html') {
        return new Response(buildLegalPage('Privacy Policy | ImageAI Go', 'Privacy Policy', PRIVACY_CONTENT), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      if (path === '/terms' || path === '/terms.html') {
        return new Response(buildLegalPage('Terms of Service | ImageAI Go', 'Terms of Service', TERMS_CONTENT), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      if (path === '/about' || path === '/about.html') {
        return new Response(buildLegalPage('About ImageAI Go', 'About ImageAI Go', ABOUT_CONTENT), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      // Admin pages
      if (path === '/admin/login' || path === '/admin/login.html') {
        return new Response(buildAdminLoginPage(), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      if (path === '/admin' || path === '/admin/' || path === '/admin/dashboard' || path === '/admin/dashboard.html') {
        return new Response(buildAdminDashboard(), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      // User authentication pages
      if (path === '/login' || path === '/login.html') {
        const message = url.searchParams.get('message') || '';
        const error = url.searchParams.get('error') || '';
        return new Response(buildLoginPage(message, error), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      if (path === '/register' || path === '/register.html') {
        const message = url.searchParams.get('message') || '';
        const error = url.searchParams.get('error') || '';
        return new Response(buildRegisterPage(message, error), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      if (path === '/forgot-password' || path === '/forgot-password.html') {
        const message = url.searchParams.get('message') || '';
        const error = url.searchParams.get('error') || '';
        return new Response(buildForgotPasswordPage(message, error), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      if (path === '/reset-password' || path === '/reset-password.html') {
        const token = url.searchParams.get('token') || '';
        const message = url.searchParams.get('message') || '';
        const error = url.searchParams.get('error') || '';
        return new Response(buildResetPasswordPage(token, message, error), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      // Profile page
      if (path === '/profile' || path === '/profile.html') {
        return await handleProfilePage(request, env);
      }

      // User page (public profile)
      if (path.startsWith('/user/')) {
        const username = decodeURIComponent(path.replace('/user/', ''));
        return await handleUserPage(request, env, username);
      }

      // Static files (favicon, logo, etc.)
      if (path === '/favicon.svg' || path === '/favicon.ico') {
        return new Response(getFaviconSVG(), {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }

      // Service Worker
      if (path === '/sw.js') {
        const swContent = await env.R2.get('public/sw.js');
        if (swContent) {
          return new Response(swContent.body, {
            headers: {
              'Content-Type': 'application/javascript; charset=utf-8',
              'Cache-Control': 'public, max-age=0, must-revalidate',
              'Service-Worker-Allowed': '/'
            }
          });
        }
      }

      // Offline page
      if (path === '/offline.html') {
        const offlineContent = await env.R2.get('public/offline.html');
        if (offlineContent) {
          return new Response(offlineContent.body, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      }

      // OG Image placeholder (返回 SVG)
      if (path === '/og-image.jpg') {
        return new Response(getOGImageSVG(), {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }

      // R2 images (包括内部请求用于 Image Resizing)
      if (path.startsWith('/r2/') || path.startsWith('/internal/r2/')) {
        return await handleR2Image(request, env, path);
      }

      // API endpoints
      if (path === '/api/search' && request.method === 'GET') {
        return await handleSearchAPI(request, env);
      }
      
      // Category images API
      if (path.match(/^\/api\/category\/[^/]+\/images$/) && request.method === 'GET') {
        const category = decodeURIComponent(path.match(/^\/api\/category\/([^/]+)\/images$/)[1]);
        return await handleCategoryImagesAPI(request, env, category);
      }
      
      // Tag images API
      if (path.match(/^\/api\/tag\/[^/]+\/images$/) && request.method === 'GET') {
        const tagName = decodeURIComponent(path.match(/^\/api\/tag\/([^/]+)\/images$/)[1]);
        return await handleTagImagesAPI(request, env, tagName);
      }

      if (path === '/api/analyze' && request.method === 'POST') {
        return await handleAnalyze(request, env);
      }

      if (path === '/api/images' && request.method === 'GET') {
        return await handleGetImages(request, env);
      }

      if (path === '/api/image' && request.method === 'GET') {
        const imageSlug = url.searchParams.get('slug') || url.searchParams.get('id');
        return await handleGetImage(imageSlug, env);
      }

      if (path === '/api/recommendations' && request.method === 'GET') {
        const imageSlug = url.searchParams.get('slug') || url.searchParams.get('id');
        return await handleGetRecommendations(imageSlug, env);
      }

      if (path === '/api/categories' && request.method === 'GET') {
        return await handleGetCategories(env);
      }

      if (path === '/api/agree-license' && request.method === 'POST') {
        return await handleAgreeLicense(env);
      }

      if (path === '/api/like' && request.method === 'POST') {
        return await handleLike(request, env);
      }

      if (path === '/api/unlike' && request.method === 'POST') {
        return await handleUnlike(request, env);
      }

      if (path === '/api/cleanup' && request.method === 'POST') {
        return await handleCleanup(request, env);
      }

      // User authentication API endpoints
      // 发送验证码
      if (path === '/api/auth/send-code' && request.method === 'POST') {
        return await handleSendVerificationCode(request, env);
      }

      if (path === '/api/auth/register' && request.method === 'POST') {
        return await handleUserRegister(request, env);
      }

      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleUserLogin(request, env);
      }

      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleUserLogout(request, env);
      }

      if (path === '/api/auth/me' && request.method === 'GET') {
        return await handleUserMe(request, env);
      }

      if (path === '/api/auth/forgot-password' && request.method === 'POST') {
        return await handleUserForgotPassword(request, env);
      }

      if (path === '/api/auth/reset-password' && request.method === 'POST') {
        return await handleUserResetPassword(request, env);
      }

      if (path === '/api/auth/change-password' && request.method === 'POST') {
        return await handleUserChangePassword(request, env);
      }

      // Profile API endpoint
      if (path === '/api/profile/update' && request.method === 'PUT') {
        return await handleProfileUpdate(request, env);
      }

      // Admin API endpoints
      if (path === '/api/admin/login' && request.method === 'POST') {
        return await handleAdminLogin(request, env);
      }

      if (path === '/api/admin/stats' && request.method === 'GET') {
        return await handleAdminStats(request, env);
      }

      if (path === '/api/admin/images' && request.method === 'GET') {
        return await handleAdminImages(request, env);
      }

      if (path.startsWith('/api/admin/image/') && request.method === 'GET') {
        const imageId = path.replace('/api/admin/image/', '');
        return await handleAdminImageDetail(request, env, imageId);
      }

      if (path.startsWith('/api/admin/image/') && request.method === 'DELETE') {
        const imageId = path.replace('/api/admin/image/', '');
        return await handleAdminDeleteImage(request, env, imageId);
      }

      if (path === '/api/admin/tags' && request.method === 'GET') {
        return await handleAdminTags(request, env);
      }

      if (path === '/api/admin/categories' && request.method === 'GET') {
        return await handleAdminCategories(request, env);
      }

      if (path.startsWith('/api/admin/tag/') && request.method === 'DELETE') {
        const tagId = path.replace('/api/admin/tag/', '');
        return await handleAdminDeleteTag(request, env, tagId);
      }

      if (path === '/api/admin/batch-upload' && request.method === 'POST') {
        return await handleAdminBatchUpload(request, env, ctx);
      }

      if (path === '/api/admin/batch-status' && request.method === 'GET') {
        return await handleAdminBatchStatus(request, env);
      }

      if (path === '/api/admin/batch-cancel' && request.method === 'POST') {
        return await handleAdminBatchCancel(request, env);
      }

      if (path === '/api/admin/unsplash-sync' && request.method === 'POST') {
        return await handleAdminUnsplashSyncManual(request, env);
      }

      if (path === '/api/admin/fix-tags' && request.method === 'POST') {
        return await handleAdminFixMissingTags(request, env);
      }

      if (path.match(/^\/api\/admin\/image\/\d+\/reanalyze$/) && request.method === 'POST') {
        const imageId = path.match(/\/api\/admin\/image\/(\d+)\/reanalyze$/)[1];
        return await handleAdminReanalyzeImage(request, env, imageId);
      }

      // Admin User Management API endpoints
      if (path === '/api/admin/users' && request.method === 'GET') {
        return await handleAdminUsers(request, env);
      }

      if (path.match(/^\/api\/admin\/user\/[^/]+$/) && request.method === 'GET') {
        const username = decodeURIComponent(path.match(/\/api\/admin\/user\/([^/]+)$/)[1]);
        return await handleAdminUserDetail(request, env, username);
      }

      if (path.match(/^\/api\/admin\/user\/[^/]+$/) && request.method === 'PUT') {
        const username = decodeURIComponent(path.match(/\/api\/admin\/user\/([^/]+)$/)[1]);
        return await handleAdminUpdateUser(request, env, username);
      }

      if (path.match(/^\/api\/admin\/user\/[^/]+$/) && request.method === 'DELETE') {
        const username = decodeURIComponent(path.match(/\/api\/admin\/user\/([^/]+)$/)[1]);
        return await handleAdminDeleteUser(request, env, username);
      }

      if (path.startsWith('/api/image-json/')) {
        const imageSlug = path.replace('/api/image-json/', '');
        return await handleGetImageJson(imageSlug, env);
      }

      // 404 页面
      return new Response(build404Page(), { 
        status: 404,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] Error (${duration}ms):`, error);
      
      let status = 500;
      if (error.message.includes('not found')) status = 404;
      if (error.message.includes('Invalid') || error.message.includes('too large')) status = 400;
      if (error.message.includes('timeout')) status = 504;
      
      return new Response(JSON.stringify({ 
        error: error.message,
        requestId,
        timestamp: new Date().toISOString()
      }), {
        status,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    } finally {
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`[${requestId}] Slow request: ${duration}ms`);
      }
    }
  },
  
  // 队列消费者
  async queue(batch, env) {
    return await handleQueue(batch, env);
  },
  
  // 定时任务 - Unsplash 同步
  async scheduled(event, env, ctx) {
    console.log(`[Cron] Triggered at ${new Date(event.scheduledTime).toISOString()}`);
    
    try {
      const result = await handleUnsplashSync(env);
      console.log('[Cron] Unsplash sync result:', result);
      
      // 清理缓存（同步后刷新首页）
      const cacheKeys = await env.CACHE.list({ prefix: 'images:' });
      await Promise.all(cacheKeys.keys.map(key => env.CACHE.delete(key.name)));
      
      return result;
    } catch (error) {
      console.error('[Cron] Unsplash sync failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// R2 Image Handler with Image Resizing support
async function handleR2Image(request, env, path) {
  // 处理内部路径和普通路径
  let r2Key;
  if (path.startsWith('/internal/r2/')) {
    r2Key = path.substring(13); // 移除 '/internal/r2/'
  } else {
    r2Key = path.substring(4); // 移除 '/r2/'
  }
  
  const referer = request.headers.get('Referer');
  const host = request.headers.get('Host');
  const isInternal = path.startsWith('/internal/r2/');
  
  // 内部请求跳过防盗链检查
  if (!isInternal && referer) {
    try {
      const refererUrl = new URL(referer);
      const currentHost = host || new URL(request.url).host;
      if (refererUrl.host !== currentHost && 
          !refererUrl.host.includes('workers.dev') && 
          !refererUrl.host.includes('imageaigo.cc')) {
        return new Response('Forbidden - Hotlinking not allowed', { 
          status: 403,
          headers: { 'Content-Type': 'text/plain', 'X-Anti-Hotlinking': 'blocked' }
        });
      }
    } catch (e) {
      return new Response('Forbidden - Invalid referer', { status: 403 });
    }
  }

  try {
    const object = await env.R2.get(r2Key);
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // 解析图片转换参数
    const url = new URL(request.url);
    const transformOptions = parseImageTransformOptions(url.searchParams);
    const needsTransform = Object.keys(transformOptions).length > 0;

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    // 优化的缓存策略
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('CDN-Cache-Control', 'public, max-age=31536000');
    
    // 性能优化头
    headers.set('X-Content-Source', 'R2');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Timing-Allow-Origin', '*');
    
    // 支持范围请求（视频、大图片）
    headers.set('Accept-Ranges', 'bytes');
    
    // 图片优化提示
    if (object.httpMetadata?.contentType?.startsWith('image/')) {
      headers.set('X-Content-Type-Options', 'nosniff');
      // 提示浏览器可以使用客户端提示
      headers.set('Accept-CH', 'Viewport-Width, Width, DPR');
    }
    
    if (object.customMetadata?.hash) {
      headers.set('X-Image-Hash', object.customMetadata.hash);
    }

    // 如果需要图片转换，使用 Cloudflare Image Resizing（带缓存优化）
    if (needsTransform && object.httpMetadata?.contentType?.startsWith('image/')) {
      try {
        // 生成缓存 key
        const cacheKey = generateTransformCacheKey(r2Key, transformOptions);
        console.log(`[ImageTransform] Request: ${r2Key}, cache key: ${cacheKey}`);
        
        // 🔹 第一级缓存：检查 R2 中是否已有转换缓存
        const cachedTransformed = await env.R2.get(cacheKey);
        if (cachedTransformed) {
          console.log(`[ImageTransform] ✅ Cache HIT from R2: ${cacheKey}`);
          
          const cacheHeaders = new Headers();
          cachedTransformed.writeHttpMetadata(cacheHeaders);
          cacheHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
          cacheHeaders.set('CDN-Cache-Control', 'public, max-age=31536000');
          cacheHeaders.set('X-Content-Source', 'R2-Cached');
          cacheHeaders.set('X-Image-Resizing', 'cached');
          cacheHeaders.set('Access-Control-Allow-Origin', '*');
          cacheHeaders.set('ETag', cachedTransformed.httpEtag || cachedTransformed.etag);
          
          return new Response(cachedTransformed.body, { headers: cacheHeaders });
        }
        
        console.log(`[ImageTransform] Cache MISS, transforming: ${cacheKey}`);
        
        // 🔹 第二级：执行转换（Image Resizing API）
        // 构建内部 URL（绕过防盗链检查）
        const internalUrl = new URL(request.url);
        internalUrl.pathname = `/internal/r2/${r2Key}`;
        internalUrl.search = ''; // 清除查询参数，避免循环
        
        // 构建 cf.image 选项
        const cfOptions = {
          image: {
            fit: transformOptions.fit || 'contain',
            quality: transformOptions.quality || 85
          }
        };
        
        if (transformOptions.width) cfOptions.image.width = transformOptions.width;
        if (transformOptions.height) cfOptions.image.height = transformOptions.height;
        if (transformOptions.format) cfOptions.image.format = transformOptions.format;
        
        // 使用 fetch 的 cf 参数进行图片转换
        const transformedResponse = await fetch(internalUrl.toString(), { 
          cf: cfOptions 
        });
        
        if (transformedResponse.ok) {
          // 读取转换后的图片数据
          const transformedData = await transformedResponse.arrayBuffer();
          
          // 🔹 第三级：存储转换结果到 R2 缓存（异步，不阻塞响应）
          const contentType = transformOptions.format ? 
            getContentTypeFromFormat(transformOptions.format) : 
            transformedResponse.headers.get('Content-Type') || 'image/jpeg';
          
          // 异步存储到 R2（使用 ctx.waitUntil 如果可用，否则不等待）
          env.R2.put(cacheKey, transformedData, {
            httpMetadata: { 
              contentType: contentType,
              cacheControl: 'public, max-age=31536000, immutable'
            },
            customMetadata: {
              originalKey: r2Key,
              transformOptions: JSON.stringify(transformOptions),
              cachedAt: new Date().toISOString()
            }
          }).then(() => {
            console.log(`[ImageTransform] ✅ Cached to R2: ${cacheKey} (${(transformedData.byteLength / 1024).toFixed(2)}KB)`);
          }).catch(err => {
            console.warn(`[ImageTransform] Failed to cache to R2:`, err.message);
          });
          
          // 构建响应头
          const finalHeaders = new Headers();
          finalHeaders.set('Content-Type', contentType);
          finalHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
          finalHeaders.set('CDN-Cache-Control', 'public, max-age=31536000');
          finalHeaders.set('X-Content-Source', 'R2-Transformed-Fresh');
          finalHeaders.set('X-Image-Resizing', 'enabled');
          finalHeaders.set('X-Transform-Options', JSON.stringify(transformOptions));
          finalHeaders.set('Access-Control-Allow-Origin', '*');
          finalHeaders.set('Timing-Allow-Origin', '*');
          
          console.log('[ImageTransform] ✅ Transform completed, response sent');
          
          return new Response(transformedData, { headers: finalHeaders });
        } else {
          console.warn('[ImageTransform] Transform failed, returning original');
          headers.set('X-Image-Resizing', 'fallback');
          return new Response(object.body, { headers });
        }
      } catch (resizeError) {
        console.error('[ImageTransform] Resize error:', resizeError);
        // 降级：返回原图
        headers.set('X-Image-Resizing', 'error');
        headers.set('X-Transform-Error', resizeError.message);
        return new Response(object.body, { headers });
      }
    }

    // 无需转换，直接返回原图
    if (needsTransform) {
      headers.set('X-Image-Resizing', 'not-applicable');
    }
    
    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving R2 image:', error);
    return new Response('Error loading image', { status: 500 });
  }
}

// 解析图片转换参数
function parseImageTransformOptions(searchParams) {
  const options = {};
  
  // 格式转换
  const format = searchParams.get('format');
  if (format && ['webp', 'jpeg', 'jpg', 'png', 'avif'].includes(format)) {
    options.format = format;
  }
  
  // 宽度
  const width = parseInt(searchParams.get('width'));
  if (width && width > 0 && width <= 4096) {
    options.width = width;
  }
  
  // 高度
  const height = parseInt(searchParams.get('height'));
  if (height && height > 0 && height <= 4096) {
    options.height = height;
  }
  
  // 适配模式
  const fit = searchParams.get('fit');
  if (fit && ['cover', 'contain', 'scale-down', 'crop', 'pad'].includes(fit)) {
    options.fit = fit;
  }
  
  // 质量
  const quality = parseInt(searchParams.get('quality'));
  if (quality && quality > 0 && quality <= 100) {
    options.quality = quality;
  }
  
  return options;
}

// 生成转换缓存的 R2 key
function generateTransformCacheKey(originalKey, options) {
  // 移除 'images/' 前缀（如果有）
  const cleanKey = originalKey.replace(/^images\//, '');
  
  // 构建缓存标识
  const parts = [];
  if (options.format) parts.push(`f${options.format}`);
  if (options.width) parts.push(`w${options.width}`);
  if (options.height) parts.push(`h${options.height}`);
  if (options.fit && options.fit !== 'contain') parts.push(`fit${options.fit}`);
  if (options.quality && options.quality !== 85) parts.push(`q${options.quality}`);
  
  const suffix = parts.join('-');
  
  // 生成缓存 key: cache/images/xxx-original-fwebp-w800-q85.webp
  const extension = options.format || 'jpg';
  return `cache/${originalKey.replace(/\.[^.]+$/, '')}-${suffix}.${extension}`;
}

// 根据格式获取 Content-Type
function getContentTypeFromFormat(format) {
  const contentTypes = {
    'webp': 'image/webp',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'avif': 'image/avif',
    'gif': 'image/gif'
  };
  return contentTypes[format] || 'image/jpeg';
}

// 速率限制检查
async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `ratelimit:${ip}`;
  
  // 获取当前计数
  const current = await env.CACHE.get(rateLimitKey);
  const count = current ? parseInt(current) : 0;
  
  // 限制：每个IP每小时最多10次上传
  if (count >= 10) {
    const timeLeft = await env.CACHE.getWithMetadata(rateLimitKey);
    return {
      allowed: false,
      message: 'Rate limit exceeded. Maximum 10 uploads per hour.',
      retryAfter: 3600
    };
  }
  
  // 增加计数
  await env.CACHE.put(rateLimitKey, (count + 1).toString(), { expirationTtl: 3600 });
  
  return { allowed: true, remaining: 9 - count };
}

// 检测可疑行为
function detectSuspiciousBehavior(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  
  // 检测机器人
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java'];
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    // 允许合法爬虫，但需要验证
    if (!userAgent.includes('Googlebot') && !userAgent.includes('Bingbot')) {
      return { suspicious: true, reason: 'Detected bot user agent' };
    }
  }
  
  // 检测缺少 Referer（直接 API 调用）
  if (!referer && !userAgent.includes('Mozilla')) {
    return { suspicious: true, reason: 'Missing referer and browser signature' };
  }
  
  return { suspicious: false };
}

// Analyze Handler
async function handleAnalyze(request, env) {
  const analyzeStart = Date.now();
  
  try {
    // 用户认证检查 - 必须登录才能分析图片
    const auth = await requireAuth(request, env);
    if (!auth.authorized) {
      return auth.response;
    }
    
    console.log(`[Analyze] User ${auth.user.username} (ID: ${auth.user.id}) is analyzing an image`);

    // 速率限制检查
    const rateLimit = await checkRateLimit(request, env);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: rateLimit.message,
        retryAfter: rateLimit.retryAfter
      }), {
        status: 429,
        headers: { 
          ...handleCORS().headers, 
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter.toString()
        }
      });
    }
    
    // 检测可疑行为
    const suspicion = detectSuspiciousBehavior(request);
    if (suspicion.suspicious) {
      console.warn(`[Security] Suspicious activity detected: ${suspicion.reason}`);
      // 记录但允许继续（可以后续添加更严格的验证）
    }
    
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const imageUrl = formData.get('url');

    let imageData, originalImageData, finalUrl, sourceUrl;

    if (imageFile) {
      // 处理上传的文件
      if (imageFile.size > 20 * 1024 * 1024) {
        throw new Error(`Image too large: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB (max 20MB)`);
      }
      
      originalImageData = await imageFile.arrayBuffer();
      sourceUrl = 'uploaded'; // 文件上传
      console.log(`[Upload] Original image: ${(originalImageData.byteLength / 1024).toFixed(2)}KB`);
      
      // 先上传原图到 R2 临时位置
      const tempKey = `temp/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      await env.R2.put(tempKey, originalImageData, {
        httpMetadata: { contentType: 'image/jpeg' }
      });
      
      console.log(`[Upload] Uploaded to R2: ${tempKey}`);
      
      // 生成 AI 分析专用图（256px JPEG）- 所有图片都压缩
      // 这样只转换一次，后续从 R2 读取，不依赖 Image Resizing 分发
      const sizeMB = originalImageData.byteLength / (1024 * 1024);
      let aiImageKey = null;
      
      console.log(`[AI-Image] Generating AI analysis version (256px) for ${sizeMB.toFixed(2)}MB image`);
      
      try {
        // 使用 Image Resizing 转换：256px JPEG（所有图片都压缩）
        const hostname = new URL(request.url).hostname;
        const publicUrl = `https://${hostname}/r2/${tempKey}`;
        
        const aiResponse = await fetch(publicUrl, {
          cf: {
            image: {
              width: 256,
              height: 256,
              quality: 80,
              fit: 'scale-down',
              format: 'jpeg'
            }
          }
        });
        
        if (aiResponse.ok) {
          const aiImageData = await aiResponse.arrayBuffer();
          
          // 存储 AI 分析图到 R2（后续可复用）
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          aiImageKey = `temp/ai-${timestamp}-${randomStr}.jpg`;
          
          await env.R2.put(aiImageKey, aiImageData, {
            httpMetadata: { contentType: 'image/jpeg' },
            customMetadata: { type: 'ai-analysis', parentKey: tempKey }
          });
          
          imageData = aiImageData;
          console.log(`[AI-Image] ✅ Compressed: ${(originalImageData.byteLength / 1024).toFixed(2)}KB → ${(aiImageData.byteLength / 1024).toFixed(2)}KB (${((1 - aiImageData.byteLength / originalImageData.byteLength) * 100).toFixed(1)}% reduction)`);
          console.log(`[ImageData] Using compressed version for AI: ${(imageData.byteLength / 1024).toFixed(2)}KB`);
        } else {
          throw new Error(`Image Resizing failed: HTTP ${aiResponse.status}`);
        }
      } catch (resizeError) {
        console.warn(`[AI-Image] Image Resizing failed:`, resizeError.message);
        
        // 大图片必须压缩
        if (sizeMB > 10) {
          await env.R2.delete(tempKey).catch(() => {});
          throw new Error(`Image too large (${sizeMB.toFixed(2)}MB) and resizing failed. Maximum 10MB without resizing.`);
        }
        
        // 确保降级到原图
        imageData = originalImageData;
        console.warn(`[AI-Image] Fallback: Using original (${sizeMB.toFixed(2)}MB) for AI analysis`);
        console.log(`[ImageData] Fallback to original: ${(imageData.byteLength / 1024).toFixed(2)}KB`);
      }
      
      // 清理原始临时文件
      await env.R2.delete(tempKey).catch(err => 
        console.warn(`[Cleanup] Failed to delete temp file:`, err.message)
      );
      
      // 验证数据
      if (!imageData || imageData.byteLength === 0) {
        throw new Error('Image processing failed: result is empty');
      }
      
      // 最终大小检查
      const finalSizeMB = imageData.byteLength / (1024 * 1024);
      if (finalSizeMB > 10) {
        throw new Error(`Image too large for AI analysis: ${finalSizeMB.toFixed(2)}MB (max 10MB)`);
      }
      
      finalUrl = `pending_r2`;
      
    } else if (imageUrl) {
      // 处理 URL 图片
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Failed to fetch image: HTTP ${response.status}`);
        
        originalImageData = await response.arrayBuffer();
        sourceUrl = imageUrl; // URL 来源
        
        const sizeMB = originalImageData.byteLength / (1024 * 1024);
        if (sizeMB > 20) throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB (max 20MB)`);
        
        // 使用 Cloudflare Image Resizing 直接从 URL 压缩（所有图片都压缩）
        console.log(`[URL] Generating AI analysis version (256px) for ${sizeMB.toFixed(2)}MB URL image`);
        
        try {
          // AI 分析用：长边 256px（所有图片都压缩）
          const resizedResponse = await fetch(imageUrl, {
            cf: {
              image: {
                width: 256,
                height: 256,
                quality: 80,
                fit: 'scale-down',
                format: 'jpeg'
              }
            }
          });
          
          if (resizedResponse.ok) {
            imageData = await resizedResponse.arrayBuffer();
            console.log(`[URL] ✅ Compressed: ${(originalImageData.byteLength / 1024).toFixed(2)}KB → ${(imageData.byteLength / 1024).toFixed(2)}KB (${((1 - imageData.byteLength / originalImageData.byteLength) * 100).toFixed(1)}% reduction)`);
          } else {
            throw new Error(`Resize failed: HTTP ${resizedResponse.status}`);
          }
        } catch (resizeError) {
          console.warn(`[URL] Image Resizing failed:`, resizeError.message);
          
          // 对于大图片，如果压缩失败，限制大小
          if (sizeMB > 10) {
            throw new Error(`Image too large (${sizeMB.toFixed(2)}MB) and resizing failed. Maximum 10MB without resizing.`);
          }
          
          // 降级到原图
          imageData = originalImageData;
          console.warn(`[URL] Fallback: Using original image (${sizeMB.toFixed(2)}MB)`);
        }
        
        // 验证数据
        if (!imageData || imageData.byteLength === 0) {
          throw new Error('Image processing failed: result is empty');
        }
        
        // 最终大小检查
        const finalSizeMB = imageData.byteLength / (1024 * 1024);
        if (finalSizeMB > 10) {
          throw new Error(`Image too large for AI analysis: ${finalSizeMB.toFixed(2)}MB (max 10MB)`);
        }
        
        finalUrl = imageUrl;
        
      } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') throw new Error('Image fetch timeout (10s)');
        throw error;
      }
    } else {
      throw new Error('No image provided (need image file or url)');
    }

    // 详细验证 imageData 有效性
    console.log('[Validation] Checking imageData:', {
      isNull: imageData === null,
      isUndefined: imageData === undefined,
      type: typeof imageData,
      constructor: imageData?.constructor?.name,
      byteLength: imageData?.byteLength
    });
    
    if (!imageData) {
      console.error('[Analyze] ❌ imageData is null or undefined!');
      console.error('[Analyze] Debug info:', {
        hasImageFile: !!imageFile,
        hasImageUrl: !!imageUrl,
        originalImageDataSize: originalImageData?.byteLength,
        finalUrl: finalUrl
      });
      throw new Error('Image data is null or undefined. Check upload processing logic.');
    }
    
    if (!(imageData instanceof ArrayBuffer) && !(imageData instanceof Uint8Array)) {
      console.error('[Analyze] Invalid imageData type:', typeof imageData, imageData?.constructor?.name);
      throw new Error(`Invalid image data type: ${typeof imageData}. Expected ArrayBuffer or Uint8Array.`);
    }
    
    if (imageData.byteLength === 0) {
      throw new Error('Image data is empty (0 bytes)');
    }

    console.log(`[Hash] ✅ imageData valid: ${(imageData.byteLength / 1024).toFixed(2)}KB`);
    const imageHash = await generateHash(imageData);
    console.log(`[Hash] Generated: ${imageHash.substring(0, 16)}...`);

    // Check if image already exists in database (avoid duplicates)
    const existingImage = await env.DB.prepare(
      'SELECT id, slug, image_url, display_url, description FROM images WHERE image_hash = ?'
    ).bind(imageHash).first();
    
    if (existingImage) {
      console.log(`[Duplicate] Image already exists: ${existingImage.slug}`);
      return new Response(JSON.stringify({ 
        duplicate: true,
        imageId: existingImage.id,
        slug: existingImage.slug,
        image_url: existingImage.image_url,
        description: existingImage.description,
        redirectUrl: `/image/${existingImage.slug}`,
        message: 'This image already exists in the database'
      }), {
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }

    // Check cache for analysis result
    const cached = await env.CACHE.get(imageHash);
    if (cached) {
      const cachedData = JSON.parse(cached);
      console.log(`[Cache] Hit for new image hash!`);
      // Even with cache, we need to store it as a new entry
    }

    // Upload original image to R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const baseKey = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}`;
    const r2Key = `${baseKey}-original.jpg`;

    try {
      await env.R2.put(r2Key, originalImageData, {
        httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          hash: imageHash,
          sourceUrl: sourceUrl || 'uploaded',
          type: 'original'
        }
      });
      console.log(`[R2] Uploaded original: ${r2Key}`);
      finalUrl = `/r2/${r2Key}`;
    } catch (error) {
      console.error('[R2] Upload failed:', error.message);
      finalUrl = `data:image/jpeg;base64,${arrayBufferToBase64(originalImageData)}`;
    }
    
    // Get original image dimensions
    const originalDimensions = await getImageDimensions(originalImageData);
    console.log(`[Dimensions] Original image: ${originalDimensions.width}x${originalDimensions.height}`);
    const maxDimension = Math.max(originalDimensions.width, originalDimensions.height);
    
    // Generate and upload display image (1080px WebP) if needed
    let displayUrl = finalUrl; // 默认使用原图
    
    if (maxDimension > 1080) {
      console.log(`[Display] Image ${maxDimension}px > 1080px, generating display version`);
      
      try {
        const hostname = new URL(request.url).hostname;
        const originalUrl = `https://${hostname}${finalUrl}`;
        
        // 生成展示图：长边 1080px，WebP 格式
        const displayResponse = await fetch(originalUrl, {
          cf: {
            image: {
              width: 1080,
              height: 1080,
              quality: 85,
              fit: 'scale-down',
              format: 'webp'
            }
          }
        });
        
        if (displayResponse.ok) {
          const displayImageData = await displayResponse.arrayBuffer();
          const displayKey = `${baseKey}-display.webp`;
          
          await env.R2.put(displayKey, displayImageData, {
            httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000' },
            customMetadata: {
              uploadedAt: new Date().toISOString(),
              hash: imageHash,
              type: 'display',
              originalKey: r2Key
            }
          });
          
          displayUrl = `/r2/${displayKey}`;
          console.log(`[Display] Generated: ${(displayImageData.byteLength / 1024).toFixed(2)}KB WebP`);
        } else {
          console.warn(`[Display] Failed to generate: HTTP ${displayResponse.status}, using original`);
        }
      } catch (displayError) {
        console.warn(`[Display] Error generating display image:`, displayError.message);
        console.log(`[Display] Using original image for display`);
      }
    } else {
      console.log(`[Display] Image ${maxDimension}px <= 1080px, using original for display`);
    }

    // AI Analysis (uses compressed image for efficiency)
    const analysis = await analyzeImage(imageData, env.AI);
    console.log(`[AI] Analysis completed`);
    
    // 清理 AI 临时图片（如果生成了）
    if (aiImageKey) {
      await env.R2.delete(aiImageKey).catch(err => 
        console.warn(`[Cleanup] Failed to delete AI temp file:`, err.message)
      );
      console.log(`[Cleanup] Deleted AI temp image: ${aiImageKey}`);
    }

    // Override dimensions with original image dimensions
    analysis.dimensions = originalDimensions;

    // Store in database with user_id, including display_url
    const { imageId, slug } = await storeImageAnalysis(env.DB, finalUrl, displayUrl, imageHash, analysis, auth.user.id);
    console.log(`[DB] Stored with slug: ${slug}, user_id: ${auth.user.id}, display_url: ${displayUrl}`);

    // Cache
    const cacheData = { imageId, slug, ...analysis };
    env.CACHE.put(imageHash, JSON.stringify(cacheData), { expirationTtl: 86400 })
      .catch(err => console.warn('[Cache] Failed:', err.message));

    console.log(`[Analyze] Complete in ${Date.now() - analyzeStart}ms`);

    return new Response(JSON.stringify({ 
      ...cacheData,
      performance: { totalTime: Date.now() - analyzeStart, cached: false }
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Analyze] Error:', error);
    throw error;
  }
}

// Get Images (with KV cache)
async function handleGetImages(request, env) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '15')));  // 默认15张
    const category = url.searchParams.get('category');
    const offset = (page - 1) * limit;

    // Generate cache key
    const cacheKey = `images:page:${page}:limit:${limit}:cat:${category || 'all'}`;
    
    // Try to get from cache
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      console.log(`[Cache] Hit for images list: ${cacheKey}`);
      return new Response(cached, {
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }

    let query = `
      SELECT DISTINCT i.id, i.slug, i.image_url, i.display_url, i.description, i.width, i.height, i.created_at,
        (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count,
        i.user_id, u.username, u.display_name, u.avatar_url
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
    `;
    let params = [];

    if (category) {
      query += ` JOIN image_tags it ON i.id = it.image_id
                JOIN tags t ON it.tag_id = t.id
                WHERE t.name = ?`;
      params.push(category);
    }

    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // 优化：一次性查询所有图片的标签，避免N+1问题
    if (results.length > 0) {
      const imageIds = results.map(img => img.id);
      const placeholders = imageIds.map(() => '?').join(',');
      
      const { results: allTags } = await env.DB.prepare(`
        SELECT it.image_id, t.name, t.level, it.weight
        FROM tags t 
        JOIN image_tags it ON t.id = it.tag_id
        WHERE it.image_id IN (${placeholders})
        ORDER BY it.image_id, t.level, it.weight DESC
      `).bind(...imageIds).all();
      
      // 将标签按图片ID分组
      const tagsByImage = {};
      for (const tag of allTags) {
        if (!tagsByImage[tag.image_id]) {
          tagsByImage[tag.image_id] = [];
        }
        tagsByImage[tag.image_id].push({
          name: tag.name,
          level: tag.level,
          weight: tag.weight
        });
      }
      
      // 将标签附加到每张图片
      for (let image of results) {
        image.tags = tagsByImage[image.id] || [];
      }
    }

    const responseData = JSON.stringify({ 
      images: results, 
      page, 
      limit,
      hasMore: results.length === limit
    });

    // Cache for 5 minutes
    env.CACHE.put(cacheKey, responseData, { expirationTtl: 300 })
      .catch(err => console.warn('[Cache] Failed to cache images:', err.message));

    return new Response(responseData, {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[GetImages] Error:', error);
    throw error;
  }
}

// Other API handlers...
async function handleGetImage(imageSlug, env) {
  if (!imageSlug) {
    return new Response(JSON.stringify({ error: 'Image slug required' }), {
      status: 400,
      headers: handleCORS().headers
    });
  }

  // Generate cache key
  const cacheKey = `image:${imageSlug}`;
  
  // Try to get from cache
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for image: ${imageSlug}`);
    return new Response(cached, {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  // 支持slug或id查询
  let image;
  if (isNaN(imageSlug)) {
    image = await env.DB.prepare('SELECT * FROM images WHERE slug = ?').bind(imageSlug).first();
  } else {
    image = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(parseInt(imageSlug)).first();
  }

  if (!image) {
    return new Response(JSON.stringify({ error: 'Image not found' }), {
      status: 404,
      headers: handleCORS().headers
    });
  }

  image.tags = await getImageTags(env.DB, image.id);

  const responseData = JSON.stringify(image);
  
  // Cache for 10 minutes
  env.CACHE.put(cacheKey, responseData, { expirationTtl: 600 })
    .catch(err => console.warn('[Cache] Failed to cache image:', err.message));

  return new Response(responseData, {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleGetImageJson(imageSlug, env) {
  if (!imageSlug) {
    return new Response(JSON.stringify({ error: 'Image slug required' }), {
      status: 400,
      headers: handleCORS().headers
    });
  }

  // 生成缓存键
  const cacheKey = `image-json:${imageSlug}`;
  
  // 尝试从缓存获取
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for image JSON: ${imageSlug}`);
    return new Response(cached, {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  // 支持slug或id查询
  let image;
  if (isNaN(imageSlug)) {
    image = await env.DB.prepare('SELECT description FROM images WHERE slug = ?').bind(imageSlug).first();
  } else {
    image = await env.DB.prepare('SELECT description FROM images WHERE id = ?').bind(parseInt(imageSlug)).first();
  }

  if (!image) {
    return new Response(JSON.stringify({ error: 'Image not found' }), {
      status: 404,
      headers: handleCORS().headers
    });
  }

  // 获取标签（只需要 name, level, weight）
  const { results: tagResults } = await env.DB.prepare(`
    SELECT t.name, t.level, it.weight
    FROM tags t JOIN image_tags it ON t.id = it.tag_id
    WHERE it.image_id = (SELECT id FROM images WHERE slug = ? OR id = ?)
    ORDER BY t.level, it.weight DESC
  `).bind(imageSlug, parseInt(imageSlug) || 0).all();

  const tags = {
    primary: tagResults.filter(t => t.level === 1),
    subcategories: tagResults.filter(t => t.level === 2),
    attributes: tagResults.filter(t => t.level === 3)
  };

  const responseData = JSON.stringify({
    description: image.description,
    tags: tags
  });
  
  // 缓存 10 分钟
  env.CACHE.put(cacheKey, responseData, { expirationTtl: 600 })
    .catch(err => console.warn('[Cache] Failed to cache image JSON:', err.message));

  return new Response(responseData, {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleGetRecommendations(imageSlug, env) {
  if (!imageSlug) {
    return new Response(JSON.stringify({ error: 'Image slug required' }), {
      status: 400,
      headers: handleCORS().headers
    });
  }

  // Generate cache key for recommendations
  const cacheKey = `recommendations:${imageSlug}`;
  
  // Try to get from cache first
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for recommendations: ${imageSlug}`);
    return new Response(cached, {
      headers: { 
        ...handleCORS().headers, 
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      }
    });
  }

  // 获取图片ID
  let image;
  if (isNaN(imageSlug)) {
    image = await env.DB.prepare('SELECT id FROM images WHERE slug = ?').bind(imageSlug).first();
  } else {
    image = await env.DB.prepare('SELECT id FROM images WHERE id = ?').bind(parseInt(imageSlug)).first();
  }

  if (!image) {
    return new Response(JSON.stringify({ recommendations: [] }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  // Get recommendations with advanced algorithm
  const recommendations = await getRecommendations(env.DB, image.id);
  
  const responseData = JSON.stringify({ 
    recommendations,
    cached: false,
    count: recommendations.length
  });
  
  // Cache for 30 minutes (recommendations don't change frequently)
  // Use longer TTL since tag-based recommendations are stable
  env.CACHE.put(cacheKey, responseData, { expirationTtl: 1800 })
    .catch(err => console.warn('[Cache] Failed to cache recommendations:', err.message));

  return new Response(responseData, {
    headers: { 
      ...handleCORS().headers, 
      'Content-Type': 'application/json',
      'X-Cache': 'MISS'
    }
  });
}

async function handleGetCategories(env) {
  const { results } = await env.DB.prepare(`
    SELECT t.id, t.name, COUNT(it.image_id) as count
    FROM tags t
    JOIN image_tags it ON t.id = it.tag_id
    WHERE t.level = 1
    GROUP BY t.id, t.name
    ORDER BY count DESC
    LIMIT 20
  `).all();

  return new Response(JSON.stringify({ categories: results }), {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleAgreeLicense(env) {
  try {
    const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { prompt: 'agree' });
    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully agreed to Meta License',
      response
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

async function handleLike(request, env) {
  try {
    const { imageId } = await request.json();
    if (!imageId) throw new Error('Image ID required');
    
    const userIdentifier = request.headers.get('CF-Connecting-IP') || 'anonymous';
    
    const existing = await env.DB.prepare(
      'SELECT id FROM likes WHERE image_id = ? AND user_identifier = ?'
    ).bind(imageId, userIdentifier).first();
    
    if (existing) {
      return new Response(JSON.stringify({ success: false, message: 'Already liked', liked: true }), {
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    await env.DB.prepare('INSERT INTO likes (image_id, user_identifier) VALUES (?, ?)').bind(imageId, userIdentifier).run();
    
    const { likes_count } = await env.DB.prepare(
      'SELECT COUNT(*) as likes_count FROM likes WHERE image_id = ?'
    ).bind(imageId).first();
    
    return new Response(JSON.stringify({ success: true, liked: true, likesCount: likes_count }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

async function handleUnlike(request, env) {
  try {
    const { imageId } = await request.json();
    if (!imageId) throw new Error('Image ID required');
    
    const userIdentifier = request.headers.get('CF-Connecting-IP') || 'anonymous';
    await env.DB.prepare('DELETE FROM likes WHERE image_id = ? AND user_identifier = ?').bind(imageId, userIdentifier).run();
    
    const { likes_count } = await env.DB.prepare(
      'SELECT COUNT(*) as likes_count FROM likes WHERE image_id = ?'
    ).bind(imageId).first();
    
    return new Response(JSON.stringify({ success: true, liked: false, likesCount: likes_count || 0 }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    throw error;
  }
}

async function handleCleanup(request, env) {
  // 使用管理员 Token 认证，而不是 secret
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { action } = await request.json();
    
    if (!action || !['r2', 'cache', 'all', 'database'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    const results = { r2: 0, cache: 0, database: 0 };
    
    console.log(`[Cleanup] Starting cleanup action: ${action}`);
    
    // 清空 R2
    if (action === 'r2' || action === 'all') {
      try {
        const listed = await env.R2.list({ prefix: 'images/' });
        const keys = listed.objects.map(obj => obj.key);
        
        if (keys.length > 0) {
          // 批量删除，每次最多 1000 个
          for (let i = 0; i < keys.length; i += 1000) {
            const batch = keys.slice(i, i + 1000);
            await Promise.all(batch.map(key => env.R2.delete(key)));
          }
          results.r2 = keys.length;
          console.log(`[Cleanup] Deleted ${keys.length} R2 objects`);
        }
      } catch (error) {
        console.error('[Cleanup] R2 cleanup failed:', error);
        throw new Error(`R2 cleanup failed: ${error.message}`);
      }
    }
    
    // 清空 KV 缓存
    if (action === 'cache' || action === 'all') {
      try {
        const list = await env.CACHE.list();
        if (list.keys.length > 0) {
          await Promise.all(list.keys.map(key => env.CACHE.delete(key.name)));
          results.cache = list.keys.length;
          console.log(`[Cleanup] Deleted ${list.keys.length} cache keys`);
        }
      } catch (error) {
        console.error('[Cleanup] Cache cleanup failed:', error);
        throw new Error(`Cache cleanup failed: ${error.message}`);
      }
    }
    
    // 清空数据库
    if (action === 'database' || action === 'all') {
      try {
        // 删除所有表数据（保留表结构）
        await env.DB.prepare('DELETE FROM likes').run();
        await env.DB.prepare('DELETE FROM image_tags').run();
        await env.DB.prepare('DELETE FROM images').run();
        await env.DB.prepare('DELETE FROM tags').run();
        
        // 重置自增ID
        await env.DB.prepare('DELETE FROM sqlite_sequence').run();
        
        const { total } = await env.DB.prepare('SELECT COUNT(*) as total FROM images').first();
        results.database = total === 0 ? 'cleared' : 'failed';
        console.log(`[Cleanup] Database cleared`);
      } catch (error) {
        console.error('[Cleanup] Database cleanup failed:', error);
        throw new Error(`Database cleanup failed: ${error.message}`);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cleanup completed successfully',
      deleted: results
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// Page Generators
async function handleImagesPage(request, env) {
  // Gallery 页面：使用前端动态加载，不预加载图片
  // 前端会调用 /api/images 进行分页加载
  const html = buildPageTemplate({
    title: `Images Gallery | ImageAI Go`,
    description: `Browse AI-analyzed images with intelligent tagging.`,
    heading: `Images Gallery`,
    subtitle: `Explore our image collection`,
    content: '',  // 空内容，前端 JS 动态加载
    canonical: `https://imageaigo.cc/images`,
    pageType: 'images',
    pageParams: {}
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' }
  });
}

async function handleImageDetailPage(request, env, imageSlug) {
  if (!imageSlug) {
    return new Response('Invalid image slug', { status: 400 });
  }
  
  // ✨ 优化1：添加页面级别缓存
  const cacheKey = `page:image:${imageSlug}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for image detail page: ${imageSlug}`);
    return new Response(cached, {
      headers: { 
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300', // 5分钟浏览器缓存
        'X-Cache': 'HIT'
      }
    });
  }
  
  const image = await env.DB.prepare(
    `SELECT i.*, (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count,
     u.username, u.display_name, u.avatar_url
     FROM images i
     LEFT JOIN users u ON i.user_id = u.id
     WHERE i.slug = ?`
  ).bind(imageSlug).first();
  
  if (!image) {
    return new Response('Image not found', { status: 404 });
  }
  
  // ✨ 优化2：并行查询标签和推荐
  const [tagsResult, recommendations] = await Promise.all([
    env.DB.prepare(`
      SELECT t.name, t.level, it.weight
      FROM tags t JOIN image_tags it ON t.id = it.tag_id
      WHERE it.image_id = ?
      ORDER BY t.level, it.weight DESC
    `).bind(image.id).all(),
    getRecommendations(env.DB, image.id, 6)
  ]);
  
  const tags = tagsResult.results;
  
  const tagsList = tags.map(tag => `
    <a href="/tag/${encodeURIComponent(tag.name)}" class="tag level-${tag.level}">
      ${escapeHtml(tag.name)} (${(tag.weight * 100).toFixed(0)}%)
    </a>
  `).join('');
  
  const recCards = recommendations.map(rec => `
    <a href="/image/${rec.slug}">
      <img src="${rec.image_url}" alt="${escapeHtml(rec.description || 'Rec')}" loading="lazy">
    </a>
  `).join('');
  
  // 准备结构化数据 - 完整 URL 和标准格式
  const fullImageUrl = image.image_url.startsWith('http') 
    ? image.image_url 
    : `https://imageaigo.cc${image.image_url}`;
  
  // 构建用户信息
  const authorInfo = image.user_id && (image.username || image.display_name) ? {
    "@type": "Person",
    "name": image.display_name || image.username,
    "identifier": image.username,
    "url": `https://imageaigo.cc/user/${encodeURIComponent(image.username)}`
  } : {
    "@type": "Organization",
    "name": "ImageAI Go",
    "url": "https://imageaigo.cc"
  };
  
  const creditText = image.user_id && (image.username || image.display_name)
    ? `Photo by ${image.display_name || image.username} on ImageAI Go`
    : "ImageAI Go - AI-Powered Image Analysis Platform";
  
  const imageSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": image.description ? image.description.substring(0, 100) : 'AI-analyzed image',
    "description": image.description || 'AI-analyzed image',
    "contentUrl": fullImageUrl,
    "url": `https://imageaigo.cc/image/${image.slug}`,
    "thumbnailUrl": fullImageUrl,
    "datePublished": new Date(image.created_at).toISOString(),
    "uploadDate": new Date(image.created_at).toISOString(),
    "author": authorInfo,
    "creator": authorInfo,
    "creditText": creditText,
    "copyrightNotice": "© 2024 ImageAI Go. All rights reserved.",
    "license": "https://imageaigo.cc/terms",
    "acquireLicensePage": "https://imageaigo.cc/terms",
    "keywords": tags.map(t => t.name).join(', '),
    "width": {
      "@type": "QuantitativeValue",
      "value": image.width || 0,
      "unitCode": "E37"
    },
    "height": {
      "@type": "QuantitativeValue",
      "value": image.height || 0,
      "unitCode": "E37"
    },
    "encodingFormat": "image/jpeg",
    "inLanguage": "en"
  };
  
  // 完全重新设计的详情页HTML
  const detailHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(image.description ? image.description.substring(0, 60) + '...' : 'Image')} | ImageAI Go</title>
  <meta name="description" content="${escapeHtml(image.description || 'View image')}">
  <meta name="keywords" content="${tags.map(t => escapeHtml(t.name)).join(', ')}, AI image analysis, image tagging">
  <link rel="canonical" href="https://imageaigo.cc/image/${image.slug}">
  
  <!-- Enhanced Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(image.description ? image.description.substring(0, 60) : 'Image')}">
  <meta property="og:description" content="${escapeHtml(image.description || 'View image')}">
  <meta property="og:image" content="${image.image_url}">
  <meta property="og:image:width" content="${image.width || 1200}">
  <meta property="og:image:height" content="${image.height || 630}">
  <meta property="og:image:alt" content="${escapeHtml(image.description || 'Image')}">
  <meta property="og:url" content="https://imageaigo.cc/image/${image.slug}">
  <meta property="og:site_name" content="ImageAI Go">
  <meta property="article:published_time" content="${image.created_at}">
  <meta property="article:tag" content="${tags.map(t => escapeHtml(t.name)).join(', ')}">
  
  <!-- Enhanced Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(image.description ? image.description.substring(0, 60) : 'Image')}">
  <meta name="twitter:description" content="${escapeHtml(image.description || 'View image')}">
  <meta name="twitter:image" content="${image.image_url}">
  <meta name="twitter:image:alt" content="${escapeHtml(image.description || 'Image')}">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(imageSchema)}
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ImageAI Go",
    "url": "https://imageaigo.cc",
    "logo": "https://imageaigo.cc/favicon.svg",
    "description": "AI-powered image tagging and analysis platform",
    "sameAs": [
      "https://github.com/zhaibin/imageaigo"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@imageaigo.cc"
    }
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
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; padding-top: 80px; }
    .nav-buttons {
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      max-width: 1400px;
      margin: 0 auto;
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
    .back-btn svg, .home-btn svg { display: block; }
    @media (max-width: 768px) {
      .container { padding-top: 70px; }
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
    
    .detail-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 25px;
    }
    @media (min-width: 1024px) {
      .detail-container { grid-template-columns: 2fr 1fr; }
    }
    
    .image-section {
      border-radius: 15px;
      padding: 0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      overflow: hidden;
      max-height: calc(100vh - 100px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .image-section img {
      width: 100%;
      height: auto;
      max-height: calc(100vh - 100px);
      display: block;
      object-fit: contain;
    }
    
    .info-section {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .description {
      color: #333;
      font-size: 1.1rem;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e8e8e8;
    }
    .meta span {
      background: #f5f5f5;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      color: #666;
    }
    .like-btn {
      background: white;
      border: 2px solid #e74c3c;
      border-radius: 25px;
      padding: 8px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .like-btn:hover { transform: scale(1.05); }
    .like-btn.liked { background: #e74c3c; }
    .like-btn .count { font-weight: 600; font-size: 0.9rem; color: #333; }
    .like-btn.liked .count { color: white; }
    .tags-section h3 {
      color: #333;
      font-size: 1rem;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tag {
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
    .tag.level-2 { background: #c7d2fe; color: #4338ca; }
    .tag.level-3 { background: #e0e7ff; color: #6366f1; }
    
    .recommendations-section {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      grid-column: 1 / -1;
    }
    .recommendations-section h3 {
      color: #333;
      font-size: 1.1rem;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .rec-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
    }
    .rec-grid a {
      display: block;
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .rec-grid a:hover { transform: scale(1.05); }
    .rec-grid img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }
  </style>
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
    <div class="detail-container">
      <div class="image-section">
        <img src="${image.image_url}" alt="${escapeHtml(image.description || 'AI-analyzed image with tags: ' + tags.slice(0, 3).map(t => t.name).join(', '))}" title="${escapeHtml(image.description || 'Image')}" loading="eager" decoding="async" ${image.width && image.height ? `style="aspect-ratio: ${image.width} / ${image.height}"` : ''}>
      </div>
      
      <div class="info-section">
        ${image.username ? `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e8e8e8;">
          <img src="${image.avatar_url || 'https://randomuser.me/api/portraits/men/1.jpg'}" 
               alt="${escapeHtml(image.display_name || image.username)}"
               style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #f0f0f0;">
          <div>
            <div style="font-weight: 600; font-size: 1rem; color: #333;">
              <a href="/user/${encodeURIComponent(image.username)}" style="color: #667eea; text-decoration: none;">
                ${escapeHtml(image.display_name || image.username)}
              </a>
            </div>
            <div style="font-size: 0.85rem; color: #999;">@${escapeHtml(image.username)}</div>
          </div>
        </div>
        ` : ''}
        
        <div class="description">${escapeHtml(image.description || '')}</div>
        
        <div class="meta">
          <span>📅 ${new Date(image.created_at).toLocaleDateString()}</span>
          <div class="like-btn" onclick="toggleLike(${image.id}, this)">
            <span>❤️</span>
            <span class="count">${image.likes_count || 0}</span>
          </div>
        </div>
        
        <div class="tags-section">
          <h3>Tags</h3>
          <div class="tags">${tagsList}</div>
        </div>
        
        <div class="json-section" style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; cursor: pointer; user-select: none;" onclick="toggleJsonSection()">
            <h3 style="color: #333; font-size: 1rem; margin: 0; font-weight: 600;">
              <span id="jsonToggleIcon">▶</span> JSON Data
            </h3>
            <span style="color: #999; font-size: 0.85rem;">Click to expand/collapse</span>
          </div>
          <div id="jsonContent" style="display: none;">
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="color: #666; font-size: 0.9rem;">API URL:</span>
                <button onclick="copyJsonUrl(event)" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                  Copy URL
                </button>
              </div>
              <input type="text" id="jsonUrl" value="${request.url.replace('/image/', '/api/image-json/')}" readonly 
                style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; font-family: monospace;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="color: #666; font-size: 0.9rem;">JSON Data:</span>
              <button onclick="copyJsonData(event)" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                Copy JSON
              </button>
            </div>
            <textarea id="jsonData" readonly style="width: 100%; height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 0.85rem; resize: vertical;">${escapeHtml(JSON.stringify({
              description: image.description,
              tags: tags
            }, null, 2))}</textarea>
          </div>
        </div>
      </div>
      
      ${recCards ? `
      <div class="recommendations-section">
        <h3>Similar Images</h3>
        <div class="rec-grid">${recCards}</div>
      </div>
      ` : ''}
    </div>
    
    <script>
    async function toggleLike(imageId, button) {
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
          const countEl = button.querySelector('.count');
          if (countEl) countEl.textContent = data.likesCount || 0;
        }
      } catch (error) {
        console.error('Like error:', error);
      }
    }
    
    function toggleJsonSection() {
      const content = document.getElementById('jsonContent');
      const icon = document.getElementById('jsonToggleIcon');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
      } else {
        content.style.display = 'none';
        icon.textContent = '▶';
      }
    }
    
    function copyJsonUrl(event) {
      if (event) event.stopPropagation();
      const urlInput = document.getElementById('jsonUrl');
      urlInput.select();
      document.execCommand('copy');
      alert('JSON URL copied to clipboard!');
    }
    
    function copyJsonData(event) {
      if (event) event.stopPropagation();
      const jsonTextarea = document.getElementById('jsonData');
      jsonTextarea.select();
      document.execCommand('copy');
      alert('JSON data copied to clipboard!');
    }
    </script>
    
    ${buildFooter()}
  </div>
</body>
</html>`;
  
  // ✨ 优化3：缓存页面 HTML（10分钟）
  env.CACHE.put(cacheKey, detailHTML, { expirationTtl: 600 })
    .catch(err => console.warn('[Cache] Failed to cache detail page:', err.message));
  
  return new Response(detailHTML, {
    headers: { 
      'Content-Type': 'text/html;charset=UTF-8', 
      'Cache-Control': 'public, max-age=300', // ✨ 5分钟浏览器/CDN缓存
      'X-Cache': 'MISS'
    }
  });
}

async function handleTagPage(request, env, tagName) {
  // 获取标签信息和图片数量
  const tagInfo = await env.DB.prepare(`
    SELECT t.id, t.name, t.level, COUNT(DISTINCT it.image_id) as count
    FROM tags t
    LEFT JOIN image_tags it ON t.id = it.tag_id
    WHERE t.name = ?
    GROUP BY t.id, t.name, t.level
  `).bind(tagName).first();
  
  const count = tagInfo?.count || 0;
  const level = tagInfo?.level || 2;
  
  const html = buildPageTemplate({
    title: `${tagName} Images | ImageAI Go`,
    description: `Browse ${count} images tagged with "${tagName}". AI-analyzed photos featuring ${tagName.toLowerCase()}.`,
    heading: `#${tagName}`,
    subtitle: `${count} images · Level ${level} tag`,
    content: '',
    canonical: `https://imageaigo.cc/tag/${encodeURIComponent(tagName)}`,
    pageType: 'tag',
    pageParams: { tag: tagName },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${tagName} Tagged Images`,
      "description": `Collection of images tagged with ${tagName}`,
      "url": `https://imageaigo.cc/tag/${encodeURIComponent(tagName)}`,
      "keywords": tagName,
      "numberOfItems": count
    }
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' }
  });
}

async function handleCategoryPage(request, env, path) {
  const category = decodeURIComponent(path.replace('/category/', '').replace('.html', ''));
  
  // 获取分类图片数量
  const { count } = await env.DB.prepare(`
    SELECT COUNT(DISTINCT i.id) as count
    FROM images i
    JOIN image_tags it ON i.id = it.image_id
    JOIN tags t ON it.tag_id = t.id
    WHERE t.name = ? AND t.level = 1
  `).bind(category).first();
  
  const html = buildPageTemplate({
    title: `${category} Images - ImageAI Go`,
    description: `Browse ${count || 0} ${category} images analyzed by AI. Discover stunning ${category.toLowerCase()} photos with intelligent tagging.`,
    heading: `${category} Gallery`,
    subtitle: `Explore ${count || 0} ${category} images`,
    content: '',
    canonical: `https://imageaigo.cc/category/${encodeURIComponent(category)}`,
    pageType: 'category',
    pageParams: { category: category },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${category} Images`,
      "description": `Collection of ${category} images analyzed by AI`,
      "url": `https://imageaigo.cc/category/${encodeURIComponent(category)}`,
      "about": {
        "@type": "Thing",
        "name": category
      },
      "numberOfItems": count || 0
    }
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' }
  });
}

async function handleSearchAPI(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '15');  // 默认15张
  const offset = (page - 1) * limit;
  
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ images: [], query, hasMore: false }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count,
      i.user_id, u.username, u.display_name, u.avatar_url
    FROM images i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN image_tags it ON i.id = it.image_id
    LEFT JOIN tags t ON it.tag_id = t.id
    WHERE i.description LIKE ? OR t.name LIKE ?
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(`%${query}%`, `%${query}%`, limit + 1, offset).all();
  
  const hasMore = results.length > limit;
  const images = hasMore ? results.slice(0, limit) : results;
  
  // 优化：一次性查询所有图片的标签，避免N+1问题
  if (images.length > 0) {
    const imageIds = images.map(img => img.id);
    const placeholders = imageIds.map(() => '?').join(',');
    
    const { results: allTags } = await env.DB.prepare(`
      SELECT it.image_id, t.name, t.level, it.weight
      FROM tags t 
      JOIN image_tags it ON t.id = it.tag_id
      WHERE it.image_id IN (${placeholders})
      ORDER BY it.image_id, t.level, it.weight DESC
    `).bind(...imageIds).all();
    
    // 将标签按图片ID分组
    const tagsByImage = {};
    for (const tag of allTags) {
      if (!tagsByImage[tag.image_id]) {
        tagsByImage[tag.image_id] = [];
      }
      tagsByImage[tag.image_id].push({
        name: tag.name,
        level: tag.level,
        weight: tag.weight
      });
    }
    
    // 将标签附加到每张图片（只取前5个）
    for (let img of images) {
      img.tags = (tagsByImage[img.id] || []).slice(0, 5);
    }
  }
  
  return new Response(JSON.stringify({ images, query, hasMore }), {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleCategoryImagesAPI(request, env, category) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '15');  // 默认15张
  const offset = (page - 1) * limit;
  
  // 尝试从KV缓存获取
  const cacheKey = `category:${category}:page:${page}:limit:${limit}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for category images: ${cacheKey}`);
    return new Response(cached, {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count,
      i.user_id, u.username, u.display_name, u.avatar_url
    FROM images i
    LEFT JOIN users u ON i.user_id = u.id
    JOIN image_tags it ON i.id = it.image_id
    JOIN tags t ON it.tag_id = t.id
    WHERE t.name = ? AND t.level = 1
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(category, limit + 1, offset).all();
  
  const hasMore = results.length > limit;
  const images = hasMore ? results.slice(0, limit) : results;
  
  // 优化：一次性查询所有图片的标签，避免N+1问题
  if (images.length > 0) {
    const imageIds = images.map(img => img.id);
    const placeholders = imageIds.map(() => '?').join(',');
    
    const { results: allTags } = await env.DB.prepare(`
      SELECT it.image_id, t.name, t.level, it.weight
      FROM tags t 
      JOIN image_tags it ON t.id = it.tag_id
      WHERE it.image_id IN (${placeholders})
      ORDER BY it.image_id, t.level, it.weight DESC
    `).bind(...imageIds).all();
    
    // 将标签按图片ID分组
    const tagsByImage = {};
    for (const tag of allTags) {
      if (!tagsByImage[tag.image_id]) {
        tagsByImage[tag.image_id] = [];
      }
      tagsByImage[tag.image_id].push({
        name: tag.name,
        level: tag.level,
        weight: tag.weight
      });
    }
    
    // 将标签附加到每张图片（只取前5个）
    for (let img of images) {
      img.tags = (tagsByImage[img.id] || []).slice(0, 5);
    }
  }
  
  const responseData = JSON.stringify({ images, hasMore });
  
  // 缓存分类页面数据（10分钟）
  env.CACHE.put(cacheKey, responseData, { expirationTtl: 600 })
    .catch(err => console.warn('[Cache] Failed to cache category images:', err.message));
  
  return new Response(responseData, {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleTagImagesAPI(request, env, tagName) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '15');  // 默认15张
  const offset = (page - 1) * limit;
  
  // 尝试从KV缓存获取
  const cacheKey = `tag:${tagName}:page:${page}:limit:${limit}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for tag images: ${cacheKey}`);
    return new Response(cached, {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count,
      i.user_id, u.username, u.display_name, u.avatar_url
    FROM images i
    LEFT JOIN users u ON i.user_id = u.id
    JOIN image_tags it ON i.id = it.image_id
    JOIN tags t ON it.tag_id = t.id
    WHERE t.name = ?
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(tagName, limit + 1, offset).all();
  
  const hasMore = results.length > limit;
  const images = hasMore ? results.slice(0, limit) : results;
  
  // 优化：一次性查询所有图片的标签，避免N+1问题
  if (images.length > 0) {
    const imageIds = images.map(img => img.id);
    const placeholders = imageIds.map(() => '?').join(',');
    
    const { results: allTags } = await env.DB.prepare(`
      SELECT it.image_id, t.name, t.level, it.weight
      FROM tags t 
      JOIN image_tags it ON t.id = it.tag_id
      WHERE it.image_id IN (${placeholders})
      ORDER BY it.image_id, t.level, it.weight DESC
    `).bind(...imageIds).all();
    
    // 将标签按图片ID分组
    const tagsByImage = {};
    for (const tag of allTags) {
      if (!tagsByImage[tag.image_id]) {
        tagsByImage[tag.image_id] = [];
      }
      tagsByImage[tag.image_id].push({
        name: tag.name,
        level: tag.level,
        weight: tag.weight
      });
    }
    
    // 将标签附加到每张图片（只取前5个）
    for (let img of images) {
      img.tags = (tagsByImage[img.id] || []).slice(0, 5);
    }
  }
  
  const responseData = JSON.stringify({ images, hasMore });
  
  // 缓存标签页面数据（10分钟）
  env.CACHE.put(cacheKey, responseData, { expirationTtl: 600 })
    .catch(err => console.warn('[Cache] Failed to cache tag images:', err.message));
  
  return new Response(responseData, {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleSearchPage(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  const html = buildPageTemplate({
    title: query ? `Search: ${query} | ImageAI Go` : 'Search | ImageAI Go',
    description: query ? `Results for "${query}"` : 'Search images',
    heading: query ? 'Search Results' : 'Search Images',
    subtitle: query ? `Results for "${query}"` : 'Find images',
    content: '',
    canonical: `https://imageaigo.cc/search${query ? '?q=' + encodeURIComponent(query) : ''}`,
    searchBox: true,
    searchQuery: query,
    pageType: 'search',
    pageParams: { query: query }
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=60' }
  });
}

// Database functions
async function storeImageAnalysis(db, imageUrl, displayUrl, imageHash, analysis, userId = null) {
  const existing = await db.prepare('SELECT id, slug FROM images WHERE image_hash = ?').bind(imageHash).first();

  let imageId, slug;
  const width = analysis.dimensions?.width || null;
  const height = analysis.dimensions?.height || null;
  
  if (existing) {
    imageId = existing.id;
    slug = existing.slug;
    // 更新现有记录，包括 display_url
    await db.prepare('UPDATE images SET description = ?, width = ?, height = ?, display_url = ?, analyzed_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(analysis.description, width, height, displayUrl, imageId).run();
  } else {
    // 生成唯一slug
    slug = generateSlug(analysis.description, imageHash);
    const result = await db.prepare(
      'INSERT INTO images (image_url, display_url, image_hash, slug, description, width, height, user_id, analyzed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(imageUrl, displayUrl, imageHash, slug, analysis.description, width, height, userId).run();
    imageId = result.meta.last_row_id;
  }

  await storeTags(db, imageId, analysis.tags);
  return { imageId, slug };
}

async function storeTags(db, imageId, tagsStructure) {
  await db.prepare('DELETE FROM image_tags WHERE image_id = ?').bind(imageId).run();

  for (const primary of tagsStructure.primary || []) {
    const tagId = await getOrCreateTag(db, primary.name, 1, null);
    await db.prepare(
      'INSERT OR REPLACE INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 1)'
    ).bind(imageId, tagId, primary.weight || 1.0).run();

    if (primary.subcategories) {
      for (const sub of primary.subcategories) {
        const subTagId = await getOrCreateTag(db, sub.name, 2, tagId);
        await db.prepare(
          'INSERT OR REPLACE INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 2)'
        ).bind(imageId, subTagId, sub.weight || 1.0).run();

        if (sub.attributes) {
          for (const attr of sub.attributes) {
            const attrTagId = await getOrCreateTag(db, attr.name, 3, subTagId);
            await db.prepare(
              'INSERT OR REPLACE INTO image_tags (image_id, tag_id, weight, level) VALUES (?, ?, ?, 3)'
            ).bind(imageId, attrTagId, attr.weight).run();
          }
        }
      }
    }
  }
}

async function getOrCreateTag(db, name, level, parentId) {
  const existing = await db.prepare('SELECT id FROM tags WHERE name = ? AND level = ?').bind(name, level).first();
  if (existing) return existing.id;

  try {
    const result = await db.prepare('INSERT INTO tags (name, level, parent_id) VALUES (?, ?, ?)').bind(name, level, parentId).run();
    return result.meta.last_row_id;
  } catch (error) {
    // 如果仍然遇到唯一约束错误（竞态条件），再次查询
    if (error.message.includes('UNIQUE constraint')) {
      const retry = await db.prepare('SELECT id FROM tags WHERE name = ? AND level = ?').bind(name, level).first();
      if (retry) return retry.id;
    }
    throw error;
  }
}

async function getImageTags(db, imageId) {
  const { results } = await db.prepare(`
    SELECT t.name, t.level, it.weight
    FROM tags t JOIN image_tags it ON t.id = it.tag_id
    WHERE it.image_id = ?
    ORDER BY t.level, it.weight DESC
  `).bind(imageId).all();

  return {
    primary: results.filter(t => t.level === 1),
    subcategories: results.filter(t => t.level === 2),
    attributes: results.filter(t => t.level === 3)
  };
}

// 使用 utils 中的 generateHash
const generateHash = utilsGenerateHash;

// PWA Manifest
function getManifestJson() {
  return JSON.stringify({
    "name": "ImageAI Go - AI-Powered Image Analysis",
    "short_name": "ImageAI Go",
    "description": "Upload images and get instant AI-powered analysis with intelligent hierarchical tags, descriptions, and smart recommendations",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#667eea",
    "theme_color": "#667eea",
    "orientation": "portrait-primary",
    "scope": "/",
    "lang": "en",
    "dir": "ltr",
    "categories": ["productivity", "photo", "utilities"],
    "icons": [
      {
        "src": "/favicon.svg",
        "sizes": "any",
        "type": "image/svg+xml",
        "purpose": "any maskable"
      }
    ]
  });
}

// Robots.txt
function getRobotsTxt() {
  return `# ImageAI Go - Robots.txt
User-agent: *
Allow: /

# Sitemap
Sitemap: https://imageaigo.cc/sitemap.xml

# Crawl delay (optional, be friendly to crawlers)
Crawl-delay: 1

# Disallow admin area
User-agent: *
Disallow: /admin
Disallow: /api/admin

# Allow all API endpoints for indexing (except admin)
Allow: /api/images
Allow: /api/categories
Allow: /api/image
Allow: /api/search

# Popular search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`;
}

// 404 Page
function build404Page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found | ImageAI Go</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .error-code {
      font-size: 8rem;
      font-weight: 900;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 20px;
    }
    h1 {
      color: #333;
      font-size: 2rem;
      margin-bottom: 15px;
    }
    p {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .links {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      padding: 12px 30px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s;
      display: inline-block;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    .suggestions {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e0e0e0;
    }
    .suggestions h2 {
      color: #333;
      font-size: 1.2rem;
      margin-bottom: 15px;
    }
    .suggestions ul {
      list-style: none;
      padding: 0;
    }
    .suggestions li {
      margin: 8px 0;
    }
    .suggestions a {
      color: #667eea;
      text-decoration: none;
      font-size: 1rem;
    }
    .suggestions a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-code">404</div>
    <h1>Page Not Found</h1>
    <p>Oops! The page you're looking for doesn't exist. It might have been moved or deleted.</p>
    
    <div class="links">
      <a href="/" class="btn btn-primary">🏠 Go Home</a>
      <a href="/images" class="btn btn-secondary">📸 Browse Images</a>
      <a href="/search" class="btn btn-secondary">🔍 Search</a>
    </div>
    
    <div class="suggestions">
      <h2>Quick Links</h2>
      <ul>
        <li><a href="/">Home - Upload & Analyze Images</a></li>
        <li><a href="/images">Gallery - Browse All Images</a></li>
        <li><a href="/search">Search - Find Images</a></li>
        <li><a href="/about">About - Learn More</a></li>
      </ul>
    </div>
  </div>
</body>
</html>`;
}

// OG Image (1200x630 SVG for social media)
function getOGImageSVG() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  
  <!-- Logo Icon -->
  <g transform="translate(250, 180)">
    <rect x="0" y="0" width="180" height="140" rx="15" fill="white" opacity="0.95"/>
    <rect x="15" y="15" width="150" height="110" rx="10" fill="url(#bgGrad)" opacity="0.8"/>
    <circle cx="90" cy="70" r="40" fill="white" opacity="0.4"/>
    <circle cx="90" cy="70" r="25" fill="white" opacity="0.7"/>
  </g>
  
  <!-- Text -->
  <text x="500" y="280" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">
    ImageAI Go
  </text>
  <text x="500" y="360" font-family="Arial, sans-serif" font-size="36" fill="white" opacity="0.9">
    AI-Powered Image Analysis
  </text>
  <text x="500" y="420" font-family="Arial, sans-serif" font-size="28" fill="white" opacity="0.8">
    Intelligent Tagging · Smart Recommendations
  </text>
  
  <!-- Decorative elements -->
  <circle cx="150" cy="80" r="8" fill="white" opacity="0.6"/>
  <circle cx="1050" cy="550" r="12" fill="white" opacity="0.5"/>
  <circle cx="180" cy="500" r="6" fill="white" opacity="0.7"/>
  <circle cx="1020" cy="100" r="10" fill="white" opacity="0.6"/>
</svg>`;
}

// Favicon SVG
function getFaviconSVG() {
  return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="32" fill="url(#grad1)"/>
  <rect x="14" y="20" width="36" height="28" rx="4" fill="white" opacity="0.9"/>
  <rect x="18" y="24" width="28" height="20" rx="2" fill="url(#grad1)"/>
  <circle cx="32" cy="34" r="8" fill="white" opacity="0.3"/>
  <circle cx="32" cy="34" r="5" fill="white" opacity="0.6"/>
  <path d="M44 18 L46 20 L44 22 L42 20 Z" fill="white"/>
  <path d="M48 22 L49 23 L48 24 L47 23 Z" fill="white"/>
  <path d="M44 26 L45 27 L44 28 L43 27 Z" fill="white"/>
</svg>`;}


function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============================================
// 管理后台 API 处理函数
// ============================================

// 简单的JWT生成和验证（使用环境变量中的密钥）
async function generateAdminToken(env) {
  const secret = env.ADMIN_SECRET || 'default-secret-change-in-production';
  const payload = {
    admin: true,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24小时过期
  };
  const token = btoa(JSON.stringify(payload)) + '.' + await simpleSign(JSON.stringify(payload), secret);
  return token;
}

export async function verifyAdminToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  try {
    const payload = JSON.parse(atob(parts[0]));
    
    // 检查过期时间
    if (payload.exp < Date.now()) {
      return false;
    }
    
    // 验证签名
    const secret = env.ADMIN_SECRET || 'default-secret-change-in-production';
    const expectedSignature = await simpleSign(JSON.stringify(payload), secret);
    
    if (parts[1] !== expectedSignature) {
      return false;
    }
    
    return payload.admin === true;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

export async function simpleSign(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBuffer = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// ============= 用户认证 API 处理函数 =============

// 发送验证码
async function handleSendVerificationCode(request, env) {
  try {
    const { email, purpose, userId } = await request.json();
    
    // IP级别的速率限制（防止滥用）
    if (env.CACHE) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const ipRateLimitKey = `sendcode:${ip}`;
      const ipCount = await env.CACHE.get(ipRateLimitKey);
      
      // 每个IP每小时最多发送20个验证码
      if (ipCount && parseInt(ipCount) >= 20) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '3600',
            ...handleCORS().headers
          }
        });
      }
      
      // 增加计数
      const newCount = ipCount ? parseInt(ipCount) + 1 : 1;
      await env.CACHE.put(ipRateLimitKey, newCount.toString(), { expirationTtl: 3600 });
    }
    
    // 验证 purpose 参数
    const validPurposes = ['register', 'login', 'reset_password', 'change_password'];
    if (!validPurposes.includes(purpose)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid verification code purpose' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCORS().headers
        }
      });
    }

    // 如果是修改密码，需要验证登录状态
    if (purpose === 'change_password') {
      const auth = await requireAuth(request, env);
      if (!auth.authorized) {
        return auth.response;
      }
      // 使用当前登录用户的邮箱和ID
      const userInfo = await getUserInfo(auth.user.id, env);
      if (!userInfo.success) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to get user information' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...handleCORS().headers
          }
        });
      }
      const result = await sendCode(userInfo.user.email, purpose, env, auth.user.id);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCORS().headers
        }
      });
    }

    // 其他情况使用请求中的邮箱
    const result = await sendCode(email, purpose, env, userId);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  } catch (error) {
    console.error('[API] Send verification code error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to send verification code, please try again later' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 用户注册
async function handleUserRegister(request, env) {
  try {
    const { email, password, username, verificationCode } = await request.json();
    const result = await registerUser(email, password, username, verificationCode, env);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  } catch (error) {
    console.error('[API] Register error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '注册失败，请稍后重试' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 用户登录（支持密码登录和验证码登录）
async function handleUserLogin(request, env) {
  try {
    const { email, password, verificationCode, turnstileToken } = await request.json();
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // 检查是否需要人机验证
    const needsCaptcha = await shouldRequireCaptcha(email, ip, env);
    
    if (needsCaptcha) {
      // 验证 Turnstile token
      if (!turnstileToken) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Human verification required',
          requireCaptcha: true
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...handleCORS().headers
          }
        });
      }
      
      const turnstileResult = await verifyTurnstile(turnstileToken, ip, env);
      if (!turnstileResult.success && !turnstileResult.skipped) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: turnstileResult.error || 'Human verification failed',
          requireCaptcha: true
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...handleCORS().headers
          }
        });
      }
    }
    
    let result;
    
    // 如果提供了验证码，使用验证码登录
    if (verificationCode) {
      result = await loginUserWithCode(email, verificationCode, ip, env);
    } 
    // 否则使用密码登录
    else if (password) {
      result = await loginUser(email, password, ip, env);
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Please provide password or verification code' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCORS().headers
        }
      });
    }
    
    if (result.success) {
      // 设置 session cookie
      return createResponseWithSession(
        JSON.stringify(result),
        result.sessionToken,
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify(result), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...handleCORS().headers
        }
      });
    }
  } catch (error) {
    console.error('[API] Login error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '登录失败，请稍后重试' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 用户登出
async function handleUserLogout(request, env) {
  try {
    const auth = await optionalAuth(request, env);
    
    if (auth.authorized && auth.sessionToken) {
      await logoutUser(auth.sessionToken, env);
    }
    
    // 清除 session cookie
    return createResponseWithoutSession(
      JSON.stringify({ success: true, message: '登出成功' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Logout error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '登出失败' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 获取当前用户信息
async function handleUserMe(request, env) {
  try {
    const auth = await requireAuth(request, env);
    
    if (!auth.authorized) {
      return auth.response;
    }
    
    const result = await getUserInfo(auth.user.id, env);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  } catch (error) {
    console.error('[API] Get user info error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '获取用户信息失败' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 忘记密码
async function handleUserForgotPassword(request, env) {
  try {
    const { email } = await request.json();
    const result = await requestPasswordReset(email, env);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  } catch (error) {
    console.error('[API] Forgot password error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '请求失败，请稍后重试' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 重置密码
async function handleUserResetPassword(request, env) {
  try {
    const { resetToken, newPassword } = await request.json();
    const result = await resetPassword(resetToken, newPassword, env);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  } catch (error) {
    console.error('[API] Reset password error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Reset failed, please try again later' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// 修改密码
async function handleUserChangePassword(request, env) {
  try {
    const auth = await requireAuth(request, env);
    
    if (!auth.authorized) {
      return auth.response;
    }
    
    const { verificationCode, newPassword } = await request.json();
    const result = await changePassword(auth.user.id, verificationCode, newPassword, env);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  } catch (error) {
    console.error('[API] Change password error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '修改密码失败' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// ============= 个人中心处理函数 =============

// 用户公开页面
async function handleUserPage(request, env, username) {
  try {
    // 获取用户信息（通过username）
    const user = await env.DB.prepare(`
      SELECT id, username, display_name, avatar_url, bio, created_at
      FROM users
      WHERE username = ?
    `).bind(username).first();
    
    if (!user) {
      return new Response('User not found', { status: 404 });
    }
    
    // 获取用户的图片
    const userImages = await env.DB.prepare(`
      SELECT id, slug, description, image_url, created_at
      FROM images
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(user.id).all();
    
    // 检查是否为本人访问
    const { authorized, user: currentUser } = await optionalAuth(request, env);
    const isOwnProfile = authorized && currentUser && currentUser.id === user.id;
    
    const html = buildProfilePage(user, userImages.results || [], isOwnProfile);
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
    
  } catch (error) {
    console.error('[UserPage] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 个人中心页面
async function handleProfilePage(request, env) {
  try {
    const auth = await requireAuth(request, env);
    
    if (!auth.authorized) {
      // 未登录，跳转到登录页
      return new Response('', {
        status: 302,
        headers: { 'Location': '/login?error=' + encodeURIComponent('请先登录') }
      });
    }
    
    // 获取用户信息
    const user = await env.DB.prepare(`
      SELECT id, username, display_name, email, avatar_url, bio, created_at, last_login
      FROM users
      WHERE id = ?
    `).bind(auth.user.id).first();
    
    if (!user) {
      return new Response('User not found', { status: 404 });
    }
    
    // 获取用户的图片
    const userImages = await env.DB.prepare(`
      SELECT id, slug, description, image_url, created_at
      FROM images
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(auth.user.id).all();
    
    const html = buildProfilePage(user, userImages.results || [], true); // true = isOwnProfile
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
    
  } catch (error) {
    console.error('[Profile] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 更新个人资料
async function handleProfileUpdate(request, env) {
  try {
    const auth = await requireAuth(request, env);
    
    if (!auth.authorized) {
      return auth.response;
    }
    
    const { display_name, avatar_url, bio } = await request.json();
    
    // 验证bio长度
    if (bio && bio.length > 50) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '个人介绍不能超过50个字' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCORS().headers
        }
      });
    }
    
    // 更新用户信息
    await env.DB.prepare(`
      UPDATE users 
      SET display_name = ?, avatar_url = ?, bio = ?
      WHERE id = ?
    `).bind(display_name, avatar_url, bio, auth.user.id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: '资料更新成功'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
    
  } catch (error) {
    console.error('[Profile] Update error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '更新失败' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS().headers
      }
    });
  }
}

// ============= 管理员 API 处理函数 =============

// 管理员登录
async function handleAdminLogin(request, env) {
  try {
    const { password } = await request.json();
    
    // 从环境变量获取管理员密码，默认为 'admin123'（生产环境必须修改）
    const adminPassword = env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
      const token = await generateAdminToken(env);
      return new Response(JSON.stringify({ 
        success: true, 
        token,
        message: '登录成功'
      }), {
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '密码错误'
      }), {
        status: 401,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('[AdminLogin] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: '登录失败'
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 获取统计数据
async function handleAdminStats(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // 总图片数
    const { total_images } = await env.DB.prepare('SELECT COUNT(*) as total_images FROM images').first();
    
    // 总标签数
    const { total_tags } = await env.DB.prepare('SELECT COUNT(*) as total_tags FROM tags').first();
    
    // 总点赞数
    const { total_likes } = await env.DB.prepare('SELECT COUNT(*) as total_likes FROM likes').first();
    
    // 今日上传（过去24小时）
    const { today_uploads } = await env.DB.prepare(
      "SELECT COUNT(*) as today_uploads FROM images WHERE created_at >= datetime('now', '-1 day')"
    ).first();
    
    return new Response(JSON.stringify({
      totalImages: total_images || 0,
      totalTags: total_tags || 0,
      totalLikes: total_likes || 0,
      todayUploads: today_uploads || 0
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminStats] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 获取图片列表（管理后台）
async function handleAdminImages(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';
    const tag = url.searchParams.get('tag') || '';
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT DISTINCT i.id, i.slug, i.image_url, i.display_url, i.description, i.width, i.height, i.created_at,
        (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count,
        i.user_id, u.username, u.display_name, u.avatar_url
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
    `;
    let params = [];
    let whereConditions = [];
    
    // 按分类或标签筛选
    if (category || tag) {
      query += ` JOIN image_tags it ON i.id = it.image_id
                 JOIN tags t ON it.tag_id = t.id`;
      
      if (category) {
        whereConditions.push('t.name = ? AND t.level = 1');
        params.push(category);
      } else if (tag) {
        whereConditions.push('t.name = ?');
        params.push(tag);
      }
    }
    
    // 搜索条件
    if (search) {
      whereConditions.push('(i.description LIKE ? OR i.id = ?)');
      params.push(`%${search}%`, parseInt(search) || 0);
    }
    
    // 组合 WHERE 条件
    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(' AND ');
    }
    
    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit + 1, offset); // +1 to check if there are more
    
    const { results } = await env.DB.prepare(query).bind(...params).all();
    
    const hasMore = results.length > limit;
    const images = results.slice(0, limit);
    
    // 优化：批量查询所有图片的标签，避免 N+1 问题
    if (images.length > 0) {
      const imageIds = images.map(img => img.id);
      const placeholders = imageIds.map(() => '?').join(',');
      
      const { results: allTags } = await env.DB.prepare(`
        SELECT it.image_id, t.name, t.level, it.weight
        FROM tags t 
        JOIN image_tags it ON t.id = it.tag_id
        WHERE it.image_id IN (${placeholders})
        ORDER BY it.image_id, t.level, it.weight DESC
      `).bind(...imageIds).all();
      
      // 将标签按图片ID分组
      const tagsByImage = {};
      for (const tag of allTags) {
        if (!tagsByImage[tag.image_id]) {
          tagsByImage[tag.image_id] = [];
        }
        tagsByImage[tag.image_id].push({
          name: tag.name,
          level: tag.level,
          weight: tag.weight
        });
      }
      
      // 将标签附加到每张图片（只取前5个）
      for (let img of images) {
        const imageTags = tagsByImage[img.id] || [];
        img.tags = imageTags.slice(0, 5);
        img.tag_count = imageTags.length;
      }
    }
    
    return new Response(JSON.stringify({
      images,
      page,
      limit,
      hasMore
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminImages] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 获取图片详情（管理后台）
async function handleAdminImageDetail(request, env, imageId) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const image = await env.DB.prepare(`
      SELECT i.*, (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
      FROM images i WHERE i.id = ?
    `).bind(parseInt(imageId)).first();
    
    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 获取标签
    const { results: tags } = await env.DB.prepare(`
      SELECT t.name, t.level, it.weight
      FROM tags t JOIN image_tags it ON t.id = it.tag_id
      WHERE it.image_id = ?
      ORDER BY t.level, it.weight DESC
    `).bind(image.id).all();
    
    return new Response(JSON.stringify({
      image,
      tags
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminImageDetail] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 删除图片（管理后台）
async function handleAdminDeleteImage(request, env, imageId) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const id = parseInt(imageId);
    
    // 获取图片完整信息（用于删除R2文件和清理缓存）
    const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first();
    
    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 如果是R2存储的图片，删除R2文件
    if (image.image_url.startsWith('/r2/')) {
      const r2Key = image.image_url.substring(4);
      try {
        await env.R2.delete(r2Key);
        console.log(`[AdminDelete] Deleted R2 object: ${r2Key}`);
      } catch (error) {
        console.error(`[AdminDelete] Failed to delete R2 object: ${error.message}`);
      }
    }
    
    // 删除数据库记录（CASCADE会自动删除相关的tags和likes）
    await env.DB.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
    
    // 清理 KV 缓存
    try {
      // 清理图片哈希缓存
      if (image.image_hash) {
        await env.CACHE.delete(image.image_hash);
        console.log(`[AdminDelete] Cleared hash cache: ${image.image_hash}`);
      }
      
      // 清理图片slug缓存
      if (image.slug) {
        await env.CACHE.delete(`image:${image.slug}`);
        await env.CACHE.delete(`image:${image.id}`);
        await env.CACHE.delete(`image-json:${image.slug}`);
        console.log(`[AdminDelete] Cleared image cache: ${image.slug}`);
      }
      
      // 清理推荐缓存（删除此图片的推荐 + 可能推荐此图片的其他图片）
      await env.CACHE.delete(`recommendations:${image.slug}`);
      await env.CACHE.delete(`recommendations:${image.id}`);
      
      // 清理所有推荐缓存，因为其他图片可能推荐了这张被删除的图片
      const recCacheList = await env.CACHE.list({ prefix: 'recommendations:' });
      if (recCacheList.keys.length > 0) {
        await Promise.all(recCacheList.keys.map(key => env.CACHE.delete(key.name)));
        console.log(`[AdminDelete] Cleared ${recCacheList.keys.length} recommendation caches`);
      }
      
      // 清理图片列表缓存（清理所有分页缓存）
      const cacheList = await env.CACHE.list({ prefix: 'images:page:' });
      if (cacheList.keys.length > 0) {
        await Promise.all(cacheList.keys.map(key => env.CACHE.delete(key.name)));
        console.log(`[AdminDelete] Cleared ${cacheList.keys.length} image list caches`);
      }
    } catch (error) {
      console.error(`[AdminDelete] Failed to clear cache: ${error.message}`);
      // 继续执行，不影响删除操作
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Image deleted successfully',
      cachesCleared: true
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminDeleteImage] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 获取分类列表（管理后台）
async function handleAdminCategories(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { results } = await env.DB.prepare(`
      SELECT t.id, t.name, COUNT(DISTINCT it.image_id) as count
      FROM tags t
      LEFT JOIN image_tags it ON t.id = it.tag_id
      WHERE t.level = 1
      GROUP BY t.id, t.name
      ORDER BY count DESC, t.name ASC
    `).all();
    
    return new Response(JSON.stringify({ categories: results }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminCategories] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 获取标签列表（管理后台）
async function handleAdminTags(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 200;
    
    let query = `
      SELECT t.id, t.name, t.level, COUNT(it.image_id) as usage_count
      FROM tags t
      LEFT JOIN image_tags it ON t.id = it.tag_id
    `;
    let params = [];
    
    if (search) {
      query += ` WHERE t.name LIKE ?`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY t.id, t.name, t.level ORDER BY usage_count DESC, t.name ASC LIMIT ?`;
    params.push(limit);
    
    const { results: tags } = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({ tags }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminTags] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 删除标签（管理后台）
async function handleAdminDeleteTag(request, env, tagId) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const id = parseInt(tagId);
    
    // 删除标签（CASCADE会自动删除相关的image_tags关联）
    const result = await env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id).run();
    
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Tag not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Tag deleted successfully'
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[AdminDeleteTag] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 批量上传处理（管理后台）
async function handleAdminBatchUpload(request, env, ctx) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const formData = await request.formData();
    const files = [];
    
    // 收集所有图片文件
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        files.push(value);
      }
    }
    
    if (files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 生成批次ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[BatchUpload] Received ${files.length} files, batchId: ${batchId}`);
    
    // 初始化批次状态到 KV
    const batchStatus = {
      batchId,
      total: files.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      processing: 0,
      status: 'processing',
      startTime: Date.now(),
      lastActivity: Date.now(),
      currentFile: '',
      files: files.map(f => ({ name: f.name, status: 'pending' }))
    };
    
    await env.CACHE.put(`batch:${batchId}`, JSON.stringify(batchStatus), { expirationTtl: 3600 });
    
    // 快速预处理：检查重复 + 上传到临时存储 + 发送到队列
    const preprocessPromises = files.map(async (file, index) => {
      try {
        console.log(`[BatchUpload:${batchId}:${index}] Preprocessing ${file.name}`);
        
        // 读取文件数据
        const imageData = await file.arrayBuffer();
        
        // 验证数据
        if (!imageData || imageData.byteLength === 0) {
          await updateBatchStatus(env, batchId, index, 'failed', 'Invalid image data', file.name);
          return;
        }
        
        // 检查大小
        if (imageData.byteLength > 20 * 1024 * 1024) {
          await updateBatchStatus(env, batchId, index, 'failed', 'File too large (>20MB)', file.name);
          return;
        }
        
        // 生成哈希
        const imageHash = await generateHash(imageData);
        
        // 检查是否已存在
        const existing = await env.DB.prepare('SELECT id, slug FROM images WHERE image_hash = ?')
          .bind(imageHash).first();
        
        if (existing) {
          console.log(`[BatchUpload:${batchId}:${index}] Duplicate found: ${existing.slug}`);
          await updateBatchStatus(env, batchId, index, 'skipped', `Duplicate of ${existing.slug}`, file.name);
          return;
        }
        
        // 上传到临时存储（用于队列处理）
        const tempKey = `temp/${batchId}/${index}`;
        await env.R2.put(tempKey, imageData, {
          httpMetadata: { contentType: file.type || 'image/jpeg' },
          customMetadata: {
            hash: imageHash,
            fileName: file.name,
            batchId: batchId,
            fileIndex: index.toString()
          }
        });
        
        // 发送消息到队列
        await env.IMAGE_QUEUE.send({
          batchId,
          fileIndex: index,
          fileName: file.name,
          imageHash,
          contentType: file.type || 'image/jpeg'
        });
        
        console.log(`[BatchUpload:${batchId}:${index}] Queued for processing`);
        
      } catch (error) {
        console.error(`[BatchUpload:${batchId}:${index}] Preprocessing failed:`, error.message);
        await updateBatchStatus(env, batchId, index, 'failed', error.message, file.name);
      }
    });
    
    // 使用 waitUntil 确保预处理完成
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(Promise.all(preprocessPromises));
    }
    
    // 立即返回响应
    return new Response(JSON.stringify({
      success: true,
      message: `Batch upload started for ${files.length} images`,
      count: files.length,
      batchId,
      status: 'processing'
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[BatchUpload] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 检查批次是否应该继续处理
async function checkBatchStatus(env, batchId) {
  try {
    const statusKey = `batch:${batchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    
    if (!currentStatus) return false;
    
    const batchStatus = JSON.parse(currentStatus);
    return batchStatus.status === 'processing';
  } catch (err) {
    console.error(`[CheckBatchStatus] Error:`, err);
    return false;
  }
}

// 更新批次状态
async function updateBatchStatus(env, batchId, fileIndex, status, error = null, currentFile = null) {
  try {
    const statusKey = `batch:${batchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    
    if (!currentStatus) return;
    
    const batchStatus = JSON.parse(currentStatus);
    batchStatus.files[fileIndex].status = status;
    if (error) {
      batchStatus.files[fileIndex].error = error;
    }
    
    // 更新计数
    batchStatus.completed = batchStatus.files.filter(f => f.status === 'completed').length;
    batchStatus.failed = batchStatus.files.filter(f => f.status === 'failed').length;
    batchStatus.skipped = batchStatus.files.filter(f => f.status === 'skipped').length;
    batchStatus.processing = batchStatus.files.filter(f => f.status === 'processing').length;
    
    // 更新最后活动时间和当前文件
    batchStatus.lastActivity = Date.now();
    if (currentFile) {
      batchStatus.currentFile = currentFile;
    }
    
    await env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 });
  } catch (err) {
    console.error(`[UpdateBatchStatus] Error:`, err);
  }
}


// 查询批次状态
async function handleAdminBatchStatus(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // 获取所有批次状态
    const batchKeys = await env.CACHE.list({ prefix: 'batch:' });
    const batches = [];
    const now = Date.now();
    
    for (const key of batchKeys.keys) {
      const statusData = await env.CACHE.get(key.name);
      if (statusData) {
        const batch = JSON.parse(statusData);
        
        // 检测疑似卡死（超过2分钟没有活动）
        if (batch.status === 'processing' && batch.lastActivity) {
          const inactiveTime = now - batch.lastActivity;
          if (inactiveTime > 120000) { // 2分钟
            batch.possiblyStuck = true;
            batch.inactiveSeconds = Math.floor(inactiveTime / 1000);
          }
        }
        
        batches.push(batch);
      }
    }
    
    // 按开始时间排序（最新的在前）
    batches.sort((a, b) => b.startTime - a.startTime);
    
    return new Response(JSON.stringify({
      success: true,
      batches: batches.filter(b => b.status === 'processing') // 只返回进行中的任务
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[BatchStatus] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 取消批次
async function handleAdminBatchCancel(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { batchId } = await request.json();
    
    if (!batchId) {
      return new Response(JSON.stringify({ error: 'batchId is required' }), {
        status: 400,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    const statusKey = `batch:${batchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    
    if (!currentStatus) {
      return new Response(JSON.stringify({ error: 'Batch not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    const batchStatus = JSON.parse(currentStatus);
    
    // 标记为已取消
    batchStatus.status = 'cancelled';
    batchStatus.cancelledAt = Date.now();
    batchStatus.endTime = Date.now();
    batchStatus.duration = batchStatus.endTime - batchStatus.startTime;
    
    await env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 });
    
    console.log(`[BatchCancel] Batch ${batchId} cancelled by admin`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Batch cancelled successfully',
      batchId
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[BatchCancel] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 手动触发 Unsplash 同步
async function handleAdminUnsplashSyncManual(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    console.log('[Admin] Manual Unsplash sync triggered');
    const result = await handleUnsplashSync(env);
    
    // 清理缓存
    const cacheKeys = await env.CACHE.list({ prefix: 'images:' });
    await Promise.all(cacheKeys.keys.map(key => env.CACHE.delete(key.name)));
    
    return new Response(JSON.stringify(result), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Admin] Unsplash sync failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 重新分析单张图片
async function handleAdminReanalyzeImage(request, env, imageId) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const id = parseInt(imageId);
    console.log(`[ReanalyzeImage] Starting to reanalyze image ${id}`);
    
    // 获取图片信息
    const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first();
    
    if (!image) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image not found' 
      }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 检查是否存储在R2
    if (!image.image_url.startsWith('/r2/')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image not in R2 storage' 
      }), {
        status: 400,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 从R2获取图片数据
    const r2Key = image.image_url.substring(4);
    const r2Object = await env.R2.get(r2Key);
    
    if (!r2Object) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image file not found in R2' 
      }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    const imageData = await r2Object.arrayBuffer();
    
    // 使用 AI 重新分析
    console.log(`[ReanalyzeImage] Analyzing image ${id} with AI...`);
    const analysis = await analyzeImage(imageData, env.AI);
    
    if (!analysis || !analysis.tags) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'AI analysis failed or no tags generated' 
      }), {
        status: 500,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 更新描述
    await env.DB.prepare('UPDATE images SET description = ? WHERE id = ?')
      .bind(analysis.description, id).run();
    
    // 删除旧标签
    await env.DB.prepare('DELETE FROM image_tags WHERE image_id = ?').bind(id).run();
    
    // 存储新标签
    await storeTags(env.DB, id, analysis.tags);
    
    console.log(`[ReanalyzeImage] ✓ Image ${id} reanalyzed successfully`);
    
    // 清理相关缓存（包括推荐缓存）
    const cacheKeys = await env.CACHE.list({ prefix: 'images:' });
    await Promise.all(cacheKeys.keys.map(key => env.CACHE.delete(key.name)));
    
    if (image.slug) {
      await env.CACHE.delete(`image:${image.slug}`);
      await env.CACHE.delete(`image:${image.id}`);
      await env.CACHE.delete(`image-json:${image.slug}`);
      await env.CACHE.delete(`recommendations:${image.slug}`);
      await env.CACHE.delete(`recommendations:${image.id}`);
    }
    
    // 清理所有推荐缓存，因为标签变化会影响其他图片的推荐结果
    const recCacheList = await env.CACHE.list({ prefix: 'recommendations:' });
    if (recCacheList.keys.length > 0) {
      await Promise.all(recCacheList.keys.map(key => env.CACHE.delete(key.name)));
      console.log(`[ReanalyzeImage] Cleared ${recCacheList.keys.length} recommendation caches`);
    }
    
    // 获取新的标签信息
    const { results: newTags } = await env.DB.prepare(`
      SELECT t.name, t.level, it.weight
      FROM tags t JOIN image_tags it ON t.id = it.tag_id
      WHERE it.image_id = ?
      ORDER BY t.level, it.weight DESC
    `).bind(id).all();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Image reanalyzed successfully',
      newDescription: analysis.description,
      newTags: newTags,
      tagCount: newTags.length
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[ReanalyzeImage] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// Sitemap Index 处理
// 符合 Google Search Console 规范：
// - 使用 sitemap index 组织多个 sitemap
// - 每个 sitemap 最多 50,000 个 URL
// - 未压缩文件不超过 50MB
async function handleSitemapIndex(env) {
  try {
    // 检查缓存
    const cached = await env.CACHE.get('sitemap:index');
    if (cached) {
      console.log('[SitemapIndex] Using cached version');
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Robots-Tag': 'all'
        }
      });
    }

    const baseUrl = 'https://imageaigo.cc';
    const formatDate = (date) => {
      const d = date ? new Date(date) : new Date();
      return d.toISOString().split('T')[0];
    };
    const today = formatDate();
    
    // 获取图片总数以确定需要多少个分页 sitemap
    const { total } = await env.DB.prepare('SELECT COUNT(*) as total FROM images').first();
    const imagesPerPage = 5000; // 每个 sitemap 包含 5000 张图片
    const imageSitemapCount = Math.ceil(total / imagesPerPage);
    
    const sitemaps = [];
    
    // 主要页面 sitemap
    sitemaps.push({
      loc: baseUrl + '/sitemap-main.xml',
      lastmod: today
    });
    
    // 图片 sitemap（分页）
    for (let i = 1; i <= imageSitemapCount; i++) {
      sitemaps.push({
        loc: baseUrl + `/sitemap-images-${i}.xml`,
        lastmod: today
      });
    }
    
    // 分类 sitemap
    sitemaps.push({
      loc: baseUrl + '/sitemap-categories.xml',
      lastmod: today
    });
    
    // 标签 sitemap
    sitemaps.push({
      loc: baseUrl + '/sitemap-tags.xml',
      lastmod: today
    });
    
    // 生成 Sitemap Index XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
    
    // 缓存1小时
    await env.CACHE.put('sitemap:index', xml, { expirationTtl: 3600 });
    
    console.log(`[SitemapIndex] Generated with ${sitemaps.length} sitemaps`);
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'all'
      }
    });
  } catch (error) {
    console.error('[SitemapIndex] Error:', error);
    return new Response('Error generating sitemap index', { status: 500 });
  }
}

// Sitemap 分页处理
// 符合 Google Search Console 规范
async function handleSitemapPage(env, path) {
  try {
    const cacheKey = 'sitemap:' + path.replace('/sitemap-', '').replace('.xml', '');
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      console.log(`[Sitemap] Using cached version for ${path}`);
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/xml;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Robots-Tag': 'all'
        }
      });
    }

    const baseUrl = 'https://imageaigo.cc';
    const formatDate = (date) => {
      const d = date ? new Date(date) : new Date();
      return d.toISOString().split('T')[0];
    };
    const today = formatDate();
    
    let urls = [];
    
    // 主要页面
    if (path === '/sitemap-main.xml') {
      urls.push(
        { loc: baseUrl + '/', lastmod: today, changefreq: 'daily', priority: '1.0' },
        { loc: baseUrl + '/images', lastmod: today, changefreq: 'daily', priority: '0.9' },
        { loc: baseUrl + '/search', lastmod: today, changefreq: 'daily', priority: '0.8' },
        { loc: baseUrl + '/about', lastmod: today, changefreq: 'monthly', priority: '0.5' },
        { loc: baseUrl + '/privacy', lastmod: today, changefreq: 'monthly', priority: '0.3' },
        { loc: baseUrl + '/terms', lastmod: today, changefreq: 'monthly', priority: '0.3' }
      );
    }
    // 图片分页
    else if (path.startsWith('/sitemap-images-')) {
      const pageMatch = path.match(/\/sitemap-images-(\d+)\.xml/);
      if (pageMatch) {
        const page = parseInt(pageMatch[1]);
        const limit = 5000;
        const offset = (page - 1) * limit;
        
        const { results: images } = await env.DB.prepare(`
          SELECT slug, image_url, created_at 
          FROM images 
          ORDER BY created_at DESC 
          LIMIT ? OFFSET ?
        `).bind(limit, offset).all();
        
        images.forEach(img => {
          urls.push({
            loc: baseUrl + '/image/' + img.slug,
            lastmod: formatDate(img.created_at),
            changefreq: 'weekly',
            priority: '0.8',
            image: img.image_url
          });
        });
      }
    }
    // 分类页面
    else if (path === '/sitemap-categories.xml') {
      const { results: categories } = await env.DB.prepare(`
        SELECT t.name, MAX(i.created_at) as last_update
        FROM tags t
        JOIN image_tags it ON t.id = it.tag_id
        JOIN images i ON it.image_id = i.id
        WHERE t.level = 1
        GROUP BY t.id, t.name
        HAVING COUNT(DISTINCT i.id) >= 5
        ORDER BY COUNT(DISTINCT i.id) DESC
      `).all();
      
      categories.forEach(cat => {
        urls.push({
          loc: baseUrl + '/category/' + encodeURIComponent(cat.name),
          lastmod: formatDate(cat.last_update),
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
    }
    // 标签页面
    else if (path === '/sitemap-tags.xml') {
      const { results: tags } = await env.DB.prepare(`
        SELECT t.name, t.level, MAX(i.created_at) as last_update
        FROM tags t
        JOIN image_tags it ON t.id = it.tag_id
        JOIN images i ON it.image_id = i.id
        WHERE t.level > 1
        GROUP BY t.id, t.name, t.level
        HAVING COUNT(DISTINCT i.id) >= 3
        ORDER BY COUNT(DISTINCT i.id) DESC
      `).all();
      
      tags.forEach(tag => {
        urls.push({
          loc: baseUrl + '/tag/' + encodeURIComponent(tag.name),
          lastmod: formatDate(tag.last_update),
          changefreq: 'weekly',
          priority: '0.6'
        });
      });
    }
    
    if (urls.length === 0) {
      return new Response('Sitemap not found', { status: 404 });
    }
    
    // 生成 XML（符合 Google Search Console 规范）
    const xml = generateSitemapXML(urls);
    
    // 缓存1小时
    await env.CACHE.put(cacheKey, xml, { expirationTtl: 3600 });
    
    console.log(`[Sitemap] Generated ${path} with ${urls.length} URLs`);
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'all'
      }
    });
  } catch (error) {
    console.error(`[Sitemap] Error generating ${path}:`, error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}

// 生成 Sitemap XML（符合 Google Search Console 规范）
function generateSitemapXML(urls) {
  // XML 转义函数
  const escapeXml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&apos;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => {
  let urlEntry = `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>`;
  
  // changefreq 和 priority 是可选的
  if (url.changefreq) {
    urlEntry += `
    <changefreq>${url.changefreq}</changefreq>`;
  }
  if (url.priority) {
    urlEntry += `
    <priority>${url.priority}</priority>`;
  }
  
  // 添加图片扩展（如果有图片）
  if (url.image) {
    urlEntry += `
    <image:image>
      <image:loc>${escapeXml(url.image)}</image:loc>
    </image:image>`;
  }
  
  urlEntry += `
  </url>`;
  
  return urlEntry;
}).join('\n')}
</urlset>`;
  
  return xml;
}

// 修复缺失标签的图片
async function handleAdminFixMissingTags(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { dryRun = false } = await request.json().catch(() => ({}));
    
    console.log('[FixTags] Starting to fix missing tags... (dryRun:', dryRun, ')');
    
    // 查找所有没有标签的图片
    const { results: images } = await env.DB.prepare(`
      SELECT i.id, i.image_url, i.image_hash, i.description
      FROM images i
      WHERE (SELECT COUNT(*) FROM image_tags WHERE image_id = i.id) = 0
      ORDER BY i.id
    `).all();
    
    console.log(`[FixTags] Found ${images.length} images without tags`);
    
    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        imagesFound: images.length,
        images: images.map(img => ({
          id: img.id,
          url: img.image_url,
          description: img.description?.substring(0, 60) + '...'
        }))
      }, null, 2), {
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }
    
    let processed = 0;
    let failed = 0;
    const errors = [];
    
    // 逐个处理图片
    for (const image of images) {
      try {
        console.log(`[FixTags] Processing image ${image.id}: ${image.description?.substring(0, 50)}`);
        
        // 从R2获取图片数据
        if (!image.image_url.startsWith('/r2/')) {
          console.warn(`[FixTags] Skipping image ${image.id}: not in R2 storage`);
          continue;
        }
        
        const r2Key = image.image_url.substring(4);
        const r2Object = await env.R2.get(r2Key);
        
        if (!r2Object) {
          throw new Error('Image not found in R2');
        }
        
        const imageData = await r2Object.arrayBuffer();
        
        // 使用 AI 重新分析
        const analysis = await analyzeImage(imageData, env.AI);
        
        if (!analysis || !analysis.tags) {
          throw new Error('AI analysis failed or no tags generated');
        }
        
        console.log(`[FixTags] Generated tags for image ${image.id}`);
        
        // 存储标签
        await storeTags(env.DB, image.id, analysis.tags);
        
        processed++;
        console.log(`[FixTags] ✓ Image ${image.id} processed successfully`);
        
        // 每5张图片休息一下，避免API限流
        if (processed % 5 === 0) {
          console.log(`[FixTags] Processed ${processed}/${images.length}, pausing...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        failed++;
        console.error(`[FixTags] ✗ Failed to process image ${image.id}:`, error.message);
        errors.push({
          id: image.id,
          error: error.message
        });
      }
    }
    
    console.log(`[FixTags] Complete: ${processed} processed, ${failed} failed`);
    
    // 清理缓存
    console.log('[FixTags] Clearing cache...');
    const cacheKeys = await env.CACHE.list({ prefix: 'images:' });
    await Promise.all(cacheKeys.keys.map(key => env.CACHE.delete(key.name)));
    
    return new Response(JSON.stringify({
      success: true,
      total: images.length,
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined
    }, null, 2), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[FixTags] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}
