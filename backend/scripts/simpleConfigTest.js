// 简单的API配置测试脚本
const http = require('http');

console.log('======= 开始简单API配置测试 =======');

// 测试获取系统配置的API
function testConfigApi() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/config',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log(`✅ 测试成功: 系统配置API返回状态码 ${res.statusCode}`);
                    console.log('📋 返回数据:', JSON.stringify(response, null, 2).substring(0, 200) + '...');
                    resolve({ success: true, statusCode: res.statusCode, data: response });
                } catch (error) {
                    console.error('❌ 测试失败: 响应解析错误', error.message);
                    reject({ success: false, error: '响应解析错误' });
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ 测试失败: 无法连接到服务器 - ${e.message}`);
            reject({ success: false, error: e.message });
        });

        req.end();
    });
}

// 执行测试
async function runTest() {
    try {
        console.log('🔄 测试获取系统配置...');
        await testConfigApi();
        console.log('🎉 所有测试完成！');
    } catch (error) {
        console.error('📊 测试结果: 部分测试失败');
    } finally {
        console.log('======= 测试结束 =======');
    }
}

// 运行测试
runTest();