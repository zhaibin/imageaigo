import { analyzeImage, getImageDimensions } from './analyzer';
import { getRecommendations } from './recommendations';
import { handleCORS } from './utils';
import { buildMainHTML, buildLegalPage, buildPageTemplate } from './html-builder';
import { PRIVACY_CONTENT, TERMS_CONTENT, ABOUT_CONTENT } from './pages';
import { escapeHtml } from './templates';
import { generateSlug, generateTagSlug } from './slug-generator';
import { buildAdminLoginPage, buildAdminDashboard } from './admin';
import { buildFooter } from './footer-template';

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

      // R2 images
      if (path.startsWith('/r2/')) {
        return await handleR2Image(request, env, path);
      }

      // API endpoints
      if (path === '/api/search' && request.method === 'GET') {
        return await handleSearchAPI(request, env);
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

      if (path.startsWith('/api/image-json/')) {
        const imageSlug = path.replace('/api/image-json/', '');
        return await handleGetImageJson(imageSlug, env);
      }

      return new Response('Not Found', { status: 404 });
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
  }
};

// R2 Image Handler
async function handleR2Image(request, env, path) {
  const r2Key = path.substring(4);
  const referer = request.headers.get('Referer');
  const host = request.headers.get('Host');
  
  if (referer) {
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

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');
    headers.set('X-Content-Source', 'R2');
    headers.set('Access-Control-Allow-Origin', '*');
    
    if (object.customMetadata?.hash) {
      headers.set('X-Image-Hash', object.customMetadata.hash);
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error serving R2 image:', error);
    return new Response('Error loading image', { status: 500 });
  }
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
    const originalFile = formData.get('original');
    const compressedFile = formData.get('compressed');
    const imageUrl = formData.get('url');
    const sourceUrl = formData.get('sourceUrl');

    let imageData, originalImageData, finalUrl;

    if (originalFile && compressedFile) {
      if (originalFile.size > 20 * 1024 * 1024) {
        throw new Error(`Original image too large: ${(originalFile.size / 1024 / 1024).toFixed(2)}MB (max 20MB)`);
      }
      
      originalImageData = await originalFile.arrayBuffer();
      imageData = await compressedFile.arrayBuffer();
      console.log(`[Upload] Original: ${(originalImageData.byteLength / 1024).toFixed(2)}KB, Compressed: ${(imageData.byteLength / 1024).toFixed(2)}KB`);
      finalUrl = `pending_r2`;
    } else if (imageUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Failed to fetch image: HTTP ${response.status}`);
        
        originalImageData = await response.arrayBuffer();
        imageData = originalImageData;
        
        const sizeMB = imageData.byteLength / (1024 * 1024);
        if (sizeMB > 10) throw new Error(`Image too large: ${sizeMB.toFixed(2)}MB (max 10MB)`);
        if (sizeMB > 2) console.warn(`[URL] Large image: ${sizeMB.toFixed(2)}MB`);
        
        finalUrl = imageUrl;
      } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') throw new Error('Image fetch timeout (10s)');
        throw error;
      }
    } else {
      throw new Error('No image provided (need original+compressed or url)');
    }

    const imageHash = await generateHash(imageData);
    console.log(`[Hash] Generated`);

    // Check if image already exists in database (avoid duplicates)
    const existingImage = await env.DB.prepare(
      'SELECT id, slug, image_url, description FROM images WHERE image_hash = ?'
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

    // Upload to R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const r2Key = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}.jpg`;

    try {
      await env.R2.put(r2Key, originalImageData, {
        httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          hash: imageHash,
          sourceUrl: sourceUrl || 'uploaded'
        }
      });
      console.log(`[R2] Uploaded: ${r2Key}`);
      finalUrl = `/r2/${r2Key}`;
    } catch (error) {
      console.error('[R2] Upload failed:', error.message);
      finalUrl = `data:image/jpeg;base64,${arrayBufferToBase64(originalImageData)}`;
    }

    // Get original image dimensions (not from compressed image)
    const originalDimensions = await getImageDimensions(originalImageData);
    console.log(`[Dimensions] Original image: ${originalDimensions.width}x${originalDimensions.height}`);

    // AI Analysis (uses compressed image for efficiency)
    const analysis = await analyzeImage(imageData, env.AI);
    console.log(`[AI] Analysis completed`);

    // Override dimensions with original image dimensions
    analysis.dimensions = originalDimensions;

    // Store in database
    const { imageId, slug } = await storeImageAnalysis(env.DB, finalUrl, imageHash, analysis);
    console.log(`[DB] Stored with slug: ${slug}`);

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
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
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
      SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
        (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
      FROM images i
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

    for (let image of results) {
      const tags = await getImageTags(env.DB, image.id);
      image.tags = tags;
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

  const recommendations = await getRecommendations(env.DB, image.id);
  return new Response(JSON.stringify({ recommendations }), {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
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
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  
  const { results: images } = await env.DB.prepare(`
    SELECT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
    FROM images i
    ORDER BY i.created_at DESC
    LIMIT 50 OFFSET ?
  `).bind((page - 1) * 50).all();
  
  const imageCards = images.map(img => `
    <article class="image-card">
      <a href="/image/${img.slug}">
        <img src="${img.image_url}" alt="${escapeHtml(img.description || 'Image')}" loading="lazy"${img.width && img.height ? ` style="aspect-ratio: ${img.width} / ${img.height}"` : ''}>
      </a>
      <div class="image-info">
        <p>${escapeHtml(img.description || '')}</p>
        <div class="likes">❤️ ${img.likes_count || 0} likes</div>
      </div>
    </article>
  `).join('');
  
  const html = buildPageTemplate({
    title: `All Images - Page ${page} | ImageAI Go`,
    description: `Browse all AI-analyzed images. Page ${page}.`,
    heading: `All Images Gallery`,
    subtitle: `Page ${page} - ${images.length} images`,
    content: imageCards,
    canonical: `https://imageaigo.cc/images${page > 1 ? '?page=' + page : ''}`
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=180' }
  });
}

async function handleImageDetailPage(request, env, imageSlug) {
  if (!imageSlug) {
    return new Response('Invalid image slug', { status: 400 });
  }
  
  const image = await env.DB.prepare(
    `SELECT i.*, (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
     FROM images i WHERE i.slug = ?`
  ).bind(imageSlug).first();
  
  if (!image) {
    return new Response('Image not found', { status: 404 });
  }
  
  const { results: tags } = await env.DB.prepare(`
    SELECT t.name, t.level, it.weight
    FROM tags t JOIN image_tags it ON t.id = it.tag_id
    WHERE it.image_id = ?
    ORDER BY t.level, it.weight DESC
  `).bind(image.id).all();
  
  const recommendations = await getRecommendations(env.DB, image.id, 6);
  
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
  
  // 完全重新设计的详情页HTML
  const detailHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(image.description ? image.description.substring(0, 60) + '...' : 'Image')} | ImageAI Go</title>
  <meta name="description" content="${escapeHtml(image.description || 'View image')}">
  <link rel="canonical" href="https://imageaigo.cc/image/${image.slug}">
  <meta property="og:image" content="${image.image_url}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .back-link {
      display: inline-block; color: white; text-decoration: none;
      padding: 10px 20px; background: rgba(255,255,255,0.2);
      border-radius: 20px; margin-bottom: 20px;
    }
    .back-link:hover { background: rgba(255,255,255,0.3); }
    
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
  <div class="container">
    <a href="/" class="back-link">← Back to Home</a>
    
    <div class="detail-container">
      <div class="image-section">
        <img src="${image.image_url}" alt="${escapeHtml(image.description)}" ${image.width && image.height ? `style="aspect-ratio: ${image.width} / ${image.height}"` : ''}>
      </div>
      
      <div class="info-section">
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
            <span style="color: #999; font-size: 0.85rem;">点击展开/折叠</span>
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
  
  return new Response(detailHTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=600' }
  });
}

async function handleTagPage(request, env, tagName) {
  const { results: images } = await env.DB.prepare(`
    SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
    FROM images i
    JOIN image_tags it ON i.id = it.image_id
    JOIN tags t ON it.tag_id = t.id
    WHERE t.name = ?
    ORDER BY i.created_at DESC
    LIMIT 50
  `).bind(tagName).all();
  
  const imageCards = images.map(img => `
    <article class="image-card">
      <a href="/image/${img.slug}">
        <img src="${img.image_url}" alt="${escapeHtml(img.description || tagName)}" loading="lazy"${img.width && img.height ? ` style="aspect-ratio: ${img.width} / ${img.height}"` : ''}>
      </a>
      <div class="image-info">
        <p>${escapeHtml(img.description || '')}</p>
        <div class="likes">❤️ ${img.likes_count || 0} likes</div>
      </div>
    </article>
  `).join('');
  
  const html = buildPageTemplate({
    title: `${tagName} Images | ImageAI Go`,
    description: `Browse images tagged with "${tagName}". ${images.length} results.`,
    heading: `#${tagName}`,
    subtitle: `${images.length} images`,
    content: imageCards,
    canonical: `https://imageaigo.cc/tag/${encodeURIComponent(tagName)}`
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' }
  });
}

async function handleCategoryPage(request, env, path) {
  const category = decodeURIComponent(path.replace('/category/', '').replace('.html', ''));
  
  const { results: images } = await env.DB.prepare(`
    SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
    FROM images i
    JOIN image_tags it ON i.id = it.image_id
    JOIN tags t ON it.tag_id = t.id
    WHERE t.name = ? AND t.level = 1
    ORDER BY i.created_at DESC
    LIMIT 50
  `).bind(category).all();
  
  const imageCards = images.map(img => `
    <article class="image-card" data-image-id="${img.id}">
      <a href="/image/${img.slug}">
        <img src="${img.image_url}" alt="${escapeHtml(img.description || category)}" loading="lazy"${img.width && img.height ? ` style="aspect-ratio: ${img.width} / ${img.height}"` : ''}>
      </a>
      <div class="image-info">
        <p>${escapeHtml(img.description || '')}</p>
        <div class="likes">
          <button class="like-btn" onclick="toggleLike(${img.id}, this, event)" aria-label="Like this image">
            ❤️ <span class="like-count">${img.likes_count || 0}</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');
  
  const html = buildPageTemplate({
    title: `${category} Images - ImageAI Go`,
    description: `Browse ${category} images analyzed by AI. ${images.length} photos.`,
    heading: `${category} Gallery`,
    subtitle: `${images.length} images`,
    content: imageCards,
    canonical: `https://imageaigo.cc/category/${encodeURIComponent(category)}`
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' }
  });
}

async function handleSearchAPI(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ images: [], query }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
  
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
      (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
    FROM images i
    LEFT JOIN image_tags it ON i.id = it.image_id
    LEFT JOIN tags t ON it.tag_id = t.id
    WHERE i.description LIKE ? OR t.name LIKE ?
    ORDER BY i.created_at DESC
    LIMIT 50
  `).bind(`%${query}%`, `%${query}%`).all();
  
  return new Response(JSON.stringify({ images: results, query }), {
    headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
  });
}

async function handleSearchPage(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  const content = `
    <form method="GET" action="/search" style="margin-bottom: 30px;">
      <input type="search" name="q" placeholder="Search..." value="${escapeHtml(query)}" style="width: 100%; padding: 12px 20px; border: 2px solid #667eea; border-radius: 25px; font-size: 1rem;">
    </form>
    <div id="searchResults"></div>
    <script>
      async function performSearch() {
        const q = new URLSearchParams(window.location.search).get('q');
        if (!q) {
          document.getElementById('searchResults').innerHTML = '<div style="color: white; padding: 40px; text-align: center;">Enter a search term</div>';
          return;
        }
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        const div = document.getElementById('searchResults');
        if (data.images.length === 0) {
          div.innerHTML = '<div style="color: white; padding: 40px; text-align: center;">No results for "' + q + '"</div>';
          return;
        }
        const gallery = document.createElement('div');
        gallery.className = 'gallery';
        data.images.forEach(img => {
          const card = document.createElement('article');
          card.className = 'image-card';
          
          const link = document.createElement('a');
          link.href = '/image/' + img.slug;
          
          const imgEl = document.createElement('img');
          imgEl.src = img.image_url;
          imgEl.alt = img.description || 'Image';
          imgEl.loading = 'lazy';
          if (img.width && img.height) {
            imgEl.style.aspectRatio = img.width + ' / ' + img.height;
          }
          
          link.appendChild(imgEl);
          
          const info = document.createElement('div');
          info.className = 'image-info';
          
          const desc = document.createElement('p');
          desc.textContent = img.description || '';
          
          const likes = document.createElement('div');
          likes.className = 'likes';
          likes.innerHTML = '❤️ ' + (img.likes_count || 0) + ' likes';
          
          info.appendChild(desc);
          info.appendChild(likes);
          
          card.appendChild(link);
          card.appendChild(info);
          gallery.appendChild(card);
        });
        div.innerHTML = '';
        div.appendChild(gallery);
      }
      performSearch();
    </script>
  `;
  
  const html = buildPageTemplate({
    title: query ? `Search: ${query} | ImageAI Go` : 'Search | ImageAI Go',
    description: query ? `Results for "${query}"` : 'Search images',
    heading: query ? 'Search Results' : 'Search Images',
    subtitle: query ? `Results for "${query}"` : 'Find images',
    content,
    canonical: `https://imageaigo.cc/search${query ? '?q=' + encodeURIComponent(query) : ''}`
  });
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=60' }
  });
}

