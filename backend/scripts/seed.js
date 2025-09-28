/**
 * 数据库种子脚本
 * 插入初始测试数据
 */

const { database } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

async function runSeed() {
  try {
    console.log('🌱 开始数据库种子填充...');
    
    // 连接数据库
    await database.createPool();
    console.log('✅ 数据库连接成功');
    
    // 插入测试用户
    console.log('📋 插入测试用户...');
    const testUser = {
      id: uuidv4(),
      nickname: '测试用户',
      avatar_url: 'https://example.com/avatar.jpg',
      member_level: 2, // 高级会员
      member_expire_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 一年后过期
      analysis_count: 5,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const userSql = `
      INSERT INTO users (
        id, nickname, avatar_url, member_level, member_expire_date, 
        analysis_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await database.query(userSql, [
      testUser.id, testUser.nickname, testUser.avatar_url, testUser.member_level,
      testUser.member_expire_date.toISOString(), testUser.analysis_count,
      testUser.created_at.toISOString(), testUser.updated_at.toISOString()
    ]);
    console.log('✅ 测试用户插入成功');
    
    // 插入测试视频
    console.log('📋 插入测试视频...');
    const testVideo = {
      id: uuidv4(),
      title: '八字命理基础入门',
      description: '本课程将带你了解八字命理的基本概念和分析方法',
      category: 'bazi',
      duration: 1800, // 30分钟
      is_premium: true,
      status: 'active',
      view_count: 100,
      like_count: 25,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const videoSql = `
      INSERT INTO videos (
        id, title, description, category, duration, is_premium, status,
        view_count, like_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await database.query(videoSql, [
      testVideo.id, testVideo.title, testVideo.description, testVideo.category,
      testVideo.duration, testVideo.is_premium ? 1 : 0, testVideo.status,
      testVideo.view_count, testVideo.like_count,
      testVideo.created_at.toISOString(), testVideo.updated_at.toISOString()
    ]);
    console.log('✅ 测试视频插入成功');
    
    // 插入测试订单
    console.log('📋 插入测试订单...');
    const testOrder = {
      id: uuidv4(),
      user_id: testUser.id,
      order_type: 'membership',
      product_name: '高级会员月费',
      amount: 99.00,
      payment_method: 'wechat',
      payment_status: 'completed',
      member_level: 2,
      member_duration: 30,
      created_at: new Date(),
      updated_at: new Date(),
      paid_at: new Date()
    };
    
    const orderSql = `
      INSERT INTO orders (
        id, user_id, order_type, product_name, amount, payment_method,
        payment_status, member_level, member_duration, created_at, 
        updated_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await database.query(orderSql, [
      testOrder.id, testOrder.user_id, testOrder.order_type, testOrder.product_name,
      testOrder.amount, testOrder.payment_method, testOrder.payment_status,
      testOrder.member_level, testOrder.member_duration,
      testOrder.created_at.toISOString(), testOrder.updated_at.toISOString(),
      testOrder.paid_at.toISOString()
    ]);
    console.log('✅ 测试订单插入成功');
    
    console.log('🎉 数据库种子填充完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库种子填充失败:', error.message);
    process.exit(1);
  }
}

// 执行种子填充
if (require.main === module) {
  runSeed();
}