/**
 * 检查数据库中的表结构
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkTables() {
  try {
    console.log('🔍 开始检查数据库表...');
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 数据库文件路径
    const dbPath = path.join(__dirname, '../data/mingli.db');
    
    // 加载数据库
    const fileBuffer = fs.readFileSync(dbPath);
    const data = new Uint8Array(fileBuffer);
    const db = new SQL.Database(data);
    
    console.log('✅ 数据库连接成功');
    
    // 查询所有表名
    console.log('\n📋 所有表名:');
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    tables[0].values.forEach(table => {
      console.log(`- ${table[0]}`);
    });
    
    // 检查video_categories表
    console.log('\n🔍 检查视频分类表...');
    try {
      // 获取表结构
      const categoriesSchema = db.exec("PRAGMA table_info(video_categories)");
      console.log('✅ 视频分类表结构:');
      categoriesSchema[0].values.forEach(col => {
        console.log(`  - ${col[1]} (${col[2]})`);
      });
      
      // 获取数据
      const categoriesData = db.exec("SELECT * FROM video_categories");
      console.log(`\n📊 视频分类数据 (${categoriesData[0].values.length}条):`);
      categoriesData[0].values.forEach(category => {
        console.log(`  - ID: ${category[0]}, 名称: ${category[1]}, 描述: ${category[2]}`);
      });
    } catch (error) {
      console.error('❌ 视频分类表不存在或查询失败:', error.message);
    }
    
    // 检查membership_levels表
    console.log('\n🔍 检查会员等级表...');
    try {
      // 获取表结构
      const membershipSchema = db.exec("PRAGMA table_info(membership_levels)");
      console.log('✅ 会员等级表结构:');
      membershipSchema[0].values.forEach(col => {
        console.log(`  - ${col[1]} (${col[2]})`);
      });
      
      // 获取数据
      const membershipData = db.exec("SELECT * FROM membership_levels");
      console.log(`\n📊 会员等级数据 (${membershipData[0].values.length}条):`);
      membershipData[0].values.forEach(level => {
        console.log(`  - ID: ${level[0]}, 名称: ${level[1]}, 价格: ${level[2]}, 时长: ${level[3]}天`);
      });
    } catch (error) {
      console.error('❌ 会员等级表不存在或查询失败:', error.message);
    }
    
    db.close();
    console.log('\n✅ 数据库检查完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkTables();