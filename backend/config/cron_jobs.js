/**
 * 定时任务配置
 * 定义系统中所有定时任务的执行频率和处理函数
 */

const cron = require('node-cron');
const { sendExpiringNotifications, processAutoRenewals, cleanupInvalidAutoRenewConfigs } = require('../scripts/membership_cron_job');

// 定时任务配置
const cronJobs = {
  /**
   * 会员到期提醒任务
   * 每天早上10点执行
   */
  membershipExpirationCheck: {
    schedule: '0 10 * * *', // 每天10:00
    task: async () => {
      try {
        console.log('执行会员到期提醒任务...');
        await sendExpiringNotifications();
        console.log('会员到期提醒任务执行完成');
      } catch (error) {
        console.error('会员到期提醒任务执行失败:', error);
      }
    }
  },

  /**
   * 自动续费处理任务
   * 每天凌晨2点执行
   */
  autoRenewalProcess: {
    schedule: '0 2 * * *', // 每天2:00
    task: async () => {
      try {
        console.log('执行自动续费处理任务...');
        await processAutoRenewals();
        console.log('自动续费处理任务执行完成');
      } catch (error) {
        console.error('自动续费处理任务执行失败:', error);
      }
    }
  },

  /**
   * 无效自动续费配置清理任务
   * 每周一凌晨3点执行
   */
  cleanupInvalidRenewals: {
    schedule: '0 3 * * 1', // 每周一3:00
    task: async () => {
      try {
        console.log('执行无效自动续费配置清理任务...');
        await cleanupInvalidAutoRenewConfigs();
        console.log('无效自动续费配置清理任务执行完成');
      } catch (error) {
        console.error('无效自动续费配置清理任务执行失败:', error);
      }
    }
  }
};

/**
 * 启动所有定时任务
 */
function startAllJobs() {
  console.log('启动定时任务...');
  
  Object.entries(cronJobs).forEach(([name, { schedule, task }]) => {
    try {
      const job = cron.schedule(schedule, task);
      console.log(`定时任务 ${name} 已启动，执行频率: ${schedule}`);
    } catch (error) {
      console.error(`启动定时任务 ${name} 失败:`, error);
    }
  });
}

/**
 * 手动执行指定任务
 * 用于测试或手动触发
 */
async function runJobManually(jobName) {
  const job = cronJobs[jobName];
  if (!job) {
    throw new Error(`定时任务 ${jobName} 不存在`);
  }
  
  console.log(`手动执行定时任务 ${jobName}...`);
  await job.task();
  console.log(`定时任务 ${jobName} 手动执行完成`);
}

module.exports = {
  cronJobs,
  startAllJobs,
  runJobManually
};