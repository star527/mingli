const axios = require('axios');

async function testVideoDetail() {
  try {
    console.log('测试视频详情接口...');
    const response = await axios.get('http://localhost:3000/api/videos/1');
    console.log('✅ 成功! 状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 失败!');
    if (error.response) {
      // 服务器返回了错误响应
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('没有收到响应:', error.request);
    } else {
      // 其他错误
      console.error('错误信息:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  }
}

testVideoDetail().catch(err => console.error('测试失败:', err));