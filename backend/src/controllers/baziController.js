/**
 * 八字排盘控制器
 * 处理八字排盘相关的业务逻辑
 */

const BaziCalculator = require('../core/baziCalculator');
const baziService = require('../services/baziService');

class BaziController {
  constructor(baziService, membershipService) {
    this.baziCalculator = new BaziCalculator();
    this.baziService = baziService;
    this.membershipService = membershipService;
  }

  /**
   * 八字排盘计算
   */
  async calculateBazi(req, res) {
    try {
      const { birthYear, birthMonth, birthDay, birthHour, gender, isLunar = false } = req.body;
      const userId = req.user.id;

      // 计算八字
      const baziResult = this.baziCalculator.calculate({
        year: birthYear,
        month: birthMonth,
        day: birthDay,
        hour: birthHour,
        gender,
        isLunar
      });

      // 保存分析记录到数据库
      const recordId = await this.baziService.saveAnalysisRecord(userId, baziResult);

      res.json({
        success: true,
        data: {
          recordId,
          ...baziResult
        }
      });
    } catch (error) {
      console.error('八字排盘计算失败:', error);
      res.status(500).json({
        success: false,
        message: '八字排盘计算失败'
      });
    }
  }

  /**
   * 获取分析记录列表
   */
  async getRecords(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      // 从数据库获取分析记录列表
      const result = await this.baziService.getAnalysisRecords(userId, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        data: {
          records: result.records,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      console.error('获取分析记录失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分析记录失败'
      });
    }
  }

  /**
   * 获取分析记录详情
   */
  async getRecordDetail(req, res) {
    try {
      const { recordId } = req.params;
      const userId = req.user.id;

      // 从数据库获取记录详情
      const record = await this.baziService.getAnalysisRecordDetail(recordId, userId);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: '记录不存在'
        });
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      console.error('获取记录详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取记录详情失败'
      });
    }
  }

  /**
   * 收藏/取消收藏记录
   */
  async toggleFavorite(req, res) {
    try {
      const { recordId } = req.params;
      const userId = req.user.id;

      // 切换收藏状态
      const result = await this.baziService.toggleFavoriteStatus(recordId, userId);

      res.json({
        success: true,
        message: result.isFavorite ? '收藏成功' : '取消收藏成功',
        data: result
      });
    } catch (error) {
      console.error('操作收藏失败:', error);
      res.status(500).json({
        success: false,
        message: '操作收藏失败'
      });
    }
  }

  /**
   * 获取收藏的记录列表
   */
  async getFavoriteRecords(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await this.baziService.getFavoriteRecords(userId, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        data: {
          records: result.records,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      console.error('获取收藏记录失败:', error);
      res.status(500).json({
        success: false,
        message: '获取收藏记录失败'
      });
    }
  }

  /**
   * 删除分析记录
   */
  async deleteRecord(req, res) {
    try {
      const { recordId } = req.params;
      const userId = req.user.id;

      const success = await this.baziService.deleteRecord(recordId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '记录不存在或无权限删除'
        });
      }

      res.json({
        success: true,
        message: '记录删除成功'
      });
    } catch (error) {
      console.error('删除记录失败:', error);
      res.status(500).json({
        success: false,
        message: '删除记录失败'
      });
    }
  }
}

// 导出工厂函数，支持函数调用方式初始化
module.exports = (baziService, membershipService) => new BaziController(baziService, membershipService);