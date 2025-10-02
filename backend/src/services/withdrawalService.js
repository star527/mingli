/**
 * 提现服务
 * 处理提现相关的业务逻辑
 */

const db = require('../config/database');
const { generateId } = require('../utils/idGenerator');

class WithdrawalService {
  constructor() {
    this.db = db;
  }

  /**
   * 创建提现申请
   * @param {string} userId - 用户ID
   * @param {number} amount - 提现金额
   * @param {object} accountInfo - 提现账户信息
   * @returns {Promise<Object>} 提现记录
   */
  async createWithdrawal(userId, amount, accountInfo) {
    // 开始事务
    await this.db.beginTransaction();
    
    try {
      // 检查用户钱包是否存在
      let [wallet] = await this.db.execute(
        'SELECT * FROM user_wallets WHERE user_id = ?',
        [userId]
      );

      if (wallet.length === 0) {
        throw new Error('用户钱包不存在');
      }

      wallet = wallet[0];
      
      // 检查余额是否充足
      if (parseFloat(wallet.balance) < parseFloat(amount)) {
        throw new Error('余额不足');
      }

      // 创建提现记录
      const withdrawalId = generateId('WD');
      const now = new Date().toISOString();
      
      await this.db.execute(
        `INSERT INTO withdrawals (id, user_id, amount, status, account_info, applied_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [withdrawalId, userId, amount, 'pending', JSON.stringify(accountInfo), now, now, now]
      );

      // 更新钱包余额（创建提现时不扣减，只有在提现完成时才扣减）
      // 这里只是记录状态

      // 提交事务
      await this.db.commitTransaction();

      // 返回提现记录
      const [withdrawal] = await this.db.execute(
        'SELECT * FROM withdrawals WHERE id = ?',
        [withdrawalId]
      );

      return withdrawal[0];
    } catch (error) {
      // 回滚事务
      await this.db.rollbackTransaction();
      throw error;
    }
  }

  /**
   * 获取提现列表
   * @param {object} params - 查询参数
   * @returns {Promise<Object>} 提现列表和分页信息
   */
  async getWithdrawals(params = {}) {
    const { page = 1, pageSize = 10, userId, status } = params;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    // 构建查询条件
    let conditions = [];
    let values = [];
    
    if (userId) {
      conditions.push('user_id = ?');
      values.push(userId);
    }
    
    if (status) {
      conditions.push('status = ?');
      values.push(status);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // 查询总数
    const [totalResult] = await this.db.execute(
      `SELECT COUNT(*) as total FROM withdrawals ${whereClause}`,
      values
    );
    const total = totalResult[0].total;
    
    // 查询分页数据
    const [withdrawals] = await this.db.execute(
      `SELECT * FROM withdrawals ${whereClause} ORDER BY applied_at DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    
    // 处理JSON字段
    const processedWithdrawals = withdrawals.map(w => ({
      ...w,
      account_info: w.account_info ? JSON.parse(w.account_info) : null
    }));
    
    return {
      items: processedWithdrawals,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 获取单个提现记录
   * @param {string} id - 提现ID
   * @returns {Promise<Object>} 提现记录
   */
  async getWithdrawalById(id) {
    const [withdrawals] = await this.db.execute(
      'SELECT * FROM withdrawals WHERE id = ?',
      [id]
    );
    
    if (withdrawals.length === 0) {
      throw new Error('提现记录不存在');
    }
    
    const withdrawal = withdrawals[0];
    return {
      ...withdrawal,
      account_info: withdrawal.account_info ? JSON.parse(withdrawal.account_info) : null
    };
  }

  /**
   * 处理提现申请
   * @param {string} id - 提现ID
   * @param {object} processData - 处理数据
   * @param {string} adminId - 管理员ID
   * @returns {Promise<Object>} 处理后的提现记录
   */
  async processWithdrawal(id, processData, adminId) {
    const { action, reason } = processData;
    
    if (!['approve', 'reject'].includes(action)) {
      throw new Error('无效的处理动作');
    }
    
    // 开始事务
    await this.db.beginTransaction();
    
    try {
      // 获取提现记录
      const [withdrawals] = await this.db.execute(
        'SELECT * FROM withdrawals WHERE id = ?',
        [id]
      );
      
      if (withdrawals.length === 0) {
        throw new Error('提现记录不存在');
      }
      
      const withdrawal = withdrawals[0];
      
      // 检查状态
      if (withdrawal.status !== 'pending') {
        throw new Error('该提现申请已经被处理');
      }
      
      const now = new Date().toISOString();
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      // 更新提现记录
      await this.db.execute(
        `UPDATE withdrawals 
         SET status = ?, reason = ?, processed_at = ?, processed_by = ?, updated_at = ? 
         WHERE id = ?`,
        [status, reason, now, adminId, now, id]
      );
      
      // 如果是同意提现，扣减用户余额
      if (action === 'approve') {
        // 获取用户钱包
        const [wallets] = await this.db.execute(
          'SELECT * FROM user_wallets WHERE user_id = ?',
          [withdrawal.user_id]
        );
        
        if (wallets.length === 0) {
          throw new Error('用户钱包不存在');
        }
        
        const wallet = wallets[0];
        const newBalance = parseFloat(wallet.balance) - parseFloat(withdrawal.amount);
        const newTotalWithdrawal = parseFloat(wallet.total_withdrawal) + parseFloat(withdrawal.amount);
        
        // 更新钱包余额
        await this.db.execute(
          `UPDATE user_wallets 
           SET balance = ?, total_withdrawal = ?, updated_at = ? 
           WHERE user_id = ?`,
          [newBalance, newTotalWithdrawal, now, withdrawal.user_id]
        );
        
        // 记录钱包流水
        const transactionId = generateId('WT');
        await this.db.execute(
          `INSERT INTO wallet_transactions 
           (id, user_id, wallet_id, type, amount, balance, related_id, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            withdrawal.user_id,
            wallet.id,
            'withdrawal',
            -parseFloat(withdrawal.amount),
            newBalance,
            id,
            `提现 - ${withdrawal.amount}元`,
            now
          ]
        );
      }
      
      // 提交事务
      await this.db.commitTransaction();
      
      // 返回更新后的记录
      return this.getWithdrawalById(id);
    } catch (error) {
      // 回滚事务
      await this.db.rollbackTransaction();
      throw error;
    }
  }

  /**
   * 完成提现（处理实际支付）
   * @param {string} id - 提现ID
   * @param {string} transactionId - 支付平台交易ID
   * @returns {Promise<Object>} 更新后的提现记录
   */
  async completeWithdrawal(id, transactionId) {
    try {
      // 获取提现记录
      const [withdrawals] = await this.db.execute(
        'SELECT * FROM withdrawals WHERE id = ?',
        [id]
      );
      
      if (withdrawals.length === 0) {
        throw new Error('提现记录不存在');
      }
      
      const withdrawal = withdrawals[0];
      
      // 检查状态
      if (withdrawal.status !== 'approved') {
        throw new Error('只能完成已同意的提现申请');
      }
      
      const now = new Date().toISOString();
      
      // 更新状态为已完成
      await this.db.execute(
        `UPDATE withdrawals 
         SET status = 'completed', transaction_id = ?, updated_at = ? 
         WHERE id = ?`,
        ['completed', transactionId, now, id]
      );
      
      return this.getWithdrawalById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取提现统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getWithdrawalStats() {
    try {
      const [stats] = await this.db.execute(
        `SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
        FROM withdrawals`
      );
      
      return stats[0];
    } catch (error) {
      console.error('获取提现统计失败:', error);
      // 返回默认值
      return {
        total_requests: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        completed_count: 0,
        failed_count: 0,
        pending_amount: 0,
        completed_amount: 0
      };
    }
  }

  /**
   * 创建或更新用户钱包
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 钱包信息
   */
  async ensureUserWallet(userId) {
    try {
      // 检查是否已存在
      const [wallets] = await this.db.execute(
        'SELECT * FROM user_wallets WHERE user_id = ?',
        [userId]
      );
      
      if (wallets.length > 0) {
        return wallets[0];
      }
      
      // 创建新钱包
      const walletId = generateId('WL');
      const now = new Date().toISOString();
      
      await this.db.execute(
        `INSERT INTO user_wallets 
         (id, user_id, balance, total_income, total_withdrawal, updated_at)
         VALUES (?, ?, 0, 0, 0, ?)`,
        [walletId, userId, now]
      );
      
      const [newWallet] = await this.db.execute(
        'SELECT * FROM user_wallets WHERE id = ?',
        [walletId]
      );
      
      return newWallet[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WithdrawalService();