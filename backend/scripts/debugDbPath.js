/**
 * 数据库路径调试脚本
 * 检查服务器和迁移脚本使用的数据库文件路径是否一致
 */

const fs = require('fs');
const path = require('path');

// 检查并打印数据库文件信息
function checkDbFile(dbPath) {
  console.log(`📂 检查数据库文件: ${dbPath}`);
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`✅ 文件存在，大小: ${stats.size} 字节，修改时间: ${stats.mtime}`);
    // 读取文件头验证SQLite格式
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(dbPath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    const isSqlite = buffer.toString('utf8', 0, 16).includes('SQLite format 3');
    console.log(`📋 SQLite格式: ${isSqlite ? '是' : '否'}`);
  } else {
    console.log(`❌ 文件不存在`);
  }
}

// 检查不同路径
console.log('=== 数据库路径调试 ===');

// 1. 服务器使用的路径（根据database.js中的逻辑）
const serverDbPath = path.resolve(__dirname, '../data/mingli.db');
console.log('\n🚀 服务器使用的路径:');
checkDbFile(serverDbPath);

// 2. 迁移/检查脚本使用的路径
const scriptDbPath = path.join(__dirname, '../data/mingli.db');
console.log('\n📝 脚本使用的路径:');
checkDbFile(scriptDbPath);

// 3. 额外检查绝对路径
const absoluteDbPath = '/Users/star/Desktop/project/mingli/backend/data/mingli.db';
console.log('\n📌 绝对路径检查:');
checkDbFile(absoluteDbPath);

// 4. 检查是否为同一文件（通过inode）
if (fs.existsSync(serverDbPath) && fs.existsSync(scriptDbPath)) {
  const serverStat = fs.statSync(serverDbPath);
  const scriptStat = fs.statSync(scriptDbPath);
  console.log('\n🔗 是否为同一文件:');
  console.log(`服务器文件inode: ${serverStat.ino}`);
  console.log(`脚本文件inode: ${scriptStat.ino}`);
  console.log(`是否相同: ${serverStat.ino === scriptStat.ino ? '是' : '否'}`);
}

console.log('\n=== 调试完成 ===');