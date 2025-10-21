/**
 * 后台用户管理 API 处理函数
 */

import { handleCORS } from '../../lib/utils.js';
import { verifyAdminToken } from '../../index.js';

/**
 * 获取用户列表（支持搜索和分页）
 */
export async function handleAdminUsers(request, env) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query, countQuery;
    let params = [];
    let countParams = [];

    if (search) {
      const searchPattern = `%${search}%`;
      query = `
        SELECT id, username, display_name, email, avatar_url, bio, created_at, last_login, is_random,
               (SELECT COUNT(*) FROM images WHERE user_id = users.id) as image_count
        FROM users
        WHERE username LIKE ? OR email LIKE ? OR display_name LIKE ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [searchPattern, searchPattern, searchPattern, limit, offset];

      countQuery = `
        SELECT COUNT(*) as total FROM users
        WHERE username LIKE ? OR email LIKE ? OR display_name LIKE ?
      `;
      countParams = [searchPattern, searchPattern, searchPattern];
    } else {
      query = `
        SELECT id, username, display_name, email, avatar_url, bio, created_at, last_login, is_random,
               (SELECT COUNT(*) FROM images WHERE user_id = users.id) as image_count
        FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [limit, offset];

      countQuery = `SELECT COUNT(*) as total FROM users`;
      countParams = [];
    }

    const users = await env.DB.prepare(query).bind(...params).all();
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.total || 0;

    return new Response(JSON.stringify({
      success: true,
      users: users.results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Admin] Get users error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get users',
      details: error.message 
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 获取单个用户详情
 */
export async function handleAdminUserDetail(request, env, username) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    const user = await env.DB.prepare(`
      SELECT id, username, display_name, email, avatar_url, bio, 
             is_verified, created_at, last_login
      FROM users
      WHERE username = ?
    `).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }

    // 获取用户的图片统计
    const imageStats = await env.DB.prepare(`
      SELECT COUNT(*) as total_images FROM images WHERE user_id = ?
    `).bind(user.id).first();

    // 获取用户最近的图片
    const recentImages = await env.DB.prepare(`
      SELECT id, slug, description, image_url, created_at
      FROM images
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(user.id).all();

    return new Response(JSON.stringify({
      success: true,
      user: {
        ...user,
        totalImages: imageStats?.total_images || 0,
        recentImages: recentImages.results
      }
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Admin] Get user detail error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get user details',
      details: error.message 
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 更新用户信息
 */
export async function handleAdminUpdateUser(request, env, username) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { username: newUsername, display_name, email, avatar_url, bio, is_verified } = await request.json();

    // 检查用户是否存在
    const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }

    // 如果修改了用户名或邮箱，检查是否重复
    if (newUsername && newUsername !== username) {
      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ? AND id != ?'
      ).bind(newUsername, user.id).first();
      if (existing) {
        return new Response(JSON.stringify({ error: '用户名已被使用' }), {
          status: 400,
          headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
        });
      }
    }

    if (email) {
      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).bind(email, user.id).first();
      if (existing) {
        return new Response(JSON.stringify({ error: '邮箱已被使用' }), {
          status: 400,
          headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
        });
      }
    }

    // 构建更新语句
    const updates = [];
    const values = [];

    if (newUsername !== undefined && newUsername !== username) {
      updates.push('username = ?');
      values.push(newUsername);
    }
    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (is_verified !== undefined) {
      updates.push('is_verified = ?');
      values.push(is_verified ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }

    values.push(user.id);
    
    await env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: '用户信息更新成功'
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Admin] Update user error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update user',
      details: error.message 
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 删除用户
 */
export async function handleAdminDeleteUser(request, env, username) {
  if (!await verifyAdminToken(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    // 检查用户是否存在
    const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
      });
    }

    // 删除用户（级联删除相关数据）
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

    return new Response(JSON.stringify({
      success: true,
      message: '用户删除成功'
    }), {
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Admin] Delete user error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete user',
      details: error.message 
    }), {
      status: 500,
      headers: { ...handleCORS().headers, 'Content-Type': 'application/json' }
    });
  }
}

