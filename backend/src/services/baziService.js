/**
 * 八字排盘服务层
 * 处理八字排盘相关的数据库操作
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

class BaziService {
  /**
   * 保存八字分析记录
   */
  async saveAnalysisRecord(userId, baziResult) {
    try {
      const recordId = uuidv4();
      
      // 提取八字结果数据
      const { birthYear, birthMonth, birthDay, birthHour, gender } = baziResult;
      const { yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi } = baziResult.pillars;
      const { wuXingAnalysis, shiShenAnalysis, characterAnalysis, careerAnalysis, relationshipAnalysis, healthAnalysis } = baziResult.analysis;
      
      // 保存到数据库
      const sql = `
        INSERT INTO bazi_records (
          id, user_id, birth_year, birth_month, birth_day, birth_hour, gender,
          year_gan, year_zhi, month_gan, month_zhi, day_gan, day_zhi, hour_gan, hour_zhi,
          wu_xing_analysis, shi_shen_analysis, character_analysis, career_analysis, relationship_analysis, health_analysis,
          is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        recordId, userId, birthYear, birthMonth, birthDay, birthHour, gender,
        yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi,
        JSON.stringify(wuXingAnalysis), JSON.stringify(shiShenAnalysis), characterAnalysis, careerAnalysis, relationshipAnalysis, healthAnalysis,
        false
      ];
      
      await query(sql, params);
      return recordId;
    } catch (error) {
      console.error('保存八字分析记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的八字分析记录列表
   */
  async getAnalysisRecords(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // 查询记录
      const sql = `
        SELECT 
          id, birth_year, birth_month, birth_day, birth_hour, gender,
          year_gan, year_zhi, month_gan, month_zhi, day_gan, day_zhi, hour_gan, hour_zhi,
          is_favorite, created_at
        FROM bazi_records 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const records = await query(sql, [userId, limit, offset]);
      
      // 查询总数
      const countSql = 'SELECT COUNT(*) as total FROM bazi_records WHERE user_id = ?';
      const countResult = await query(countSql, [userId]);
      const total = countResult[0].total || 0;
      
      // 格式化返回数据
      const formattedRecords = records.map(record => ({
        id: record.id,
        birthDate: `${record.birth_year}-${String(record.birth_month).padStart(2, '0')}-${String(record.birth_day).padStart(2, '0')}`,
        gender: record.gender === 1 ? 'male' : 'female',
        fourPillars: {
          year: [record.year_gan, record.year_zhi],
          month: [record.month_gan, record.month_zhi],
          day: [record.day_gan, record.day_zhi],
          hour: [record.hour_gan, record.hour_zhi]
        },
        isFavorite: record.is_favorite,
        createdAt: new Date(record.created_at).toISOString()
      }));
      
      return {
        records: formattedRecords,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('获取八字分析记录列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取八字分析记录详情
   */
  async getAnalysisRecordDetail(recordId, userId) {
    try {
      const sql = `
        SELECT * FROM bazi_records 
        WHERE id = ? AND user_id = ?
      `;
      
      const records = await query(sql, [recordId, userId]);
      
      if (records.length === 0) {
        return null;
      }
      
      const record = records[0];
      
      // 格式化返回数据
      return {
        id: record.id,
        birthDate: `${record.birth_year}-${String(record.birth_month).padStart(2, '0')}-${String(record.birth_day).padStart(2, '0')}`,
        birthTime: `${String(record.birth_hour).padStart(2, '0')}:00`,
        gender: record.gender === 1 ? 'male' : 'female',
        isLunar: false,
        fourPillars: {
          year: [record.year_gan, record.year_zhi],
          month: [record.month_gan, record.month_zhi],
          day: [record.day_gan, record.day_zhi],
          hour: [record.hour_gan, record.hour_zhi]
        },
        elements: this._extractElementsFromAnalysis(record.wu_xing_analysis),
        analysis: {
          personality: record.character_analysis,
          career: record.career_analysis,
          wealth: '财运分析内容...', // 可以从其他字段中提取或生成
          relationship: record.relationship_analysis,
          health: record.health_analysis
        },
        isFavorite: record.is_favorite,
        createdAt: new Date(record.created_at).toISOString()
      };
    } catch (error) {
      console.error('获取八字分析记录详情失败:', error);
      throw error;
    }
  }

  /**
   * 切换记录收藏状态
   */
  async toggleFavoriteStatus(recordId, userId) {
    try {
      // 先查询当前状态
      const checkSql = 'SELECT is_favorite FROM bazi_records WHERE id = ? AND user_id = ?';
      const checkResult = await query(checkSql, [recordId, userId]);
      
      if (checkResult.length === 0) {
        throw new Error('记录不存在或无权限访问');
      }
      
      const currentStatus = checkResult[0].is_favorite;
      const newStatus = !currentStatus;
      
      // 更新状态
      const updateSql = 'UPDATE bazi_records SET is_favorite = ? WHERE id = ? AND user_id = ?';
      await query(updateSql, [newStatus, recordId, userId]);
      
      return { isFavorite: newStatus };
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      throw error;
    }
  }

  /**
   * 从五行分析中提取五行元素统计
   */
  _extractElementsFromAnalysis(wuXingAnalysisJson) {
    try {
      const wuXingAnalysis = JSON.parse(wuXingAnalysisJson);
      // 简化实现，实际应该根据wuXingAnalysis的具体结构提取
      return {
        wood: wuXingAnalysis.wood || 0,
        fire: wuXingAnalysis.fire || 0,
        earth: wuXingAnalysis.earth || 0,
        metal: wuXingAnalysis.metal || 0,
        water: wuXingAnalysis.water || 0
      };
    } catch (error) {
      // 如果解析失败，返回默认值
      return {
        wood: 0,
        fire: 0,
        earth: 0,
        metal: 0,
        water: 0
      };
    }
  }

  /**
   * 获取用户收藏的记录
   */
  async getFavoriteRecords(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const sql = `
        SELECT 
          id, birth_year, birth_month, birth_day, birth_hour, gender,
          year_gan, year_zhi, month_gan, month_zhi, day_gan, day_zhi, hour_gan, hour_zhi,
          created_at
        FROM bazi_records 
        WHERE user_id = ? AND is_favorite = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const records = await query(sql, [userId, true, limit, offset]);
      
      // 查询总数
      const countSql = 'SELECT COUNT(*) as total FROM bazi_records WHERE user_id = ? AND is_favorite = ?';
      const countResult = await query(countSql, [userId, true]);
      const total = countResult[0].total || 0;
      
      // 格式化返回数据
      const formattedRecords = records.map(record => ({
        id: record.id,
        birthDate: `${record.birth_year}-${String(record.birth_month).padStart(2, '0')}-${String(record.birth_day).padStart(2, '0')}`,
        gender: record.gender === 1 ? 'male' : 'female',
        fourPillars: {
          year: [record.year_gan, record.year_zhi],
          month: [record.month_gan, record.month_zhi],
          day: [record.day_gan, record.day_zhi],
          hour: [record.hour_gan, record.hour_zhi]
        },
        isFavorite: true,
        createdAt: new Date(record.created_at).toISOString()
      }));
      
      return {
        records: formattedRecords,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('获取收藏记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除分析记录
   */
  async deleteRecord(recordId, userId) {
    try {
      const sql = 'DELETE FROM bazi_records WHERE id = ? AND user_id = ?';
      await query(sql, [recordId, userId]);
      
      // 验证删除是否成功
      const checkSql = 'SELECT id FROM bazi_records WHERE id = ? AND user_id = ?';
      const checkResult = await query(checkSql, [recordId, userId]);
      return checkResult.length === 0;
    } catch (error) {
      console.error('删除记录失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否有权限访问记录
   */
  async checkRecordAccess(recordId, userId) {
    try {
      const sql = 'SELECT id FROM bazi_records WHERE id = ? AND user_id = ?';
      const result = await query(sql, [recordId, userId]);
      return result.length > 0;
    } catch (error) {
      console.error('检查记录访问权限失败:', error);
      return false;
    }
  }
}

module.exports = new BaziService();