/**
 * 暴力破解保护模块
 * 防止登录、注册等操作的暴力攻击
 */

/**
 * 验证 Cloudflare Turnstile token
 * @param {string} token - Turnstile token
 * @param {string} remoteIP - 用户IP
 * @param {object} env - 环境变量
 */
export async function verifyTurnstile(token, remoteIP, env) {
  try {
    const secretKey = env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn('[Turnstile] Secret key not configured, skipping verification');
      return { success: true, skipped: true };
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', remoteIP);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('[Turnstile] Verification failed:', result['error-codes']);
      return {
        success: false,
        error: 'Human verification failed. Please try again.',
        errorCodes: result['error-codes']
      };
    }

    console.log('[Turnstile] Verification successful');
    return { success: true };

  } catch (error) {
    console.error('[Turnstile] Verification error:', error);
    // 如果验证服务出错，允许通过但记录日志
    return { success: true, error: error.message };
  }
}

/**
 * 记录登录失败
 * @param {string} identifier - 邮箱或用户名
 * @param {string} ip - IP地址
 * @param {object} env - 环境变量
 */
export async function recordLoginFailure(identifier, ip, env) {
  try {
    if (!env.CACHE) return { failures: 0 };

    const identifierKey = `login_fail:${identifier}`;
    const ipKey = `login_fail_ip:${ip}`;

    // 记录失败次数
    const identifierFails = await env.CACHE.get(identifierKey);
    const ipFails = await env.CACHE.get(ipKey);

    const identifierCount = identifierFails ? parseInt(identifierFails) + 1 : 1;
    const ipCount = ipFails ? parseInt(ipFails) + 1 : 1;

    // 失败记录保存30分钟
    await env.CACHE.put(identifierKey, identifierCount.toString(), { expirationTtl: 1800 });
    await env.CACHE.put(ipKey, ipCount.toString(), { expirationTtl: 1800 });

    console.log(`[BruteForce] Login failure recorded: ${identifier} (${identifierCount}), IP: ${ip} (${ipCount})`);

    return {
      identifierFailures: identifierCount,
      ipFailures: ipCount
    };

  } catch (error) {
    console.error('[BruteForce] Record failure error:', error);
    return { failures: 0 };
  }
}

/**
 * 清除登录失败记录
 * @param {string} identifier - 邮箱或用户名
 * @param {string} ip - IP地址
 * @param {object} env - 环境变量
 */
export async function clearLoginFailures(identifier, ip, env) {
  try {
    if (!env.CACHE) return;

    const identifierKey = `login_fail:${identifier}`;
    const ipKey = `login_fail_ip:${ip}`;

    await env.CACHE.delete(identifierKey);
    await env.CACHE.delete(ipKey);

    console.log(`[BruteForce] Login failures cleared for ${identifier}`);

  } catch (error) {
    console.error('[BruteForce] Clear failures error:', error);
  }
}

/**
 * 检查是否需要人机验证
 * @param {string} identifier - 邮箱或用户名
 * @param {string} ip - IP地址
 * @param {object} env - 环境变量
 */
export async function shouldRequireCaptcha(identifier, ip, env) {
  try {
    if (!env.CACHE) return false;

    const identifierKey = `login_fail:${identifier}`;
    const ipKey = `login_fail_ip:${ip}`;

    const identifierFails = await env.CACHE.get(identifierKey);
    const ipFails = await env.CACHE.get(ipKey);

    const identifierCount = identifierFails ? parseInt(identifierFails) : 0;
    const ipCount = ipFails ? parseInt(ipFails) : 0;

    // 2次失败后需要验证
    const needsCaptcha = identifierCount >= 2 || ipCount >= 5;

    if (needsCaptcha) {
      console.log(`[BruteForce] CAPTCHA required: ${identifier} (${identifierCount} fails), IP (${ipCount} fails)`);
    }

    return needsCaptcha;

  } catch (error) {
    console.error('[BruteForce] Check CAPTCHA error:', error);
    return false;
  }
}

/**
 * 计算登录延迟时间（渐进式延迟）
 * @param {number} failureCount - 失败次数
 */
export function calculateLoginDelay(failureCount) {
  if (failureCount <= 1) return 0;
  if (failureCount === 2) return 2000;   // 2秒
  if (failureCount === 3) return 5000;   // 5秒
  if (failureCount === 4) return 10000;  // 10秒
  if (failureCount >= 5) return 30000;   // 30秒

  return Math.min(failureCount * 5000, 60000); // 最多60秒
}

/**
 * 检查是否被锁定
 * @param {string} identifier - 邮箱或用户名
 * @param {string} ip - IP地址
 * @param {object} env - 环境变量
 */
export async function isLockedOut(identifier, ip, env) {
  try {
    if (!env.CACHE) return { locked: false };

    const lockKey = `login_lock:${identifier}`;
    const ipLockKey = `login_lock_ip:${ip}`;

    const locked = await env.CACHE.get(lockKey);
    const ipLocked = await env.CACHE.get(ipLockKey);

    if (locked) {
      const expiresAt = parseInt(locked);
      if (Date.now() < expiresAt) {
        const remainingSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
        return {
          locked: true,
          reason: 'account',
          remainingSeconds,
          message: `Account temporarily locked due to multiple failed attempts. Try again in ${remainingSeconds} seconds.`
        };
      }
    }

    if (ipLocked) {
      const expiresAt = parseInt(ipLocked);
      if (Date.now() < expiresAt) {
        const remainingSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
        return {
          locked: true,
          reason: 'ip',
          remainingSeconds,
          message: `Too many failed login attempts from your IP. Try again in ${remainingSeconds} seconds.`
        };
      }
    }

    return { locked: false };

  } catch (error) {
    console.error('[BruteForce] Check lockout error:', error);
    return { locked: false };
  }
}

/**
 * 锁定账户或IP
 * @param {string} identifier - 邮箱或用户名
 * @param {string} ip - IP地址
 * @param {number} duration - 锁定时长（秒）
 * @param {object} env - 环境变量
 */
export async function lockAccount(identifier, ip, duration, env) {
  try {
    if (!env.CACHE) return;

    const lockKey = `login_lock:${identifier}`;
    const ipLockKey = `login_lock_ip:${ip}`;
    const expiresAt = Date.now() + (duration * 1000);

    await env.CACHE.put(lockKey, expiresAt.toString(), { expirationTtl: duration });
    await env.CACHE.put(ipLockKey, expiresAt.toString(), { expirationTtl: duration });

    console.log(`[BruteForce] Account locked: ${identifier}, IP: ${ip} for ${duration}s`);

  } catch (error) {
    console.error('[BruteForce] Lock account error:', error);
  }
}

/**
 * 获取失败统计
 * @param {string} identifier - 邮箱或用户名
 * @param {string} ip - IP地址
 * @param {object} env - 环境变量
 */
export async function getFailureStats(identifier, ip, env) {
  try {
    if (!env.CACHE) return { identifierFailures: 0, ipFailures: 0 };

    const identifierKey = `login_fail:${identifier}`;
    const ipKey = `login_fail_ip:${ip}`;

    const identifierFails = await env.CACHE.get(identifierKey);
    const ipFails = await env.CACHE.get(ipKey);

    return {
      identifierFailures: identifierFails ? parseInt(identifierFails) : 0,
      ipFailures: ipFails ? parseInt(ipFails) : 0
    };

  } catch (error) {
    console.error('[BruteForce] Get stats error:', error);
    return { identifierFailures: 0, ipFailures: 0 };
  }
}

