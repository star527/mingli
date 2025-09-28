/**
 * 通知服务
 * 处理各类通知的发送
 */

const { query } = require('../config/database');

class NotificationService {
  /**
   * 发送会员到期提醒通知
   */
  async sendMembershipExpiringNotification(userId, phone, email, daysRemaining, planType) {
    try {
      // 构建通知消息
      const message = this._buildExpiringMessage(planType, daysRemaining);
      
      // 记录通知
      await this._recordNotification(userId, 'membership_expiring', message, daysRemaining);
      
      // TODO: 实际发送通知（这里是模拟实现）
      // 在实际项目中，这里应该调用短信服务、邮件服务或推送服务
      console.log(`向用户 ${userId} 发送会员到期提醒: ${message}`);
      
      // 模拟发送邮件
      if (email) {
        console.log(`模拟发送邮件到 ${email}: ${message}`);
      }
      
      // 模拟发送短信
      if (phone) {
        console.log(`模拟发送短信到 ${phone}: ${message}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('发送会员到期提醒失败:', error);
      throw error;
    }
  }

  /**
   * 发送续费成功通知
   */
  async sendRenewalSuccessNotification(userId, planType, orderId) {
    try {
      const message = `您的${planType}会员已成功续费，订单号：${orderId}`;
      
      // 记录通知
      await this._recordNotification(userId, 'renewal_success', message);
      
      // TODO: 实际发送通知
      console.log(`向用户 ${userId} 发送续费成功通知: ${message}`);
      
      return { success: true };
    } catch (error) {
      console.error('发送续费成功通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送支付成功通知
   */
  async sendPaymentSuccessNotification(userId, amount, orderType, orderId) {
    try {
      const message = `您的${orderType}订单已支付成功，金额：¥${amount.toFixed(2)}，订单号：${orderId}`;
      
      // 记录通知
      await this._recordNotification(userId, 'payment_success', message);
      
      // TODO: 实际发送通知
      console.log(`向用户 ${userId} 发送支付成功通知: ${message}`);
      
      return { success: true };
    } catch (error) {
      console.error('发送支付成功通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送支付失败通知
   */
  async sendPaymentFailureNotification(userId, amount, orderType, errorMessage) {
    try {
      const message = `您的${orderType}订单支付失败，金额：¥${amount.toFixed(2)}，原因：${errorMessage}`;
      
      // 记录通知
      await this._recordNotification(userId, 'payment_failure', message);
      
      // TODO: 实际发送通知
      console.log(`向用户 ${userId} 发送支付失败通知: ${message}`);
      
      return { success: true };
    } catch (error) {
      console.error('发送支付失败通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    let db = null;
    try {
      db = await createDbConnection();
      
      const offset = (page - 1) * limit;
      
      const notifications = await executeQuery(db, `
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);
      
      const total = await executeQuery(db, `
        SELECT COUNT(*) as count FROM notifications
        WHERE user_id = ?
      `, [userId]);
      
      return {
        notifications,
        total: total[0]?.count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('获取用户通知失败:', error);
      throw error;
    } finally {
      if (db) {
        await closeDb(db);
      }
    }
  }

  /**
   * 标记通知为已读
   */
  async markNotificationAsRead(notificationId, userId) {
    try {
      await query(`
        UPDATE notifications
        SET is_read = 1, read_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);
      
      return { success: true };
    } catch (error) {
      console.error('标记通知已读失败:', error);
      throw error;
    }
  }

  /**
   * 构建到期提醒消息
   */
  _buildExpiringMessage(planType, daysRemaining) {
    const planNames = {
      'PREMIUM': '高级',
      'BASIC': '基础',
      'FREE': '免费'
    };
    
    const planName = planNames[planType] || planType;
    
    if (daysRemaining === 7) {
      return `尊敬的用户，您的${planName}会员将在7天后到期，为了不影响您的使用体验，建议您及时续费。`;
    } else if (daysRemaining === 3) {
      return `温馨提醒：您的${planName}会员仅剩3天有效期，请及时续费以继续享受会员权益。`;
    } else if (daysRemaining === 1) {
      return `紧急提醒：您的${planName}会员将在明天到期，立即续费可继续使用会员服务。`;
    }
    
    return `您的${planName}会员将在${daysRemaining}天后到期，请及时续费。`;
  }

  /**
   * 记录通知到数据库
   */
  async _recordNotification(userId, type, message, extraData = null) {
    try {
      await query(`
        INSERT INTO notifications (user_id, type, message, extra_data, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, NOW())
      `, [userId, type, message, JSON.stringify(extraData)]);
    } catch (error) {
      console.error('记录通知失败:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();