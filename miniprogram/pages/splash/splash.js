// pages/splash/splash.js
Page({
  data: {
  },

  onLoad: function () {
    // 延迟1.5秒后跳转到首页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 1500);
  }
});