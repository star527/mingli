// 系统配置API测试脚本（无超时限制）
const http = require('http');

console.log('开始测试系统配置API...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/config',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ 响应状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    console.log('🔄 接收数据中...');
  });

  res.on('end', () => {
    try {
      console.log('✅ 数据接收完成');
      console.log('响应数据长度:', data.length, '字符');
      console.log('测试成功完成！');
      process.exit(0);
    } catch (error) {
      console.error('❌ 响应解析错误', error.message);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ 连接错误: ${e.message}`);
  process.exit(1);
});

console.log('发送请求到 http://localhost:3000/api/config');
req.end();