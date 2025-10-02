// utils/util.js - 通用工具函数

class Util {
  /**
   * 格式化日期
   * @param {Date|string} date - 日期对象或日期字符串
   * @param {string} format - 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取当前时间戳
   * @returns {number} 时间戳
   */
  getTimestamp() {
    return Date.now();
  }

  /**
   * 本地存储 - 保存数据
   * @param {string} key - 存储键名
   * @param {any} value - 存储值
   * @returns {boolean} 是否保存成功
   */
  setStorage(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      return false;
    }
  }

  /**
   * 本地存储 - 获取数据
   * @param {string} key - 存储键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值或默认值
   */
  getStorage(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key);
      return value !== undefined ? value : defaultValue;
    } catch (error) {
      console.error('获取存储数据失败:', error);
      return defaultValue;
    }
  }

  /**
   * 本地存储 - 删除数据
   * @param {string} key - 存储键名
   * @returns {boolean} 是否删除成功
   */
  removeStorage(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('删除存储数据失败:', error);
      return false;
    }
  }

  /**
   * 本地存储 - 清空所有数据
   * @returns {boolean} 是否清空成功
   */
  clearStorage() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (error) {
      console.error('清空存储数据失败:', error);
      return false;
    }
  }

  /**
   * 生成随机字符串
   * @param {number} length - 字符串长度
   * @returns {string} 随机字符串
   */
  randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 格式化数字（添加千位分隔符）
   * @param {number|string} num - 数字
   * @returns {string} 格式化后的数字
   */
  formatNumber(num) {
    return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * 显示加载提示
   * @param {string} title - 提示文字
   */
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  }

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    wx.hideLoading();
  }

  /**
   * 显示提示框
   * @param {string} title - 提示文字
   * @param {string} icon - 图标类型 'success', 'error', 'loading', 'none'
   * @param {number} duration - 显示时长
   */
  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title,
      icon,
      duration
    });
  }

  /**
   * 显示确认对话框
   * @param {Object} options - 对话框配置
   * @param {string} options.title - 标题
   * @param {string} options.content - 内容
   * @param {boolean} options.showCancel - 是否显示取消按钮
   * @param {string} options.confirmText - 确定按钮文字
   * @param {string} options.cancelText - 取消按钮文字
   * @returns {Promise} 对话框结果
   */
  showModal(options = {}) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '提示',
        content: options.content || '',
        showCancel: options.showCancel !== false,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        success: (res) => {
          resolve(res);
        }
      });
    });
  }

  /**
   * 检查是否为空对象
   * @param {Object} obj - 要检查的对象
   * @returns {boolean} 是否为空
   */
  isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  /**
   * 深拷贝对象
   * @param {any} obj - 要拷贝的对象
   * @returns {any} 拷贝后的对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }
}

export default new Util();