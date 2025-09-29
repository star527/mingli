/**
 * API路由设计
 * 微信小程序和管理后台的接口定义
 */

const express = require('express');
const router = express.Router();

// 中间件
const createAuthMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');
const validationMiddleware = require('../middleware/validation');

// 服务
const baziService = require('../services/baziService');
const membershipService = require('../services/membershipService');
const userService = require('../services/userService');
// 其他服务暂时注释，后续实现

// 配置对象
const config = {
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key'
};

// 初始化中间件
const authMiddleware = createAuthMiddleware(config);

// 控制器
const userController = require('../controllers/userController')(userService, authMiddleware);
const baziController = require('../controllers/baziController')(baziService, membershipService);
// 其他控制器暂时使用原始导入方式
const membershipController = require('../controllers/membershipController');
const videoController = require('../controllers/videoController');
const paymentController = require('../controllers/paymentController');
const adminController = require('../controllers/adminController');
const systemController = require('../controllers/systemController');
const shareController = require('../controllers/shareController');

// 路由模块
const videoRoutes = require('./videoRoutes');

// ==================== 用户相关接口 ====================

/**
 * 用户登录/注册
 * POST /api/users/login
 */
router.post('/users/login', 
  validationMiddleware.validateLogin,
  userController.login
);

/**
 * 获取用户信息
 * GET /api/users/profile
 */
router.get('/users/profile',
  authMiddleware.requireAuth,
  userController.getProfile
);

/**
 * 更新用户信息
 * PUT /api/users/profile
 */
router.put('/users/profile',
  authMiddleware.requireAuth,
  validationMiddleware.validateProfileUpdate,
  userController.updateProfile
);

// ==================== 视频课程接口 ====================
// 集成视频相关的所有路由
router.use('/', videoRoutes);

// ==================== 八字排盘接口 ====================

/**
 * 八字排盘
 * POST /api/bazi/calculate
 */
router.post('/bazi/calculate',
  authMiddleware.requireAuth,
  rateLimitMiddleware.limitByUser('bazi_calculation', 10), // 每用户每小时10次
  validationMiddleware.validateBaziInput,
  baziController.calculateBazi
);

/**
 * 获取分析记录列表
 * GET /api/bazi/records
 */
router.get('/bazi/records',
  authMiddleware.requireAuth,
  baziController.getRecords
);

/**
 * 获取收藏记录列表
 * GET /api/bazi/favorites
 */
router.get('/bazi/favorites',
  authMiddleware.requireAuth,
  baziController.getFavoriteRecords
);

/**
 * 获取分析记录详情
 * GET /api/bazi/records/:recordId
 */
router.get('/bazi/records/:recordId',
  authMiddleware.requireAuth,
  baziController.getRecordDetail
);

/**
 * 收藏/取消收藏记录
 * POST /api/bazi/records/:recordId/favorite
 */
router.post('/bazi/records/:recordId/favorite',
  authMiddleware.requireAuth,
  baziController.toggleFavorite
);

/**
 * 删除分析记录
 * DELETE /api/bazi/records/:recordId
 */
router.delete('/bazi/records/:recordId',
  authMiddleware.requireAuth,
  baziController.deleteRecord
);

// ==================== 会员相关接口 ====================

/**
 * 获取会员信息
 * GET /api/membership/info
 */
router.get('/membership/info',
  authMiddleware.requireAuth,
  membershipController.getMembershipInfo
);

/**
 * 获取会员权益
 * GET /api/membership/benefits
 */
router.get('/membership/benefits',
  authMiddleware.requireAuth,
  membershipController.getBenefits
);

/**
 * 检查功能权限
 * POST /api/membership/check-permission
 */
router.post('/membership/check-permission',
  authMiddleware.requireAuth,
  validationMiddleware.validatePermissionCheck,
  membershipController.checkPermission
);

/**
 * 获取会员套餐列表
 * GET /api/membership/plans
 */
router.get('/membership/plans',
  authMiddleware.requireAuth,
  membershipController.getPlans
);

/**
 * 会员升级
 * POST /api/membership/upgrade
 */
router.post('/membership/upgrade',
  authMiddleware.requireAuth,
  membershipController.upgrade
);

/**
 * 设置自动续费
 * POST /api/membership/auto-renew
 */
router.post('/membership/auto-renew',
  authMiddleware.requireAuth,
  membershipController.setupAutoRenew
);

/**
 * 获取自动续费状态
 * GET /api/membership/auto-renew
 */
router.get('/membership/auto-renew',
  authMiddleware.requireAuth,
  membershipController.getAutoRenewStatus
);

/**
 * 计算会员升级价格
 * POST /api/membership/calculate-price
 */
router.post('/membership/calculate-price',
  authMiddleware.requireAuth,
  validationMiddleware.validateUpgradePrice(),
  membershipController.calculateUpgradePrice
);

/**
 * 验证优惠券
 * POST /api/membership/validate-coupon
 */
router.post('/membership/validate-coupon',
  membershipController.validateCoupon
);

/**
 * 检查视频访问权限
 * GET /api/membership/video-access/:videoId
 */
router.get('/membership/video-access/:videoId',
  authMiddleware.requireAuth,
  membershipController.checkVideoAccess
);

/**
 * 获取会员信息（模拟实现）
 * GET /api/membership/info
 */
router.get('/api/membership/info',
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      // 模拟返回会员信息
      const membershipInfo = {
        level: 'basic',
        expireTime: '2024-12-31 23:59:59',
        status: 'active',
        autoRenew: true,
        remainingDays: 180
      };
      
      res.json({
        success: true,
        data: membershipInfo
      });
    } catch (error) {
      console.error('获取会员信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取会员信息失败'
      });
    }
  }
);

// ==================== 视频课程接口 ====================

/**
 * 获取视频课程列表
 * GET /api/videos
 */
router.get('/videos',
  authMiddleware.optionalAuth, // 可选认证，免费用户可以看列表
  videoController.getVideoList
);

/**
 * 获取视频详情
 * GET /api/videos/:videoId
 */
router.get('/videos/:videoId',
  authMiddleware.requireAuth,
  videoController.getVideoDetail
);

// 视频播放地址接口已在videoRoutes中定义，注释掉以避免冲突
// /**
//  * 获取视频播放地址
//  * GET /api/videos/:videoId/play
//  */
// router.get('/videos/:videoId/play',
//   authMiddleware.requireAuth,
//   videoController.getSignedPlayUrl
// );

// 记录观看进度接口已在videoRoutes中定义，注释掉以避免冲突
// /**
//  * 记录观看进度
//  * POST /api/videos/:videoId/progress
//  */
// router.post('/videos/:videoId/progress',
//   authMiddleware.requireAuth,
//   validationMiddleware.validateProgress,
//   videoController.recordWatchProgress
// );

/**
 * 点赞/取消点赞视频
 * POST /api/videos/:videoId/like
 */
router.post('/videos/:videoId/like',
  authMiddleware.requireAuth,
  videoController.toggleLike
);

/**
 * 搜索视频课程
 * GET /api/videos/search
 */
router.get('/videos/search',
  authMiddleware.optionalAuth,
  videoController.searchVideos
);

// ==================== 支付相关接口 ====================

/**
 * 创建会员订单
 * POST /api/payments/membership
 */
router.post('/payments/membership',
  authMiddleware.requireAuth,
  validationMiddleware.validateMembershipOrder,
  paymentController.createMembershipOrder
);

/**
 * 创建视频订单
 * POST /api/payments/video
 */
router.post('/payments/video',
  authMiddleware.requireAuth,
  validationMiddleware.validateVideoOrder,
  paymentController.createVideoOrder
);

/**
 * 支付回调处理
 * POST /api/payments/notify
 */
router.post('/payments/notify',
  paymentController.paymentCallback
);

/**
 * 查询订单状态
 * GET /api/payments/:orderId/status
 */
router.get('/payments/:orderId/status',
  authMiddleware.requireAuth,
  paymentController.getOrderStatus
);

// ==================== 管理后台接口 ====================

/**
 * 管理员登录
 * POST /api/admin/login
 */
router.post('/admin/login', async (req, res) => {
  try {
    const { adminId } = req.body;
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: '管理员ID不能为空'
      });
    }
    
    // 使用auth中间件进行管理员登录验证
    const result = await authMiddleware.adminLogin(adminId);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(401).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

/**
 * 获取统计数据
 * GET /api/admin/stats
 */
router.get('/admin/stats',
  authMiddleware.requireAdmin,
  adminController.getStats
);

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/admin/users',
  authMiddleware.requireAdmin,
  adminController.getUserList
);

// 视频管理接口已在videoRoutes中定义
// 保持兼容性，保留原始路由并转发到新实现
router.post('/admin/videos/upload',
  authMiddleware.requireAdmin,
  (req, res, next) => {
    console.log('转发到新的视频上传接口');
    res.redirect(307, '/api/admin/videos');
  }
);

router.put('/admin/videos/:videoId',
  authMiddleware.requireAdmin,
  async (req, res) => {
    console.log('转发到新的视频批量更新接口');
    // 转换为批量更新格式
    try {
      const { videoId } = req.params;
      const response = await fetch('http://localhost:3000/api/admin/videos/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        },
        body: JSON.stringify({
          videoIds: [videoId],
          updates: req.body
        })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ success: false, error: '转发请求失败', message: error.message });
    }
  }
);

/**
 * 获取订单列表
 * GET /api/admin/orders
 */
router.get('/admin/orders',
  authMiddleware.requireAdmin,
  adminController.getOrderList
);

// ==================== 文件上传接口 ====================

/**
 * 上传图片（用于视频封面等）
 * POST /api/upload/image
 */
router.post('/upload/image',
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  async (req, res) => {
    try {
      // 模拟图片上传，返回一个mock的URL
      // 实际项目中应该使用multer等中间件处理文件上传
      const mockImageUrl = 'https://example.com/uploads/' + Date.now() + '.jpg';
      
      res.json({
        success: true,
        data: {
          url: mockImageUrl
        }
      });
    } catch (error) {
      console.error('上传图片失败:', error);
      res.status(500).json({
        success: false,
        message: '上传图片失败'
      });
    }
  }
);

/**
 * 上传视频文件
 * POST /api/upload/video
 */
router.post('/upload/video',
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  async (req, res) => {
    try {
      // 模拟视频上传，返回一个mock的URL
      const mockVideoUrl = 'https://example.com/uploads/' + Date.now() + '.mp4';
      
      res.json({
        success: true,
        data: {
          url: mockVideoUrl
        }
      });
    } catch (error) {
      console.error('上传视频失败:', error);
      res.status(500).json({
        success: false,
        message: '上传视频失败'
      });
    }
  }
);

// ==================== 工具接口 ====================

/**
 * 获取系统配置
 * GET /api/config
 */
router.get('/config',
  authMiddleware.requireAuth,
  systemController.getConfig
);

/**
 * 生成分享链接
 * POST /api/share/video
 */
router.post('/share/video',
  authMiddleware.requireAuth,
  validationMiddleware.validateShareRequest,
  shareController.generateVideoShare
);

/**
 * 验证分享链接
 * GET /api/share/verify
 */
router.get('/share/verify',
  shareController.verifyShare
);

module.exports = router;