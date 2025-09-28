// 极简系统配置API测试脚本
const http = require('http');

console.log('开始测试系统配置API...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/config',
  method: 'GET',
  timeout: 3000 // 3秒超时
};

const req = http.request(options, (res) => {
  console.log(`✅ 响应状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ 响应解析成功');
      console.log('测试成功完成！');
      process.exit(0);
    } catch (error) {
      console.error('❌ 响应解析错误');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ 连接错误: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ 请求超时');
  req.destroy();
  process.exit(1);
});

req.end();