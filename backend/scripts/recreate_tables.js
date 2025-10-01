/**
 * 临时脚本：删除并重新创建会员等级和视频分类表
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function recreateTables() {
  try {
    console.log('🚀 开始重新创建表...');
    
    // 初始化SQL.js
    console.log('📦 初始化SQL.js...');
    const SQL = await initSqlJs();
    console.log('✅ SQL.js初始化成功');
    
    // 数据库文件路径
    const dbPath = path.join(__dirname, '../data/mingli.db');
    console.log(`📂 数据库文件路径: ${dbPath}`);
    
    // 检查数据目录是否存在
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      console.log(`📁 创建数据目录: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 创建新的数据库文件（覆盖现有文件）
    console.log('📝 创建新的数据库...');
    const db = new SQL.Database();
    console.log('✅ SQLite数据库创建成功');
    
    // 显示当前所有表
    console.log('\n📋 操作前的表列表:');
    const beforeTables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (beforeTables && beforeTables.length > 0) {
      beforeTables[0].values.forEach(table => {
        console.log(`- ${table[0]}`);
      });
    } else {
      console.log('没有找到任何表');
    }
    
    // 使用简化的SQL语句创建表
    console.log('\n📋 开始创建表...');
    
    // 创建video_categories表
    try {
      const categoryTableSQL = `
        CREATE TABLE video_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`;
      
      console.log('📋 创建视频分类表...');
      console.log(`SQL: ${categoryTableSQL}`);
      db.run(categoryTableSQL);
      console.log('✅ 视频分类表创建成功');
    } catch (error) {
      console.error('❌ 创建视频分类表失败:', error.message);
    }
    
    // 创建membership_levels表
    try {
      const membershipTableSQL = `
        CREATE TABLE membership_levels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            duration INTEGER NOT NULL,
            description TEXT,
            benefits TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`;
      
      console.log('📋 创建会员等级表...');
      console.log(`SQL: ${membershipTableSQL}`);
      db.run(membershipTableSQL);
      console.log('✅ 会员等级表创建成功');
    } catch (error) {
      console.error('❌ 创建会员等级表失败:', error.message);
    }
    
    // 显示创建后的表列表
    console.log('\n📋 创建后的表列表:');
    const afterTables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (afterTables && afterTables.length > 0) {
      afterTables[0].values.forEach(table => {
        console.log(`- ${table[0]}`);
      });
    } else {
      console.log('没有找到任何表');
    }
    
    // 插入测试数据
    try {
      console.log('\n📋 插入测试数据...');
      
      // 视频分类测试数据
      const categoryStmt = db.prepare(
        "INSERT INTO video_categories (name, description, sort_order) VALUES (?, ?, ?)"
      );
      categoryStmt.run(['基础八字', '八字基础入门知识', 1]);
      categoryStmt.run(['进阶命理', '深入学习命理分析', 2]);
      categoryStmt.run(['运势预测', '年度运势解读方法', 3]);
      categoryStmt.free();
      
      // 会员等级测试数据
      const membershipStmt = db.prepare(
        "INSERT INTO membership_levels (name, price, duration, description, benefits, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
      );
      membershipStmt.run(['普通会员', 29.00, 30, '基础会员权益', '基础八字分析功能', 1]);
      membershipStmt.run(['高级会员', 99.00, 30, '高级会员权益', '所有功能无限制使用', 2]);
      membershipStmt.free();
      
      console.log('✅ 测试数据插入成功');
    } catch (error) {
      console.error('❌ 插入测试数据失败:', error.message);
    }
    
    // 验证数据
    console.log('\n🔍 验证视频分类数据:');
    try {
      const categories = db.exec("SELECT * FROM video_categories");
      if (categories && categories.length > 0 && categories[0].values) {
        console.log(`找到 ${categories[0].values.length} 条记录:`);
        categories[0].values.forEach(cat => {
          console.log(`- ${cat[0]}: ${cat[1]}`);
        });
      } else {
        console.log('未找到视频分类数据');
      }
    } catch (error) {
      console.error('❌ 查询视频分类失败:', error.message);
    }
    
    console.log('\n🔍 验证会员等级数据:');
    try {
      const levels = db.exec("SELECT * FROM membership_levels");
      if (levels && levels.length > 0 && levels[0].values) {
        console.log(`找到 ${levels[0].values.length} 条记录:`);
        levels[0].values.forEach(level => {
          console.log(`- ${level[0]}: ${level[1]} (¥${level[2]})`);
        });
      } else {
        console.log('未找到会员等级数据');
      }
    } catch (error) {
      console.error('❌ 查询会员等级失败:', error.message);
    }
    
    // 保存数据库
    try {
      console.log('\n💾 保存数据库到文件...');
      const exportData = db.export();
      const buffer = Buffer.from(exportData);
      fs.writeFileSync(dbPath, buffer);
      console.log(`✅ 数据库已保存，文件大小: ${buffer.length} 字节`);
    } catch (error) {
      console.error('❌ 保存数据库失败:', error.message);
    }
    
    db.close();
    console.log('\n✅ 数据库连接已关闭');
    console.log('🎉 表重新创建完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行脚本
recreateTables();