// pages/bazi/index.js
const app = getApp();
const util = require('../../utils/util');
const baziService = require('../../services/baziService');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    name: '', // 姓名
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
   * 姓名输入
   */
  onNameInput: function(e) {
    this.setData({
      name: e.detail.value
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
    
    wx.showLoading({
      title: '正在排盘中...',
    });
    
    try {
      // 解析日期和时间
      const [year, month, day] = this.data.birthDate.split('-').map(Number);
      const [hour, minute] = this.data.birthTime.split(':').map(Number);
      
      // 验证姓名
      if (!this.data.name || this.data.name.trim() === '') {
        wx.showToast({
          title: '请输入姓名',
          icon: 'none'
        });
        return;
      }
      
      // 调用八字排盘API
      const params = {
        name: this.data.name.trim(),
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
        wx.showToast({ title: result.message || '排盘失败，请重试', icon: 'none' });
      }
    } catch (error) {
      console.error('计算八字失败:', error);
      wx.showToast({ title: '排盘失败，请检查网络后重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 加载历史记录
   */
  loadHistoryRecords: async function() {
    try {
      // 显示加载提示
      wx.showLoading({
        title: '加载中...',
      });
      
      // 检查登录状态
      const token = wx.getStorageSync('token');
      
      // 无论是否登录都尝试调用API，但设置超时处理
      try {
        // 已登录，调用API
        const result = await baziService.getBaziRecords(1, 10);
        
        if (result && result.success && result.data && result.data.records) {
          // 成功获取到数据
          this.setData({
            historyList: result.data.records,
            hasData: result.data.records.length > 0
          });
          console.log('成功加载八字记录:', result.data.records.length, '条');
        } else {
          // API返回但数据不符合预期，使用模拟数据
          console.log('API返回数据异常，使用模拟数据');
          this.showMockData();
        }
      } catch (error) {
        console.error('API调用失败，使用模拟数据:', error);
        // 调用失败，使用模拟数据
        this.showMockData();
      }
    } finally {
      // 无论如何都隐藏加载提示
      wx.hideLoading();
    }
  },
  
  /**
   * 显示模拟数据
   */
  showMockData: function() {
    const mockData = this.getMockHistoryData();
    this.setData({
      historyList: mockData,
      hasData: mockData.length > 0,
      isUsingMockData: true
    });
    
    // 显示一个提示，告知用户当前使用的是模拟数据
    wx.showToast({
      title: '当前使用模拟数据',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 查看全部记录
   */
  viewAllRecords: function() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录查看完整历史记录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        }
      });
      return;
    }
    
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
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录查看详情',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        }
      });
      return;
    }
    
    wx.showLoading({
      title: '加载中...',
    });
    
    try {
      const result = await baziService.getBaziRecordDetail(recordId);
      
      if (result && result.success && result.data) {
        // 保存详情到全局
        app.globalData.currentBaziResult = result.data;
        
        // 跳转到详情页
        wx.navigateTo({
          url: '/pages/bazi/detail?recordId=' + recordId
        });
      } else {
        wx.showToast({ title: '获取记录详情失败', icon: 'none' });
      }
    } catch (error) {
      console.error('获取记录详情失败:', error);
      wx.showToast({ title: '获取记录详情失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite: async function(e) {
    e.stopPropagation(); // 阻止冒泡，避免触发查看详情
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/index'
          });
        }
      });
      return;
    }
    
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
        id: 'mock-001',
        birthYear: 1990,
        birthMonth: 1,
        birthDay: 1,
        birthHour: 12,
        gender: 1,
        created_at: '2024-01-15 14:30:00',
        is_favorite: true,
        displayDate: '1990年1月1日 12:00',
        displayInfo: '庚午年 戊寅月 戊子日 戊午时'
      },
      {
        id: 'mock-002',
        birthYear: 1985,
        birthMonth: 5,
        birthDay: 20,
        birthHour: 8,
        gender: 0,
        created_at: '2024-01-10 09:15:00',
        is_favorite: false,
        displayDate: '1985年5月20日 8:00',
        displayInfo: '乙丑年 辛巳月 丁巳日 甲辰时'
      },
      {
        id: 'mock-003',
        birthYear: 2000,
        birthMonth: 10,
        birthDay: 1,
        birthHour: 20,
        gender: 1,
        created_at: '2024-01-05 18:45:00',
        is_favorite: true,
        displayDate: '2000年10月1日 20:00',
        displayInfo: '庚辰年 乙酉月 辛酉日 戊戌时'
      }
    ];
  }
})