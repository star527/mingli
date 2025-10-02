// services/baziService.js - 八字排盘服务
const apiService = require('./api');

class BaziService {
  /**
   * 计算八字排盘
   * @param {Object} params - 排盘参数
   * @param {number} params.birthYear - 出生年份
   * @param {number} params.birthMonth - 出生月份
   * @param {number} params.birthDay - 出生日
   * @param {number} params.birthHour - 出生时
   * @param {number} params.gender - 性别 1-男 0-女
   * @returns {Promise} 排盘结果
   */
  async calculateBazi(params) {
    try {
      const result = await apiService.post('/bazi/calculate', params);
      return result;
    } catch (error) {
      console.error('计算八字失败:', error);
      throw error;
    }
  }

  /**
   * 获取八字分析记录列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise} 记录列表
   */
  async getBaziRecords(page = 1, pageSize = 10) {
    try {
      const result = await apiService.get('/bazi/records', {
        page,
        pageSize
      });
      return result;
    } catch (error) {
      console.error('获取八字记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取八字分析记录详情
   * @param {string} recordId - 记录ID
   * @returns {Promise} 记录详情
   */
  async getBaziRecordDetail(recordId) {
    try {
      const result = await apiService.get(`/bazi/records/${recordId}`);
      return result;
    } catch (error) {
      console.error('获取八字记录详情失败:', error);
      throw error;
    }
  }

  /**
   * 收藏/取消收藏八字记录
   * @param {string} recordId - 记录ID
   * @returns {Promise} 操作结果
   */
  async toggleFavorite(recordId) {
    try {
      const result = await apiService.post(`/bazi/records/${recordId}/favorite`);
      return result;
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    }
  }

  /**
   * 删除八字记录
   * @param {string} recordId - 记录ID
   * @returns {Promise} 操作结果
   */
  async deleteBaziRecord(recordId) {
    try {
      const result = await apiService.delete(`/bazi/records/${recordId}`);
      return result;
    } catch (error) {
      console.error('删除记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取收藏的八字记录
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise} 收藏记录列表
   */
  async getFavoriteRecords(page = 1, pageSize = 10) {
    try {
      const result = await apiService.get('/bazi/favorites', {
        page,
        pageSize
      });
      return result;
    } catch (error) {
      console.error('获取收藏记录失败:', error);
      throw error;
    }
  }
}

export default new BaziService();