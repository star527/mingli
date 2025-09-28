/**
 * 会员控制器
 * 处理会员相关的业务逻辑
 */

const membershipService = require('../services/membershipService');
const { query } = require('../config/database');

class MembershipController {
  constructor() {
    this.membershipService = membershipService;
  }

  /**
   * 获取会员信息
   */
  async getMembershipInfo(req, res) {
    try {
      const userId = req.user.id;
      
      // 获取会员信息
      const membershipInfo = await this.membershipService.getUserMembership(userId);
      
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

  /**
   * 获取会员权益
   */
  async getBenefits(req, res) {
    try {
      const userId = req.user.id;
      
      // 获取会员权益
      const benefits = await this.membershipService.getMembershipBenefits(userId);
      
      res.json({
        success: true,
        data: benefits
      });
    } catch (error) {
      console.error('获取会员权益失败:', error);
      res.status(500).json({
        success: false,
        message: '获取会员权益失败'
      });
    }
  }

  /**
   * 检查功能权限
   */
  async checkPermission(req, res) {
    try {
      const userId = req.user.id;
      const { feature } = req.body;
      
      // 检查权限
      const hasPermission = await this.membershipService.checkFeaturePermission(userId, feature);
      
      res.json({
        success: true,
        data: {
          hasPermission,
          feature
        }
      });
    } catch (error) {
      console.error('检查权限失败:', error);
      res.status(500).json({
        success: false,
        message: '检查权限失败'
      });
    }
  }

  /**
   * 获取会员套餐列表
   */
  async getPlans(req, res) {
    try {
      const plans = await this.membershipService.getMembershipPlans();
      
      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error('获取会员套餐失败:', error);
      res.status(500).json({
        success: false,
        message: '获取会员套餐失败'
      });
    }
  }

  /**
   * 会员升级
   */
  async upgrade(req, res) {
    try {
      const userId = req.user.id;
      const { planId, duration, autoRenew, couponCode } = req.body;
      
      // 创建升级订单
      const order = await this.membershipService.upgradeMembership(
        userId, 
        planId, 
        duration, 
        autoRenew || false,
        couponCode
      );
      
      res.json({
        success: true,
        message: '创建升级订单成功',
        data: order
      });
    } catch (error) {
      console.error('会员升级失败:', error);
      res.status(500).json({
        success: false,
        message: '会员升级失败: ' + (error.message || '未知错误')
      });
    }
  }

  /**
   * 设置自动续费
   */
  async setupAutoRenew(req, res) {
    try {
      const userId = req.user.id;
      const { enabled, paymentMethodId, level, duration } = req.body;
      
      // 调用updateAutoRenew方法而不是setupAutoRenew
      const result = await this.membershipService.updateAutoRenew(userId, enabled, level, duration);
      
      // 如果开启了自动续费且提供了支付方式，更新支付方式ID
      if (enabled && paymentMethodId) {
        await query(`
          UPDATE auto_renew_configs 
          SET payment_method_id = ? 
          WHERE user_id = ?
        `, [paymentMethodId, userId]);
      }
      
      res.json({
        success: result.success,
        message: result.message || (enabled ? '自动续费已开启' : '自动续费已关闭')
      });
    } catch (error) {
      console.error('设置自动续费失败:', error);
      res.status(500).json({
        success: false,
        message: '设置自动续费失败: ' + error.message
      });
    }
  }

  /**
   * 获取自动续费状态
   */
  async getAutoRenewStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const status = await this.membershipService.getAutoRenewStatus(userId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('获取自动续费状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取自动续费状态失败'
      });
    }
  }

  /**
   * 计算会员升级价格
   */
  async calculateUpgradePrice(req, res) {
    try {
      const userId = req.user.id;
      const { planId, duration, couponCode } = req.body;
      
      const priceInfo = await this.membershipService.calculateUpgradePrice(
        userId, 
        planId, 
        duration,
        couponCode
      );
      
      res.json({
        success: true,
        data: priceInfo
      });
    } catch (error) {
      console.error('计算升级价格失败:', error);
      res.status(500).json({
        success: false,
        message: '计算升级价格失败'
      });
    }
  }

  /**
 * 验证优惠券
 */
  async validateCoupon(req, res) {
    try {
      const { couponCode, planId, duration } = req.body;
      
      const couponInfo = await this.membershipService.validateCoupon(
        couponCode, 
        planId, 
        duration
      );
      
      res.json({
        success: true,
        data: couponInfo
      });
    } catch (error) {
      console.error('验证优惠券失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '优惠券无效'
      });
    }
  }
  
  /**
   * 计算会员升级价格
   */
  async calculateUpgradePrice(req, res) {
    try {
      const userId = req.user.id;
      const { planId, duration = 1 } = req.body;
      
      // 计算升级价格
      const price = await this.membershipService.calculateUpgradePrice(userId, parseInt(planId), duration);
      
      res.json({
        success: true,
        data: {
          price: price,
          planId: planId,
          duration: duration
        }
      });
    } catch (error) {
      console.error('计算会员升级价格失败:', error);
      res.status(500).json({
        success: false,
        message: '计算会员升级价格失败: ' + (error.message || '未知错误')
      });
    }
  }

  /**
   * 检查视频访问权限
   */
  async checkVideoAccess(req, res) {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = req.user.id;

      // 参数验证
      if (!videoId || isNaN(videoId)) {
        return res.status(400).json({ success: false, message: '无效的视频ID' });
      }

      // 检查视频访问权限
      const accessInfo = await this.membershipService.checkVideoAccess(userId, videoId);

      return res.json({
        success: true,
        data: {
          hasAccess: accessInfo.hasAccess,
          reason: accessInfo.reason,
          accessType: accessInfo.accessType,
          expiresAt: accessInfo.expiresAt
        }
      });
    } catch (error) {
      console.error('检查视频访问权限失败:', error);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }
}

module.exports = new MembershipController();