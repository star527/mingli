/**
 * 应用主入口文件
 * AI算命八字排盘工具 - 后端API服务
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const { connectDatabase } = require('./config/database');
const redisClient = require('./config/redis');
const { startAllJobs } = require('../config/cron_jobs');

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * 初始化中间件
   */
  initializeMiddlewares() {
    // 安全中间件
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
      credentials: true
    }));
    
    // 压缩响应
    this.app.use(compression());
    
    // 日志记录
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }
    
    // 解析请求体
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 静态文件服务（用于视频、图片等）
    this.app.use('/uploads', express.static('uploads'));
  }

  /**
   * 初始化路由
   */
  initializeRoutes() {
    // API路由
    this.app.use('/api', apiRoutes);
    
    // 健康检查端点
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });
    
    // 测试路由 - 直接测试基本API响应
    this.app.get('/test/video/1', (req, res) => {
      console.log('[TEST DEBUG] 接收到测试请求');
      res.status(200).json({
        success: true,
        message: '测试路由响应正常',
        data: { videoId: '1', test: 'success' }
      });
    });
    
    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        message: 'AI算命八字排盘工具 API服务',
        version: '1.0.0',
        documentation: '/api/docs'
      });
    });
    
    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: '接口不存在',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  /**
   * 初始化错误处理
   */
  initializeErrorHandling() {
    // 404错误处理
    this.app.use(errorHandler.handleNotFound);
    
    // 全局错误处理
    this.app.use(errorHandler.handleError);
  }

  /**
   * 启动应用
   */
  async start() {
    try {
      // 连接数据库
      await connectDatabase();
      console.log('✅ 数据库连接成功');
      
      // 连接Redis（即使失败也继续启动应用）
      try {
        await redisClient.connect();
        console.log('✅ Redis连接成功');
      } catch (error) {
        console.log('⚠️ Redis连接失败，应用将继续启动');
      }
      
      // 启动定时任务
      try {
        startAllJobs();
        console.log('✅ 定时任务启动成功');
      } catch (cronError) {
        console.error('❌ 定时任务启动失败:', cronError);
        // 定时任务失败不影响主服务启动
      }
      
      // 启动服务器
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 服务器启动成功`);
        console.log(`📍 服务地址: http://localhost:${this.port}`);
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
      });
      
      // 优雅关闭
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ 应用启动失败:', error);
      process.exit(1);
    }
  }

  /**
   * 优雅关闭处理
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n📡 收到 ${signal} 信号，开始优雅关闭...`);
      
      // 停止接收新请求
      this.server.close(() => {
        console.log('✅ HTTP服务器已关闭');
      });
      
      // 关闭数据库连接
      if (this.dbConnection) {
        await this.dbConnection.end();
        console.log('✅ 数据库连接已关闭');
      }
      
      // 关闭Redis连接
      if (this.redisClient) {
        await this.redisClient.quit();
        console.log('✅ Redis连接已关闭');
      }
      
      console.log('👋 服务已完全关闭');
      process.exit(0);
    };
    
    // 监听关闭信号
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      console.error('💥 未捕获异常:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 未处理的Promise拒绝:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }
}

// 如果是直接运行此文件，则启动应用
if (require.main === module) {
  const app = new App();
  app.start();
}

module.exports = App;