// Database functions
async function storeImageAnalysis(db, imageUrl, imageHash, analysis) {
  const existing = await db.prepare('SELECT id, slug FROM images WHERE image_hash = ?').bind(imageHash).first();

  let imageId, slug;
  const width = analysis.dimensions?.width || null;
  const height = analysis.dimensions?.height || null;
  
  if (existing) {
    imageId = existing.id;
    slug = existing.slug;
    await db.prepare('UPDATE images SET description = ?, width = ?, height = ?, analyzed_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(analysis.description, width, height, imageId).run();
  } else {
    // 生成唯一slug
    slug = generateSlug(analysis.description, imageHash);
    const result = await db.prepare(
      'INSERT INTO images (image_url, image_hash, slug, description, width, height, analyzed_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(imageUrl, imageHash, slug, analysis.description, width, height).run();
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

async function generateHash(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

async function verifyAdminToken(request, env) {
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

async function simpleSign(data, secret) {
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
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT i.id, i.slug, i.image_url, i.description, i.width, i.height, i.created_at,
        (SELECT COUNT(*) FROM likes WHERE image_id = i.id) as likes_count
      FROM images i
    `;
    let params = [];
    
    if (search) {
      query += ` WHERE i.description LIKE ? OR i.id = ?`;
      params.push(`%${search}%`, parseInt(search) || 0);
    }
    
    query += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit + 1, offset); // +1 to check if there are more
    
    const { results } = await env.DB.prepare(query).bind(...params).all();
    
    const hasMore = results.length > limit;
    const images = results.slice(0, limit);
    
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
        console.log(`[AdminDelete] Cleared image cache: ${image.slug}`);
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
    
    query += ` GROUP BY t.id, t.name, t.level ORDER BY usage_count DESC, t.name ASC LIMIT 200`;
    
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
    
    if (files.length > 10) {
      return new Response(JSON.stringify({ error: 'Maximum 10 files per batch' }), {
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
      processing: 0,
      status: 'processing',
      startTime: Date.now(),
      files: files.map(f => ({ name: f.name, status: 'pending' }))
    };
    
    await env.CACHE.put(`batch:${batchId}`, JSON.stringify(batchStatus), { expirationTtl: 3600 }); // 1小时过期
    
    // 立即返回响应，避免超时
    const response = new Response(JSON.stringify({
      success: true,
      message: `Batch upload started for ${files.length} images`,
      count: files.length,
      batchId,
      status: 'processing'
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
    
    // 异步处理图片（使用 waitUntil）
    if (ctx && ctx.waitUntil) {
      ctx.waitUntil(processBatchUpload(files, env, batchId));
    } else {
      // 如果没有 ctx，则同步处理（开发环境）
      processBatchUpload(files, env, batchId).catch(err => 
        console.error('[BatchUpload] Background processing failed:', err)
      );
    }
    
    return response;
  } catch (error) {
    console.error('[BatchUpload] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

// 批量上传后台处理
async function processBatchUpload(files, env, batchId) {
  console.log(`[BatchProcess:${batchId}] Starting to process ${files.length} files`);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[BatchProcess:${batchId}] Processing file ${i + 1}/${files.length}: ${file.name}`);
    
    // 更新状态：正在处理
    await updateBatchStatus(env, batchId, i, 'processing');
    
    try {
      const imageData = await file.arrayBuffer();
      
      // 检查大小
      if (imageData.byteLength > 20 * 1024 * 1024) {
        console.warn(`[BatchProcess:${batchId}] File ${file.name} too large, skipping`);
        await updateBatchStatus(env, batchId, i, 'failed', 'File too large (>20MB)');
        continue;
      }
      
      // 生成哈希
      const imageHash = await generateHash(imageData);
      
      // 检查是否已存在
      const existing = await env.DB.prepare('SELECT id FROM images WHERE image_hash = ?').bind(imageHash).first();
      if (existing) {
        console.log(`[BatchProcess:${batchId}] File ${file.name} already exists, skipping`);
        await updateBatchStatus(env, batchId, i, 'skipped', 'Image already exists');
        continue;
      }
      
      // 上传到 R2
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const r2Key = `images/${timestamp}-${randomStr}-${imageHash.substring(0, 12)}.jpg`;
      
      await env.R2.put(r2Key, imageData, {
        httpMetadata: { contentType: file.type || 'image/jpeg', cacheControl: 'public, max-age=31536000' },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          hash: imageHash,
          sourceUrl: 'batch-upload',
          originalName: file.name
        }
      });
      
      const finalUrl = `/r2/${r2Key}`;
      
      // 获取图片尺寸
      const dimensions = await getImageDimensions(imageData);
      
      // AI 分析
      const analysis = await analyzeImage(imageData, env.AI);
      analysis.dimensions = dimensions;
      
      // 存储到数据库
      const { imageId, slug } = await storeImageAnalysis(env.DB, finalUrl, imageHash, analysis);
      
      console.log(`[BatchProcess:${batchId}] File ${file.name} processed successfully: ${slug}`);
      
      // 更新状态：完成
      await updateBatchStatus(env, batchId, i, 'completed');
      
      // 添加延迟避免过快
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`[BatchProcess:${batchId}] Failed to process ${file.name}:`, error.message);
      await updateBatchStatus(env, batchId, i, 'failed', error.message);
      // 继续处理下一个文件
    }
  }
  
  // 标记批次完成
  await finalizeBatchStatus(env, batchId);
  console.log(`[BatchProcess:${batchId}] Completed processing ${files.length} files`);
}

// 更新批次状态
async function updateBatchStatus(env, batchId, fileIndex, status, error = null) {
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
    batchStatus.processing = batchStatus.files.filter(f => f.status === 'processing').length;
    
    await env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 });
  } catch (err) {
    console.error(`[UpdateBatchStatus] Error:`, err);
  }
}

// 完成批次状态
async function finalizeBatchStatus(env, batchId) {
  try {
    const statusKey = `batch:${batchId}`;
    const currentStatus = await env.CACHE.get(statusKey);
    
    if (!currentStatus) return;
    
    const batchStatus = JSON.parse(currentStatus);
    batchStatus.status = 'completed';
    batchStatus.endTime = Date.now();
    batchStatus.duration = batchStatus.endTime - batchStatus.startTime;
    
    await env.CACHE.put(statusKey, JSON.stringify(batchStatus), { expirationTtl: 3600 });
  } catch (err) {
    console.error(`[FinalizeBatchStatus] Error:`, err);
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
    
    for (const key of batchKeys.keys) {
      const statusData = await env.CACHE.get(key.name);
      if (statusData) {
        batches.push(JSON.parse(statusData));
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

