/**
 * 视频API接口测试脚本
 * 用于验证视频相关接口的功能和验证规则
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试环境配置
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_USER_TOKEN = ''; // 需要替换为实际的测试用户token
const TEST_ADMIN_TOKEN = ''; // 需要替换为实际的测试管理员token

class VideoApiTester {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 设置认证token
  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // 测试日志
  log(message, success = true) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${message}`);
  }

  // 测试错误
  logError(message, error) {
    this.log(message, false);
    if (error.response) {
      console.error(`  状态码: ${error.response.status}`);
      console.error(`  响应数据:`, error.response.data);
    } else if (error.request) {
      console.error(`  请求发送失败:`, error.request);
    } else {
      console.error(`  错误信息:`, error.message);
    }
  }

  // 1. 测试视频列表接口
  async testVideoList() {
    try {
      this.log('测试视频列表接口');
      const response = await this.api.get('/videos');
      this.log(`视频列表返回成功，共${response.data.data.length}条记录`);
      return response.data;
    } catch (error) {
      this.logError('视频列表接口测试失败', error);
      return null;
    }
  }

  // 2. 测试视频搜索接口（带验证）
  async testVideoSearch() {
    try {
      this.log('测试视频搜索接口（有效参数）');
      const response = await this.api.get('/videos/search?q=八字');
      this.log(`搜索返回成功，共${response.data.data.length}条记录`);

      // 测试无效参数
      this.log('测试视频搜索接口（无效参数）');
      try {
        await this.api.get('/videos/search?q=' + 'a'.repeat(101)); // 超出长度限制
        this.logError('未正确验证搜索关键词长度');
      } catch (error) {
        if (error.response?.status === 400) {
          this.log('正确验证了搜索关键词长度限制');
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logError('视频搜索接口测试失败', error);
    }
  }

  // 3. 测试视频详情接口（带验证）
  async testVideoDetail(videoId = 1) {
    try {
      this.log(`测试视频详情接口（ID: ${videoId}）`);
      const response = await this.api.get(`/videos/${videoId}`);
      this.log(`视频详情返回成功: ${response.data.data.title}`);
      console.log('响应数据:', JSON.stringify(response.data, null, 2));

      // 测试无效ID
      this.log('测试视频详情接口（无效ID - abc）');
      try {
        await this.api.get('/videos/abc'); // 非数字ID
        this.logError('未正确验证视频ID格式');
      } catch (error) {
        if (error.response) {
          console.log(`错误状态码: ${error.response.status}`);
          console.log(`错误数据:`, JSON.stringify(error.response.data, null, 2));
          if (error.response.status === 400) {
            this.log('正确验证了视频ID格式');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      // 测试负整数ID
      this.log('测试视频详情接口（无效ID - 负数）');
      try {
        await this.api.get('/videos/-1'); // 负整数ID
        this.logError('未正确验证视频ID不能为负数');
      } catch (error) {
        if (error.response) {
          console.log(`错误状态码: ${error.response.status}`);
          console.log(`错误数据:`, JSON.stringify(error.response.data, null, 2));
          if (error.response.status === 400) {
            this.log('正确验证了视频ID不能为负数');
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logError('视频详情接口测试失败', error);
      if (error.response) {
        console.log('完整错误响应:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('请求对象:', error.request);
      } else {
        console.log('错误堆栈:', error.stack);
      }
    }
  }

  // 4. 测试需要认证的接口（需要token）
  async testAuthRequiredEndpoints() {
    if (!TEST_USER_TOKEN) {
      this.log('跳过认证接口测试（未提供测试token）', false);
      return;
    }

    try {
      this.setAuthToken(TEST_USER_TOKEN);
      this.log('测试用户学习统计接口');
      const statsResponse = await this.api.get('/user/learning-stats');
      this.log('用户学习统计返回成功');

      // 测试记录观看进度（带验证）
      this.log('测试记录观看进度接口（有效参数）');
      await this.api.post('/videos/1/progress', { 
        progress: 45.5, 
        duration: 300 
      });
      this.log('记录观看进度成功');

      // 测试无效进度参数
      this.log('测试记录观看进度接口（无效参数）');
      try {
        await this.api.post('/videos/1/progress', { 
          progress: 150, // 超出范围
          duration: 300 
        });
        this.logError('未正确验证进度范围');
      } catch (error) {
        if (error.response?.status === 400) {
          this.log('正确验证了进度范围限制');
        } else {
          throw error;
        }
      }

    } catch (error) {
      this.logError('认证接口测试失败', error);
    } finally {
      this.setAuthToken(null);
    }
  }

  // 5. 运行所有测试
  async runAllTests() {
    console.log('========== 开始视频API接口测试 ==========');
    
    // 测试公开接口
    await this.testVideoList();
    await this.testVideoSearch();
    await this.testVideoDetail();
    
    // 测试认证接口
    await this.testAuthRequiredEndpoints();
    
    console.log('========== 视频API接口测试完成 ==========');
  }
}

// 执行测试
if (require.main === module) {
  const tester = new VideoApiTester();
  tester.runAllTests().catch(err => {
    console.error('测试运行失败:', err);
  });
} else {
  module.exports = VideoApiTester;
}