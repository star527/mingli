/**
 * 简单的数据库表检查脚本
 * 使用与后端应用相同的数据库配置来检查表
 */

const fs = require('fs');
const path = require('path');

// 使用与后端应用相同的数据库模块
const initSqlJs = require('sql.js');

// 模拟后端的数据库连接配置
const simulateBackendDbConnection = async () => {
  try {
    console.log('🔍 开始检查数据库表...');
    
    // 数据库文件路径 - 使用绝对路径
    const dbPath = path.resolve(__dirname, '../data/mingli.db');
    console.log(`📂 数据库文件路径: ${dbPath}`);
    
    // 检查文件是否存在
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`✅ 数据库文件存在，大小: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.error(`❌ 数据库文件不存在: ${dbPath}`);
      return;
    }
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    console.log('✅ SQL.js初始化成功');
    
    // 读取数据库文件
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);
    console.log('✅ 数据库加载成功');
    
    // 1. 查询所有表 - 使用与后端相同的方式
    console.log('\n📋 使用sql.js查询所有表:');
    const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    
    if (tablesResult && tablesResult[0]) {
      const tables = tablesResult[0].values.map(row => row[0]);
      console.log('数据库中存在的表:', tables);
      
      // 2. 查询video_categories表数据
      console.log('\n📋 查询video_categories表:');
      try {
        const categoriesResult = db.exec("SELECT * FROM video_categories LIMIT 5");
        if (categoriesResult && categoriesResult[0]) {
          console.log('✅ 视频分类表存在!');
          console.log('数据预览:');
          categoriesResult[0].values.forEach(row => {
            console.log(row.join('|'));
          });
        }
      } catch (error) {
        console.error(`❌ 查询video_categories表失败: ${error.message}`);
      }
      
      // 3. 查询membership_levels表数据
      console.log('\n📋 查询membership_levels表:');
      try {
        const membershipResult = db.exec("SELECT * FROM membership_levels LIMIT 5");
        if (membershipResult && membershipResult[0]) {
          console.log('✅ 会员等级表存在!');
          console.log('数据预览:');
          membershipResult[0].values.forEach(row => {
            console.log(row.join('|'));
          });
        }
      } catch (error) {
        console.error(`❌ 查询membership_levels表失败: ${error.message}`);
      }
      
      // 4. 尝试查询videos表（后端报错的表）
      console.log('\n📋 查询videos表（后端报错的表）:');
      try {
        const videosResult = db.exec("SELECT * FROM videos LIMIT 5");
        if (videosResult && videosResult[0]) {
          console.log('✅ videos表存在!');
          console.log('数据行数:', videosResult[0].values.length);
        } else {
          console.log('⚠️ videos表存在但没有数据');
        }
      } catch (error) {
        console.error(`❌ 查询videos表失败: ${error.message}`);
        console.error('这解释了为什么后端会报错！');
      }
      
      // 5. 尝试查询users表
      console.log('\n📋 查询users表:');
      try {
        const usersResult = db.exec("SELECT * FROM users LIMIT 5");
        if (usersResult && usersResult[0]) {
          console.log('✅ users表存在!');
          console.log('数据行数:', usersResult[0].values.length);
        } else {
          console.log('⚠️ users表存在但没有数据');
        }
      } catch (error) {
        console.error(`❌ 查询users表失败: ${error.message}`);
      }
      
    } else {
      console.error('❌ 没有找到任何表');
    }
    
    // 测试后端的实际查询（获取视频计数）
    console.log('\n🔍 测试后端的实际查询（获取视频计数）:');
    try {
      const countResult = db.exec("SELECT COUNT(*) as total FROM videos");
      if (countResult && countResult[0]) {
        const count = countResult[0].values[0][0];
        console.log(`✅ 查询成功，视频总数: ${count}`);
      }
    } catch (error) {
      console.error(`❌ 测试查询失败: ${error.message}`);
      console.error('❌ 这正是后端报错的原因！');
    }
    
    // 检查是否有多个数据库文件
    const dataDir = path.resolve(__dirname, '../data');
    const files = fs.readdirSync(dataDir);
    console.log('\n📂 data目录下的文件:');
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
    });
    
    db.close();
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
  }
  
  console.log('\n🎉 检查完成');
};

// 运行检查
simulateBackendDbConnection();