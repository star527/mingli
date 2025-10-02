// pages/video/index.js
const app = getApp();
const util = require('../../utils/util').default || require('../../utils/util');
// 处理ES模块和CommonJS模块的兼容性
const apiService = require('../../services/api').default || require('../../services/api');

/**
 * 确保URL是完整的绝对地址
 * @param {string} url - 要检查的URL
 * @returns {string} - 完整的绝对URL
 */
function ensureAbsoluteUrl(url, isVideo = false) {
  if (!url) return '';
  
  // 如果已经是完整的URL（包含协议），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 使用127.0.0.1而不是localhost，可能在小程序环境中更稳定
  const baseUrl = 'http://127.0.0.1:3000';
  
  if (isVideo) {
    // 视频文件使用代理API
    // 提取文件名（处理不同格式的URL）
    let filename;
    if (url.includes('uploads/video')) {
      filename = url.split('/').pop();
    } else if (url.startsWith('/')) {
      filename = url.split('/').pop();
    } else {
      filename = url;
    }
    
    // 使用视频代理API端点
    return `${baseUrl}/api/video-play/${filename}`;
  } else {
    // 其他资源（如封面图片）使用直接URL
    // 检查是否已经包含uploads/video路径
    if (url.includes('uploads/video')) {
      return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }
    
    // 如果URL以'/'开头，直接添加baseUrl
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    // 如果是文件名或短路径，添加uploads/video前缀
    return `${baseUrl}/uploads/video/${url}`;
  }
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    categories: [], // 视频分类列表
    activeCategory: 'all', // 当前选中的分类
    videoList: [], // 视频列表
    page: 1, // 当前页码
    pageSize: 10, // 每页数量
    hasMore: true, // 是否有更多数据
    isLoading: false // 是否正在加载
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载分类和视频数据
    this.loadCategories();
    this.loadVideos();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 下拉刷新，重置页面并重新加载
    this.setData({
      page: 1,
      hasMore: true,
      videoList: []
    });
    this.loadVideos(true);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 上拉加载更多
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadVideos(false);
    }
  },

  /**
   * 加载视频分类
   */
  loadCategories: function() {
    // 从后端API获取分类数据
    apiService.get('/videos/categories')
      .then(res => {
        if (res.success) {
          // 确保始终包含"全部"分类作为第一个选项
          const categoriesWithAll = [
            { id: 'all', name: '全部' },
            ...res.data
          ];
          
          this.setData({
            categories: categoriesWithAll
          });
        } else {
          // 如果API调用失败，使用默认分类列表作为降级方案
          console.error('获取分类失败:', res.message);
          const defaultCategories = [
            { id: 'all', name: '全部' },
            { id: 'basic', name: '基础教程' },
            { id: 'intermediate', name: '中级教程' },
            { id: 'advanced', name: '高级教程' },
            { id: 'case', name: '案例分析' },
            { id: 'forecast', name: '运势预测' }
          ];
          this.setData({ categories: defaultCategories });
        }
      })
      .catch(err => {
        console.error('获取分类出错:', err);
        // 出错时使用默认分类列表
        const defaultCategories = [
          { id: 'all', name: '全部' },
          { id: 'basic', name: '基础教程' },
          { id: 'intermediate', name: '中级教程' },
          { id: 'advanced', name: '高级教程' },
          { id: 'case', name: '案例分析' },
          { id: 'forecast', name: '运势预测' }
        ];
        this.setData({ categories: defaultCategories });
      });
  },

  /**
   * 加载视频列表
   * @param {boolean} isRefresh - 是否是刷新操作
   */
  loadVideos: async function(isRefresh = false) {
    if (this.data.isLoading) return;
    
    this.setData({
      isLoading: true
    });
    
    try {
      // 准备请求参数
      const params = {
        page: isRefresh ? 1 : this.data.page,
        limit: this.data.pageSize
      };
      
      // 如果不是"全部"分类，则添加分类筛选
      if (this.data.activeCategory !== 'all') {
        params.category = this.data.activeCategory;
      }
      
      // 调用后端API获取视频列表
      const res = await apiService.get('/videos', params);
      
      if (res.success) {
        // 适配API返回的数据格式
        const apiVideos = res.data.videos || res.data || [];
        
        // 格式化视频数据，确保前端所需字段都存在
        const formattedVideos = apiVideos.map(video => ({
          id: video.id || video._id,
          title: video.title,
          // 确保封面URL是完整的绝对地址
          cover: ensureAbsoluteUrl(video.cover_url || video.cover || video.thumbnail || video.cover_image || ''),
          duration: video.duration || '',
          viewCount: video.view_count || 0,
          publishTime: video.created_at || video.publishTime || '',
          category: video.category_id || video.category || '',
          tags: video.tags || []
        }));
        
        // 更新数据
        let newVideoList = [];
        if (isRefresh) {
          newVideoList = formattedVideos;
          wx.stopPullDownRefresh();
        } else {
          newVideoList = [...this.data.videoList, ...formattedVideos];
        }
        
        this.setData({
          videoList: newVideoList,
          hasMore: formattedVideos.length === this.data.pageSize,
          isLoading: false,
          page: isRefresh ? 2 : this.data.page + 1 // 下一页页码
        });
      } else {
        console.error('获取视频列表失败:', res.message);
        wx.showToast({
          title: res.message || '加载视频失败',
          icon: 'none'
        });
        
        this.setData({
          isLoading: false
        });
      }
    } catch (error) {
      console.error('加载视频出错:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
      
      this.setData({
        isLoading: false
      });
    }
  },

  /**
   * 选择分类
   */
  selectCategory: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    
    // 如果点击的是当前选中的分类，不做任何操作
    if (categoryId === this.data.activeCategory) return;
    
    this.setData({
      activeCategory: categoryId,
      page: 1,
      hasMore: true,
      videoList: []
    });
    
    // 加载新分类下的视频
    this.loadVideos();
  },

  /**
   * 播放视频
   */
  playVideo: function(e) {
    const videoId = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/video/detail?id=${videoId}`
    });
  },

  /**
   * 跳转到搜索页面
   */
  navigateToSearch: function() {
    wx.navigateTo({
      url: '/pages/video/search'
    });
  },

  /**
   * 格式化时间戳为可读格式
   */
  formatTime: function(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
});