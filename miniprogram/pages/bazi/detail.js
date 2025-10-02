// pages/bazi/detail.js
const app = getApp();
const util = require('../../utils/util');
const baziService = require('../../services/baziService');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    baziData: {}, // 八字数据
    isFavorite: false, // 是否已收藏
    isLoading: true, // 加载状态
    recordId: '' // 记录ID
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      recordId: options.recordId || ''
    });
    
    // 加载八字数据
    this.loadBaziData();
  },

  /**
   * 加载八字数据
   */
  loadBaziData: function() {
    // 首先尝试从全局获取数据
    const globalData = app.globalData.currentBaziResult;
    
    if (globalData && (this.data.recordId ? globalData.id === this.data.recordId : true)) {
      this.setData({
        baziData: globalData,
        isFavorite: globalData.isFavorite || false,
        isLoading: false
      });
    } else if (this.data.recordId) {
      // 如果有记录ID，从服务器获取
      this.loadRecordDetail();
    } else {
      // 使用模拟数据
      this.setData({
        baziData: this.getMockBaziData(),
        isFavorite: false,
        isLoading: false
      });
    }
  },

  /**
   * 从服务器加载记录详情
   */
  async loadRecordDetail() {
    try {
      const result = await baziService.getBaziRecordDetail(this.data.recordId);
      
      if (result.success && result.data) {
        this.setData({
          baziData: result.data,
          isFavorite: result.data.isFavorite || false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
      // 使用模拟数据作为备用
      this.setData({
        baziData: this.getMockBaziData(),
        isFavorite: false,
        isLoading: false
      });
    }
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite() {
    // 如果没有记录ID，需要先保存记录
    if (!this.data.recordId) {
      await this.saveRecord();
      return;
    }
    
    try {
      const result = await baziService.toggleFavorite(this.data.recordId);
      
      if (result.success) {
        this.setData({
          isFavorite: result.data.isFavorite
        });
        
        util.showToast(result.data.isFavorite ? '收藏成功' : '取消收藏', 'success');
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      util.showToast('操作失败，请重试', 'error');
    }
  },

  /**
   * 分享八字结果
   */
  shareBazi: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 保存记录
   */
  async saveRecord() {
    // 验证登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      });
      return;
    }
    
    util.showLoading('保存中...');
    
    try {
      // 如果已经有记录ID，不需要保存
      if (this.data.recordId) {
        util.hideLoading();
        util.showToast('记录已存在', 'success');
        return;
      }
      
      // 这里应该调用API保存记录
      // 为了演示，我们假设保存成功并生成一个ID
      const mockRecordId = 'record_' + Date.now();
      
      // 更新数据
      this.setData({
        recordId: mockRecordId
      });
      
      util.hideLoading();
      util.showToast('保存成功', 'success');
      
      // 刷新历史记录
      // 这里可以通过事件或其他方式通知上一页刷新
    } catch (error) {
      console.error('保存记录失败:', error);
      util.hideLoading();
      util.showToast('保存失败，请重试', 'error');
    }
  },

  /**
   * 生成详细报告
   */
  generateReport: function() {
    util.showLoading('生成中...');
    
    // 模拟生成报告的延迟
    setTimeout(() => {
      util.hideLoading();
      
      // 这里应该跳转到详细报告页面
      wx.navigateTo({
        url: '/pages/bazi/report?recordId=' + (this.data.recordId || 'mock')
      });
    }, 1000);
  },

  /**
   * 获取模拟八字数据
   */
  getMockBaziData: function() {
    return {
      id: 'mock-data',
      birthDate: '1990-01-01',
      birthTime: '12:00',
      gender: 1,
      pillars: {
        year: ['甲', '子'],
        month: ['丙', '寅'],
        day: ['戊', '午'],
        hour: ['庚', '申']
      },
      zodiacYear: '马',
      seasonMonth: '寅月',
      dayStem: '戊土',
      timeInfo: '申时',
      lifeMaster: '戊土',
      fiveElements: [
        { name: '木', value: 40, color: '#52c41a' },
        { name: '火', value: 25, color: '#faad14' },
        { name: '土', value: 30, color: '#fa8c16' },
        { name: '金', value: 20, color: '#1890ff' },
        { name: '水', value: 35, color: '#13c2c2' }
      ],
      personalityAnalysis: '戊土日主的人性格稳重踏实，注重实际，有责任感和耐心。为人忠厚，做事认真，值得信赖。但有时可能过于固执，缺乏变通。',
      wealthAnalysis: '你命中财星旺盛，财运较好。适合从事与土地、建筑、房地产相关的行业。中年时期财运更佳，需要注意理财，避免过度消费。',
      marriageAnalysis: '你的婚姻宫稳定，夫妻感情较好。适合与性格互补的人结合。注意在相处中要多沟通，避免因固执而产生矛盾。',
      healthAnalysis: '需要注意消化系统和脾胃的健康。建议保持规律的饮食习惯，适当运动，避免过度劳累。',
      isFavorite: false
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline: function() {
    return {
      title: '我的八字排盘结果',
      query: 'recordId=' + (this.data.recordId || 'mock'),
      imageUrl: '/assets/images/share-cover.png'
    };
  },

  /**
   * 分享给朋友
   */
  onShareAppMessage: function() {
    return {
      title: '我的八字排盘结果，快来看看你的运势如何',
      path: '/pages/bazi/detail?recordId=' + (this.data.recordId || 'mock'),
      imageUrl: '/assets/images/share-cover.png'
    };
  }
})