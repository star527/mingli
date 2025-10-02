// pages/user/index.js
const app = getApp();
const util = require('../../utils/util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {}, // 用户信息
    isLoggedIn: false, // 是否已登录
    stats: {
      baziRecords: 0,
      favorites: 0,
      watchHistory: 0,
      coupons: 0
    },
    appInfo: {
      version: '1.0.0'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 初始化页面数据
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时检查登录状态和用户信息
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo;
    
    if (token && userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
      // 加载用户统计数据
      this.loadUserStats();
    } else {
      this.setData({
        userInfo: {},
        isLoggedIn: false
      });
    }
  },

  /**
   * 加载用户统计数据
   */
  loadUserStats: function() {
    // 这里应该调用API获取用户统计数据
    // 现在使用模拟数据
    const mockStats = {
      baziRecords: Math.floor(Math.random() * 50) + 10,
      favorites: Math.floor(Math.random() * 30),
      watchHistory: Math.floor(Math.random() * 100) + 20,
      coupons: Math.floor(Math.random() * 5)
    };
    
    // 检查用户是否是VIP
    const userInfo = this.data.userInfo;
    if (!userInfo.isVip) {
      // 模拟VIP状态
      userInfo.isVip = Math.random() > 0.7; // 30%的概率是VIP
      if (userInfo.isVip) {
        // 生成随机的VIP过期日期
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        userInfo.vipExpiryDate = util.formatDate(expiryDate, 'YYYY-MM-DD');
      }
    }
    
    this.setData({
      stats: mockStats,
      userInfo: userInfo
    });
  },

  /**
   * 跳转到用户信息页面
   */
  navigateToUserInfo: function() {
    if (!this.data.isLoggedIn) {
      // 如果未登录，跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    // 已登录，跳转到用户信息编辑页面
    wx.navigateTo({
      url: '/pages/user/profile'
    });
  },

  /**
   * 跳转到八字排盘历史
   */
  navigateToBaziHistory: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/common/list?type=bazi_history'
    });
  },

  /**
   * 跳转到收藏页面
   */
  navigateToFavorites: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/common/list?type=favorites'
    });
  },

  /**
   * 跳转到观看历史
   */
  navigateToWatchHistory: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/common/list?type=watch_history'
    });
  },

  /**
   * 跳转到会员中心
   */
  navigateToMembership: function() {
    wx.navigateTo({
      url: '/pages/membership/index'
    });
  },

  /**
   * 跳转到优惠券页面
   */
  navigateToCoupon: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/user/coupons'
    });
  },

  /**
   * 跳转到收货地址页面
   */
  navigateToAddress: function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/user/address'
    });
  },

  /**
   * 跳转到设置页面
   */
  navigateToSettings: function() {
    wx.navigateTo({
      url: '/pages/user/settings'
    });
  },

  /**
   * 跳转到帮助与反馈页面
   */
  navigateToHelp: function() {
    wx.navigateTo({
      url: '/pages/common/help'
    });
  },

  /**
   * 跳转到关于我们页面
   */
  navigateToAbout: function() {
    wx.navigateTo({
      url: '/pages/common/about'
    });
  },

  /**
   * 处理退出登录
   */
  handleLogout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      showCancel: true,
      success: (res) => {
        if (res.confirm) {
          // 清除登录状态
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = null;
          app.globalData.userInfo = null;
          
          // 更新页面状态
          this.setData({
            userInfo: {},
            isLoggedIn: false
          });
          
          // 显示提示
          util.showToast('退出登录成功', 'success');
        }
      }
    });
  }
})