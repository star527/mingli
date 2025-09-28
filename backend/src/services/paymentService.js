/**
 * 支付服务模块
 * 处理微信支付和支付宝支付相关逻辑
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const userService = require('./userService');
const membershipService = require('./membershipService');

class PaymentService {
  constructor() {
    // 支付配置，实际应用中从环境变量读取
    this.wechatPayConfig = {
      appid: process.env.WECHAT_APPID || '',
      mchId: process.env.WECHAT_MCH_ID || '',
      apiKey: process.env.WECHAT_API_KEY || '',
      notifyUrl: process.env.WECHAT_NOTIFY_URL || ''
    };
    
    this.alipayConfig = {
      appId: process.env.ALIPAY_APPID || '',
      privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
      alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || '',
      notifyUrl: process.env.ALIPAY_NOTIFY_URL || ''
    };
  }

  /**
   * 创建订单记录
   */
  async createOrder(orderData) {
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      // 插入订单记录
      const sql = `
        INSERT INTO orders (
          id, user_id, order_type, product_id, product_name,
          amount, original_amount, discount_amount,
          payment_method, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // 设置默认值
      const productName = this.getProductName(orderData.type, orderData.productId, orderData.duration);
      const originalAmount = orderData.amount;
      const discountAmount = orderData.discountAmount || 0;
      
      await query(sql, [
        orderId, orderData.userId, orderData.type, orderData.productId, productName,
        orderData.amount, originalAmount, discountAmount,
        orderData.paymentMethod || null, 'pending', now, now
      ]);
      
      return {
        id: orderId,
        ...orderData,
        status: 'pending',
        createdAt: now
      };
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取产品名称
   */
  getProductName(orderType, productId, duration) {
    if (orderType === 'membership') {
      const levelName = productId === 'BASIC' ? '普通会员' : '高级会员';
      return `${levelName}${duration || 1}个月`;
    } else if (orderType === 'video') {
      return `视频课程购买`;
    }
    return '未知产品';
  }

  /**
   * 创建支付订单
   */
  async createPayment(order, paymentMethod = 'wechat') {
    try {
      if (paymentMethod === 'wechat') {
        return await this.createWechatPayment(order);
      } else if (paymentMethod === 'alipay') {
        return await this.createAlipayPayment(order);
      }
      throw new Error('不支持的支付方式');
    } catch (error) {
      console.error('创建支付失败:', error);
      throw error;
    }
  }

  /**
   * 创建微信支付订单
   */
  async createWechatPayment(order) {
    // 这里是模拟实现，实际需要调用微信支付API
    // 在真实环境中，需要使用微信支付SDK生成预支付订单
    return {
      paymentUrl: `weixin://wxpay/bizpayurl?pr=${order.id}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: uuidv4(),
      package: 'prepay_id=mock_prepay_id_' + order.id,
      signType: 'MD5',
      paySign: 'mock_sign_' + order.id
    };
  }

  /**
   * 创建支付宝支付订单
   */
  async createAlipayPayment(order) {
    // 这里是模拟实现，实际需要调用支付宝API
    // 在真实环境中，需要使用支付宝SDK生成支付链接
    return {
      paymentUrl: `alipays://platformapi/startapp?appId=20000067&actionType=toAccount&goBack=YES&amount=${order.amount}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`,
      orderString: `alipay_sdk=alipay-sdk-node&app_id=${this.alipayConfig.appId}&biz_content={"out_trade_no":"${order.id}","total_amount":"${order.amount}","subject":"${order.productId}","buyer_id":"","notify_url":"${this.alipayConfig.notifyUrl}","product_code":"FAST_INSTANT_TRADE_PAY"}`
    };
  }

  /**
   * 验证支付回调签名
   */
  async verifyCallbackSignature(req, paymentMethod) {
    try {
      if (paymentMethod === 'wechat') {
        return await this.verifyWechatSignature(req);
      } else if (paymentMethod === 'alipay') {
        return await this.verifyAlipaySignature(req);
      }
      return false;
    } catch (error) {
      console.error('验证签名失败:', error);
      return false;
    }
  }

  /**
   * 验证微信支付回调签名
   */
  async verifyWechatSignature(req) {
    // 模拟验证逻辑，实际需要解析XML并使用微信支付密钥验证
    return true;
  }

  /**
   * 验证支付宝回调签名
   */
  async verifyAlipaySignature(req) {
    // 模拟验证逻辑，实际需要使用支付宝SDK验证
    return true;
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(orderId, paymentStatus, transactionId) {
    try {
      const sql = `
        UPDATE orders 
        SET payment_status = ?, transaction_id = ?, updated_at = ? 
        WHERE id = ?
      `;
      
      await query(sql, [paymentStatus, transactionId, new Date(), orderId]);
      
      // 如果支付成功，处理业务逻辑
      if (paymentStatus === 'success') {
        await this.handleSuccessfulPayment(orderId);
      }
      
      return true;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
  }

  /**
   * 处理成功支付
   */
  async handleSuccessfulPayment(orderId) {
    try {
      // 获取订单信息
      const sql = 'SELECT * FROM orders WHERE id = ?';
      const [order] = await query(sql, [orderId]);
      
      if (!order) {
        throw new Error('订单不存在');
      }
      
      // 根据订单类型处理
      if (order.order_type === 'membership') {
        await this.handleMembershipPayment(order);
      } else if (order.order_type === 'video') {
        await this.handleVideoPayment(order);
      }
      
    } catch (error) {
      console.error('处理支付成功逻辑失败:', error);
      throw error;
    }
  }

  /**
   * 处理会员支付成功
   */
  async handleMembershipPayment(order) {
    // 调用会员服务更新会员状态
    const duration = parseInt(order.product_name?.match(/\d+/)?.[0] || 1, 10);
    
    // 直接调用upgradeMembership方法来处理会员升级，这与控制器中的逻辑保持一致
    await membershipService.upgradeMembership(
      order.user_id, 
      parseInt(order.product_id), 
      duration,
      false, // 不自动设置自动续费，除非用户明确选择
      order.id
    );
  }

  /**
   * 处理视频支付成功
   */
  async handleVideoPayment(order) {
    // 将视频添加到用户的已购视频列表
    const sql = `
      INSERT INTO user_purchased_videos (user_id, video_id, purchased_at)
      VALUES (?, ?, ?)
    `;
    await query(sql, [order.user_id, order.product_id, new Date()]);
  }

  /**
   * 根据ID获取订单
   */
  async getOrderById(orderId, userId) {
    try {
      const sql = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
      const [order] = await query(sql, [orderId, userId]);
      return order;
    } catch (error) {
      console.error('获取订单失败:', error);
      throw error;
    }
  }

  /**
   * 应用优惠券
   */
  async applyCoupon(couponCode, userId, orderAmount, orderType) {
    try {
      // 查找优惠券
      const sql = `
        SELECT * FROM coupons 
        WHERE code = ? AND active = 1 AND expires_at > ?
      `;
      const [coupon] = await query(sql, [couponCode, new Date()]);
      
      if (!coupon) {
        return { valid: false, message: '优惠券无效或已过期' };
      }
      
      // 检查是否已使用
      const usageSql = `
        SELECT COUNT(*) as count FROM coupon_usage 
        WHERE coupon_id = ? AND user_id = ?
      `;
      const [usageResult] = await query(usageSql, [coupon.id, userId]);
      
      if (usageResult.count >= coupon.max_usage || usageResult.count >= coupon.max_usage_per_user) {
        return { valid: false, message: '优惠券已达到使用次数限制' };
      }
      
      // 计算优惠金额
      let discountAmount = 0;
      if (coupon.discount_type === 'fixed') {
        discountAmount = Math.min(coupon.discount_value, orderAmount);
      } else if (coupon.discount_type === 'percentage') {
        discountAmount = orderAmount * (coupon.discount_value / 100);
      }
      
      // 确保折扣后金额不小于0
      const finalAmount = Math.max(0, orderAmount - discountAmount);
      
      return {
        valid: true,
        discountAmount,
        finalAmount,
        coupon
      };
    } catch (error) {
      console.error('应用优惠券失败:', error);
      return { valid: false, message: '应用优惠券时出错' };
    }
  }

  /**
   * 记录优惠券使用
   */
  async recordCouponUsage(couponId, userId, orderId) {
    try {
      const sql = `
        INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at)
        VALUES (?, ?, ?, ?)
      `;
      await query(sql, [couponId, userId, orderId, new Date()]);
    } catch (error) {
      console.error('记录优惠券使用失败:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();