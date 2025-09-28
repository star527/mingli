#!/usr/bin/env node
/**
 * 用户服务测试脚本
 * 验证用户服务的各项功能是否正常工作
 */

import { database } from '../src/config/database.js';
import userService from '../src/services/userService.js';
import membershipService from '../src/services/membershipService.js';
import createAuthMiddleware from '../src/middleware/auth.js';

// 创建简单的配置对象
const config = {
  jwtSecret: process.env.JWT_SECRET || 'test_jwt_secret_key'
};

const authMiddleware = createAuthMiddleware(config);

async function runTests() {
  console.log('开始测试用户服务...');
  
  let testUserId = null;
  
  try {
    // 测试1: 创建测试用户
    console.log('\n测试1: 创建测试用户');
    const testOpenid = 'test_openid_' + Date.now();
    const insertResult = await database.query(
      `INSERT INTO users (id, openid, nickname, created_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      ['test_user_' + Date.now(), testOpenid, '测试用户']
    );
    console.log('创建用户成功');
    
    // 获取刚创建的用户
    const [user] = await database.query(
      'SELECT * FROM users WHERE openid = ?',
      [testOpenid]
    );
    testUserId = user.id;
    console.log('用户ID:', testUserId);
    
    // 测试2: 根据ID获取用户
    console.log('\n测试2: 根据ID获取用户');
    const userById = await userService.getUserById(testUserId);
    console.log('用户信息:', userById);
    if (!userById) {
      throw new Error('根据ID获取用户失败');
    }
    
    // 测试3: 根据openid获取用户
    console.log('\n测试3: 根据openid获取用户');
    const userByOpenid = await userService.getUserByOpenid(testOpenid);
    console.log('用户信息:', userByOpenid);
    if (!userByOpenid) {
      throw new Error('根据openid获取用户失败');
    }
    
    // 测试4: 获取会员信息
    console.log('\n测试4: 获取会员信息');
    const membershipInfo = await membershipService.getUserMembership(testUserId);
    console.log('会员信息:', membershipInfo);
    
    // 测试5: 获取本月分析次数
    console.log('\n测试5: 获取本月分析次数');
    const analysisCount = await userService.getAnalysisCountThisMonth(testUserId);
    console.log('本月分析次数:', analysisCount);
    
    // 测试6: 会员统计
    console.log('\n测试6: 获取会员统计');
    const stats = await membershipService.getMembershipStats();
    console.log('会员统计:', stats);
    
    // 测试7: 生成Token
    console.log('\n测试7: 生成Token');
    const token = authMiddleware.generateToken(testUserId);
    console.log('生成的Token:', token);
    
    console.log('\n🎉 基础测试通过! 用户服务核心功能正常!');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    // 清理测试数据
    if (testUserId) {
      try {
        await database.query('DELETE FROM users WHERE id = ?', [testUserId]);
        console.log('\n已清理测试数据');
      } catch (e) {
        console.error('清理测试数据失败:', e.message);
      }
    }
    // 关闭数据库连接
    await database.close();
  }
}

// 运行测试
runTests();