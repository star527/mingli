/**
 * 生成提现相关模拟数据
 * 用于测试前端提现管理功能
 */

const db = require('../src/config/database');
const { generateId } = require('../src/utils/idGenerator');

async function generateWithdrawalMockData() {
  try {
    console.log('开始生成提现模拟数据...');

    // 简化版本：直接生成提现记录，暂时不关联用户
    const statusList = ['pending', 'approved', 'rejected', 'completed', 'failed'];
    const accountTypes = ['alipay', 'wechat', 'bank'];
    const withdrawalAmounts = [100, 200, 300, 500, 800, 1000];
    const recordCount = 10; // 生成10条记录
    
    for (let i = 0; i < recordCount; i++) {
      // 随机生成过去30天内的时间
      const daysAgo = Math.floor(Math.random() * 30);
      const appliedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // 随机选择状态
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      const amount = withdrawalAmounts[Math.floor(Math.random() * withdrawalAmounts.length)];
      
      // 生成账户信息
      const accountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
      let accountInfo = {};
      
      if (accountType === 'alipay') {
        accountInfo = {
          type: 'alipay',
          account: 'test' + Math.floor(Math.random() * 10000) + '@alipay.com',
          name: '测试用户'
        };
      } else if (accountType === 'wechat') {
        accountInfo = {
          type: 'wechat',
          account: 'wx' + Math.floor(Math.random() * 100000000),
          name: '测试用户'
        };
      } else {
        accountInfo = {
          type: 'bank',
          bank_name: '中国建设银行',
          account_number: '622700' + Math.floor(Math.random() * 1000000000000),
          name: '测试用户'
        };
      }
      
      // 创建提现记录 - 使用简单的用户ID
      const withdrawalId = generateId('WD');
      const simpleUserId = 'user_' + Math.floor(Math.random() * 1000);
      
      try {
        // 暂时禁用外键约束
        await db.execute('PRAGMA foreign_keys = OFF');
        
        await db.execute(
          `INSERT INTO withdrawals 
           (id, user_id, amount, status, account_info, applied_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            withdrawalId,
            simpleUserId,
            amount,
            status,
            JSON.stringify(accountInfo),
            appliedDate.toISOString(),
            appliedDate.toISOString(),
            appliedDate.toISOString()
          ]
        );
        
        // 重新启用外键约束
        await db.execute('PRAGMA foreign_keys = ON');
        
        console.log(`生成提现记录: ${withdrawalId}, 金额: ${amount}, 状态: ${status}`);
      } catch (error) {
        console.error(`生成提现记录失败: ${error.message}`);
      }
    }

    console.log('提现模拟数据生成完成！');
    return true;
  } catch (error) {
    console.error('生成提现模拟数据失败:', error);
    return false;
  }
}

// 如果直接运行此脚本，则生成模拟数据
if (require.main === module) {
  generateWithdrawalMockData().then(success => {
    console.log('模拟数据生成完成，状态:', success ? '成功' : '失败');
    process.exit(success ? 0 : 1);
  });
}

module.exports = { generateWithdrawalMockData };