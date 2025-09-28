/**
 * 认证中间件
 * 处理用户身份验证和权限验证
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const membershipService = require('../services/membershipService');
const userService = require('../services/userService');

class AuthMiddleware {
  constructor(config) {
    this.config = config;
    this.membershipService = membershipService;
    this.userService = userService;
    this.jwtVerify = promisify(jwt.verify);
  }
  /**
   * 验证JWT令牌
   */
  async verifyToken(token) {
    try {
      if (!token) {
        throw new Error('缺少认证令牌');
      }
      
      // 从Bearer令牌中提取
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 验证用户是否存在且状态正常
      const user = await this.userService.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      return {
        userId: decoded.userId,
        userInfo: user
      };
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的令牌');
      }
      throw error;
    }
  }

  /**
   * 必须认证中间件
   */
  requireAuth() {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization || req.query.token;
        
        if (!token) {
          return res.status(401).json({
            code: 401,
            message: '请先登录',
            error: 'AUTH_REQUIRED'
          });
        }
        
        const authData = await this.verifyToken(token);
        
        // 将用户信息添加到请求对象中
        req.user = authData.userInfo;
        req.userId = authData.userId;
        
        next();
        
      } catch (error) {
        return res.status(401).json({
          code: 401,
          message: '认证失败: ' + error.message,
          error: 'AUTH_FAILED'
        });
      }
    };
  }

  /**
   * 可选认证中间件
   */
  optionalAuth() {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization || req.query.token;
        
        if (token) {
          const authData = await this.verifyToken(token);
          req.user = authData.userInfo;
          req.userId = authData.userId;
          req.isAuthenticated = true;
        } else {
          req.isAuthenticated = false;
          req.user = null;
          req.userId = null;
        }
        
        next();
        
      } catch (error) {
        // 对于可选认证，认证失败也继续处理
        req.isAuthenticated = false;
        req.user = null;
        req.userId = null;
        next();
      }
    };
  }

  /**
   * 管理员权限验证
   */
  requireAdmin() {
    return async (req, res, next) => {
      try {
        // 先验证普通认证
        const token = req.headers.authorization || req.query.token;
        const authData = await this.verifyToken(token);
        
        // 检查是否是管理员（这里可以根据实际需求实现）
        // 简化实现：检查用户ID是否在管理员列表中
        const adminUsers = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
        
        if (!adminUsers.includes(authData.userId)) {
          return res.status(403).json({
            code: 403,
            message: '需要管理员权限',
            error: 'ADMIN_REQUIRED'
          });
        }
        
        req.user = authData.userInfo;
        req.userId = authData.userId;
        req.isAdmin = true;
        
        next();
        
      } catch (error) {
        return res.status(401).json({
          code: 401,
          message: '认证失败: ' + error.message,
          error: 'AUTH_FAILED'
        });
      }
    };
  }

  /**
   * 会员权限验证
   */
  requireMembership(level = 1) {
    return async (req, res, next) => {
      try {
        // 先验证普通认证
        const token = req.headers.authorization || req.query.token;
        const authData = await this.verifyToken(token);
        
        const user = authData.userInfo;
        
        // 检查会员状态
        const isMemberActive = user.member_expire_date && 
                              new Date(user.member_expire_date) > new Date();
        
        if (!isMemberActive || user.member_level < level) {
          return res.status(403).json({
            code: 403,
            message: `需要${level === 1 ? '普通会员' : '高级会员'}权限`,
            error: 'MEMBERSHIP_REQUIRED',
            requiredLevel: level,
            currentLevel: user.member_level
          });
        }
        
        req.user = user;
        req.userId = authData.userId;
        
        next();
        
      } catch (error) {
        return res.status(401).json({
          code: 401,
          message: '认证失败: ' + error.message,
          error: 'AUTH_FAILED'
        });
      }
    };
  }

  /**
   * 生成JWT令牌
   */
  generateToken(userId, expiresIn = '7d') {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  }

  /**
   * 微信登录验证
   */
  async verifyWechatLogin(code) {
    try {
      // 调用微信API验证code并获取用户信息
      // 这里需要集成微信小程序登录API
      
      // 简化实现，实际需要调用微信接口
      const wechatResponse = await this.callWechatAPI(code);
      
      if (!wechatResponse.openid) {
        throw new Error('微信登录验证失败');
      }
      
      // 查找或创建用户
      let user = await this.userService.getUserByOpenid(wechatResponse.openid);
      const isNewUser = !user;
      
      if (!user) {
        // 创建新用户
        const userData = {
          openid: wechatResponse.openid,
          unionid: wechatResponse.unionid,
          nickname: wechatResponse.nickname,
          avatar_url: wechatResponse.avatar_url
        };
        
        const createResult = await this.userService.createUser(userData);
        if (!createResult.success) {
          throw new Error(createResult.error || '创建用户失败');
        }
        user = createResult.user;
      }
      
      // 生成JWT令牌
      const token = this.generateToken(user.id);
      
      return {
        token,
        user,
        isNewUser
      };
      
    } catch (error) {
      console.error('微信登录验证失败:', error);
      throw error;
    }
  }

  /**
   * 调用微信API（占位实现）
   */
  async callWechatAPI(code) {
    // 实际实现需要调用微信小程序登录接口
    // https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
    
    // 简化实现
    return {
      openid: 'mock_openid_' + code,
      unionid: 'mock_unionid_' + code,
      nickname: '微信用户',
      avatar_url: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
    };
  }
}

module.exports = (config) => new AuthMiddleware(config);