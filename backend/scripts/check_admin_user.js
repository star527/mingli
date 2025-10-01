/**
 * 检查管理员用户具体数据
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkAdminUser() {
  try {
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 数据库文件路径
    const dbPath = path.resolve(__dirname, '../data/mingli.db');
    console.log(`检查数据库文件: ${dbPath}`);
    
    // 读取数据库文件
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);
    
    // 查询users表的具体数据
    console.log('\n查询users表数据:');
    const result = db.exec(`SELECT * FROM users`);
    
    if (result && result[0] && result[0].values.length > 0) {
      console.log('✅ 找到用户记录:');
      
      // 获取列名
      const columns = result[0].columns;
      
      // 打印每条记录
      result[0].values.forEach((row, index) => {
        console.log(`\n记录 ${index + 1}:`);
        columns.forEach((column, colIndex) => {
          console.log(`  ${column}: ${row[colIndex]}`);
        });
      });
      
      // 检查是否有admin用户
      const adminResult = db.exec(`SELECT * FROM users WHERE username = 'admin'`);
      if (adminResult && adminResult[0] && adminResult[0].values.length > 0) {
        console.log('\n✅ 找到admin用户:');
        console.log(`  id: ${adminResult[0].values[0][0]}`);
        console.log(`  username: ${adminResult[0].values[0][1]}`);
        console.log(`  password: ${adminResult[0].values[0][2]} (MD5哈希)`);
        console.log(`  nickname: ${adminResult[0].values[0][5]}`);
        console.log(`  status: ${adminResult[0].values[0][11]}`);
      }
      
    } else {
      console.error('❌ users表中没有数据');
    }
    
    // 查看users表的完整结构
    console.log('\n查看users表结构:');
    const tableInfo = db.exec(`PRAGMA table_info(users)`);
    if (tableInfo && tableInfo[0]) {
      tableInfo[0].values.forEach(row => {
        console.log(`  ${row[1]} (${row[2]})${row[3] ? ' NOT NULL' : ''}${row[5] !== null ? ` DEFAULT ${row[4]}` : ''}`);
      });
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
  }
}

checkAdminUser();