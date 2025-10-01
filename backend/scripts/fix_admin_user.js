/**
 * 修复管理员用户数据
 * 特别是将status字段设置为正确的值(1=激活状态)
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function fixAdminUser() {
  try {
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 数据库文件路径
    const dbPath = path.resolve(__dirname, '../data/mingli.db');
    console.log(`🔧 修复数据库文件: ${dbPath}`);
    
    // 读取数据库文件
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);
    
    console.log('\n🔍 修复前检查管理员用户:');
    const beforeResult = db.exec(`SELECT id, username, status FROM users WHERE username = 'admin'`);
    if (beforeResult && beforeResult[0] && beforeResult[0].values.length > 0) {
      console.log(`  当前状态: id=${beforeResult[0].values[0][0]}, status=${beforeResult[0].values[0][2]}`);
    }
    
    // 更新管理员用户的status为1
    console.log('\n🔧 更新管理员用户状态...');
    const updateSql = `UPDATE users SET status = 1 WHERE username = 'admin'`;
    db.run(updateSql);
    console.log('✅ 管理员用户状态已更新为激活状态(1)');
    
    // 验证更新是否成功
    console.log('\n✅ 修复后检查管理员用户:');
    const afterResult = db.exec(`SELECT id, username, status FROM users WHERE username = 'admin'`);
    if (afterResult && afterResult[0] && afterResult[0].values.length > 0) {
      console.log(`  新状态: id=${afterResult[0].values[0][0]}, status=${afterResult[0].values[0][2]}`);
    }
    
    // 保存更改
    console.log('\n💾 保存数据库更改...');
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log(`✅ 数据库已保存`);
    
    // 额外添加一个测试查询，确保users表结构正确
    console.log('\n🔍 验证users表状态字段类型:');
    const typeResult = db.exec(`PRAGMA table_info(users)`);
    if (typeResult && typeResult[0]) {
      typeResult[0].values.forEach(row => {
        if (row[1] === 'status') {
          console.log(`  status字段: ${row[2]}, 默认值: ${row[4]}`);
        }
      });
    }
    
    db.close();
    console.log('\n🎉 管理员用户数据修复完成!');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message);
  }
}

fixAdminUser();