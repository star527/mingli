// pages/index/index.js
const app = getApp();
const util = require('../../utils/util').default || require('../../utils/util');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    recommendList: [
      {
        id: '1',
        type: 'video',
        title: '八字入门基础教程',
        description: '从零基础开始学习八字排盘基础知识',
        image: '/assets/images/recommend1.webp'
      },
      {
        id: '2',
        type: 'video',
        title: '五行相生相克详解',
        description: '深入了解五行之间的生克关系和应用',
        image: '/assets/images/recommend2.webp'
      },
      {
        id: '3',
        type: 'article',
        title: '2024年运势预测',
        description: '根据八字看2024年各方面运势走向',
        image: '/assets/images/recommend3.webp'
      }
    ],
    newsList: [
      {
        id: '1',
        title: '新版八字排盘工具上线，更多功能等你来体验',
        date: '2024-01-15'
      },
      {
        id: '2',
        title: '如何通过八字分析职业发展方向',
        date: '2024-01-10'
      },
      {
        id: '3',
        title: '会员专属课程更新通知',
        date: '2024-01-05'
      },
      {
        id: '4',
        title: '八字与健康：如何从八字看健康运势',
        date: '2024-01-01'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    this.checkLoginStatus();
    // 加载首页数据
    this.loadHomeData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    // 如果没有token，可以考虑显示登录提示或引导用户登录
  },

  /**
   * 加载首页数据
   */
  loadHomeData: function() {
    util.showLoading('加载中...');
    
    // 这里应该调用API获取实际数据，现在使用模拟数据
    // 模拟网络请求延迟
    setTimeout(() => {
      // 数据已经在data中定义为模拟数据
      util.hideLoading();
    }, 500);
  },

  /**
   * 跳转到八字排盘页面
   */
  navigateToBazi: function() {
    wx.navigateTo({
      url: '/pages/bazi/index'
    });
  },

  /**
   * 跳转到视频课程页面
   */
  navigateToVideo: function() {
    wx.switchTab({
      url: '/pages/video/index'
    });
  },

  /**
   * 跳转到会员中心页面
   */
  navigateToMembership: function() {
    wx.navigateTo({
      url: '/pages/membership/index'
    });
  },

  /**
   * 跳转到个人中心页面
   */
  navigateToUser: function() {
    wx.switchTab({
      url: '/pages/user/index'
    });
  },

  /**
   * 跳转到更多推荐页面
   */
  navigateToMoreRecommend: function() {
    // 根据实际情况跳转到相应页面
    wx.navigateTo({
      url: '/pages/common/list?type=recommend'
    });
  },

  /**
   * 跳转到资讯列表页面
   */
  navigateToNews: function() {
    wx.navigateTo({
      url: '/pages/common/list?type=news'
    });
  },

  /**
   * 跳转到详情页
   */
  navigateToDetail: function(e) {
    const { id, type } = e.currentTarget.dataset;
    
    if (type === 'video') {
      wx.navigateTo({
        url: `/pages/video/detail?id=${id}`
      });
    } else if (type === 'article') {
      wx.navigateTo({
        url: `/pages/common/article?id=${id}`
      });
    }
  },

  /**
   * 跳转到资讯详情页
   */
  navigateToNewsDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/common/article?id=${id}&type=news`
    });
  }
})