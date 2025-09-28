/**
 * 用户控制器
 * 处理用户相关的业务逻辑
 */

const userService = require('../services/userService');
const authMiddleware = require('../middleware/auth');

class UserController {
  constructor(userService, authMiddleware) {
    this.userService = userService;
    this.authMiddleware = authMiddleware;
  }

  /**
   * 用户登录/注册
   */
  async login(req, res) {
    try {
      const { code, userInfo } = req.body;
      
      // 调用微信API验证登录并获取openid
      const wechatResponse = await authMiddleware.verifyWechatLogin(code);
      
      // 查找或创建用户
      const user = await this.userService.findOrCreateUser(wechatResponse.openid, userInfo);
      
      // 更新最后登录时间
      await this.userService.updateLastLogin(user.id);
      
      // 生成JWT token
      const token = authMiddleware.generateToken(user.id);
      
      // 返回成功响应
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar_url,
            membership: this.userService.getMembershipLabel(user.member_level),
            createdAt: user.created_at
          }
        }
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败: ' + error.message
      });
    }
  }

  /**
   * 获取用户信息
   */
  async getProfile(req, res) {
    try {
      // 从数据库获取用户信息
      const user = await this.userService.getUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 获取本月分析次数
      const analysisCountThisMonth = await this.userService.getAnalysisCountThisMonth(user.id);

      res.json({
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar_url,
          gender: user.gender,
          birthday: user.birthday,
          membership: this.userService.getMembershipLabel(user.member_level),
          memberLevel: user.member_level,
          membershipExpiry: user.member_expire_date,
          createdAt: user.created_at,
          analysisCount: user.analysis_count,
          analysisCountThisMonth,
          videoWatchTime: user.video_watch_time
        }
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(req, res) {
    try {
      const { nickname, avatar, gender, birthday, phone, email } = req.body;
      
      // 准备更新数据
      const updates = {};
      if (nickname !== undefined) updates.nickname = nickname;
      if (avatar !== undefined) updates.avatar = avatar;
      if (gender !== undefined) updates.gender = gender;
      if (birthday !== undefined) updates.birthday = birthday;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email;
      
      // 更新用户信息到数据库
      const result = await this.userService.updateUser(req.user.id, updates);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || '更新失败'
        });
      }
      
      res.json({
        success: true,
        message: '更新成功',
        data: updates
      });
    } catch (error) {
      console.error('更新用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败'
      });
    }
  }

  /**
   * 获取用户统计信息
   */
  async getStats(req, res) {
    try {
      const userId = req.user.id;
      
      // 获取本月分析次数
      const analysisCountThisMonth = await this.userService.getAnalysisCountThisMonth(userId);
      
      // 获取用户详情
      const user = await this.userService.getUserById(userId);
      
      res.json({
        success: true,
        data: {
          totalAnalysis: user.analysis_count,
          analysisThisMonth: analysisCountThisMonth,
          totalVideoWatchTime: user.video_watch_time,
          membershipLevel: user.member_level,
          membershipExpiry: user.member_expire_date
        }
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计失败'
      });
    }
  }
}

// 导出工厂函数，支持函数调用方式初始化
module.exports = (userService, authMiddleware) => new UserController(userService, authMiddleware);