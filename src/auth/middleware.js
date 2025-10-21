/**
 * 用户认证中间件
 * 用于保护需要登录才能访问的路由
 */

import { verifySession } from './auth.js';

/**
 * 从请求中提取 session token
 * 支持从 Cookie 或 Authorization header 中提取
 */
export function extractSessionToken(request) {
  // 首先尝试从 Cookie 中提取
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('session_token=')) {
        return cookie.substring('session_token='.length);
      }
    }
  }

  // 其次尝试从 Authorization header 中提取
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring('Bearer '.length);
  }

  return null;
}

/**
 * 验证用户是否已登录
 * 返回用户信息或错误响应
 */
export async function requireAuth(request, env) {
  const sessionToken = extractSessionToken(request);

  if (!sessionToken) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ 
          error: '未登录',
          code: 'UNAUTHORIZED' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  const verification = await verifySession(sessionToken, env);

  if (!verification.valid) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ 
          error: verification.error || '会话无效',
          code: 'UNAUTHORIZED' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    };
  }

  return {
    authorized: true,
    user: verification.user,
    sessionToken: sessionToken
  };
}

/**
 * 可选的认证中间件
 * 如果已登录则返回用户信息，未登录也允许访问
 */
export async function optionalAuth(request, env) {
  const sessionToken = extractSessionToken(request);

  if (!sessionToken) {
    return {
      authorized: false,
      user: null
    };
  }

  const verification = await verifySession(sessionToken, env);

  if (!verification.valid) {
    return {
      authorized: false,
      user: null
    };
  }

  return {
    authorized: true,
    user: verification.user,
    sessionToken: sessionToken
  };
}

/**
 * 创建带有 session cookie 的响应
 */
export function createResponseWithSession(body, sessionToken, options = {}) {
  const maxAge = options.maxAge || 30 * 24 * 60 * 60; // 30 天
  const secure = options.secure !== false; // 默认使用 secure
  const sameSite = options.sameSite || 'Lax';

  const cookieValue = `session_token=${sessionToken}; Max-Age=${maxAge}; Path=/; ${secure ? 'Secure; ' : ''}HttpOnly; SameSite=${sameSite}`;

  return new Response(body, {
    status: options.status || 200,
    headers: {
      'Content-Type': options.contentType || 'application/json',
      'Set-Cookie': cookieValue,
      ...options.headers
    }
  });
}

/**
 * 创建清除 session cookie 的响应
 */
export function createResponseWithoutSession(body, options = {}) {
  const cookieValue = 'session_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax';

  return new Response(body, {
    status: options.status || 200,
    headers: {
      'Content-Type': options.contentType || 'application/json',
      'Set-Cookie': cookieValue,
      ...options.headers
    }
  });
}

