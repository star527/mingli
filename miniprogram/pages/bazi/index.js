// pages/bazi/index.js
const app = getApp();
const util = require('../../utils/util');
const baziService = require('../../services/baziService');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    gender: 1, // 默认选择男
    birthDate: '', // 出生日期
    birthTime: '', // 出生时间
    currentDate: '', // 当前日期
    historyList: [] // 历史记录列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置当前日期和默认日期
    const now = new Date();
    const currentDate = this.formatDate(now);
    const defaultDate = this.formatDate(new Date(1990, 0, 1)); // 默认日期设为1990-01-01
    const defaultTime = '12:00';
    
    this.setData({
      currentDate,
      birthDate: defaultDate,
      birthTime: defaultTime
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时加载历史记录
    this.loadHistoryRecords();
  },

  /**
   * 格式化日期为YYYY-MM-DD格式
   */
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 选择性别
   */
  selectGender: function(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({ gender });
  },

  /**
   * 日期改变
   */
  onDateChange: function(e) {
    this.setData({
      birthDate: e.detail.value
    });
  },

  /**
   * 时间改变
   */
  onTimeChange: function(e) {
    this.setData({
      birthTime: e.detail.value
    });
  },

  /**
   * 计算八字
   */
  calculateBazi: async function() {
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
    
    util.showLoading('正在排盘中...');
    
    try {
      // 解析日期和时间
      const [year, month, day] = this.data.birthDate.split('-').map(Number);
      const [hour, minute] = this.data.birthTime.split(':').map(Number);
      
      // 调用八字排盘API
      const params = {
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        birthHour: hour,
        gender: this.data.gender
      };
      
      const result = await baziService.calculateBazi(params);
      
      if (result.success && result.data) {
        // 保存排盘结果到全局，供详情页使用
        app.globalData.currentBaziResult = result.data;
        
        // 跳转到详情页
        wx.navigateTo({
          url: '/pages/bazi/detail'
        });
      } else {
        util.showToast(result.message || '排盘失败，请重试', 'error');
      }
    } catch (error) {
      console.error('计算八字失败:', error);
      util.showToast('排盘失败，请检查网络后重试', 'error');
    } finally {
      util.hideLoading();
    }
  },

  /**
   * 加载历史记录
   */
  loadHistoryRecords: async function() {
    try {
      const result = await baziService.getBaziRecords(1, 10);
      
      if (result.success && result.data) {
        this.setData({
          historyList: result.data.records
        });
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      // 使用模拟数据作为备用
      this.setData({
        historyList: this.getMockHistoryData()
      });
    }
  },

  /**
   * 查看全部记录
   */
  viewAllRecords: function() {
    // 这里可以跳转到历史记录列表页
    wx.navigateTo({
      url: '/pages/common/list?type=bazi_history'
    });
  },

  /**
   * 查看记录详情
   */
  viewRecordDetail: async function(e) {
    const recordId = e.currentTarget.dataset.id;
    
    util.showLoading('加载中...');
    
    try {
      const result = await baziService.getBaziRecordDetail(recordId);
      
      if (result.success && result.data) {
        // 保存详情到全局
        app.globalData.currentBaziResult = result.data;
        
        // 跳转到详情页
        wx.navigateTo({
          url: '/pages/bazi/detail?recordId=' + recordId
        });
      } else {
        util.showToast('获取记录详情失败', 'error');
      }
    } catch (error) {
      console.error('获取记录详情失败:', error);
      util.showToast('获取记录详情失败，请重试', 'error');
    } finally {
      util.hideLoading();
    }
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite: async function(e) {
    e.stopPropagation(); // 阻止冒泡，避免触发查看详情
    
    const recordId = e.currentTarget.dataset.id;
    
    try {
      const result = await baziService.toggleFavorite(recordId);
      
      if (result.success) {
        // 更新本地历史记录列表
        const updatedList = this.data.historyList.map(item => {
          if (item.id === recordId) {
            return { ...item, isFavorite: !item.isFavorite };
          }
          return item;
        });
        
        this.setData({
          historyList: updatedList
        });
        
        util.showToast(result.data.isFavorite ? '收藏成功' : '取消收藏', 'success');
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      util.showToast('操作失败，请重试', 'error');
    }
  },

  /**
   * 删除记录
   */
  deleteRecord: async function(e) {
    e.stopPropagation(); // 阻止冒泡，避免触发查看详情
    
    const recordId = e.currentTarget.dataset.id;
    
    // 确认对话框
    const confirmResult = await util.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      showCancel: true
    });
    
    if (confirmResult.confirm) {
      try {
        const result = await baziService.deleteBaziRecord(recordId);
        
        if (result.success) {
          // 更新本地历史记录列表
          const updatedList = this.data.historyList.filter(item => item.id !== recordId);
          
          this.setData({
            historyList: updatedList
          });
          
          util.showToast('删除成功', 'success');
        }
      } catch (error) {
        console.error('删除记录失败:', error);
        util.showToast('删除失败，请重试', 'error');
      }
    }
  },

  /**
   * 获取模拟历史数据
   */
  getMockHistoryData: function() {
    return [
      {
        id: 'mock-1',
        birthDate: '1990-01-01',
        birthTime: '12:00',
        isFavorite: true,
        pillars: {
          year: ['甲', '子'],
          month: ['丙', '寅'],
          day: ['戊', '午'],
          hour: ['庚', '申']
        }
      },
      {
        id: 'mock-2',
        birthDate: '1985-05-15',
        birthTime: '08:30',
        isFavorite: false,
        pillars: {
          year: ['乙', '丑'],
          month: ['丁', '巳'],
          day: ['己', '未'],
          hour: ['辛', '酉']
        }
      }
    ];
  }
})