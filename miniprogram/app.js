// app.js - 小程序入口文件
App({
  onLaunch: function() {
    // 加载用户信息
    this.getUserInfo();
    
    // 初始化云开发环境（如需使用）
    // wx.cloud.init({
    //   env: 'your-env-id',
    //   traceUser: true
    // });
  },
  
  // 获取用户信息
  getUserInfo: function() {
    const that = this;
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              that.globalData.userInfo = res.userInfo
              
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (that.userInfoReadyCallback) {
                that.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  
  // 全局数据
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://127.0.0.1:3000/api', // 使用127.0.0.1而不是localhost，在小程序环境中更稳定
    // apiBaseUrl: 'https://your-production-api.com/api', // 生产环境API地址
    token: null
  }
})