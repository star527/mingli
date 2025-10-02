/**
 * ID生成器工具
 * 生成各种业务ID
 */

/**
 * 生成唯一ID
 * @param {string} prefix - ID前缀
 * @returns {string} 生成的ID
 */
function generateId(prefix = 'ID') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * 生成订单ID
 * @returns {string} 订单ID
 */
function generateOrderId() {
  return generateId('ORD');
}

/**
 * 生成用户ID
 * @returns {string} 用户ID
 */
function generateUserId() {
  return generateId('USER');
}

/**
 * 生成视频ID
 * @returns {string} 视频ID
 */
function generateVideoId() {
  return generateId('VIDEO');
}

/**
 * 生成提现ID
 * @returns {string} 提现ID
 */
function generateWithdrawalId() {
  return generateId('WD');
}

/**
 * 生成钱包ID
 * @returns {string} 钱包ID
 */
function generateWalletId() {
  return generateId('WL');
}

/**
 * 生成钱包交易ID
 * @returns {string} 交易ID
 */
function generateWalletTransactionId() {
  return generateId('WT');
}

module.exports = {
  generateId,
  generateOrderId,
  generateUserId,
  generateVideoId,
  generateWithdrawalId,
  generateWalletId,
  generateWalletTransactionId
};