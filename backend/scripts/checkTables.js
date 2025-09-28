/**
 * 检查数据库表结构
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkTables() {
  try {
    console.log('🔍 检查数据库表结构...');
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 数据库文件路径
    const dbPath = path.join(__dirname, '../data/mingli.db');
    
    // 尝试从文件加载现有数据库
    let db;
    let data = null;
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      data = new Uint8Array(fileBuffer);
      console.log('📂 加载现有数据库文件');
    } catch (err) {
      console.log('❌ 数据库文件不存在');
      process.exit(1);
    }
    
    db = new SQL.Database(data);
    console.log('✅ SQLite数据库连接成功');
    
    // 查询所有表
    const stmt = db.prepare(`
      SELECT name as table_name
      FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    const tables = [];
    while (stmt.step()) {
      tables.push(stmt.getAsObject());
    }
    
    console.log(`📋 找到 ${tables.length} 个表:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // 查询所有视图
    const viewStmt = db.prepare(`
      SELECT name as view_name
      FROM sqlite_master 
      WHERE type = 'view'
      ORDER BY name
    `);
    
    const views = [];
    while (viewStmt.step()) {
      views.push(viewStmt.getAsObject());
    }
    
    console.log(`\n📋 找到 ${views.length} 个视图:`);
    views.forEach(view => {
      console.log(`  - ${view.view_name}`);
    });
    
    db.close();
    console.log('\n✅ 数据库检查完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
    process.exit(1);
  }
}

// 执行检查
if (require.main === module) {
  checkTables();
}