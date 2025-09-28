/**
 * 验证中间件
 * 请求参数验证和数据处理
 */

const { body, query, param, validationResult, custom } = require('express-validator');

class ValidationMiddleware {
  /**
   * 自定义验证函数 - 验证字符串不包含特殊字符
   */
  validateNoSpecialChars(value) {
    const specialChars = /[`!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~]/;
    if (specialChars.test(value)) {
      throw new Error('不能包含特殊字符');
    }
    return true;
  }

  /**
   * 自定义验证函数 - 验证手机号格式
   */
  validatePhone(value) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      throw new Error('手机号格式错误');
    }
    return true;
  }

  /**
   * 自定义验证函数 - 验证邮箱格式
   */
  validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('邮箱格式错误');
    }
    return true;
  }
  /**
   * 登录验证
   */
  validateLogin() {
    return [
      body('code').notEmpty().withMessage('微信code不能为空'),
      body('userInfo').optional().isObject().withMessage('用户信息格式错误'),
      body('userInfo.nickName').optional().isLength({ max: 50 }).withMessage('昵称长度不能超过50字符'),
      body('userInfo.avatarUrl').optional().isURL().withMessage('头像URL格式错误'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 用户资料更新验证
   */
  validateProfileUpdate() {
    return [
      body('nickname').optional()
        .isLength({ min: 1, max: 50 }).withMessage('昵称长度1-50字符')
        .custom((value) => this.validateNoSpecialChars(value)).withMessage('昵称不能包含特殊字符'),
      body('avatar').optional().isURL().withMessage('头像必须是有效URL'),
      body('gender').optional().isIn([0, 1, 2]).withMessage('性别参数错误'),
      body('birthday').optional().isISO8601().withMessage('生日格式错误'),
      body('phone').optional().custom((value) => this.validatePhone(value)).withMessage('手机号格式错误'),
      body('email').optional().custom((value) => this.validateEmail(value)).withMessage('邮箱格式错误'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 八字输入验证
   */
  validateBaziInput() {
    return [
      body('birthYear').isInt({ min: 1900, max: 2100 }).withMessage('出生年份必须在1900-2100之间'),
      body('birthMonth').isInt({ min: 1, max: 12 }).withMessage('出生月份必须在1-12之间'),
      body('birthDay').isInt({ min: 1, max: 31 }).withMessage('出生日期必须在1-31之间'),
      body('birthHour').isInt({ min: 0, max: 23 }).withMessage('出生时辰必须在0-23之间'),
      body('gender').isIn(['male', 'female']).withMessage('性别必须是male或female'),
      body('isLunar').optional().isBoolean().withMessage('是否为农历必须是布尔值'),
      body('name').optional().isLength({ max: 20 }).withMessage('姓名长度不能超过20字符'),
      // 自定义验证：验证日期的有效性
      custom((value, { req }) => {
        if (req.body.birthYear && req.body.birthMonth && req.body.birthDay) {
          const date = new Date(req.body.birthYear, req.body.birthMonth - 1, req.body.birthDay);
          if (date.getFullYear() !== req.body.birthYear || 
              date.getMonth() + 1 !== req.body.birthMonth || 
              date.getDate() !== req.body.birthDay) {
            throw new Error('无效的日期');
          }
        }
        return true;
      }),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 权限检查验证
   */
  validatePermissionCheck() {
    return [
      body('feature').isIn(['video_play', 'detailed_analysis', 'export_report', 'consultation']).withMessage('功能标识错误'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 观看进度验证
   */
  validateProgress() {
    return [
      body('progress').isFloat({ min: 0, max: 100 }).withMessage('进度必须在0-100之间'),
      body('duration').isFloat({ min: 0 }).withMessage('视频时长必须大于0'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 会员订单验证
   */
  validateMembershipOrder() {
    return [
      body('membershipType').isIn(['BASIC', 'PREMIUM']).withMessage('会员类型错误'),
      body('duration').isIn([1, 3, 12]).withMessage('时长必须是1、3或12个月'),
      body('couponCode').optional()
        .isLength({ min: 1, max: 20 }).withMessage('优惠券代码格式错误')
        .isAlphanumeric().withMessage('优惠券代码只能包含字母和数字'),
      body('paymentMethod').optional().isIn(['wechat', 'alipay']).withMessage('支付方式错误'),
      body('autoRenew').optional().isBoolean().withMessage('自动续费必须是布尔值'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 视频订单验证
   */
  validateVideoOrder() {
    return [
      body('videoId').isInt({ min: 1 }).withMessage('视频ID必须为正整数'),
      body('couponCode').optional()
        .isLength({ min: 1, max: 20 }).withMessage('优惠券代码格式错误')
        .isAlphanumeric().withMessage('优惠券代码只能包含字母和数字'),
      body('paymentMethod').optional().isIn(['wechat', 'alipay']).withMessage('支付方式错误'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 会员升级价格计算验证
   */
  validateUpgradePrice() {
    return [
      body('planId').isInt({ min: 0 }).withMessage('会员套餐ID必须为非负整数'),
      body('duration').optional().isIn([1, 3, 12]).withMessage('时长必须是1、3或12个月'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 视频上传验证
   */
  validateVideoUpload() {
    return [
      body('title').isLength({ min: 1, max: 100 }).withMessage('标题长度1-100字符'),
      body('description').optional().isLength({ max: 500 }).withMessage('描述不能超过500字符'),
      body('category').isIn(['八字基础', '命理分析', '实战案例', '风水知识']).withMessage('分类错误'),
      body('price').isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
      body('isFree').optional().isBoolean().withMessage('是否免费必须是布尔值'),
      body('membershipRequired').isIn(['FREE', 'BASIC', 'PREMIUM']).withMessage('会员要求错误'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 分享请求验证
   */
  validateShareRequest() {
    return [
      body('videoId').isInt({ min: 1 }).withMessage('视频ID必须为正整数'),
      body('expireHours').optional().isInt({ min: 1, max: 168 }).withMessage('过期时间必须在1-168小时之间'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 处理验证错误
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      // 记录验证错误日志
      console.warn('请求参数验证失败:', {
        path: req.path,
        method: req.method,
        errors: errors.array()
      });
      
      // 构建更友好的错误响应
      const errorDetails = errors.array().reduce((acc, error) => {
        if (!acc[error.path]) {
          acc[error.path] = [];
        }
        acc[error.path].push(error.msg);
        return acc;
      }, {});
      
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errorCount: errors.array().length,
        errors: errorDetails,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  }

  /**
   * 分页参数验证
   */
  validatePagination() {
    return [
      query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * ID参数验证
   */
  validateId() {
    return [
      param('id').isInt({ min: 1 }).withMessage('ID必须为正整数'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }

  /**
   * 视频ID参数验证
   */
  validateVideoId() {
    return [
      // 简化的验证逻辑，避免this上下文问题
      (req, res, next) => {
        console.log('[VALIDATION DEBUG] 验证videoId参数:', req.params.videoId);
        // 简单验证：确保videoId存在且不为空
        if (!req.params.videoId || typeof req.params.videoId !== 'string') {
          return res.status(400).json({
            success: false,
            message: '视频ID必须为有效的字符串',
            errors: { videoId: ['视频ID格式错误'] }
          });
        }
        next();
      }
    ];
  }

  /**
   * 视频搜索参数验证
   */
  validateVideoSearch() {
    const validation = [
      query('q').optional().isLength({ max: 100 }).withMessage('搜索关键词不能超过100字符'),
      query('category').optional().isIn(['八字基础', '命理分析', '实战案例', '风水知识']).withMessage('分类错误'),
      query('sortBy').optional().isIn(['newest', 'popularity', 'price']).withMessage('排序方式错误'),
      query('minPrice').optional().isFloat({ min: 0 }).withMessage('最低价格必须大于等于0'),
      query('maxPrice').optional().isFloat({ min: 0 }).withMessage('最高价格必须大于等于0'),
      query('isFree').optional().isBoolean().withMessage('是否免费必须是布尔值'),
      query('isLiked').optional().isBoolean().withMessage('是否点赞必须是布尔值')
    ];
    
    // 添加分页验证（直接添加分页验证规则，避免this上下文问题）
    validation.push(query('page').optional().isInt({ min: 1 }).withMessage('页码必须为正整数'));
    validation.push(query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'));
    
    // 添加最终的错误处理
    validation.push((req, res, next) => this.handleValidationErrors(req, res, next));
    
    return validation;
  }

  /**
   * 批量更新视频验证
   */
  validateBatchUpdateVideos() {
    return [
      body('videoIds').isArray().withMessage('视频ID列表必须是数组'),
      body('videoIds.*').isInt({ min: 1 }).withMessage('视频ID必须为正整数'),
      body('updates').isObject().withMessage('更新内容必须是对象'),
      body('updates.category').optional().isIn(['八字基础', '命理分析', '实战案例', '风水知识']).withMessage('分类错误'),
      body('updates.price').optional().isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
      body('updates.isFree').optional().isBoolean().withMessage('是否免费必须是布尔值'),
      body('updates.membershipRequired').optional().isIn(['FREE', 'BASIC', 'PREMIUM']).withMessage('会员要求错误'),
      body('updates.status').optional().isIn(['draft', 'published', 'archived']).withMessage('状态错误'),
      (req, res, next) => this.handleValidationErrors(req, res, next)
    ];
  }
}

module.exports = new ValidationMiddleware();