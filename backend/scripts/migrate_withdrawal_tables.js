/**
 * 提现相关表结构迁移脚本
 * 创建提现表和相关索引
 */

const db = require('../src/config/database');

async function migrateWithdrawalTables() {
  try {
    console.log('开始创建提现相关表...');

    // 1. 创建提现申请表 (SQLite兼容版)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(64) PRIMARY KEY, -- 提现记录ID
        user_id VARCHAR(64) NOT NULL, -- 用户ID
        amount DECIMAL(10,2) NOT NULL, -- 提现金额
        status VARCHAR(20) DEFAULT 'pending', -- 提现状态: pending-待处理, approved-已同意, rejected-已拒绝, completed-已完成, failed-失败
        reason TEXT, -- 处理原因/备注
        account_info TEXT NOT NULL, -- 提现账户信息(银行卡、支付宝等)
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 申请时间
        processed_at DATETIME, -- 处理时间
        processed_by VARCHAR(64), -- 处理人ID
        transaction_id VARCHAR(128), -- 支付平台交易ID
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ); -- 提现申请表
    `);
    
    // 创建索引
    await db.execute('CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_withdrawals_applied_at ON withdrawals(applied_at);');
    

    // 2. 创建用户钱包表（用于记录用户余额）
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_wallets (
        id VARCHAR(64) PRIMARY KEY, -- 钱包ID
        user_id VARCHAR(64) NOT NULL, -- 用户ID
        balance DECIMAL(10,2) DEFAULT 0.00, -- 当前余额
        total_income DECIMAL(10,2) DEFAULT 0.00, -- 累计收入
        total_withdrawal DECIMAL(10,2) DEFAULT 0.00, -- 累计提现
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ); -- 用户钱包表
    `);
    
    // 创建索引
    await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS uk_user_wallets_user_id ON user_wallets(user_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_user_wallets_balance ON user_wallets(balance);');
    

    // 3. 创建钱包流水表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id VARCHAR(64) PRIMARY KEY, -- 流水ID
        user_id VARCHAR(64) NOT NULL, -- 用户ID
        wallet_id VARCHAR(64) NOT NULL, -- 钱包ID
        type VARCHAR(20) NOT NULL, -- 交易类型: income-收入, withdrawal-提现, adjustment-调整
        amount DECIMAL(10,2) NOT NULL, -- 交易金额
        balance DECIMAL(10,2) NOT NULL, -- 交易后余额
        related_id VARCHAR(64), -- 关联ID(如订单ID、提现ID)
        description TEXT, -- 交易描述
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (wallet_id) REFERENCES user_wallets(id) ON DELETE CASCADE
      ); -- 钱包流水表
    `);
    
    // 创建索引
    await db.execute('CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);');
    

    // 4. 创建提现统计视图
    await db.execute(`
      CREATE VIEW IF NOT EXISTS withdrawal_stats AS
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
      FROM withdrawals;
    `);

    console.log('提现相关表创建成功！');
    return true;
  } catch (error) {
    console.error('创建提现相关表失败:', error);
    return false;
  }
}

// 如果直接运行此脚本，则执行迁移
if (require.main === module) {
  migrateWithdrawalTables().then(success => {
    console.log('迁移完成，状态:', success ? '成功' : '失败');
    process.exit(success ? 0 : 1);
  });
}

module.exports = { migrateWithdrawalTables };