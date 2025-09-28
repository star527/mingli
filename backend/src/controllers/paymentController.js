/**
 * 支付控制器
 * 处理支付相关的业务逻辑
 */

const paymentService = require('../services/paymentService');
const videoService = require('../services/videoService');

class PaymentController {
  constructor() {
    this.paymentService = paymentService;
    this.videoService = videoService;
  }

  /**
   * 创建会员订单
   */
  async createMembershipOrder(req, res) {
    try {
      const userId = req.user.id;
      const { membershipType, duration, couponCode, paymentMethod = 'wechat' } = req.body;
      
      // 计算基础价格
      let amount = this.calculateMembershipPrice(membershipType, duration);
      let discountAmount = 0;
      let coupon = null;
      
      // 如果有优惠券，应用优惠
      if (couponCode) {
        const couponResult = await this.paymentService.applyCoupon(couponCode, userId, amount, 'membership');
        if (!couponResult.valid) {
          return res.status(400).json({
            success: false,
            message: couponResult.message
          });
        }
        discountAmount = couponResult.discountAmount;
        amount = couponResult.finalAmount;
        coupon = couponResult.coupon;
      }
      
      // 创建订单记录
      const order = await this.paymentService.createOrder({
        userId,
        type: 'membership',
        productId: membershipType,
        duration,
        amount,
        originalAmount: amount + discountAmount,
        discountAmount,
        couponCode,
        paymentMethod
      });
      
      // 如果使用了优惠券，记录使用情况
      if (coupon) {
        await this.paymentService.recordCouponUsage(coupon.id, userId, order.id);
      }
      
      // 调用支付接口
      const paymentData = await this.paymentService.createPayment(order, paymentMethod);
      
      res.json({
        success: true,
        message: '创建订单成功',
        data: {
          orderId: order.id,
          amount: order.amount,
          originalAmount: order.original_amount,
          discountAmount: order.discount_amount,
          paymentData
        }
      });
    } catch (error) {
      console.error('创建会员订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建会员订单失败',
        error: error.message
      });
    }
  }

  /**
   * 创建视频订单
   */
  async createVideoOrder(req, res) {
    try {
      const userId = req.user.id;
      const { videoId, couponCode, paymentMethod = 'wechat' } = req.body;
      
      // 获取视频价格信息
      const videoInfo = await this.videoService.getVideoById(videoId);
      if (!videoInfo) {
        return res.status(404).json({
          success: false,
          message: '视频不存在'
        });
      }
      
      let amount = videoInfo.price || 0;
      let discountAmount = 0;
      let coupon = null;
      
      // 如果有优惠券，应用优惠
      if (couponCode) {
        const couponResult = await this.paymentService.applyCoupon(couponCode, userId, amount, 'video');
        if (!couponResult.valid) {
          return res.status(400).json({
            success: false,
            message: couponResult.message
          });
        }
        discountAmount = couponResult.discountAmount;
        amount = couponResult.finalAmount;
        coupon = couponResult.coupon;
      }
      
      // 创建订单记录
      const order = await this.paymentService.createOrder({
        userId,
        type: 'video',
        productId: videoId,
        productName: videoInfo.title || '视频课程',
        amount,
        originalAmount: amount + discountAmount,
        discountAmount,
        couponCode,
        paymentMethod
      });
      
      // 如果使用了优惠券，记录使用情况
      if (coupon) {
        await this.paymentService.recordCouponUsage(coupon.id, userId, order.id);
      }
      
      // 调用支付接口
      const paymentData = await this.paymentService.createPayment(order, paymentMethod);
      
      res.json({
        success: true,
        message: '创建订单成功',
        data: {
          orderId: order.id,
          amount: order.amount,
          originalAmount: order.original_amount,
          discountAmount: order.discount_amount,
          paymentData
        }
      });
    } catch (error) {
      console.error('创建视频订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建视频订单失败',
        error: error.message
      });
    }
  }

  /**
   * 支付回调处理
   */
  async paymentCallback(req, res) {
    try {
      const { orderId, paymentStatus, transactionId, paymentMethod = 'wechat' } = req.body;
      
      // 验证回调签名
      const isValid = await this.paymentService.verifyCallbackSignature(req, paymentMethod);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: '签名验证失败'
        });
      }
      
      // 更新订单状态
      await this.paymentService.updateOrderStatus(orderId, paymentStatus, transactionId);
      
      // 支付服务内部已经处理了支付成功的业务逻辑
      
      res.json({
        success: true,
        message: '回调处理成功'
      });
    } catch (error) {
      console.error('支付回调处理失败:', error);
      res.status(500).json({
        success: false,
        message: '支付回调处理失败',
        error: error.message
      });
    }
  }

  /**
   * 查询订单状态
   */
  async getOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;
      
      // 查询订单信息
      const order = await this.paymentService.getOrderById(orderId, userId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('查询订单状态失败:', error);
      res.status(500).json({
        success: false,
        message: '查询订单状态失败',
        error: error.message
      });
    }
  }

  /**
   * 计算会员价格
   */
  calculateMembershipPrice(membershipType, duration) {
    const basePrices = {
      'BASIC': { 1: 29, 3: 79, 12: 299 },
      'PREMIUM': { 1: 59, 3: 159, 12: 599 }
    };
    
    return basePrices[membershipType]?.[duration] || 0;
  }
}

module.exports = new PaymentController();