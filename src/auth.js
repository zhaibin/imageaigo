/**
 * 用户认证模块
 * 处理用户注册、登录、密码找回等功能
 */

import { sendCode, verifyCode } from './verification-code.js';
import { sendPasswordResetEmail } from './email-service.js';

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
 * 验证用户名格式
 * 3-20 个字符，只能包含字母、数字、下划线和连字符
 * 必须以字母或数字开头
 */
function isValidUsername(username) {
  if (!username || username.length < 3 || username.length > 20) {
    return false;
  }
  // 只能包含字母、数字、下划线和连字符
  const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
  return validPattern.test(username);
}

/**
 * 用户注册（使用验证码）
 */
export async function registerUser(email, password, username, verificationCode, env) {
  try {
    // 验证输入
    if (!email || !password || !username || !verificationCode) {
      return { success: false, error: 'Please fill in all fields' };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (!isValidPassword(password)) {
      return { success: false, error: 'Password must be at least 8 characters with letters and numbers' };
    }

    if (!isValidUsername(username)) {
      return { success: false, error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens' };
    }

    // 验证验证码
    const codeVerification = await verifyCode(email, verificationCode, 'register', env);
    if (!codeVerification.valid) {
      return { success: false, error: codeVerification.error };
    }

    // 检查邮箱是否已存在
    const existingEmail = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingEmail) {
      return { success: false, error: 'Email already registered' };
    }

    // 检查用户名是否已存在
    const existingUsername = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUsername) {
      return { success: false, error: 'Username already taken' };
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 插入新用户（邮箱已验证）
    const result = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, username, is_verified) VALUES (?, ?, ?, ?)'
    ).bind(email, passwordHash, username, 1).run();

    if (!result.success) {
      return { success: false, error: 'Registration failed, please try again later' };
    }

    return {
      success: true,
      message: 'Registration successful',
      userId: result.meta.last_row_id
    };

  } catch (error) {
    console.error('[Auth] Register error:', error);
    return { success: false, error: 'Registration failed: ' + error.message };
  }
}

/**
 * 用户登录（密码方式）
 * 支持邮箱或用户名登录
 */
export async function loginUser(emailOrUsername, password, env) {
  try {
    // 验证输入
    if (!emailOrUsername || !password) {
      return { success: false, error: 'Please provide email/username and password' };
    }

    // 判断是邮箱还是用户名
    const isEmail = emailOrUsername.includes('@');
    
    // 查找用户（支持邮箱或用户名）
    const user = await env.DB.prepare(
      isEmail 
        ? 'SELECT id, email, password_hash, username, is_verified FROM users WHERE email = ?'
        : 'SELECT id, email, password_hash, username, is_verified FROM users WHERE username = ?'
    ).bind(emailOrUsername).first();

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

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
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };

  } catch (error) {
    console.error('[Auth] Login error:', error);
    return { success: false, error: 'Login failed: ' + error.message };
  }
}

/**
 * 用户登录（验证码方式）
 * 支持邮箱或用户名（验证码发送到注册邮箱）
 */
export async function loginUserWithCode(emailOrUsername, verificationCode, env) {
  try {
    // 验证输入
    if (!emailOrUsername || !verificationCode) {
      return { success: false, error: 'Please provide email/username and verification code' };
    }

    // 判断是邮箱还是用户名
    const isEmail = emailOrUsername.includes('@');
    
    // 查找用户
    const user = await env.DB.prepare(
      isEmail 
        ? 'SELECT id, email, username, is_verified FROM users WHERE email = ?'
        : 'SELECT id, email, username, is_verified FROM users WHERE username = ?'
    ).bind(emailOrUsername).first();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // 验证验证码（使用用户的邮箱）
    const codeVerification = await verifyCode(user.email, verificationCode, 'login', env);
    if (!codeVerification.valid) {
      return { success: false, error: codeVerification.error };
    }

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
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    };

  } catch (error) {
    console.error('[Auth] Login with code error:', error);
    return { success: false, error: 'Login failed: ' + error.message };
  }
}

/**
 * 验证 session token
 */
export async function verifySession(sessionToken, env) {
  try {
    if (!sessionToken) {
      return { valid: false, error: 'No session token provided' };
    }

    // 查找 session
    const session = await env.DB.prepare(`
      SELECT s.user_id, s.expires_at, u.email, u.username
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ?
    `).bind(sessionToken).first();

    if (!session) {
      return { valid: false, error: 'Invalid session' };
    }

    // 检查是否过期
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // 删除过期的 session
      await env.DB.prepare(
        'DELETE FROM user_sessions WHERE session_token = ?'
      ).bind(sessionToken).run();
      
      return { valid: false, error: 'Session expired, please log in again' };
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
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * 用户登出
 */
export async function logoutUser(sessionToken, env) {
  try {
    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }

    // 删除 session
    await env.DB.prepare(
      'DELETE FROM user_sessions WHERE session_token = ?'
    ).bind(sessionToken).run();

    return { success: true, message: 'Logout successful' };

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}

/**
 * 请求密码重置（发送重置链接到邮箱）
 */
export async function requestPasswordReset(email, env) {
  try {
    if (!email) {
      return { success: false, error: 'Please enter your email' };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // 查找用户
    const user = await env.DB.prepare(
      'SELECT id, username FROM users WHERE email = ?'
    ).bind(email).first();

    // 为了安全，即使用户不存在也返回成功，但不发送邮件
    if (!user) {
      return { 
        success: true, 
        message: 'If this email is registered, you will receive a password reset link'
      };
    }

    // 生成重置 token
    const resetToken = generateToken(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小时

    // 保存重置 token
    await env.DB.prepare(
      'INSERT INTO password_resets (user_id, reset_token, expires_at) VALUES (?, ?, ?)'
    ).bind(user.id, resetToken, expiresAt.toISOString()).run();

    // 发送重置邮件
    const resetLink = `https://imageaigo.cc/reset-password?token=${resetToken}`;
    const emailResult = await sendPasswordResetEmail(email, resetLink, env);
    
    if (!emailResult.success) {
      return emailResult;
    }

    return {
      success: true,
      message: 'Password reset link sent to your email'
    };

  } catch (error) {
    console.error('[Auth] Request password reset error:', error);
    return { success: false, error: 'Request failed, please try again later' };
  }
}

/**
 * 重置密码（使用重置链接 token）
 */
export async function resetPassword(resetToken, newPassword, env) {
  try {
    if (!resetToken || !newPassword) {
      return { success: false, error: 'Please provide all required information' };
    }

    if (!isValidPassword(newPassword)) {
      return { success: false, error: 'Password must be at least 8 characters with letters and numbers' };
    }

    // 查找重置请求
    const resetRequest = await env.DB.prepare(`
      SELECT id, user_id, expires_at, used
      FROM password_resets
      WHERE reset_token = ?
    `).bind(resetToken).first();

    if (!resetRequest) {
      return { success: false, error: 'Invalid reset link' };
    }

    // 检查是否已使用
    if (resetRequest.used) {
      return { success: false, error: 'This reset link has already been used' };
    }

    // 检查是否过期
    const expiresAt = new Date(resetRequest.expires_at);
    if (expiresAt < new Date()) {
      return { success: false, error: 'Reset link expired, please request a new one' };
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
      message: 'Password reset successful, please log in with your new password'
    };

  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    return { success: false, error: 'Reset failed: ' + error.message };
  }
}

/**
 * 更改密码（已登录用户，使用验证码）
 */
export async function changePassword(userId, verificationCode, newPassword, env) {
  try {
    if (!verificationCode || !newPassword) {
      return { success: false, error: 'Please provide verification code and new password' };
    }

    if (!isValidPassword(newPassword)) {
      return { success: false, error: 'Password must be at least 8 characters with letters and numbers' };
    }

    // 获取用户邮箱
    const user = await env.DB.prepare(
      'SELECT email FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // 验证验证码
    const codeVerification = await verifyCode(user.email, verificationCode, 'change_password', env);
    if (!codeVerification.valid) {
      return { success: false, error: codeVerification.error };
    }

    // 哈希新密码
    const passwordHash = await hashPassword(newPassword);

    // 更新密码
    await env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(passwordHash, userId).run();

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    console.error('[Auth] Change password error:', error);
    return { success: false, error: 'Change failed: ' + error.message };
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
      return { success: false, error: 'User not found' };
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
    return { success: false, error: 'Failed to get user information' };
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

