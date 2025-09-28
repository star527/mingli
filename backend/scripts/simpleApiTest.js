/**
 * 简单API测试脚本
 * 验证系统核心功能和API访问
 */

const http = require('http');

// API基础URL
const BASE_URL = 'http://localhost:3000/api';
let token = null;

// 简单的HTTP请求函数
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 测试函数
async function runTests() {
  console.log('======= 开始API功能测试 =======');
  
  try {
    // 测试1: 尝试未授权访问需要认证的API
    console.log('\n测试1: 未授权访问测试');
    const unauthOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/config',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const unauthResponse = await httpRequest(unauthOptions);
    console.log(`响应状态码: ${unauthResponse.statusCode}`);
    console.log('响应内容:', unauthResponse.body);
    
    // 测试2: 用户登录
    console.log('\n测试2: 用户登录');
    const loginData = JSON.stringify({
      openid: 'test_api_openid_123',
      nickname: 'API测试用户',
      avatar_url: 'https://example.com/avatar.jpg'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await httpRequest(loginOptions, loginData);
    console.log(`登录响应状态码: ${loginResponse.statusCode}`);
    
    let loginBody;
    try {
      loginBody = JSON.parse(loginResponse.body);
      console.log('登录响应:', loginBody);
      
      if (loginBody.token) {
        token = loginBody.token;
        console.log('✅ 登录成功，获取到token');
      } else {
        console.log('❌ 登录失败，未获取到token');
      }
    } catch (e) {
      console.log('登录响应解析错误:', e);
      console.log('原始响应:', loginResponse.body);
    }
    
    // 测试3: 已授权访问API
    if (token) {
      console.log('\n测试3: 已授权访问API');
      const authOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/config',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const authResponse = await httpRequest(authOptions);
      console.log(`响应状态码: ${authResponse.statusCode}`);
      
      try {
        const authBody = JSON.parse(authResponse.body);
        console.log('配置响应:', authBody);
        console.log('✅ 已授权API访问成功');
      } catch (e) {
        console.log('响应解析错误:', e);
        console.log('原始响应:', authResponse.body);
      }
    }
    
    // 测试4: 获取用户信息
    if (token) {
      console.log('\n测试4: 获取用户信息');
      const userOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/users/profile',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const userResponse = await httpRequest(userOptions);
      console.log(`响应状态码: ${userResponse.statusCode}`);
      
      try {
        const userBody = JSON.parse(userResponse.body);
        console.log('用户信息响应:', userBody);
        console.log('✅ 用户信息获取成功');
      } catch (e) {
        console.log('响应解析错误:', e);
        console.log('原始响应:', userResponse.body);
      }
    }
    
    console.log('\n======= API测试完成 =======');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
runTests();