/**
 * 会员服务模块
 * 处理会员等级、权限、视频课程访问控制
 */

const userService = require('./userService');
const { query } = require('../config/database');

class MembershipService {
  constructor() {
    // 不再需要传入db参数，直接使用userService
    this.userService = userService;
    this.memberLevels = {
      FREE: 0,      // 免费用户
      BASIC: 1,     // 普通会员
      PREMIUM: 2    // 高级会员
    };
    
    // 会员权益定义
    this.memberBenefits = {
      [this.memberLevels.FREE]: {
        name: '免费用户',
        price: 0,
        features: [
          '基础八字排盘',
          '简单命理分析',
          '五行基础解读'
        ],
        videoAccess: false,
        maxAnalyses: 3, // 每月免费分析次数
        prioritySupport: false,
        exclusiveContent: false
      },
      [this.memberLevels.BASIC]: {
        name: '普通会员',
        features: [
          '深度命理分析',
          '视频课程观看',
          '运势预测',
          '无限次分析',
          '学习进度跟踪'
        ],
        videoAccess: true,
        maxAnalyses: -1, // 无限次
        prioritySupport: false,
        exclusiveContent: false
      },
      [this.memberLevels.PREMIUM]: {
        name: '高级会员',
        features: [
          '专家一对一咨询',
          '专属命理报告',
          '优先技术支持',
          '所有视频课程',
          '离线下载功能'
        ],
        videoAccess: true,
        maxAnalyses: -1,
        expertConsultation: true,
        prioritySupport: true,
        exclusiveContent: true
      }
    };
    
    // 会员价格定义（不同时长）
    this.memberPrices = {
      [this.memberLevels.BASIC]: {
        1: 29,    // 一个月
        3: 79,    // 三个月 (优惠价)
        12: 299   // 一年 (优惠价)
      },
      [this.memberLevels.PREMIUM]: {
        1: 99,
        3: 259,
        12: 899
      }
    };
    
    // 升级优惠比例
    this.upgradeDiscount = 0.1; // 10%折扣
  }

