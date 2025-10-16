/**
 * 数据验证和鲁棒性增强模块
 * 提供输入验证、错误处理和安全检查
 */

/**
 * 验证结果类
 */
export class ValidationResult {
  constructor(valid, errors = []) {
    this.valid = valid;
    this.errors = errors;
  }

  get isValid() {
    return this.valid;
  }

  get errorMessage() {
    return this.errors.join('; ');
  }

  addError(error) {
    this.errors.push(error);
    this.valid = false;
  }
}

/**
 * 图片验证器
 */
export class ImageValidator {
  /**
   * 验证图片文件
   * @param {File|ArrayBuffer} file - 图片文件或数据
   * @param {Object} options - 验证选项
   * @returns {ValidationResult}
   */
  static validateImageFile(file, options = {}) {
    const {
      maxSize = 20 * 1024 * 1024, // 20MB
      minSize = 1024, // 1KB
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      requireDimensions = false
    } = options;

    const result = new ValidationResult(true);

    // 检查文件是否存在
    if (!file) {
      result.addError('未提供图片文件');
      return result;
    }

    // 检查文件大小
    const fileSize = file.size || file.byteLength || 0;
    
    if (fileSize === 0) {
      result.addError('图片文件为空');
      return result;
    }

    if (fileSize < minSize) {
      result.addError(`图片文件太小（最小 ${(minSize / 1024).toFixed(0)}KB）`);
    }

    if (fileSize > maxSize) {
      result.addError(`图片文件过大（最大 ${(maxSize / 1024 / 1024).toFixed(0)}MB）`);
    }

    // 检查文件类型（如果是File对象）
    if (file.type && !allowedTypes.includes(file.type)) {
      result.addError(`不支持的图片格式（支持: ${allowedTypes.join(', ')}）`);
    }

    return result;
  }

  /**
   * 验证图片URL
   * @param {string} url - 图片URL
   * @returns {ValidationResult}
   */
  static validateImageUrl(url) {
    const result = new ValidationResult(true);

    if (!url || typeof url !== 'string') {
      result.addError('无效的图片URL');
      return result;
    }

    // 检查URL格式
    try {
      const parsed = new URL(url);
      
      // 检查协议
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        result.addError('图片URL必须使用HTTP或HTTPS协议');
      }

      // 检查扩展名或域名
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const path = parsed.pathname.toLowerCase();
      const validDomains = ['imgur.com', 'cloudinary.com', 'unsplash.com', 'imageaigo.cc'];

      const hasValidExtension = validExtensions.some(ext => path.endsWith(ext));
      const hasValidDomain = validDomains.some(domain => parsed.hostname.includes(domain));

      if (!hasValidExtension && !hasValidDomain) {
        result.addError('URL似乎不是有效的图片链接');
      }

    } catch (error) {
      result.addError('无效的URL格式');
    }

    return result;
  }

  /**
   * 验证图片尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} options - 验证选项
   * @returns {ValidationResult}
   */
  static validateDimensions(width, height, options = {}) {
    const {
      minWidth = 100,
      minHeight = 100,
      maxWidth = 10000,
      maxHeight = 10000,
      maxAspectRatio = 10
    } = options;

    const result = new ValidationResult(true);

    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      result.addError('图片尺寸必须是整数');
      return result;
    }

    if (width < minWidth || height < minHeight) {
      result.addError(`图片尺寸太小（最小 ${minWidth}x${minHeight}）`);
    }

    if (width > maxWidth || height > maxHeight) {
      result.addError(`图片尺寸过大（最大 ${maxWidth}x${maxHeight}）`);
    }

    // 检查宽高比
    const aspectRatio = Math.max(width / height, height / width);
    if (aspectRatio > maxAspectRatio) {
      result.addError(`图片宽高比过大（最大 ${maxAspectRatio}:1）`);
    }

    return result;
  }
}

/**
 * 输入验证器
 */
