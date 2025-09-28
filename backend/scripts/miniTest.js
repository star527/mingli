const http = require('http');

console.log('开始测试视频详情接口...');

// 创建一个非常简单的HTTP请求
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/videos/1',
  method: 'GET',
  timeout: 5000 // 设置5秒超时
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`响应状态码: ${res.statusCode}`);
    console.log('响应内容:', data);
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.on('timeout', () => {
  console.error('请求超时');
  req.destroy();
});

req.end();