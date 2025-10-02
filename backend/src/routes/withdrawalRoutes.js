/**
 * 提现相关路由
 */

const express = require('express');
const router = express.Router();
const withdrawalService = require('../services/withdrawalService');
const createAuthMiddleware = require('../middleware/auth');
// 初始化认证中间件
const authMiddleware = createAuthMiddleware();
const { authenticate, authorize } = authMiddleware;
const { handleError } = require('../middleware/errorHandler');

/**
 * 用户端提现相关路由
 */
// 用户提交提现申请 - 暂时注释认证中间件以便调试
router.post('/user/withdrawals', /* authenticate, */ async (req, res) => {
  try {
    const { amount, account_info } = req.body;
    // 为测试环境提供默认的userId
    const userId = req.user?.id || '1001';
    
    // 验证参数
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '提现金额必须大于0' });
    }
    
    if (!account_info) {
      return res.status(400).json({ error: '请提供提现账户信息' });
    }
    
    // 确保用户钱包存在
    await withdrawalService.ensureUserWallet(userId);
    
    // 创建提现申请
    const withdrawal = await withdrawalService.createWithdrawal(userId, amount, account_info);
    
    res.status(201).json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 用户获取自己的提现记录 - 暂时注释认证中间件以便调试
router.get('/user/withdrawals', /* authenticate, */ async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const userId = req.user.id;
    
    const result = await withdrawalService.getWithdrawals({
      page,
      pageSize,
      userId,
      status
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 用户获取单个提现记录 - 暂时注释认证中间件以便调试
router.get('/user/withdrawals/:id', /* authenticate, */ async (req, res) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await withdrawalService.getWithdrawalById(id);
    
    // 确保只能查看自己的提现记录
    if (withdrawal.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看该提现记录' });
    }
    
    res.json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * 管理员端提现相关路由
 */
// 管理员获取提现列表（支持筛选） - 暂时注释认证中间件以便调试
router.get('/admin/withdrawals', /* authenticate, authorize('admin'), */ async (req, res) => {
  try {
    const queryUserId = req.query.userId;
    // 为测试环境提供默认的userId，优先使用查询参数中的userId
    const userId = req.user?.id || queryUserId || '1001';
    const { page = 1, pageSize = 10, status } = req.query;
    
    const result = await withdrawalService.getWithdrawals({
      page,
      pageSize,
      userId,
      status
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 管理员获取单个提现记录 - 暂时注释认证中间件以便调试
router.get('/admin/withdrawals/:id', /* authenticate, authorize('admin'), */ async (req, res) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await withdrawalService.getWithdrawalById(id);
    
    res.json({
      success: true,
      data: withdrawal
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 管理员处理提现申请 - 暂时注释认证中间件以便调试
router.put('/admin/withdrawals/:id/process', /* authenticate, authorize('admin'), */ async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;
    
    // 验证参数
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的处理动作' });
    }
    
    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: '拒绝提现时必须提供拒绝原因' });
    }
    
    const withdrawal = await withdrawalService.processWithdrawal(id, { action, reason }, adminId);
    
    res.json({
      success: true,
      data: withdrawal,
      message: action === 'approve' ? '提现申请已同意' : '提现申请已拒绝'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 管理员完成提现（标记为已支付） - 暂时注释认证中间件以便调试
router.put('/admin/withdrawals/:id/complete', /* authenticate, authorize('admin'), */ async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_id } = req.body;
    
    // 验证参数
    if (!transaction_id) {
      return res.status(400).json({ error: '请提供支付平台交易ID' });
    }
    
    const withdrawal = await withdrawalService.completeWithdrawal(id, transaction_id);
    
    res.json({
      success: true,
      data: withdrawal,
      message: '提现已完成'
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 获取提现统计信息 - 暂时注释认证中间件以便调试
router.get('/admin/withdrawals/stats', /* authenticate, authorize('admin'), */ async (req, res) => {
  try {
    const stats = await withdrawalService.getWithdrawalStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;