/**
 * 限流中间件
 * 防止API滥用和DDoS攻击
 */

class RateLimitMiddleware {
  constructor() {
    this.rateLimits = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000); // 每小时清理一次
  }

  /**
   * 基于用户的限流
   * @param {string} key - 限流键名
   * @param {number} maxRequests - 最大请求数
   * @param {number} windowMs - 时间窗口（毫秒）
   */
  limitByUser(key, maxRequests = 100, windowMs = 60 * 60 * 1000) {
    return (req, res, next) => {
      const userId = req.user?.id || req.ip;
      const rateKey = `${key}:${userId}`;
      
      return this.checkRateLimit(rateKey, maxRequests, windowMs, req, res, next);
    };
  }

  /**
   * 基于IP的限流
   * @param {string} key - 限流键名
   * @param {number} maxRequests - 最大请求数
   * @param {number} windowMs - 时间窗口（毫秒）
   */
  limitByIP(key, maxRequests = 50, windowMs = 60 * 60 * 1000) {
    return (req, res, next) => {
      const rateKey = `${key}:${req.ip}`;
      
      return this.checkRateLimit(rateKey, maxRequests, windowMs, req, res, next);
    };
  }

  /**
   * 检查限流
   */
  checkRateLimit(rateKey, maxRequests, windowMs, req, res, next) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 获取或初始化限流记录
    if (!this.rateLimits.has(rateKey)) {
      this.rateLimits.set(rateKey, []);
    }

    const requests = this.rateLimits.get(rateKey);
    
    // 清理过期请求
    const validRequests = requests.filter(time => time > windowStart);
    this.rateLimits.set(rateKey, validRequests);

    // 检查是否超过限制
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }

    // 记录当前请求
    validRequests.push(now);
    this.rateLimits.set(rateKey, validRequests);

    // 设置响应头
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - validRequests.length,
      'X-RateLimit-Reset': Math.ceil((now + windowMs) / 1000)
    });

    next();
  }

  /**
   * 清理过期数据
   */
  cleanup() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [key, requests] of this.rateLimits.entries()) {
      const validRequests = requests.filter(time => time > oneHourAgo);
      if (validRequests.length === 0) {
        this.rateLimits.delete(key);
      } else {
        this.rateLimits.set(key, validRequests);
      }
    }
  }

  /**
   * 销毁清理定时器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// 创建单例实例
const rateLimitMiddleware = new RateLimitMiddleware();

module.exports = rateLimitMiddleware;