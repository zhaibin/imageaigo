/**
 * 性能优化模块
 * 提供缓存策略、资源优化和性能监控功能
 */

/**
 * 缓存管理器
 */
export class CacheManager {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 100;
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 前缀
   * @param  {...any} parts - 键的组成部分
   * @returns {string} 缓存键
   */
  static generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @param {Object} options - 选项
   * @returns {Promise<any>} 缓存值
   */
  async get(key, options = {}) {
    const {
      useMemoryCache = true,
      parse = true
    } = options;

    try {
      // 先检查内存缓存
      if (useMemoryCache && this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        if (cached.expiresAt > Date.now()) {
          console.log(`[Cache] Memory hit: ${key}`);
          return cached.value;
        } else {
          this.memoryCache.delete(key);
        }
      }

      // 从KV获取
      const value = await this.kv.get(key);
      
      if (value !== null) {
        console.log(`[Cache] KV hit: ${key}`);
        const parsed = parse ? JSON.parse(value) : value;
        
        // 更新内存缓存
        if (useMemoryCache) {
          this.setMemoryCache(key, parsed, 60); // 内存缓存60秒
        }
        
        return parsed;
      }

      console.log(`[Cache] Miss: ${key}`);
      return null;

    } catch (error) {
      console.error(`[Cache] Get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {Object} options - 选项
   * @returns {Promise<void>}
   */
  async set(key, value, options = {}) {
    const {
      ttl = 3600,
      useMemoryCache = true,
      stringify = true
    } = options;

    try {
      const stringified = stringify ? JSON.stringify(value) : value;
      
      // 存储到KV
      await this.kv.put(key, stringified, { expirationTtl: ttl });
      
      // 存储到内存缓存
      if (useMemoryCache) {
        this.setMemoryCache(key, value, Math.min(ttl, 300)); // 最多缓存5分钟
      }

      console.log(`[Cache] Set: ${key} (TTL: ${ttl}s)`);

    } catch (error) {
      console.error(`[Cache] Set error for ${key}:`, error);
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      await this.kv.delete(key);
      this.memoryCache.delete(key);
      console.log(`[Cache] Deleted: ${key}`);
    } catch (error) {
      console.error(`[Cache] Delete error for ${key}:`, error);
    }
  }

  /**
   * 批量删除缓存（通过前缀）
   * @param {string} prefix - 前缀
   * @returns {Promise<number>} 删除的数量
   */
  async deleteByPrefix(prefix) {
    try {
      const list = await this.kv.list({ prefix });
      let count = 0;

      for (const key of list.keys) {
        await this.kv.delete(key.name);
        this.memoryCache.delete(key.name);
        count++;
      }

      console.log(`[Cache] Deleted ${count} keys with prefix: ${prefix}`);
      return count;

    } catch (error) {
      console.error(`[Cache] DeleteByPrefix error for ${prefix}:`, error);
      return 0;
    }
  }

  /**
   * 设置内存缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   */
  setMemoryCache(key, value, ttl) {
    // 限制内存缓存大小
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000
    });
  }

  /**
   * 清理过期的内存缓存
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 获取或设置缓存（缓存包装器）
   * @param {string} key - 缓存键
   * @param {Function} fetchFn - 获取数据的函数
   * @param {Object} options - 选项
   * @returns {Promise<any>} 数据
   */
  async getOrSet(key, fetchFn, options = {}) {
    // 先尝试获取缓存
    const cached = await this.get(key, options);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行获取函数
    console.log(`[Cache] Fetching data for: ${key}`);
    const data = await fetchFn();

    // 存储到缓存
    if (data !== null && data !== undefined) {
      await this.set(key, data, options);
    }

    return data;
  }
}

/**
 * 响应优化器
 */
export class ResponseOptimizer {
  /**
   * 创建优化的响应
   * @param {string|Object} data - 响应数据
   * @param {Object} options - 选项
   * @returns {Response} 优化的响应对象
   */
  static createResponse(data, options = {}) {
    const {
      statusCode = 200,
      contentType = 'application/json',
      cache = true,
      cacheMaxAge = 300,
      cors = true,
      compress = true
    } = options;

    // 构建响应头
    const headers = new Headers();
    
    // Content-Type
    if (contentType === 'application/json' && typeof data === 'object') {
      headers.set('Content-Type', 'application/json;charset=UTF-8');
    } else {
      headers.set('Content-Type', contentType);
    }

    // 缓存控制
    if (cache) {
      headers.set('Cache-Control', `public, max-age=${cacheMaxAge}, stale-while-revalidate=60`);
    } else {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    // CORS
    if (cors) {
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // 性能优化头部
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');

    // 压缩提示
    if (compress) {
      headers.set('Vary', 'Accept-Encoding');
    }

    // 准备响应体
    const body = typeof data === 'object' ? JSON.stringify(data) : data;

    return new Response(body, {
      status: statusCode,
      headers
    });
  }

  /**
   * 创建HTML响应
   * @param {string} html - HTML内容
   * @param {Object} options - 选项
   * @returns {Response} 响应对象
   */
  static createHtmlResponse(html, options = {}) {
    const {
      statusCode = 200,
      cacheMaxAge = 300
    } = options;

    const headers = new Headers({
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': `public, max-age=${cacheMaxAge}`,
      'X-Content-Type-Options': 'nosniff'
    });

    return new Response(html, {
      status: statusCode,
      headers
    });
  }

  /**
   * 创建错误响应
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {string} requestId - 请求ID
   * @returns {Response} 错误响应对象
   */
  static createErrorResponse(message, statusCode = 500, requestId = null) {
    const error = {
      error: message,
      statusCode,
      timestamp: new Date().toISOString()
    };

    if (requestId) {
      error.requestId = requestId;
    }

    return this.createResponse(error, {
      statusCode,
      cache: false,
      cors: true
    });
  }
}

/**
 * 图片优化器
 */
export class ImageOptimizer {
  /**
   * 计算最佳图片尺寸
   * @param {number} width - 原始宽度
   * @param {number} height - 原始高度
   * @param {number} maxDimension - 最大尺寸
   * @returns {Object} 优化后的尺寸
   */
  static calculateOptimalSize(width, height, maxDimension = 2048) {
    if (width <= maxDimension && height <= maxDimension) {
      return { width, height };
    }

    const aspectRatio = width / height;

    if (width > height) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / aspectRatio)
      };
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: maxDimension
      };
    }
  }

  /**
   * 估算图片文件大小
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} format - 格式
   * @returns {number} 估算的字节数
   */
  static estimateFileSize(width, height, format = 'jpeg') {
    const pixels = width * height;
    
    const compressionRatios = {
      'jpeg': 0.15,  // JPEG通常压缩到原始的15%
      'png': 0.5,    // PNG无损压缩
      'webp': 0.1,   // WebP更高效
      'gif': 0.3     // GIF
    };

    const ratio = compressionRatios[format] || 0.2;
    return Math.round(pixels * 3 * ratio); // RGB每像素3字节
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * 开始性能测量
   * @param {string} label - 标签
   * @returns {number} 开始时间
   */
  start(label) {
    const startTime = Date.now();
    this.metrics.set(label, { startTime, endTime: null });
    return startTime;
  }

  /**
   * 结束性能测量
   * @param {string} label - 标签
   * @returns {number} 持续时间（毫秒）
   */
  end(label) {
    const metric = this.metrics.get(label);
    if (!metric) {
      console.warn(`[Performance] Metric not found: ${label}`);
      return 0;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    console.log(`[Performance] ${label}: ${duration}ms`);
    
    // 警告慢操作
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation: ${label} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * 获取性能摘要
   * @returns {Object} 性能摘要
   */
  getSummary() {
    const summary = {};
    
    for (const [label, metric] of this.metrics.entries()) {
      if (metric.duration !== undefined) {
        summary[label] = metric.duration;
      }
    }

    return summary;
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics.clear();
  }
}

/**
 * 资源加载优化器
 */
export class ResourceLoader {
  /**
   * 生成预加载链接头部
   * @param {Array<Object>} resources - 资源列表
   * @returns {string} Link头部值
   */
  static generatePreloadHeaders(resources) {
    return resources.map(resource => {
      const { url, as, type, crossorigin } = resource;
      let link = `<${url}>; rel=preload; as=${as}`;
      
      if (type) link += `; type=${type}`;
      if (crossorigin) link += `; crossorigin`;
      
      return link;
    }).join(', ');
  }

  /**
   * 生成关键CSS内联
   * @param {string} css - CSS内容
   * @returns {string} 内联CSS HTML
   */
  static inlineCriticalCss(css) {
    return `<style>${css}</style>`;
  }

  /**
   * 生成异步脚本标签
   * @param {string} src - 脚本URL
   * @param {Object} options - 选项
   * @returns {string} 脚本标签HTML
   */
  static asyncScriptTag(src, options = {}) {
    const { defer = false, module = false } = options;
    
    let attrs = defer ? 'defer' : 'async';
    if (module) attrs += ' type="module"';
    
    return `<script src="${src}" ${attrs}></script>`;
  }
}

/**
 * 数据库查询优化器
 */
export class QueryOptimizer {
  /**
   * 批量查询优化
   * @param {Array<number>} ids - ID列表
   * @param {Function} queryFn - 查询函数
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 查询结果
   */
  static async batchQuery(ids, queryFn, options = {}) {
    const { batchSize = 50, parallel = true } = options;

    // 分批处理
    const batches = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    // 并行或串行执行
    if (parallel) {
      const results = await Promise.all(
        batches.map(batch => queryFn(batch))
      );
      return results.flat();
    } else {
      const results = [];
      for (const batch of batches) {
        const batchResults = await queryFn(batch);
        results.push(...batchResults);
      }
      return results;
    }
  }

  /**
   * 查询结果去重
   * @param {Array<Object>} results - 查询结果
   * @param {string} keyField - 键字段
   * @returns {Array<Object>} 去重后的结果
   */
  static deduplicateResults(results, keyField = 'id') {
    const seen = new Set();
    return results.filter(item => {
      const key = item[keyField];
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

/**
 * 内存优化工具
 */
export class MemoryOptimizer {
  /**
   * 流式处理大数据
   * @param {Array} items - 数据项
   * @param {Function} processFn - 处理函数
   * @param {number} chunkSize - 块大小
   * @returns {Promise<Array>} 处理结果
   */
  static async processInChunks(items, processFn, chunkSize = 100) {
    const results = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await processFn(chunk);
      results.push(...chunkResults);
      
      // 允许事件循环处理其他任务
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }

  /**
   * 限制并发数
   * @param {Array<Function>} tasks - 任务列表
   * @param {number} concurrency - 并发数
   * @returns {Promise<Array>} 结果数组
   */
  static async limitConcurrency(tasks, concurrency = 5) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      results.push(promise);
      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }
}

