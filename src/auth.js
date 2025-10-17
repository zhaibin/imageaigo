/**
 * 用户认证模块
 * 处理用户注册、登录、密码找回等功能
 */

/**
 * 密码哈希函数（使用 Web Crypto API）
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * 验证密码
 */
async function verifyPassword(password, hashedPassword) {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

/**
 * 生成随机 token
 */
function generateToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证 email 格式
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * 至少 8 个字符，包含字母和数字
 */
function isValidPassword(password) {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * 用户注册
 */
export async function registerUser(email, password, username, env) {
  try {
    // 验证输入
    if (!email || !password || !username) {
      return { success: false, error: '请填写所有字段' };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: '邮箱格式不正确' };
    }

    if (!isValidPassword(password)) {
      return { success: false, error: '密码至少需要 8 个字符，包含字母和数字' };
    }

    if (username.length < 3 || username.length > 20) {
      return { success: false, error: '用户名长度应在 3-20 个字符之间' };
    }

    // 检查邮箱是否已存在
    const existingEmail = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingEmail) {
      return { success: false, error: '该邮箱已被注册' };
    }

    // 检查用户名是否已存在
    const existingUsername = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUsername) {
      return { success: false, error: '该用户名已被使用' };
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 生成验证 token（用于邮箱验证，当前版本不实现邮件发送）
    const verificationToken = generateToken();

    // 插入新用户
    const result = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, username, verification_token, is_verified) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, passwordHash, username, verificationToken, 1).run(); // 暂时自动验证

    if (!result.success) {
      return { success: false, error: '注册失败，请稍后重试' };
    }

    return {
      success: true,
      message: '注册成功',
      userId: result.meta.last_row_id
    };

  } catch (error) {
    console.error('[Auth] Register error:', error);
    return { success: false, error: '注册失败：' + error.message };
  }
}

/**
 * 用户登录
 */
export async function loginUser(email, password, env) {
  try {
    // 验证输入
    if (!email || !password) {
      return { success: false, error: '请填写邮箱和密码' };
    }

    // 查找用户
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, username, is_verified FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return { success: false, error: '邮箱或密码错误' };
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: '邮箱或密码错误' };
    }

    // 检查账号是否已验证（当前版本跳过）
    // if (!user.is_verified) {
    //   return { success: false, error: '请先验证您的邮箱' };
    // }

    // 生成 session token
    const sessionToken = generateToken(48);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 天

    // 保存 session
    await env.DB.prepare(
      'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, sessionToken, expiresAt.toISOString()).run();

    // 更新最后登录时间
    await env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    return {
      success: true,
      message: '登录成功',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };

  } catch (error) {
    console.error('[Auth] Login error:', error);
    return { success: false, error: '登录失败：' + error.message };
  }
}

/**
 * 验证 session token
 */
export async function verifySession(sessionToken, env) {
  try {
    if (!sessionToken) {
      return { valid: false, error: '未提供会话令牌' };
    }

    // 查找 session
    const session = await env.DB.prepare(`
      SELECT s.user_id, s.expires_at, u.email, u.username
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ?
    `).bind(sessionToken).first();

    if (!session) {
      return { valid: false, error: '无效的会话' };
    }

    // 检查是否过期
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // 删除过期的 session
      await env.DB.prepare(
        'DELETE FROM user_sessions WHERE session_token = ?'
      ).bind(sessionToken).run();
      
      return { valid: false, error: '会话已过期，请重新登录' };
    }

    return {
      valid: true,
      user: {
        id: session.user_id,
        email: session.email,
        username: session.username
      }
    };

  } catch (error) {
    console.error('[Auth] Verify session error:', error);
    return { valid: false, error: '验证失败' };
  }
}

/**
 * 用户登出
 */
export async function logoutUser(sessionToken, env) {
  try {
    if (!sessionToken) {
      return { success: false, error: '未提供会话令牌' };
    }

    // 删除 session
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE session_token = ?'
    ).bind(sessionToken).run();

    return { success: true, message: '登出成功' };

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: '登出失败' };
  }
}

/**
 * 请求密码重置
 */
