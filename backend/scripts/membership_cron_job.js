/**
 * 会员定时任务脚本
 * 功能：
 * 1. 检查即将到期的会员并发送提醒
 * 2. 处理会员自动续费
 */

const { createDbConnection, executeQuery, saveDatabase, closeDb } = require('./db_utils');
const membershipService = require('../src/services/membershipService');
const notificationService = require('../src/services/notificationService');

// 配置常量
const EXPIRATION_REMINDER_DAYS = [7, 3, 1]; // 提前7天、3天、1天发送提醒
const MAX_RETRIES = 3;

/**
 * 记录日志
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

/**
 * 检查即将到期的会员并发送提醒
 */
async function checkExpiringMemberships() {
  let db = null;
  try {
    log('开始检查即将到期的会员...');
    
    // 连接数据库
    db = await createDbConnection();
    
    // 获取所有活跃会员
    const activeMembers = await executeQuery(db, `
      SELECT um.*, u.phone, u.email 
      FROM user_memberships um
      JOIN users u ON um.user_id = u.id
      WHERE um.status = 'active'
    `);
    
    log(`找到 ${activeMembers.length} 个活跃会员`);
    
    // 检查每个会员的到期时间
    for (const member of activeMembers) {
      const expireDate = new Date(member.expire_date);
      const today = new Date();
      const daysUntilExpire = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
      
      // 如果在提醒天数范围内
      if (EXPIRATION_REMINDER_DAYS.includes(daysUntilExpire)) {
        // 检查是否已经发送过该时间点的提醒
        const existingReminder = await executeQuery(db, `
          SELECT * FROM notifications
          WHERE user_id = ? AND type = 'membership_expiring' AND days_remaining = ?
          AND created_at > datetime('now', '-1 day')
        `, [member.user_id, daysUntilExpire]);
        
        if (existingReminder.length === 0) {
          // 发送提醒通知
          await notificationService.sendMembershipExpiringNotification(
            member.user_id,
            member.phone,
            member.email,
            daysUntilExpire,
            member.plan_type
          );
          
          // 记录已发送的提醒
          await executeQuery(db, `
            INSERT INTO notifications (user_id, type, message, days_remaining, created_at)
            VALUES (?, 'membership_expiring', ?, ?, datetime('now'))
          `, [
            member.user_id, 
            `您的${member.plan_type}会员将在${daysUntilExpire}天后到期`, 
            daysUntilExpire
          ]);
          
          log(`已向用户 ${member.user_id} 发送会员到期提醒，剩余天数：${daysUntilExpire}`);
        }
      }
    }
    
    // 保存数据库更改
    await saveDatabase(db);
    log('会员到期提醒检查完成');
  } catch (error) {
    log(`检查会员到期提醒时出错: ${error.message}`, 'error');
    throw error;
  } finally {
    if (db) {
      await closeDb(db);
    }
  }
}

/**
 * 处理会员自动续费
 */
async function processAutoRenewals() {
  let db = null;
  try {
    log('开始处理会员自动续费...');
    
    // 连接数据库
    db = await createDbConnection();
    
    // 获取需要续费的会员
    const renewalMembers = await executeQuery(db, `
      SELECT um.*, ual.payment_method_id, ual.status as renewal_status
      FROM user_memberships um
      JOIN auto_renew_configs ual ON um.user_id = ual.user_id
      WHERE um.status = 'active' 
      AND ual.enabled = 1
      AND date(um.expires_at) = date('now', '+1 day')
      AND (ual.status = 'pending' OR ual.status IS NULL)
    `);
    
    log(`找到 ${renewalMembers.length} 个需要自动续费的会员`);
    
    // 处理每个需要续费的会员
    for (const member of renewalMembers) {
      try {
        // 更新续费状态为处理中
        await executeQuery(db, `
          UPDATE auto_renew_configs 
          SET status = 'processing', last_attempt_at = datetime('now')
          WHERE user_id = ?
        `, [member.user_id]);
        
        // 执行续费逻辑
        const renewalResult = await membershipService.processAutoRenewal(
          member.user_id,
          member.plan_type,
          1, // 默认续费1个月
          member.payment_method_id
        );
        
        if (renewalResult.success) {
          // 更新续费状态为成功
          await executeQuery(db, `
            UPDATE auto_renew_configs 
            SET status = 'success', last_renewal_at = datetime('now')
            WHERE user_id = ?
          `, [member.user_id]);
          
          log(`用户 ${member.user_id} 会员自动续费成功，订单号：${renewalResult.orderId}`);
          
          // 发送续费成功通知
          await notificationService.sendRenewalSuccessNotification(
            member.user_id,
            member.plan_type,
            renewalResult.orderId
          );
        } else {
          // 更新续费状态为失败
          await executeQuery(db, `
            UPDATE auto_renew_configs 
            SET status = 'failed', failure_reason = ?, last_attempt_at = datetime('now')
            WHERE user_id = ?
          `, [renewalResult.error || '支付失败', member.user_id]);
          
          log(`用户 ${member.user_id} 会员自动续费失败: ${renewalResult.error}`, 'error');
        }
        
        // 每处理一个会员就保存一次数据库
        await saveDatabase(db);
      } catch (error) {
        log(`处理用户 ${member.user_id} 自动续费时出错: ${error.message}`, 'error');
        
        // 记录失败状态
        await executeQuery(db, `
          UPDATE auto_renew_configs 
          SET status = 'failed', failure_reason = ?, last_attempt_at = datetime('now')
          WHERE user_id = ?
        `, [error.message, member.user_id]);
        
        await saveDatabase(db);
      }
    }
    
    log('会员自动续费处理完成');
  } catch (error) {
    log(`处理自动续费时出错: ${error.message}`, 'error');
    throw error;
  } finally {
    if (db) {
      await closeDb(db);
    }
  }
}

/**
 * 检查并禁用无效的自动续费配置
 */
async function cleanupInvalidRenewals() {
  let db = null;
  try {
    log('开始清理无效的自动续费配置...');
    
    // 连接数据库
    db = await createDbConnection();
    
    // 禁用多次失败的自动续费配置
    await executeQuery(db, `
      UPDATE auto_renew_configs 
      SET enabled = 0, status = 'disabled_due_to_failures'
      WHERE status = 'failed' 
      AND (failure_count IS NULL OR failure_count >= ?)
    `, [MAX_RETRIES]);
    
    // 保存数据库更改
    await saveDatabase(db);
    log('无效自动续费配置清理完成');
  } catch (error) {
    log(`清理无效自动续费时出错: ${error.message}`, 'error');
  } finally {
    if (db) {
      await closeDb(db);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    log('开始执行会员定时任务...');
    
    // 1. 检查即将到期的会员
    await checkExpiringMemberships();
    
    // 2. 处理自动续费
    await processAutoRenewals();
    
    // 3. 清理无效的自动续费配置
    await cleanupInvalidRenewals();
    
    log('会员定时任务执行完成');
    process.exit(0);
  } catch (error) {
    log(`会员定时任务执行失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkExpiringMemberships,
  processAutoRenewals,
  cleanupInvalidRenewals
};