  /**
   * 获取用户会员信息
   */
  async getUserMembership(userId) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        return this.createFreeMembership(userId);
      }
      
      // 获取用户会员记录
      const sql = `
        SELECT * FROM user_memberships 
        WHERE user_id = ? 
        ORDER BY created_at DESC LIMIT 1
      `;
      const [membershipRecord] = await query(sql, [userId]);
      
      // 确定当前会员等级和过期时间
      const level = user.member_level || membershipRecord?.level || this.memberLevels.FREE;
      const expireDate = user.member_expire_date || membershipRecord?.expires_at;
      const autoRenew = membershipRecord?.auto_renew || false;
      
      return {
        userId: user.id,
        level: level,
        benefits: this.memberBenefits[level] || this.memberBenefits[this.memberLevels.FREE],
        expireDate: expireDate,
        isActive: this.isMembershipActive(expireDate),
        remainingAnalyses: await this.getRemainingAnalyses(userId),
        autoRenew: autoRenew,
        createdAt: membershipRecord?.created_at
      };
    } catch (error) {
      console.error('获取用户会员信息失败:', error);
      return this.createFreeMembership(userId);
    }
  }

  /**
   * 检查会员状态是否有效
   */
  isMembershipActive(expireDate) {
    if (!expireDate) return false;
    return new Date(expireDate) > new Date();
  }

  /**
   * 创建免费会员
   */
  createFreeMembership(userId) {
    return {
      userId: userId,
      level: this.memberLevels.FREE,
      benefits: this.memberBenefits[this.memberLevels.FREE],
      expireDate: null,
      isActive: true,
      remainingAnalyses: this.memberBenefits[this.memberLevels.FREE].maxAnalyses
    };
  }

  /**
   * 获取剩余分析次数
   */
  async getRemainingAnalyses(userId) {
    try {
      const membership = await this.getUserMembership(userId);
      
      if (membership.level === this.memberLevels.FREE) {
        const usedCount = await this.userService.getAnalysisCountThisMonth(userId);
        return Math.max(0, membership.benefits.maxAnalyses - usedCount);
      }
      
      return -1; // 会员无限次
    } catch (error) {
      console.error('获取剩余分析次数失败:', error);
      return 0;
    }
  }

  /**
   * 检查用户是否有权限访问功能
   */
  async checkPermission(userId, feature) {
    const membership = await this.getUserMembership(userId);
    
    switch (feature) {
      case 'deep_analysis':
        return membership.level > this.memberLevels.FREE;
        
      case 'video_course':
        return membership.benefits.videoAccess;
        
      case 'expert_consultation':
        return membership.level === this.memberLevels.PREMIUM;
        
      case 'bazi_analysis':
        return membership.remainingAnalyses !== 0;
        
      default:
        return false;
    }
  }

  /**
   * 升级会员等级
   */
  async upgradeMembership(userId, targetLevel, duration = 1, autoRenew = false, paymentId = null) {
    try {
      const currentMembership = await this.getUserMembership(userId);
      
      // 验证目标等级
      if (!Object.values(this.memberLevels).includes(targetLevel)) {
        throw new Error('无效的会员等级');
      }
      
      // 计算过期时间
      const expireDate = this.calculateExpireDate(targetLevel, duration, currentMembership.expireDate);
      
      // 插入会员记录到独立的会员表
      const now = new Date();
      const sql = `
        INSERT INTO user_memberships 
        (user_id, level, duration, expires_at, auto_renew, payment_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [
        userId, targetLevel, duration, expireDate, 
        autoRenew ? 1 : 0, paymentId, now, now
      ]);
      
      // 更新用户表中的会员信息
      const updateResult = await this.userService.updateUserMembership(userId, {
        memberLevel: targetLevel,
        memberExpireDate: expireDate,
        lastUpgradeDate: now
      });
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || '更新会员信息失败');
      }
      
      // 记录升级日志
      console.log(`用户 ${userId} 会员升级成功: ${targetLevel}, 时长 ${duration}个月, 有效期至: ${expireDate}`);
      
      // 如果开启自动续费，记录到自动续费配置
      if (autoRenew) {
        await this.setupAutoRenew(userId, targetLevel, duration);
      }
      
      return {
        success: true,
        newLevel: targetLevel,
        expireDate: expireDate,
        benefits: this.memberBenefits[targetLevel],
        autoRenew: autoRenew,
        message: '会员升级成功'
      };
      
    } catch (error) {
      console.error('升级会员失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证支付信息
   */
  async validatePayment(paymentInfo) {
    // 这里集成微信支付/支付宝验证逻辑
    // 简化实现，实际需要调用支付平台API
    return true;
  }

  /**
   * 计算会员过期时间
   */
  calculateExpireDate(level, duration = 1, currentExpireDate = null) {
    // 如果当前会员有效，从当前过期时间开始计算
    const expireDate = currentExpireDate && this.isMembershipActive(currentExpireDate) 
      ? new Date(currentExpireDate) 
      : new Date();
    
    // 根据时长计算过期时间
    expireDate.setMonth(expireDate.getMonth() + duration);
    
    return expireDate;
  }
  
  /**
   * 设置自动续费
   */
  async setupAutoRenew(userId, level, duration, paymentMethodId = null) {
    try {
      const sql = `
        INSERT OR REPLACE INTO auto_renew_configs 
        (user_id, member_level, duration, next_renew_date, status, created_at, updated_at, enabled${paymentMethodId ? ', payment_method_id' : ''})
        VALUES (?, ?, ?, ?, ?, ?, ?, ?${paymentMethodId ? ', ?' : ''})
      `;
      
      // 计算下次续费日期（当前会员到期前3天）
      const membership = await this.getUserMembership(userId);
      const nextRenewDate = new Date(membership.expireDate);
      nextRenewDate.setDate(nextRenewDate.getDate() - 3);
      
      const params = [
        userId, level, duration, nextRenewDate,
        'active', new Date(), new Date(), true
      ];
      
      if (paymentMethodId) {
        params.push(paymentMethodId);
      }
      
      await query(sql, params);
      
      return { success: true, message: '自动续费设置成功' };
    } catch (error) {
      console.error('设置自动续费失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 更新自动续费设置
   */
  async updateAutoRenew(userId, enabled, level = null, duration = null, paymentMethodId = null) {
    try {
      if (enabled) {
        // 启用自动续费
        if (!level || !duration) {
          // 如果没有提供等级和时长，使用当前会员设置
          const membership = await this.getUserMembership(userId);
          level = level || membership.level;
          duration = duration || 1; // 默认1个月
        }
        
        return await this.setupAutoRenew(userId, level, duration, paymentMethodId);
      } else {
        // 禁用自动续费
        const sql = `
          UPDATE auto_renew_configs 
          SET status = 'disabled', enabled = 0, updated_at = ? 
          WHERE user_id = ?
        `;
        await query(sql, [new Date(), userId]);
        
        return { success: true, message: '自动续费已关闭' };
      }
    } catch (error) {
      console.error('更新自动续费设置失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 检查即将到期的会员
   */
  async checkExpiringMemberships() {
    try {
      // 查找7天内即将到期的会员
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      
      const sql = `
        SELECT u.id, u.name, u.member_level, u.member_expire_date 
        FROM users u 
        WHERE u.member_expire_date IS NOT NULL 
        AND u.member_expire_date <= ? 
        AND u.member_expire_date > ?
      `;
      const expiringMembers = await query(sql, [sevenDaysLater, new Date()]);
      
      // 这里应该调用通知服务发送提醒
      for (const member of expiringMembers) {
        console.log(`会员即将到期提醒: 用户 ${member.id}, 等级 ${member.member_level}, 到期时间 ${member.member_expire_date}`);
        
        // TODO: 实现通知发送逻辑
        // await notificationService.sendMembershipExpireReminder(member.id, member.member_expire_date);
      }
      
      return expiringMembers;
    } catch (error) {
      console.error('检查即将到期会员失败:', error);
      return [];
    }
  }
  
  /**
   * 获取会员价格信息
   */
  getMembershipPrice(level, duration = 1) {
    return this.memberPrices[level]?.[duration] || 0;
  }
  
  /**
   * 计算会员升级价格（考虑当前会员剩余时间）
   */
  async calculateUpgradePrice(userId, targetLevel, duration = 1) {
    try {
      const currentMembership = await this.getUserMembership(userId);
      let basePrice = this.getMembershipPrice(targetLevel, duration);
      
      // 如果用户当前已是会员且有效，计算剩余价值并抵扣
      if (currentMembership.isActive && currentMembership.level !== this.memberLevels.FREE) {
        const currentPrice = this.getMembershipPrice(currentMembership.level, 1); // 月单价
        const daysRemaining = Math.ceil(
          (new Date(currentMembership.expireDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        const remainingValue = (currentPrice / 30) * daysRemaining;
        
        // 应用升级折扣
        basePrice = Math.max(0, basePrice - remainingValue) * (1 - this.upgradeDiscount);
      }
      
      return Math.round(basePrice * 100) / 100; // 保留两位小数
    } catch (error) {
      console.error('计算升级价格失败:', error);
      return this.getMembershipPrice(targetLevel, duration);
    }
  }

  /**
   * 检查视频课程访问权限
   */
  async checkVideoAccess(userId, videoId) {
    try {
      // 首先检查用户是否单独购买了此视频
      const purchaseSql = `
        SELECT * FROM user_purchased_videos 
        WHERE user_id = ? AND video_id = ?
      `;
      const [purchase] = await query(purchaseSql, [userId, videoId]);
      
      if (purchase) {
        // 用户单独购买了此视频
        return {
          accessible: true,
          accessType: 'purchase',
          purchasedAt: purchase.purchased_at,
          videoUrl: await this.generateVideoUrl(videoId, userId)
        };
      }
      
      // 检查会员权限
      const membership = await this.getUserMembership(userId);
      
      if (!membership.isActive) {
        return {
          accessible: false,
          reason: '会员已过期'
        };
      }
      
      if (!membership.benefits.videoAccess) {
        return {
          accessible: false,
          reason: '需要会员才能观看视频课程',
          suggestedAction: 'upgrade_membership'
        };
      }
      
      // 检查视频是否属于高级会员专属
      const videoSql = `SELECT is_premium FROM videos WHERE id = ?`;
      const [video] = await query(videoSql, [videoId]);
      
      if (video && video.is_premium && membership.level !== this.memberLevels.PREMIUM) {
        return {
          accessible: false,
          reason: '此视频需要高级会员权限',
          suggestedAction: 'upgrade_to_premium'
        };
      }
      
      return {
        accessible: true,
        accessType: 'membership',
        membershipLevel: membership.level,
        videoUrl: await this.generateVideoUrl(videoId, userId)
      };
    } catch (error) {
      console.error('检查视频访问权限失败:', error);
      return {
        accessible: false,
        reason: '系统错误，请稍后重试'
      };
    }
  }

  /**
   * 生成带权限验证的视频URL
   */
  async generateVideoUrl(videoId, userId) {
    // 生成带有时效性的访问令牌
    const token = this.generateAccessToken(userId, videoId);
    
    // 实际项目中这里会调用云存储服务的API
    return `https://video.mingli.com/${videoId}?token=${token}`;
  }

  /**
   * 生成视频访问令牌
   */
  async generateAccessToken(userId, videoId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 1); // 1小时后过期
    
    // 保存访问令牌到Redis（这里是模拟实现）
    console.log(`生成视频访问令牌: ${token}，用户: ${userId}，视频: ${videoId}`);
    
    return {
      token,
      expiresAt: expiration
    };
  }

  /**
   * 获取自动续费状态
   */
  async getAutoRenewStatus(userId) {
    try {
      const result = await query(`
        SELECT * FROM auto_renew_configs 
        WHERE user_id = ?
      `, [userId]);
      
      if (result.length === 0) {
        return {
          enabled: false,
          status: 'not_configured'
        };
      }
      
      return {
        enabled: result[0].enabled === 1,
        paymentMethodId: result[0].payment_method_id,
        status: result[0].status || 'active',
        lastAttemptAt: result[0].last_attempt_at,
        lastRenewalAt: result[0].last_renewal_at
      };
    } catch (error) {
      console.error('获取自动续费状态失败:', error);
      throw error;
    }
  }

  /**
   * 验证优惠券
   */
  async validateCoupon(couponCode, planId, duration) {
    try {
      // 查询优惠券信息
      const result = await query(`
        SELECT * FROM coupons 
        WHERE code = ? 
        AND status = 'active'
        AND (usage_limit IS NULL OR usage_count < usage_limit)
        AND (expire_date IS NULL OR expire_date >= date('now'))
      `, [couponCode]);
      
      if (result.length === 0) {
        throw new Error('优惠券不存在或已失效');
      }
      
      const coupon = result[0];
      
      // 检查适用的会员类型
      if (coupon.applicable_plans && coupon.applicable_plans !== '*') {
        const applicablePlans = coupon.applicable_plans.split(',');
        if (!applicablePlans.includes(planId)) {
          throw new Error('此优惠券不适用于该会员套餐');
        }
      }
      
      // 计算优惠金额
      const basePrice = this.getMembershipPrice(parseInt(planId), duration);
      let discountAmount = 0;
      
      if (coupon.type === 'percentage') {
        discountAmount = basePrice * (coupon.value / 100);
      } else if (coupon.type === 'fixed') {
        discountAmount = Math.min(coupon.value, basePrice);
      }
      
      const finalPrice = basePrice - discountAmount;
      
      return {
        valid: true,
        couponId: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        basePrice,
        discountAmount,
        finalPrice,
        description: coupon.description
      };
    } catch (error) {
      console.error('验证优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 处理自动续费
   */
  async processAutoRenewal(userId, planType, duration, paymentMethodId) {
    try {
      // 开始事务
      await query('BEGIN TRANSACTION');
      
      // 获取当前会员信息
      const currentMembership = await query(
        'SELECT * FROM user_memberships WHERE user_id = ? AND status = ?',
        [userId, 'active']
      );
      
      if (currentMembership.length === 0) {
        throw new Error('没有活跃的会员记录');
      }
      
      // 计算续费价格
      const price = await this.getMembershipPrice(planType, duration);
      
      // 创建续费订单
      const orderId = `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await query(`
        INSERT INTO orders (id, user_id, type, amount, status, created_at, payment_method_id)
        VALUES (?, ?, 'membership_renewal', ?, 'pending', datetime('now'), ?)
      `, [orderId, userId, price, paymentMethodId]);
      
      // 模拟支付处理
      // 在实际项目中，这里应该调用支付网关
      console.log(`处理自动续费支付: 用户 ${userId}, 金额 ${price}, 订单号 ${orderId}`);
      
      // 更新订单状态
      await query(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['completed', orderId]
      );
      
      // 更新会员信息
      const currentExpireDate = new Date(currentMembership[0].expire_date);
      const newExpireDate = this.calculateExpireDate(planType, duration, currentExpireDate);
      
      await query(`
        UPDATE user_memberships 
        SET expire_date = ?, last_renewal_at = datetime('now')
        WHERE user_id = ? AND status = 'active'
      `, [newExpireDate.toISOString(), userId]);
      
      // 更新自动续费配置
      await query(
        'UPDATE auto_renew_configs SET last_renewal_at = datetime(\'now\') WHERE user_id = ?',
        [userId]
      );
      
      // 提交事务
      await query('COMMIT');
      
      return {
        success: true,
        orderId,
        newExpireDate
      };
    } catch (error) {
      // 回滚事务
      await query('ROLLBACK');
      console.error('处理自动续费失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取会员统计数据
   */
  async getMembershipStats() {
    try {
      const stats = await this.userService.getMembershipStats();
      
      return {
        totalUsers: stats.totalUsers,
        freeUsers: stats.freeUsers,
        basicMembers: stats.basicMembers,
        premiumMembers: stats.premiumMembers,
        monthlyRevenue: stats.monthlyRevenue,
        conversionRate: stats.totalUsers > 0 ? 
          (stats.basicMembers + stats.premiumMembers) / stats.totalUsers : 0
      };
    } catch (error) {
      console.error('获取会员统计失败:', error);
      return null;
    }
  }
}

module.exports = new MembershipService();