export async function requestPasswordReset(email, env) {
  try {
    if (!email) {
      return { success: false, error: '请输入邮箱' };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: '邮箱格式不正确' };
    }

    // 查找用户
    const user = await env.DB.prepare(
      'SELECT id, username FROM users WHERE email = ?'
    ).bind(email).first();

    // 为了安全，即使用户不存在也返回成功
    if (!user) {
      return { 
        success: true, 
        message: '如果该邮箱已注册，您将收到密码重置链接'
      };
    }

    // 生成重置 token
    const resetToken = generateToken(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小时

    // 保存重置 token
    await env.DB.prepare(
      'INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, resetToken, expiresAt.toISOString()).run();

    // TODO: 发送重置邮件
    // 在实际应用中，这里应该发送包含重置链接的邮件
    // const resetLink = `https://yourdomain.com/reset-password?token=${resetToken}`;

    return {
      success: true,
      message: '密码重置链接已发送到您的邮箱',
      // 开发环境下返回 token（生产环境应删除）
      resetToken: resetToken
    };

  } catch (error) {
    console.error('[Auth] Request password reset error:', error);
    return { success: false, error: '请求失败，请稍后重试' };
  }
}

/**
 * 重置密码
 */
export async function resetPassword(resetToken, newPassword, env) {
  try {
    if (!resetToken || !newPassword) {
      return { success: false, error: '请提供所有必要信息' };
    }

    if (!isValidPassword(newPassword)) {
      return { success: false, error: '密码至少需要 8 个字符，包含字母和数字' };
    }

    // 查找重置请求
    const resetRequest = await env.DB.prepare(`
      SELECT id, user_id, expires_at, used
      FROM password_resets
      WHERE reset_token = ?
    `).bind(resetToken).first();

    if (!resetRequest) {
      return { success: false, error: '无效的重置链接' };
    }

    // 检查是否已使用
    if (resetRequest.used) {
      return { success: false, error: '该重置链接已被使用' };
    }

    // 检查是否过期
    const expiresAt = new Date(resetRequest.expires_at);
    if (expiresAt < new Date()) {
      return { success: false, error: '重置链接已过期，请重新请求' };
    }

    // 哈希新密码
    const passwordHash = await hashPassword(newPassword);

    // 更新密码
    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(passwordHash, resetRequest.user_id).run();

    // 标记 token 已使用
    await env.DB.prepare(
      'UPDATE password_resets SET used = 1 WHERE id = ?'
    ).bind(resetRequest.id).run();

    // 删除该用户的所有 session（强制重新登录）
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE user_id = ?'
    ).bind(resetRequest.user_id).run();

    return {
      success: true,
      message: '密码重置成功，请使用新密码登录'
    };

  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    return { success: false, error: '重置失败：' + error.message };
  }
}

/**
 * 更改密码（已登录用户）
 */
export async function changePassword(userId, oldPassword, newPassword, env) {
  try {
    if (!oldPassword || !newPassword) {
      return { success: false, error: '请提供旧密码和新密码' };
    }

    if (!isValidPassword(newPassword)) {
      return { success: false, error: '新密码至少需要 8 个字符，包含字母和数字' };
    }

    // 获取用户当前密码
    const user = await env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, user.password_hash);
    if (!isValid) {
      return { success: false, error: '旧密码不正确' };
    }

    // 哈希新密码
    const passwordHash = await hashPassword(newPassword);

    // 更新密码
    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(passwordHash, userId).run();

    return {
      success: true,
      message: '密码修改成功'
    };

  } catch (error) {
    console.error('[Auth] Change password error:', error);
    return { success: false, error: '修改失败：' + error.message };
  }
}

/**
 * 获取用户信息
 */
export async function getUserInfo(userId, env) {
  try {
    const user = await env.DB.prepare(`
      SELECT id, email, username, created_at, last_login
      FROM users
      WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    };

  } catch (error) {
    console.error('[Auth] Get user info error:', error);
    return { success: false, error: '获取用户信息失败' };
  }
}

/**
 * 清理过期的 sessions 和 password resets
 */
export async function cleanupExpiredTokens(env) {
  try {
    const now = new Date().toISOString();

    // 删除过期的 sessions
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE expires_at < ?'
    ).bind(now).run();

    // 删除过期的密码重置请求
    await env.DB.prepare(
      'DELETE FROM password_resets WHERE expires_at < ? OR used = 1'
    ).bind(now).run();

    console.log('[Auth] Cleanup completed');
    return { success: true };

  } catch (error) {
    console.error('[Auth] Cleanup error:', error);
    return { success: false, error: error.message };
  }
}

