// services/api.js - API请求服务
const app = getApp();

class ApiService {
  constructor() {
    this.baseUrl = app.globalData.apiBaseUrl;
    this.token = wx.getStorageSync('token') || app.globalData.token;
  }

  /**
   * 通用请求方法
   */
  request(options = {}) {
    const token = wx.getStorageSync('token') || app.globalData.token;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.header
        },
        success: res => {
          // 处理统一错误
          if (res.statusCode === 401) {
            // 未授权，清除token并跳转到登录页
            wx.removeStorageSync('token');
            app.globalData.token = null;
            wx.redirectTo({
              url: '/pages/login/login'
            });
            reject(new Error('未授权，请重新登录'));
            return;
          }
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            // 显示错误信息
            if (res.data && res.data.message) {
              wx.showToast({
                title: res.data.message,
                icon: 'none'
              });
            }
            reject(new Error(res.data?.message || `请求失败: ${res.statusCode}`));
          }
        },
        fail: err => {
          console.error('API请求失败:', err);
          wx.showToast({
            title: '网络请求失败，请检查网络',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }

  /**
   * GET请求
   */
  get(url, data = {}) {
    return this.request({
      url,
      method: 'GET',
      data
    });
  }

  /**
   * POST请求
   */
  post(url, data = {}) {
    return this.request({
      url,
      method: 'POST',
      data
    });
  }

  /**
   * PUT请求
   */
  put(url, data = {}) {
    return this.request({
      url,
      method: 'PUT',
      data
    });
  }

  /**
   * DELETE请求
   */
  delete(url, data = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data
    });
  }
}

export default new ApiService();