export class InputValidator {
  /**
   * 验证分页参数
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Object} 规范化的分页参数
   */
  static validatePagination(page, limit) {
    const normalizedPage = Math.max(1, parseInt(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      offset: (normalizedPage - 1) * normalizedLimit
    };
  }

  /**
   * 验证搜索查询
   * @param {string} query - 搜索查询
   * @returns {ValidationResult}
   */
  static validateSearchQuery(query) {
    const result = new ValidationResult(true);

    if (!query || typeof query !== 'string') {
      result.addError('搜索查询必须是字符串');
      return result;
    }

    const trimmed = query.trim();

    if (trimmed.length === 0) {
      result.addError('搜索查询不能为空');
      return result;
    }

    if (trimmed.length < 2) {
      result.addError('搜索查询至少需要2个字符');
    }

    if (trimmed.length > 200) {
      result.addError('搜索查询过长（最大200字符）');
    }

    // 检查是否包含SQL注入字符
    const sqlInjectionPatterns = [
      /(\bor\b.*=.*)/i,
      /(\band\b.*=.*)/i,
      /(union.*select)/i,
      /(drop\s+table)/i,
      /(insert\s+into)/i,
      /(delete\s+from)/i
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(trimmed)) {
        result.addError('搜索查询包含非法字符');
        break;
      }
    }

    return result;
  }

  /**
   * 验证ID参数
   * @param {any} id - ID值
   * @param {string} fieldName - 字段名称
   * @returns {ValidationResult}
   */
  static validateId(id, fieldName = 'ID') {
    const result = new ValidationResult(true);

    const numId = parseInt(id);

    if (isNaN(numId) || numId <= 0) {
      result.addError(`${fieldName}必须是正整数`);
    }

    if (numId > 2147483647) { // INT32_MAX
      result.addError(`${fieldName}超出范围`);
    }

    return result;
  }

  /**
   * 验证slug参数
   * @param {string} slug - Slug值
   * @returns {ValidationResult}
   */
  static validateSlug(slug) {
    const result = new ValidationResult(true);

    if (!slug || typeof slug !== 'string') {
      result.addError('Slug必须是字符串');
      return result;
    }

    const trimmed = slug.trim();

    if (trimmed.length === 0) {
      result.addError('Slug不能为空');
      return result;
    }

    if (trimmed.length > 200) {
      result.addError('Slug过长（最大200字符）');
    }

    // 检查slug格式（只允许字母、数字、连字符）
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      result.addError('Slug只能包含小写字母、数字和连字符');
    }

    return result;
  }

  /**
   * 清理和规范化字符串输入
   * @param {string} input - 输入字符串
   * @param {Object} options - 选项
   * @returns {string} 清理后的字符串
   */
  static sanitizeString(input, options = {}) {
    const {
      maxLength = 1000,
      allowHtml = false,
      trim = true
    } = options;

    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    if (trim) {
      sanitized = sanitized.trim();
    }

    if (!allowHtml) {
      // 移除HTML标签
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // 限制长度
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }
}

/**
 * 速率限制检查器
 */
