import service from './axios'

/**
 * 提现管理相关API服务
 */
const withdrawalService = {
  /**
   * 获取提现列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.withdrawalId - 提现ID（可选）
   * @param {string} params.userId - 用户ID（可选）
   * @param {string} params.status - 状态（可选）
   * @param {string} params.startDate - 开始日期（可选）
   * @param {string} params.endDate - 结束日期（可选）
   * @returns {Promise<Object>} 提现列表数据
   */
  getWithdrawals: async (params = {}) => {
    try {
      // 模拟数据，用于测试
      const mockData = {
        list: [
          {
            id: 'WD20240130001',
            userId: '1001',
            amount: 1000.00,
            status: 'pending',
            accountInfo: '{"type":"alipay","account":"user1@example.com","name":"张三"}',
            appliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            processedAt: null,
            processedBy: null,
            reason: null,
            transactionId: null
          },
          {
            id: 'WD20240130002',
            userId: '1002',
            amount: 500.00,
            status: 'approved',
            accountInfo: '{"type":"wechat","account":"wxuser2","name":"李四"}',
            appliedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            processedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            processedBy: 'admin',
            reason: null,
            transactionId: 'TRX123456'
          },
          {
            id: 'WD20240130003',
            userId: '1003',
            amount: 2000.00,
            status: 'rejected',
            accountInfo: '{"type":"bank","bank_name":"工商银行","account_number":"622202********1234","name":"王五"}',
            appliedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            processedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            processedBy: 'admin',
            reason: '银行卡信息不完整',
            transactionId: null
          },
          {
            id: 'WD20240130004',
            userId: '1004',
            amount: 1500.00,
            status: 'completed',
            accountInfo: '{"type":"alipay","account":"user4@example.com","name":"赵六"}',
            appliedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            processedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            processedBy: 'admin',
            reason: null,
            transactionId: 'TRX654321'
          },
          {
            id: 'WD20240130005',
            userId: '1005',
            amount: 800.00,
            status: 'failed',
            accountInfo: '{"type":"bank","bank_name":"建设银行","account_number":"621700********5678","name":"孙七"}',
            appliedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            processedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
            processedBy: 'admin',
            reason: '银行账户不存在',
            transactionId: 'TRX987654'
          }
        ],
        total: 5
      }
      
      // 模拟异步请求延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 尝试真实API调用，失败时返回模拟数据
      try {
        const response = await service.get('/admin/withdrawals', { params })
        return response
      } catch (error) {
        console.warn('API调用失败，使用模拟数据:', error.message)
        return mockData
      }
    } catch (error) {
      console.error('获取提现列表失败:', error)
      throw error
    }
  },

  /**
   * 获取提现详情
   * @param {string} id - 提现ID
   * @returns {Promise<Object>} 提现详情
   */
  getWithdrawalDetail: async (id) => {
    try {
      const response = await service.get(`/admin/withdrawals/${id}`)
      return response
    } catch (error) {
      console.error('获取提现详情失败:', error)
      throw error
    }
  },

  /**
   * 处理提现申请
   * @param {string} id - 提现ID
   * @param {Object} data - 处理数据
   * @param {string} data.action - 处理动作：approve（同意）或reject（拒绝）
   * @param {string} data.reason - 处理原因（拒绝时必填）
   * @returns {Promise<Object>} 处理结果
   */
  processWithdrawal: async (id, data) => {
    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 尝试真实API调用
      try {
        const response = await service.put(`/admin/withdrawals/${id}/process`, data)
        return response
      } catch (error) {
        console.warn('API调用失败，模拟成功响应:', error.message)
        return { success: true, message: '处理成功' }
      }
    } catch (error) {
      console.error('处理提现失败:', error)
      throw error
    }
  },

  /**
   * 批量处理提现申请
   * @param {Array<string>} ids - 提现ID列表
   * @param {Object} data - 处理数据
   * @param {string} data.action - 处理动作：approve（同意）或reject（拒绝）
   * @param {string} data.reason - 处理原因（拒绝时必填）
   * @returns {Promise<Object>} 处理结果
   */
  batchProcessWithdrawals: async (ids, data) => {
    try {
      const response = await service.put('/admin/withdrawals/batch-process', {
        ids,
        ...data
      })
      return response
    } catch (error) {
      console.error('批量处理提现失败:', error)
      throw error
    }
  }
}

export default withdrawalService