/**
 * 应用配置文件
 * 包含所有服务的配置信息
 */

require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    tokenExpire: '24h'
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mingli',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },
  
  // 阿里云OSS配置
  oss: {
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || 'mingli-videos',
    secure: true
  },
  
  // 视频转码配置
  transcode: {
    enabled: process.env.TRANSCODE_ENABLED === 'true',
    tmpDir: process.env.TRANSCODE_TMP_DIR || '/tmp/mingli-transcode',
    ffmpegPath: process.env.FFMPEG_PATH || '/usr/local/bin/ffmpeg',
    qualities: ['720p', '480p', '360p'],
    hlsEnabled: true
  },
  
  // 支付配置
  payment: {
    wechat: {
      appId: process.env.WECHAT_APP_ID || '',
      mchId: process.env.WECHAT_MCH_ID || '',
      apiKey: process.env.WECHAT_API_KEY || '',
      notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://localhost:3000/api/payment/wechat-notify'
    },
    alipay: {
      appId: process.env.ALIPAY_APP_ID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:3000/api/payment/alipay-notify',
      gatewayUrl: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipaydev.com/gateway.do'
    }
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 500 * 1024 * 1024, // 500MB
    allowedVideoTypes: ['mp4', 'mov', 'avi', 'mkv'],
    allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    tmpDir: process.env.UPLOAD_TMP_DIR || '/tmp/mingli-uploads'
  },
  
  // 安全配置
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED === 'true',
      maxRequests: 100,
      windowMs: 60000
    }
  }
};