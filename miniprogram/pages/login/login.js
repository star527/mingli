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
      timeout: 5000, // 设置5秒超时
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
          wx.hideLoading();
          this.handleLoginFail('登录失败，请重试');
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('请求登录失败:', err);
        this.handleLoginFail('服务器连接失败或超时');
      }
    });
  },
  
  /**
   * 处理登录失败
   */
  handleLoginFail: function(message) {
    wx.showModal({
      title: '登录提示',
      content: `${message}\n\n是否使用模拟登录？`,
      showCancel: true,
      cancelText: '重试',
      confirmText: '模拟登录',
      success: (res) => {
        if (res.confirm) {
          this.mockLogin();
        }
      }
    });
  },
  
  /**
   * 模拟登录
   */
  mockLogin: function() {
    wx.showLoading({
      title: '模拟登录中...',
    });
    
    // 模拟网络延迟
    setTimeout(() => {
      // 生成模拟的token和用户信息
      const mockToken = 'mock_token_' + Date.now();
      const mockUserInfo = {
        id: 'mock_user_1',
        nickname: '测试用户',
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTLLo87ibq7h5jO1tE43iaJxYV68PzNibP16vQqicNia4p8nibx4Y2s8H1t5mXs/132',
        membership: '普通会员',
        createdAt: new Date().toISOString()
      };
      
      // 保存模拟数据到全局和本地存储
      app.globalData.token = mockToken;
      app.globalData.userInfo = mockUserInfo;
      
      wx.setStorageSync('token', mockToken);
      wx.setStorageSync('userInfo', mockUserInfo);
      
      wx.hideLoading();
      
      // 模拟登录成功，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 1000);
  },
  
  /**
   * 开发模式：隐藏的模拟登录按钮处理函数
   * 长按微信登录按钮可以直接进入模拟登录
   */
  handleLongPressLogin: function() {
    // 开发模式下，可以通过长按登录按钮直接进入模拟登录
    console.log('长按登录按钮，进入模拟登录');
    wx.showModal({
      title: '开发模式',
      content: '是否使用模拟登录？',
      showCancel: true,
      success: (res) => {
        if (res.confirm) {
          this.mockLogin();
        }
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