export class RateLimiter {
  /**
   * 检查速率限制
   * @param {Request} request - 请求对象
   * @param {KVNamespace} cache - KV存储
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 速率限制结果
   */
  static async checkRateLimit(request, cache, options = {}) {
    const {
      maxRequests = 10,
      windowSeconds = 3600,
      keyPrefix = 'ratelimit:'
    } = options;

    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    
    const rateLimitKey = `${keyPrefix}${ip}`;

    try {
      // 获取当前计数
      const current = await cache.get(rateLimitKey);
      const count = current ? parseInt(current) : 0;

      // 检查是否超限
      if (count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + windowSeconds * 1000,
          message: `速率限制：每${windowSeconds / 3600}小时最多${maxRequests}次请求`
        };
      }

      // 增加计数
      await cache.put(rateLimitKey, (count + 1).toString(), { 
        expirationTtl: windowSeconds 
      });

      return {
        allowed: true,
        remaining: maxRequests - count - 1,
        resetAt: Date.now() + windowSeconds * 1000
      };

    } catch (error) {
      console.error('[RateLimiter] Error:', error);
      // 出错时允许请求通过
      return {
        allowed: true,
        remaining: maxRequests,
        error: error.message
      };
    }
  }

  /**
   * 检测可疑行为
   * @param {Request} request - 请求对象
   * @returns {Object} 检测结果
   */
  static detectSuspiciousBehavior(request) {
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';

    const suspicious = {
      isBot: false,
      isSuspicious: false,
      reasons: []
    };

    // 检测机器人
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 
      'curl', 'wget', 'python-requests', 'java',
      'headless', 'phantom', 'selenium'
    ];

    const botMatch = botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );

    if (botMatch) {
      // 允许合法爬虫
      const legitimateBots = ['googlebot', 'bingbot', 'slackbot', 'twitterbot'];
      const isLegitimate = legitimateBots.some(bot => 
        userAgent.toLowerCase().includes(bot)
      );

      if (!isLegitimate) {
        suspicious.isBot = true;
        suspicious.isSuspicious = true;
        suspicious.reasons.push('检测到机器人用户代理');
      }
    }

    // 检测缺少必要头部
    if (!userAgent || userAgent.length < 10) {
      suspicious.isSuspicious = true;
      suspicious.reasons.push('缺少或无效的用户代理');
    }

    // 检测空Referer（API直接调用）
    if (!referer && !userAgent.includes('Mozilla')) {
      suspicious.isSuspicious = true;
      suspicious.reasons.push('缺少Referer且非浏览器访问');
    }

    return suspicious;
  }
}

/**
 * 数据库查询安全检查
 */
export class DatabaseSecurity {
  /**
   * 验证SQL参数
   * @param {any} param - 参数值
   * @param {string} paramType - 参数类型（string|number|boolean）
   * @returns {ValidationResult}
   */
  static validateParameter(param, paramType) {
    const result = new ValidationResult(true);

    if (param === null || param === undefined) {
      result.addError('参数不能为null或undefined');
      return result;
    }

    switch (paramType) {
      case 'string':
        if (typeof param !== 'string') {
          result.addError('参数必须是字符串');
        }
        // 检查字符串长度
        if (param.length > 10000) {
          result.addError('字符串参数过长');
        }
        break;

      case 'number':
        if (typeof param !== 'number' && isNaN(Number(param))) {
          result.addError('参数必须是数字');
        }
        break;

      case 'boolean':
        if (typeof param !== 'boolean') {
          result.addError('参数必须是布尔值');
        }
        break;

      default:
        result.addError('未知的参数类型');
    }

    return result;
  }

  /**
   * 清理用于数据库的字符串
   * @param {string} input - 输入字符串
   * @returns {string} 清理后的字符串
   */
  static sanitizeForDatabase(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // D1使用参数化查询，但我们仍然清理输入
    return input
      .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
      .trim()
      .substring(0, 10000); // 限制长度
  }
}

/**
 * 错误处理工具
 */
export class ErrorHandler {
  /**
   * 标准化错误响应
   * @param {Error} error - 错误对象
   * @param {string} requestId - 请求ID
   * @returns {Object} 错误响应对象
   */
  static formatErrorResponse(error, requestId = null) {
    const response = {
      error: error.message || '未知错误',
      timestamp: new Date().toISOString()
    };

    if (requestId) {
      response.requestId = requestId;
    }

    // 不要在生产环境中暴露堆栈信息
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  /**
   * 确定HTTP状态码
   * @param {Error} error - 错误对象
   * @returns {number} HTTP状态码
   */
  static getHttpStatusCode(error) {
    const message = error.message.toLowerCase();

    if (message.includes('not found')) return 404;
    if (message.includes('unauthorized') || message.includes('forbidden')) return 403;
    if (message.includes('invalid') || message.includes('validation')) return 400;
    if (message.includes('timeout')) return 504;
    if (message.includes('rate limit')) return 429;
    if (message.includes('too large')) return 413;

    return 500; // 默认服务器错误
  }

  /**
   * 记录错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  static logError(error, context = {}) {
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    });
  }
}

