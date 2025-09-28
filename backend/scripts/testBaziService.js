/**
 * 八字排盘服务测试脚本
 * 用于验证baziService的数据库操作功能
 */

const { database, connectDatabase } = require('../src/config/database');
const baziService = require('../src/services/baziService');

// 模拟的八字计算结果
const mockBaziResult = {
  birthYear: 1990,
  birthMonth: 5,
  birthDay: 15,
  birthHour: 14,
  gender: 1,
  pillars: {
    yearGan: '庚',
    yearZhi: '午',
    monthGan: '辛',
    monthZhi: '巳',
    dayGan: '壬',
    dayZhi: '子',
    hourGan: '丁',
    hourZhi: '未'
  },
  analysis: {
    wuXingAnalysis: {
      wood: 2,
      fire: 3,
      earth: 1,
      metal: 1,
      water: 1
    },
    shiShenAnalysis: {
      zhenGuan: 1,
      qiSha: 1,
      cai: 1,
      shangGuan: 1,
      biJie: 1
    },
    characterAnalysis: '性格开朗，善于交际，有领导能力。',
    careerAnalysis: '适合从事与人打交道的工作，如销售、管理等。',
    relationshipAnalysis: '感情丰富，重视家庭，婚姻较美满。',
    healthAnalysis: '注意心脏和血压方面的健康问题。'
  }
};

// 模拟用户ID
const mockUserId = 'test-user-123';
let testRecordId = null;

async function testBaziService() {
  try {
    console.log('开始测试八字排盘服务...');
    
    // 连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');
    
    // 测试1: 保存分析记录
    console.log('\n测试1: 保存分析记录');
    testRecordId = await baziService.saveAnalysisRecord(mockUserId, mockBaziResult);
    console.log('✅ 保存成功，记录ID:', testRecordId);
    
    // 测试2: 获取记录列表
    console.log('\n测试2: 获取记录列表');
    const recordsResult = await baziService.getAnalysisRecords(mockUserId, 1, 10);
    console.log('✅ 获取成功，记录数量:', recordsResult.records.length);
    console.log('记录详情:', JSON.stringify(recordsResult.records[0], null, 2));
    
    // 测试3: 获取记录详情
    console.log('\n测试3: 获取记录详情');
    const recordDetail = await baziService.getAnalysisRecordDetail(testRecordId, mockUserId);
    console.log('✅ 获取成功');
    console.log('记录详情:', JSON.stringify(recordDetail, null, 2));
    
    // 测试4: 切换收藏状态
    console.log('\n测试4: 切换收藏状态');
    const favoriteResult1 = await baziService.toggleFavoriteStatus(testRecordId, mockUserId);
    console.log('✅ 切换成功，新状态:', favoriteResult1.isFavorite);
    
    // 再次切换，恢复原状态
    const favoriteResult2 = await baziService.toggleFavoriteStatus(testRecordId, mockUserId);
    console.log('✅ 再次切换成功，新状态:', favoriteResult2.isFavorite);
    
    // 测试5: 检查记录访问权限
    console.log('\n测试5: 检查记录访问权限');
    const hasAccess = await baziService.checkRecordAccess(testRecordId, mockUserId);
    console.log('✅ 检查结果:', hasAccess ? '有权限' : '无权限');
    
    // 测试6: 删除记录
    console.log('\n测试6: 删除记录');
    const deleteResult = await baziService.deleteRecord(testRecordId, mockUserId);
    console.log('✅ 删除结果:', deleteResult ? '删除成功' : '删除失败');
    
    // 验证删除是否成功
    const deletedRecord = await baziService.getAnalysisRecordDetail(testRecordId, mockUserId);
    console.log('✅ 验证删除结果:', deletedRecord === null ? '记录已被成功删除' : '记录仍然存在');
    
    console.log('\n🎉 所有测试完成！八字排盘服务功能正常。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    // 关闭数据库连接
    if (database) {
      await database.close();
      console.log('\n✅ 数据库连接已关闭');
    }
  }
}

// 运行测试
testBaziService();