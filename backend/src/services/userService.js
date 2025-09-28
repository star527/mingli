/**
 * 用户服务层
 * 处理用户相关的数据库操作
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

class UserService {
  /**
   * 查找或创建用户
   */
  async findOrCreateUser(openid, userInfo = {}) {
    try {
      // 先尝试查找用户
      const existingUser = await this.getUserByOpenid(openid);
      if (existingUser) {
        return existingUser;
      }
      
      // 创建新用户
      const userId = uuidv4();
      const sql = `
        INSERT INTO users (
          id, openid, unionid, nickname, avatar_url, gender,
          member_level, member_expire_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userId,
        openid,
        userInfo.unionid || null,
        userInfo.nickName || userInfo.nickname || '新用户',
        userInfo.avatarUrl || userInfo.avatar || '',
        userInfo.gender || 0,
        0, // 默认免费会员
        null
      ];
      
      await query(sql, params);
      
      // 返回新创建的用户
      return await this.getUserById(userId);
    } catch (error) {
      console.error('查找或创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(userId) {
    try {
      const sql = `
        SELECT 
          id, openid, unionid, nickname, avatar_url, gender,
          member_level, member_expire_date, last_upgrade_date,
          analysis_count, video_watch_time,
          created_at, updated_at, last_login
        FROM users 
        WHERE id = ?
      `;
      
      const result = await query(sql, [userId]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('获取用户失败:', error);
      return null;
    }
  }

  /**
   * 根据openid获取用户
   */
  async getUserByOpenid(openid) {
    try {
      const sql = `
        SELECT 
          id, openid, unionid, nickname, avatar_url, gender,
          member_level, member_expire_date, last_upgrade_date,
          analysis_count, video_watch_time,
          created_at, updated_at, last_login
        FROM users 
        WHERE openid = ?
      `;
      
      const result = await query(sql, [openid]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('根据openid获取用户失败:', error);
      return null;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, updates) {
    try {
      // 构建更新SQL
      const fields = [];
      const params = [];
      
      if (updates.nickname !== undefined) {
        fields.push('nickname = ?');
        params.push(updates.nickname);
      }
      
      if (updates.avatar !== undefined) {
        fields.push('avatar_url = ?');
        params.push(updates.avatar);
      }
      
      if (updates.gender !== undefined) {
        fields.push('gender = ?');
        params.push(updates.gender);
      }
      
      if (updates.birthday !== undefined) {
        fields.push('birthday = ?');
        params.push(updates.birthday);
      }
      
      if (updates.phone !== undefined) {
        fields.push('phone = ?');
        params.push(updates.phone);
      }
      
      if (updates.email !== undefined) {
        fields.push('email = ?');
        params.push(updates.email);
      }
      
      if (fields.length === 0) {
        return { success: false, message: '没有需要更新的字段' };
      }
      
      params.push(userId);
      
      const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
      await query(sql, params);
      
      return { success: true };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新用户会员信息
   */
  async updateUserMembership(userId, membershipInfo) {
    try {
      const fields = [];
      const params = [];
      
      if (membershipInfo.memberLevel !== undefined) {
        fields.push('member_level = ?');
        params.push(membershipInfo.memberLevel);
      }
      
      if (membershipInfo.memberExpireDate !== undefined) {
        fields.push('member_expire_date = ?');
        params.push(membershipInfo.memberExpireDate);
      }
      
      if (membershipInfo.lastUpgradeDate !== undefined) {
        fields.push('last_upgrade_date = ?');
        params.push(membershipInfo.lastUpgradeDate);
      }
      
      if (fields.length === 0) {
        return { success: false, message: '没有需要更新的会员信息' };
      }
      
      params.push(userId);
      
      const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
      await query(sql, params);
      
      return { success: true };
    } catch (error) {
      console.error('更新用户会员信息失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId) {
    try {
      const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
      await query(sql, [userId]);
      return true;
    } catch (error) {
      console.error('更新最后登录时间失败:', error);
      return false;
    }
  }

  /**
   * 增加分析次数
   */
  async incrementAnalysisCount(userId) {
    try {
      const sql = 'UPDATE users SET analysis_count = analysis_count + 1 WHERE id = ?';
      await query(sql, [userId]);
      return true;
    } catch (error) {
      console.error('增加分析次数失败:', error);
      return false;
    }
  }

  /**
   * 更新视频观看时长
   */
  async updateVideoWatchTime(userId, minutes) {
    try {
      const sql = 'UPDATE users SET video_watch_time = video_watch_time + ? WHERE id = ?';
      await query(sql, [minutes, userId]);
      return true;
    } catch (error) {
      console.error('更新视频观看时长失败:', error);
      return false;
    }
  }

  /**
   * 获取本月分析次数
   */
  async getAnalysisCountThisMonth(userId) {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM bazi_records 
        WHERE user_id = ? 
        AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
      `;
      
      const result = await query(sql, [userId]);
      return result[0].count || 0;
    } catch (error) {
      console.error('获取本月分析次数失败:', error);
      return 0;
    }
  }

  /**
   * 获取用户列表（分页）
   */
  async getUserList(page = 1, limit = 20, keyword = '') {
    try {
      const offset = (page - 1) * limit;
      let sql = `
        SELECT 
          id, nickname, avatar_url, gender, member_level, member_expire_date,
          analysis_count, video_watch_time, last_login, created_at
        FROM users 
      `;
      
      const params = [];
      
      // 关键词搜索
      if (keyword) {
        sql += ' WHERE nickname LIKE ? OR phone LIKE ? OR email LIKE ?';
        const searchKeyword = `%${keyword}%`;
        params.push(searchKeyword, searchKeyword, searchKeyword);
      }
      
      // 排序和分页
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const users = await query(sql, params);
      
      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM users';
      const countParams = [];
      
      if (keyword) {
        countSql += ' WHERE nickname LIKE ? OR phone LIKE ? OR email LIKE ?';
        const searchKeyword = `%${keyword}%`;
        countParams.push(searchKeyword, searchKeyword, searchKeyword);
      }
      
      const countResult = await query(countSql, countParams);
      const total = countResult[0].total || 0;
      
      // 格式化用户数据
      const formattedUsers = users.map(user => ({
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar_url,
        gender: user.gender,
        membership: this.getMembershipLabel(user.member_level),
        memberLevel: user.member_level,
        memberExpireDate: user.member_expire_date,
        analysisCount: user.analysis_count,
        videoWatchTime: user.video_watch_time,
        lastLogin: user.last_login,
        createdAt: user.created_at
      }));
      
      return {
        users: formattedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { users: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  /**
   * 获取会员统计信息
   */
  async getMembershipStats() {
    try {
      // 获取总用户数
      const totalUsersSql = 'SELECT COUNT(*) as count FROM users';
      const totalUsersResult = await query(totalUsersSql);
      const totalUsers = totalUsersResult[0].count || 0;
      
      // 获取免费用户数
      const freeUsersSql = 'SELECT COUNT(*) as count FROM users WHERE member_level = 0';
      const freeUsersResult = await query(freeUsersSql);
      const freeUsers = freeUsersResult[0].count || 0;
      
      // 获取普通会员数
      const basicMembersSql = 'SELECT COUNT(*) as count FROM users WHERE member_level = 1 AND member_expire_date > NOW()';
      const basicMembersResult = await query(basicMembersSql);
      const basicMembers = basicMembersResult[0].count || 0;
      
      // 获取高级会员数
      const premiumMembersSql = 'SELECT COUNT(*) as count FROM users WHERE member_level = 2 AND member_expire_date > NOW()';
      const premiumMembersResult = await query(premiumMembersSql);
      const premiumMembers = premiumMembersResult[0].count || 0;
      
      // 获取本月收入
      const monthlyRevenueSql = `
        SELECT SUM(amount) as revenue 
        FROM orders 
        WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01') 
        AND payment_status = 'completed'
      `;
      const monthlyRevenueResult = await query(monthlyRevenueSql);
      const monthlyRevenue = monthlyRevenueResult[0].revenue || 0;
      
      return {
        totalUsers,
        freeUsers,
        basicMembers,
        premiumMembers,
        monthlyRevenue
      };
    } catch (error) {
      console.error('获取会员统计失败:', error);
      return {
        totalUsers: 0,
        freeUsers: 0,
        basicMembers: 0,
        premiumMembers: 0,
        monthlyRevenue: 0
      };
    }
  }

  /**
   * 获取会员等级标签
   */
  getMembershipLabel(level) {
    const labels = {
      0: '免费用户',
      1: '普通会员',
      2: '高级会员'
    };
    return labels[level] || '未知';
  }
}

module.exports = new UserService();