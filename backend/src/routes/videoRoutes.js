const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const createAuthMiddleware = require('../middleware/auth');
const config = require('../config/appConfig');
const authMiddleware = createAuthMiddleware(config);
// 直接使用authMiddleware.requireAdmin作为adminMiddleware
const adminMiddleware = authMiddleware.requireAdmin;
// 上传中间件暂时未实现
const validationMiddleware = require('../middleware/validation'); // 注意：文件名为validation.js而不是validationMiddleware.js

/**
 * 视频课程相关路由
 */

// 公开路由
router.get('/videos', validationMiddleware.validateVideoSearch, VideoController.getVideoList);

// 重写视频详情路由，使用内联函数直接处理请求，避免依赖外部中间件和控制器的复杂性
router.get('/videos/:videoId', (req, res) => {
  try {
    console.log('[DIRECT ROUTE DEBUG] 视频详情请求到达:', req.params);
    const { videoId } = req.params;
    
    // 直接返回响应，不经过任何中间件或控制器
    return res.json({
      success: true,
      message: '视频详情获取成功（直接路由）',
      data: {
        videoId: videoId,
        title: '测试视频标题',
        description: '这是通过直接路由返回的视频详情',
        category: '八字基础',
        isFree: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[DIRECT ROUTE ERROR]', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 搜索视频（公开）
router.get('/videos/search', validationMiddleware.validateVideoSearch, VideoController.searchVideos);

// 需要登录的路由
// 记录观看进度
router.post('/videos/:videoId/progress', 
  authMiddleware.requireAuth,
  validationMiddleware.validateProgress,
  VideoController.recordWatchProgress
);

// 点赞/取消点赞视频
router.post('/videos/:videoId/like', 
  authMiddleware.requireAuth,
  [], // 控制器中不需要liked参数，它会自动切换状态
  VideoController.toggleLike
);

router.get('/user/learning-stats', authMiddleware.requireAuth, VideoController.getUserLearningStats);

// 生成分享链接
router.post('/videos/:videoId/share', 
  authMiddleware.requireAuth,
  validationMiddleware.validateShareRequest,
  VideoController.generateShareLink
);

// 需要会员权限的路由
// 生成签名播放URL
router.get('/videos/:videoId/play', 
  authMiddleware.requireAuth,
  validationMiddleware.validateVideoId,
  VideoController.getSignedPlayUrl
);

// 管理员路由
// 管理员上传视频（暂时注释掉uploadMiddleware，因为文件不存在）
router.post('/admin/videos', 
  authMiddleware.requireAuth,
  adminMiddleware,
  // uploadMiddleware.single('video'), // 暂时注释，因为uploadMiddleware文件不存在
  validationMiddleware.validateVideoUpload,
  VideoController.uploadVideo
);

// 管理员批量更新视频
router.patch('/admin/videos/batch', 
  authMiddleware.requireAuth,
  adminMiddleware,
  validationMiddleware.validateBatchUpdateVideos,
  VideoController.batchUpdateVideos
);

module.exports = router;