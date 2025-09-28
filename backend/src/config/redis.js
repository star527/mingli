/**
 * Redis配置
 * Redis客户端连接和缓存管理（支持降级到内存存储）
 */

const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.useMemoryStore = false;
    this.memoryStore = new Map();
    
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 1000,
      maxRetriesPerRequest: 3,
    };
  }

  /**
   * 连接Redis
   */
  async connect() {
    try {
      this.client = redis.createClient(this.config);
      
      // 设置事件监听器
      this.client.on('error', (err) => {
        console.error('Redis连接错误:', err);
        // 如果Redis连接失败，降级到内存存储
        if (!this.useMemoryStore) {
          console.log('⚠️  Redis不可用，降级到内存存储');
          this.useMemoryStore = true;
          this.isConnected = true;
          // 断开Redis连接以停止重连尝试
          if (this.client) {
            this.client.disconnect();
          }
        }
      });
      
      this.client.on('connect', () => {
        console.log('🔄 Redis连接中...');
      });
      
      this.client.on('ready', () => {
        console.log('✅ Redis连接成功');
        this.isConnected = true;
        this.useMemoryStore = false;
      });
      
      this.client.on('reconnecting', () => {
        console.log('🔄 Redis重连中...');
      });
      
      this.client.on('end', () => {
        console.log('🔚 Redis连接已断开');
        this.isConnected = false;
      });
      
      // 创建连接Promise
      const connectPromise = this.client.connect();
      
      // 设置5秒超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Redis连接超时'));
        }, 5000);
      });
      
      // 等待连接完成或超时
      try {
        await Promise.race([connectPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('❌ Redis连接超时:', timeoutError.message);
        // 如果Redis连接超时，降级到内存存储
        if (!this.useMemoryStore) {
          console.log('⚠️  Redis连接超时，降级到内存存储');
          this.useMemoryStore = true;
          this.isConnected = true;
        }
        return this;
      }
      
      // 测试连接（仅在未使用内存存储时）
      if (!this.useMemoryStore) {
        await this.client.ping();
      }
      
      return this.client;
    } catch (error) {
      console.error('❌ Redis连接失败:', error.message);
      // 如果Redis连接失败，降级到内存存储
      if (!this.useMemoryStore) {
        console.log('⚠️  Redis不可用，降级到内存存储');
        this.useMemoryStore = true;
        this.isConnected = true;
      }
      return this;
    }
  }

  /**
   * 获取Redis客户端实例
   */
  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis客户端未连接');
    }
    return this.client;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} expire - 过期时间（秒）
   */
  async set(key, value, expire = 3600) {
    // 如果使用内存存储，不需要检查Redis连接状态
    if (this.useMemoryStore) {
      try {
        const serializedValue = JSON.stringify(value);
        const expireTime = expire ? Date.now() + expire * 1000 : null;
        this.memoryStore.set(key, { value: serializedValue, expire: expireTime });
        return true;
      } catch (error) {
        console.error('设置缓存失败:', error.message);
        return false;
      }
    }
    
    // 使用Redis存储需要检查连接状态
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      
      // 使用Redis存储
      if (expire) {
        await this.client.setEx(key, expire, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   */
  async get(key) {
    // 如果使用内存存储，不需要检查Redis连接状态
    if (this.useMemoryStore) {
      try {
        const item = this.memoryStore.get(key);
        if (!item) return null;
        
        // 检查是否过期
        if (item.expire && Date.now() > item.expire) {
          this.memoryStore.delete(key);
          return null;
        }
        
        return JSON.parse(item.value);
      } catch (error) {
        console.error('获取缓存失败:', error.message);
        return null;
      }
    }
    
    // 使用Redis存储需要检查连接状态
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      // 使用Redis存储
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('获取缓存失败:', error.message);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  async del(key) {
    // 如果使用内存存储，不需要检查Redis连接状态
    if (this.useMemoryStore) {
      try {
        this.memoryStore.delete(key);
        return true;
      } catch (error) {
        console.error('删除缓存失败:', error.message);
        return false;
      }
    }
    
    // 使用Redis存储需要检查连接状态
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      // 使用Redis存储
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('删除缓存失败:', error.message);
      return false;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        return this.memoryStore.has(key);
      }
      
      // 使用Redis存储需要检查连接状态
      if (!this.isConnected) {
        throw new Error('Redis未连接');
      }
      
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis检查键存在失败:', error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, seconds) {
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key);
        if (item) {
          item.expire = Date.now() + seconds * 1000;
          this.memoryStore.set(key, item);
        }
        return true;
      }
      
      // 使用Redis存储需要检查连接状态
      if (!this.isConnected) {
        throw new Error('Redis未连接');
      }
      
      const client = this.getClient();
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis设置过期时间失败:', error);
      return false;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key) {
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key);
        if (!item) return -2; // 键不存在
        if (item.expire) {
          const remaining = Math.floor((item.expire - Date.now()) / 1000);
          return remaining > 0 ? remaining : -1; // 已过期
        }
        return -1; // 没有设置过期时间
      }
      
      // 使用Redis存储
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('Redis获取剩余时间失败:', error);
      return -2; // 键不存在
    }
  }

  /**
   * 计数器增加
   * @param {string} key - 计数器键
   * @param {number} increment - 增量
   */
  async incr(key, increment = 1) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key) || { value: '0' };
        const currentValue = parseInt(item.value) || 0;
        const newValue = currentValue + increment;
        item.value = newValue.toString();
        this.memoryStore.set(key, item);
        return newValue;
      }
      
      // 使用Redis存储
      const result = await this.client.incrBy(key, increment);
      return result;
    } catch (error) {
      console.error('计数器增加失败:', error.message);
      throw error;
    }
  }

  /**
   * 计数器减少
   * @param {string} key - 计数器键
   * @param {number} decrement - 减量
   */
  async decr(key, decrement = 1) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key) || { value: '0' };
        const currentValue = parseInt(item.value) || 0;
        const newValue = currentValue - decrement;
        item.value = newValue.toString();
        this.memoryStore.set(key, item);
        return newValue;
      }
      
      // 使用Redis存储
      const result = await this.client.decrBy(key, decrement);
      return result;
    } catch (error) {
      console.error('计数器减少失败:', error.message);
      throw error;
    }
  }

  /**
   * 设置哈希字段
   * @param {string} key - 哈希键
   * @param {string} field - 字段名
   * @param {any} value - 字段值
   */
  async hset(key, field, value) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key) || { value: {} };
        item.value[field] = serializedValue;
        this.memoryStore.set(key, item);
        return;
      }
      
      // 使用Redis存储
      await this.client.hSet(key, field, serializedValue);
    } catch (error) {
      console.error('设置哈希字段失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取哈希字段
   * @param {string} key - 哈希键
   * @param {string} field - 字段名
   */
  async hget(key, field) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key);
        if (!item || !item.value[field]) return null;
        return JSON.parse(item.value[field]);
      }
      
      // 使用Redis存储
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('获取哈希字段失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除哈希字段
   * @param {string} key - 哈希键
   * @param {string} field - 字段名
   */
  async hdel(key, field) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key);
        if (item && item.value[field]) {
          delete item.value[field];
          this.memoryStore.set(key, item);
        }
        return;
      }
      
      // 使用Redis存储
      await this.client.hDel(key, field);
    } catch (error) {
      console.error('删除哈希字段失败:', error.message);
      throw error;
    }
  }

  /**
   * 向列表左侧推入元素
   * @param {string} key - 列表键
   * @param {...any} values - 要推入的值
   */
  async lpush(key, ...values) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      const serializedValues = values.map(value => JSON.stringify(value));
      
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key) || { value: [] };
        item.value.unshift(...serializedValues);
        this.memoryStore.set(key, item);
        return item.value.length;
      }
      
      // 使用Redis存储
      return await this.client.lPush(key, serializedValues);
    } catch (error) {
      console.error('列表左侧推入失败:', error.message);
      throw error;
    }
  }

  /**
   * 从列表右侧弹出元素
   * @param {string} key - 列表键
   */
  async rpop(key) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key);
        if (!item || item.value.length === 0) return null;
        const value = item.value.pop();
        this.memoryStore.set(key, item);
        return value ? JSON.parse(value) : null;
      }
      
      // 使用Redis存储
      const value = await this.client.rPop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('列表右侧弹出失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取列表长度
   * @param {string} key - 列表键
   */
  async llen(key) {
    if (!this.isConnected) {
      throw new Error('Redis未连接');
    }
    
    try {
      if (this.useMemoryStore) {
        // 使用内存存储
        const item = this.memoryStore.get(key);
        return item ? item.value.length : 0;
      }
      
      // 使用Redis存储
      return await this.client.lLen(key);
    } catch (error) {
      console.error('获取列表长度失败:', error.message);
      throw error;
    }
  }

  /**
   * 关闭Redis连接
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        console.log('Redis连接已关闭');
      }
    } catch (error) {
      console.error('Redis关闭连接失败:', error);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Redis未连接' };
      }
      
      await this.client.ping();
      return { status: 'connected', message: 'Redis连接正常' };
    } catch (error) {
      return { status: 'error', message: 'Redis健康检查失败: ' + error.message };
    }
  }
}

// 创建单例实例
const redisClient = new RedisClient();

module.exports = redisClient;