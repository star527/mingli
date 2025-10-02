// pages/video/detail.js
const app = getApp();
const util = require('../../utils/util').default || require('../../utils/util');
// 处理ES模块和CommonJS模块的兼容性
const apiService = require('../../services/api').default || require('../../services/api');

/**
 * 确保URL是完整的绝对地址
 * @param {string} url - 要检查的URL
 * @returns {string} - 完整的绝对URL
 */
function ensureAbsoluteUrl(url) {
  if (!url) return '';
  
  // 如果已经是完整的URL（包含协议），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 使用127.0.0.1而不是localhost，可能在小程序环境中更稳定
  const baseUrl = 'http://127.0.0.1:3000';
  
  // 提取文件名（处理不同格式的URL）
  let filename;
  if (url.includes('uploads/video')) {
    // 从完整路径中提取文件名
    filename = url.split('/').pop();
  } else if (url.startsWith('/')) {
    // 从相对路径中提取文件名
    filename = url.split('/').pop();
  } else {
    // 已经是文件名
    filename = url;
  }
  
  // 使用新的视频代理API端点，通过API间接提供视频
  // 这种方式可能会绕过小程序的一些安全限制
  return `${baseUrl}/api/video-play/${filename}`;
}
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoId: '',
    videoDetail: null,
    relatedVideos: [],
    isLoading: true,
    isPlaying: false,
    playProgress: 0, // 播放进度
    videoContext: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options && options.id) {
      this.setData({
        videoId: options.id
      });
      this.loadVideoDetail();
    } else {
      wx.showToast({
        title: '视频ID无效',
        icon: 'none'
      });
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 获取视频上下文
    this.setData({
      videoContext: wx.createVideoContext('myVideo')
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果有视频ID且没有加载过视频详情，则加载
    if (this.data.videoId && !this.data.videoDetail) {
      this.loadVideoDetail();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 隐藏时暂停视频并保存进度
    if (this.data.isPlaying) {
      this.data.videoContext.pause();
      this.recordVideoProgress();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 卸载时保存进度
    this.recordVideoProgress();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 刷新视频详情
    if (this.data.videoId) {
      this.loadVideoDetail(true);
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多相关视频
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const video = this.data.videoDetail;
    return {
      title: video ? video.title : '观看精彩视频',
      path: `/pages/video/detail?id=${this.data.videoId}`,
      imageUrl: video ? video.coverUrl : ''
    };
  },

  /**
   * 加载视频详情
   */
  async loadVideoDetail(isRefresh = false) {
    if (isRefresh) {
      wx.showNavigationBarLoading();
    } else {
      this.setData({
        isLoading: true
      });
    }

    try {
      // 调用后端API获取视频详情
      const res = await apiService.get(`/videos/${this.data.videoId}`);

      if (res.success) {
        // 正确地从res.data.video获取视频详情数据
        const videoData = res.data?.video || {};
        
        // 格式化视频详情数据
        const videoDetail = {
          id: videoData.id || videoData._id,
          title: videoData.title,
          description: videoData.description,
          // 确保视频URL是完整的http URL
          videoUrl: ensureAbsoluteUrl(videoData.videoUrl || videoData.video_url || videoData.play_url),
          // 确保封面URL是完整的http URL
          coverUrl: ensureAbsoluteUrl(videoData.coverUrl || videoData.cover_url || videoData.thumbnail_url || videoData.thumbnail),
          duration: videoData.duration,
          viewCount: videoData.viewCount || videoData.view_count || 0,
          publishTime: this.formatTime(videoData.createdAt || videoData.created_at || videoData.publishTime),
          tags: videoData.tags || [],
          author: videoData.author || { name: '命理学院' }
        };

        // 更新数据
        this.setData({
          videoDetail: videoDetail,
          isLoading: false
        });

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: videoDetail.title
        });

        // 记录视频观看记录和进度
        this.recordVideoProgress();

        // 加载相关视频
        this.loadRelatedVideos();
      } else {
        console.error('获取视频详情失败:', res.message);
        wx.showToast({
          title: res.message || '加载视频失败',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      }
    } catch (error) {
      console.error('加载视频详情出错:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    } finally {
      if (isRefresh) {
        wx.hideNavigationBarLoading();
        wx.stopPullDownRefresh();
      }
    }
  },

  /**
   * 加载相关视频
   */
  async loadRelatedVideos() {
    try {
      const res = await apiService.get(`/videos/related/${this.data.videoId}`, {
        limit: 6
      });

      if (res.success) {
        // 正确访问相关视频数组，应该从res.data.videos获取
        const videosArray = res.data?.videos || [];
        
        // 格式化相关视频数据
        const relatedVideos = videosArray.map(video => ({
          id: video.id || video._id,
          title: video.title,
          // 确保相关视频封面URL也是完整的绝对地址
          cover: ensureAbsoluteUrl(video.cover_url || video.cover || video.thumbnail || video.cover_image),
          duration: video.duration
        }));

        this.setData({
          relatedVideos: relatedVideos
        });
      }
    } catch (error) {
      console.error('加载相关视频出错:', error);
      // 即使出错也设置空数组，避免页面显示问题
      this.setData({ relatedVideos: [] });
    }
  },

  /**
   * 记录视频观看进度
   */
  async recordVideoProgress() {
    try {
      // 这里可以调用API记录用户观看进度
      // await apiService.post('/videos/progress', {
      //   videoId: this.data.videoId,
      //   progress: this.data.playProgress
      // });
    } catch (error) {
      console.error('记录观看进度失败:', error);
    }
  },

  /**
   * 视频播放事件
   */
  onVideoPlay() {
    this.setData({ isPlaying: true });
  },

  /**
   * 视频暂停事件
   */
  onVideoPause() {
    this.setData({ isPlaying: false });
  },

  /**
   * 视频进度更新事件
   */
  onTimeUpdate(e) {
    const progress = e.detail.currentTime;
    // 每10秒记录一次进度
    if (Math.floor(progress) % 10 === 0 && Math.floor(progress) > 0) {
      this.setData({ playProgress: progress });
    }
  },

  /**
   * 视频播放结束事件
   */
  onEnded() {
    this.setData({ isPlaying: false });
    // 记录完整观看
    this.recordVideoProgress();
  },

  /**
   * 点击播放/暂停
   */
  togglePlay() {
    if (this.data.isPlaying) {
      this.data.videoContext.pause();
    } else {
      this.data.videoContext.play();
    }
  },

  /**
   * 跳转到其他视频
   */
  navigateToVideo(e) {
    const videoId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/video/detail?id=${videoId}`
    });
  },

  /**
   * 视频错误处理函数
   */
  onVideoError(e) {
    console.error('视频加载错误:', e.detail);
    wx.showToast({
      title: `视频加载失败: ${e.detail.errMsg || '未知错误'}`,
      icon: 'none',
      duration: 3000
    });
    // 可以在这里记录错误信息
  },
  
  /**
   * 格式化时间戳为可读格式
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
});