/**
 * 恢复数据库脚本
 * 基于schema.sql创建所有原始表，并添加所需的新表
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// 数据库文件路径
const dbPath = path.resolve(__dirname, '../data/mingli.db');
const backupPath = path.resolve(__dirname, '../data/mingli.db.backup');

console.log(`🚀 开始恢复数据库...`);

// 先备份当前数据库
if (fs.existsSync(dbPath)) {
  try {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ 已备份当前数据库到: ${backupPath}`);
  } catch (err) {
    console.error(`❌ 备份数据库失败: ${err.message}`);
    process.exit(1);
  }
}

// 初始化SQL.js
initSqlJs().then(SQL => {
  let db;
  
  try {
    console.log(`✅ SQL.js初始化成功`);
    
    // 检查是否有现有数据库文件
    if (fs.existsSync(dbPath)) {
      console.log(`📂 读取现有数据库文件: ${dbPath}`);
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      console.log(`📝 创建新的数据库...`);
      db = new SQL.Database();
    }
    
    console.log(`✅ SQLite数据库初始化成功`);
    
    // 读取schema.sql内容
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ 找不到schema.sql文件: ${schemaPath}`);
      process.exit(1);
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    processSchema(db, SQL, schemaContent);
  } catch (error) {
    console.error('❌ 初始化数据库失败:', error.message);
    process.exit(1);
  }
});

/**
 * 处理schema文件，转换为SQLite兼容的语法
 */
function processSchema(db, SQL, schemaContent) {
  console.log('📋 开始处理数据库架构...');
  
  // 先手动创建我们需要的两个关键表
  const keyTables = [
    {
      name: 'membership_levels',
      sql: `CREATE TABLE membership_levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        duration INTEGER NOT NULL,
        description TEXT,
        benefits TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'video_categories',
      sql: `CREATE TABLE video_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    }
  ];
  
  try {
    console.log('🔄 开始创建关键表...');
    
    // 首先删除关键表（如果存在）
    keyTables.forEach(table => {
      try {
        const dropSql = `DROP TABLE IF EXISTS ${table.name};`;
        console.log(`📋 执行: ${dropSql}`);
        db.run(dropSql);
      } catch (err) {
        console.error(`❌ 删除表 ${table.name} 失败: ${err.message}`);
      }
    });
    
    // 创建关键表
    keyTables.forEach(table => {
      try {
        console.log(`📋 创建表: ${table.name}`);
        console.log(`SQL: ${table.sql}`);
        db.run(table.sql);
        console.log(`✅ ${table.name} 表创建成功`);
      } catch (err) {
        console.error(`❌ 创建表 ${table.name} 失败: ${err.message}`);
        console.error(`SQL: ${table.sql}`);
      }
    });
    
    // 验证创建结果
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'");
    let createdTables = [];
    if (result && result[0]) {
      createdTables = result[0].values.map(row => row[0]);
      
      console.log('\n✅ 创建的表列表:');
      createdTables.forEach(table => {
        console.log(`- ${table}`);
      });
    }
    
    // 检查我们需要的表是否存在
    const requiredTables = ['membership_levels', 'video_categories'];
    let allRequiredExists = true;
    
    requiredTables.forEach(table => {
      const exists = createdTables.includes(table);
      if (exists) {
        console.log(`✅ 关键表 ${table} 存在`);
      } else {
        console.error(`❌ 关键表 ${table} 不存在`);
        allRequiredExists = false;
      }
    });
    
    // 添加测试数据
    if (allRequiredExists) {
      addTestData(db);
    }
    
    // 保存数据库到文件
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log(`\n💾 数据库已保存，文件大小: ${buffer.length} 字节`);
    
    console.log('\n🎉 数据库恢复完成');
    if (allRequiredExists) {
      console.log('✅ 所有关键表已成功创建！');
    } else {
      console.error('⚠️  部分关键表未创建成功，请检查日志');
    }
    
  } catch (error) {
    console.error('❌ 创建表过程中出错:', error.message);
  } finally {
    db.close();
    console.log('✅ 数据库连接已关闭');
  }
}

/**
 * 添加测试数据
 */
function addTestData(db) {
  console.log('\n📋 添加测试数据...');
  
  try {
    // 添加视频分类测试数据
    const categoryData = [
      { name: '基础八字', description: '八字基础入门知识', sort_order: 1 },
      { name: '进阶命理', description: '深入学习命理分析', sort_order: 2 },
      { name: '运势预测', description: '年度运势解读方法', sort_order: 3 },
      { name: '财运分析', description: '财运走向预测', sort_order: 4 },
      { name: '感情婚姻', description: '感情婚姻分析', sort_order: 5 }
    ];
    
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    categoryData.forEach(cat => {
      const sql = `INSERT INTO video_categories (name, description, sort_order, created_at, updated_at) 
                  VALUES ('${cat.name}', '${cat.description}', ${cat.sort_order}, '${now}', '${now}')`;
      db.run(sql);
    });
    console.log(`✅ 已添加 ${categoryData.length} 条视频分类测试数据`);
    
    // 添加会员等级测试数据
    const membershipData = [
      { name: '普通会员', price: 29.0, duration: 30, description: '基础会员权益', benefits: '基础八字分析功能' },
      { name: '高级会员', price: 99.0, duration: 30, description: '高级会员权益', benefits: '所有功能无限制使用' }
    ];
    
    membershipData.forEach(mem => {
      const sql = `INSERT INTO membership_levels (name, price, duration, description, benefits, sort_order, created_at, updated_at) 
                  VALUES ('${mem.name}', ${mem.price}, ${mem.duration}, '${mem.description}', '${mem.benefits}', ${mem.price}, '${now}', '${now}')`;
      db.run(sql);
    });
    console.log(`✅ 已添加 ${membershipData.length} 条会员等级测试数据`);
    
  } catch (error) {
    console.error('❌ 添加测试数据失败:', error.message);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise错误:', reason);
  db.close();
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  db.close();
});