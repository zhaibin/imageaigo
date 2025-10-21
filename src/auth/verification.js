/**
 * 验证码管理模块
 * 处理验证码的生成、存储、验证和清理
 */

import { sendVerificationCode } from './email.js';

/**
 * 生成 6 位数字验证码
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 发送验证码
 * @param {string} email - 收件人邮箱
 * @param {string} purpose - 用途：register, login, reset_password, change_password
 * @param {object} env - 环境变量
 * @param {number} userId - 用户ID（可选，用于 change_password）
 */
export async function sendCode(emailOrUsername, purpose, env, userId = null) {
  try {
    let email = emailOrUsername;
    
    // 如果不是邮箱格式，当作用户名处理，查找对应的邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailOrUsername)) {
      // 根据用户名查找邮箱
      const user = await env.DB.prepare(
        'SELECT email FROM users WHERE username = ?'
      ).bind(emailOrUsername).first();
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      email = user.email;
    } else {
      // 验证邮箱格式
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' };
      }
    }

    // 检查是否在短时间内重复发送（防止滥用）
    const recentCode = await env.DB.prepare(`
      SELECT created_at FROM verification_codes 
      WHERE email = ? AND purpose = ? AND created_at > datetime('now', '-1 minute')
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, purpose).first();

    if (recentCode) {
      return { 
        success: false, 
        error: 'Please wait 1 minute before requesting another code' 
      };
    }

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟后过期

    // 保存验证码到数据库
    const result = await env.DB.prepare(`
      INSERT INTO verification_codes (email, code, purpose, user_id, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(email, code, purpose, userId, expiresAt.toISOString()).run();

    if (!result.success) {
      return { success: false, error: '保存验证码失败' };
    }

    // 发送邮件
    const emailResult = await sendVerificationCode(email, code, purpose, env);
    
    if (!emailResult.success) {
      // 如果邮件发送失败，删除刚才保存的验证码
      await env.DB.prepare(
        'DELETE FROM verification_codes WHERE id = ?'
      ).bind(result.meta.last_row_id).run();
      
      return emailResult;
    }

    console.log(`[VerificationCode] Sent ${purpose} code to ${email}`);
    
    return {
      success: true,
      message: 'Verification code sent to your email',
      codeId: result.meta.last_row_id
    };

  } catch (error) {
    console.error('[VerificationCode] Send error:', error);
    return { 
      success: false, 
      error: 'Failed to send verification code: ' + error.message 
    };
  }
}

/**
 * 验证验证码
 * @param {string} email - 邮箱
 * @param {string} code - 验证码
 * @param {string} purpose - 用途
 * @param {object} env - 环境变量
 * @param {boolean} markAsUsed - 是否标记为已使用（默认 true）
 */
export async function verifyCode(email, code, purpose, env, markAsUsed = true) {
  try {
    if (!email || !code || !purpose) {
      return { 
        valid: false, 
        error: 'Please provide complete verification information' 
      };
    }

    // 查找验证码
    const record = await env.DB.prepare(`
      SELECT id, code, expires_at, used, user_id
      FROM verification_codes
      WHERE email = ? AND purpose = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email, purpose).first();

    if (!record) {
      return { 
        valid: false, 
        error: 'Verification code not found or expired' 
      };
    }

    // 检查是否已使用
    if (record.used) {
      return { 
        valid: false, 
        error: 'Verification code already used' 
      };
    }

    // 检查是否过期
    const expiresAt = new Date(record.expires_at);
    if (expiresAt < new Date()) {
      return { 
        valid: false, 
        error: 'Verification code expired, please request a new one' 
      };
    }

    // 验证码匹配
    if (record.code !== code) {
      // 防止暴力破解：记录失败尝试
      const failKey = `verify_fail:${email}:${purpose}`;
      if (env.CACHE) {
        const failCount = await env.CACHE.get(failKey);
        const fails = failCount ? parseInt(failCount) + 1 : 1;
        
        // 超过5次失败，锁定30分钟
        if (fails >= 5) {
          return {
            valid: false,
            error: 'Too many failed attempts. Please request a new code.'
          };
        }
        
        await env.CACHE.put(failKey, fails.toString(), { expirationTtl: 1800 });
      }
      
      return { 
        valid: false, 
        error: 'Incorrect verification code' 
      };
    }

    // 标记为已使用
    if (markAsUsed) {
      await env.DB.prepare(
        'UPDATE verification_codes SET used = 1 WHERE id = ?'
      ).bind(record.id).run();
    }

    // 清除失败记录
    const failKey = `verify_fail:${email}:${purpose}`;
    if (env.CACHE) {
      await env.CACHE.delete(failKey);
    }

    console.log(`[VerificationCode] Verified ${purpose} code for ${email}`);

    return {
      valid: true,
      userId: record.user_id,
      codeId: record.id
    };

  } catch (error) {
    console.error('[VerificationCode] Verify error:', error);
    return { 
      valid: false, 
      error: 'Verification failed: ' + error.message 
    };
  }
}

/**
 * 清理过期的验证码
 */
export async function cleanupExpiredCodes(env) {
  try {
    const now = new Date().toISOString();

    const result = await env.DB.prepare(
      'DELETE FROM verification_codes WHERE expires_at < ? OR used = 1'
    ).bind(now).run();

    console.log('[VerificationCode] Cleanup completed');
    return { 
      success: true, 
      deletedCount: result.meta.changes 
    };

  } catch (error) {
    console.error('[VerificationCode] Cleanup error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * 撤销验证码（用于取消操作）
 */
export async function revokeCode(email, purpose, env) {
  try {
    await env.DB.prepare(`
      UPDATE verification_codes 
      SET used = 1 
      WHERE email = ? AND purpose = ? AND used = 0
    `).bind(email, purpose).run();

    return { success: true };

  } catch (error) {
    console.error('[VerificationCode] Revoke error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * 获取验证码统计信息（管理功能）
 */
export async function getCodeStats(env) {
  try {
    const stats = await env.DB.prepare(`
      SELECT 
        purpose,
        COUNT(*) as total,
        SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used_count,
        SUM(CASE WHEN expires_at < datetime('now') THEN 1 ELSE 0 END) as expired_count
      FROM verification_codes
      WHERE created_at > datetime('now', '-7 days')
      GROUP BY purpose
    `).all();

    return {
      success: true,
      stats: stats.results
    };

  } catch (error) {
    console.error('[VerificationCode] Get stats error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

