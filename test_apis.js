const axios = require('axios');

// 测试API的函数
async function testApis() {
  console.log('开始测试API...');
  
  try {
    // 1. 测试图片上传接口
    console.log('\n测试 /api/upload/image 接口...');
    try {
      // 由于需要认证，我们使用模拟的token
      const response = await axios.post('http://localhost:3000/api/upload/image', {}, {
        headers: {
          'Authorization': 'Bearer mock_token_for_testing'
        }
      });
      console.log('图片上传接口返回:', response.data);
    } catch (error) {
      console.log('图片上传接口状态码:', error.response?.status || '无响应');
      console.log('图片上传接口错误信息:', error.response?.data || error.message);
    }
    
    // 2. 测试会员信息接口
    console.log('\n测试 /api/membership/info 接口...');
    try {
      const response = await axios.get('http://localhost:3000/api/membership/info', {
        headers: {
          'Authorization': 'Bearer mock_token_for_testing'
        }
      });
      console.log('会员信息接口返回:', response.data);
    } catch (error) {
      console.log('会员信息接口状态码:', error.response?.status || '无响应');
      console.log('会员信息接口错误信息:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  console.log('\nAPI测试完成');
}

// 执行测试
testApis();