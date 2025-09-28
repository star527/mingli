/**
 * 数据库查询调试脚本
 * 使用与服务器相同的方式查询数据库表
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 使用与服务器相同的方式查询数据库
async function debugDatabase() {
  try {
    console.log('=== 数据库查询调试 ===');
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 数据库文件路径 - 与服务器完全相同
    const dbPath = path.resolve(__dirname, '../data/mingli.db');
    console.log(`📂 数据库文件: ${dbPath}`);
    
    // 读取数据库文件
    const fileBuffer = fs.readFileSync(dbPath);
    const data = new Uint8Array(fileBuffer);
    
    // 创建数据库实例
    const db = new SQL.Database(data);
    console.log('✅ SQLite数据库连接成功');
    
    // 启用外键约束（与服务器相同）
    db.run('PRAGMA foreign_keys = ON');
    
    // 1. 与checkTables.js相同的查询方式
    console.log('\n📋 方式1：checkTables.js使用的查询（包含NOT LIKE sqlite_%）:');
    const stmt1 = db.prepare(`
      SELECT name as table_name
      FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    const tables1 = [];
    while (stmt1.step()) {
      tables1.push(stmt1.getAsObject());
    }
    
    console.log(`找到 ${tables1.length} 个表:`);
    tables1.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 2. 与服务器代码相同的查询方式（原始）
    console.log('\n📋 方式2：服务器代码使用的查询（原始方式）:');
    const stmt2 = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    const tables2 = [];
    while (stmt2.step()) {
      tables2.push(stmt2.getAsObject());
    }
    
    console.log(`找到 ${tables2.length} 个表:`);
    tables2.forEach(table => {
      console.log(`  - ${table.name} (原始值)`);
    });
    
    // 检查bazi_records表是否存在
    const baziCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='bazi_records'`);
    const baziExists = baziCheck.step();
    console.log('\n🔍 bazi_records表直接查询结果:', baziExists ? '存在' : '不存在');
    
    // 检查表名大小写变体
    console.log('\n🔍 表名大小写检查:');
    const allTables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    const allTableNames = [];
    while (allTables.step()) {
      allTableNames.push(allTables.getAsObject().name);
    }
    
    console.log('所有表名:', JSON.stringify(allTableNames));
    
    // 检查是否有bazi_records的变体
    const baziVariants = allTableNames.filter(name => 
      name.toLowerCase().includes('bazi') || name.toLowerCase().includes('record')
    );
    console.log('相关表名变体:', JSON.stringify(baziVariants));
    
    // 检查数据库结构完整性
    console.log('\n📊 数据库信息:');
    console.log(`总表数: ${allTableNames.length}`);
    console.log(`包含bazi_records: ${allTableNames.includes('bazi_records')}`);
    
    db.close();
    console.log('\n✅ 数据库连接已关闭');
    console.log('=== 调试完成 ===');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

// 执行调试
debugDatabase();