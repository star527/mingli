// pages/login/login.js
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查是否已经登录
    const token = wx.getStorageSync('token');
    if (token) {
      // 如果已有token，直接跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 处理微信登录
   */
  handleWechatLogin: function() {
    wx.showLoading({
      title: '登录中...',
    });
    
    // 调用微信登录API
    wx.login({
      success: res => {
        if (res.code) {
          // 发送code到后端换取用户信息和token
          this.requestLogin(res.code);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('微信登录失败:', err);
      }
    });
  },

  /**
   * 向后端请求登录
   */
  requestLogin: function(code) {
    wx.request({
      url: `${app.globalData.apiBaseUrl}/users/login`,
      method: 'POST',
      data: {
        code: code
      },
      success: res => {
        wx.hideLoading();
        
        if (res.data.success && res.data.data) {
          // 保存token到全局和本地存储
          const token = res.data.data.token;
          const userInfo = res.data.data.user;
          
          app.globalData.token = token;
          app.globalData.userInfo = userInfo;
          
          wx.setStorageSync('token', token);
          wx.setStorageSync('userInfo', userInfo);
          
          // 登录成功，跳转到首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        } else {
          wx.showToast({
            title: res.data.message || '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '服务器连接失败',
          icon: 'none'
        });
        console.error('请求登录失败:', err);
      }
    });
  },

  /**
   * 显示隐私政策
   */
  showPrivacy: function() {
    wx.navigateTo({
      url: '/pages/common/webview?url=privacy'
    });
  },

  /**
   * 显示用户协议
   */
  showTerms: function() {
    wx.navigateTo({
      url: '/pages/common/webview?url=terms'
    });
  }
})