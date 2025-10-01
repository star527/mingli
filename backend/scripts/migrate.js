/**
 * 数据库迁移脚本
 * 创建必要的关键表
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function runMigration() {
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 使用绝对路径确保指向正确的数据库文件
    const dbPath = path.resolve(__dirname, '../data/mingli.db');
    
    // 确保data目录存在
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 已创建data目录: ${dataDir}`);
    }
    
    // 尝试从文件加载现有数据库，如果不存在则创建新数据库
    let db;
    let data = null;
    
    try {
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        data = new Uint8Array(fileBuffer);
        console.log(`📂 加载现有数据库文件: ${dbPath}`);
      } else {
        console.log(`📝 创建新的SQLite数据库文件: ${dbPath}`);
      }
    } catch (err) {
      console.log('📝 创建新的SQLite数据库文件');
    }
    
    db = new SQL.Database(data);
    console.log('✅ SQLite数据库连接成功');
    
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
    
    // 手动定义关键表结构，更新表结构以匹配后端需求
    const requiredTables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          nickname TEXT,
          avatar TEXT,
          gender INTEGER DEFAULT 0,
          birthday TEXT,
          last_login TEXT,
          status INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'bazi_records',
        sql: `CREATE TABLE IF NOT EXISTS bazi_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT,
          gender INTEGER,
          birth_year INTEGER,
          birth_month INTEGER,
          birth_day INTEGER,
          birth_hour INTEGER,
          birth_minute INTEGER,
          birth_city TEXT,
          bazi_data TEXT,
          analysis_result TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'videos',
        sql: `CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          cover_url TEXT,
          video_url TEXT NOT NULL,
          duration INTEGER,
          view_count INTEGER DEFAULT 0,
          status INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'orders',
        sql: `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          membership_level_id INTEGER,
          order_no TEXT,
          amount REAL,
          status INTEGER DEFAULT 0,
          payment_method TEXT,
          payment_time TEXT,
          expire_time TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'video_categories',
        sql: `CREATE TABLE IF NOT EXISTS video_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'membership_levels',
        sql: `CREATE TABLE IF NOT EXISTS membership_levels (
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
      }
    ];
    
    // 创建表
    requiredTables.forEach(table => {
      try {
        console.log(`📋 正在创建表: ${table.name}`);
        db.run(table.sql);
        console.log(`✅ 表 ${table.name} 创建成功`);
        
        // 验证表是否真的被创建
        const result = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table.name}'`);
        if (result && result[0] && result[0].values.length > 0) {
          console.log(`✅ 表 ${table.name} 验证成功，确实存在`);
        } else {
          console.error(`❌ 表 ${table.name} 创建后验证失败，未找到`);
        }
      } catch (err) {
        console.error(`❌ 创建表 ${table.name} 失败: ${err.message}`);
      }
    });
    
    // 添加默认视频分类数据（如果表存在且为空）
    try {
      const categoryCheck = db.exec("SELECT COUNT(*) FROM video_categories");
      if (categoryCheck && categoryCheck[0] && categoryCheck[0].values[0][0] === 0) {
        const now = new Date().toISOString().replace('T', ' ').split('.')[0];
        const categories = [
          `('基础八字', '八字基础入门知识', 1, '${now}', '${now}')`,
          `('进阶命理', '深入学习命理分析', 2, '${now}', '${now}')`,
          `('运势预测', '年度运势解读方法', 3, '${now}', '${now}')`
        ];
        
        const insertSql = `INSERT INTO video_categories (name, description, sort_order, created_at, updated_at) VALUES ${categories.join(', ')}`;
        db.run(insertSql);
        console.log(`✅ 已添加默认视频分类数据`);
      }
    } catch (err) {
      console.error(`⚠️ 添加默认视频分类数据失败: ${err.message}`);
    }
    
    // 添加默认会员等级数据（如果表存在且为空）
    try {
      const membershipCheck = db.exec("SELECT COUNT(*) FROM membership_levels");
      if (membershipCheck && membershipCheck[0] && membershipCheck[0].values[0][0] === 0) {
        const now = new Date().toISOString().replace('T', ' ').split('.')[0];
        const memberships = [
          `('普通会员', 29.0, 30, '基础会员权益', '基础八字分析功能', 1, '${now}', '${now}')`,
          `('高级会员', 99.0, 30, '高级会员权益', '所有功能无限制使用', 2, '${now}', '${now}')`
        ];
        
        const insertSql = `INSERT INTO membership_levels (name, price, duration, description, benefits, sort_order, created_at, updated_at) VALUES ${memberships.join(', ')}`;
        db.run(insertSql);
        console.log(`✅ 已添加默认会员等级数据`);
      }
    } catch (err) {
      console.error(`⚠️ 添加默认会员等级数据失败: ${err.message}`);
    }
    
    // 添加默认管理员用户
    try {
      // 先检查是否已存在用户
      const userResult = db.exec("SELECT COUNT(*) FROM users");
      if (userResult && userResult[0] && userResult[0].values[0][0] === 0) {
        const now = new Date().toISOString().replace('T', ' ').split('.')[0];
        const insertSql = `INSERT INTO users (username, password, nickname, status, created_at, updated_at) 
                          VALUES ('admin', 'e10adc3949ba59abbe56e057f20f883e', '管理员', 1, '${now}', '${now}')`;
        db.run(insertSql);
        console.log(`✅ 已添加默认管理员用户: admin/admin123`);
      }
    } catch (err) {
      console.error(`⚠️ 添加默认用户失败: ${err.message}`);
    }
    
    // 保存数据库到文件 - 确保写入操作正确执行
    console.log('💾 准备保存数据库更改...');
    const exportData = db.export();
    const buffer = Buffer.from(exportData);
    
    // 先创建备份
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`✅ 已创建数据库备份: ${backupPath}`);
    }
    
    // 写入数据库文件
    fs.writeFileSync(dbPath, buffer);
    console.log(`💾 数据库更改已保存到文件: ${dbPath}`);
    
    // 验证保存是否成功
    const savedStats = fs.statSync(dbPath);
    console.log(`📊 保存后数据库大小: ${(savedStats.size / 1024).toFixed(2)} KB`);
    
    // 重新加载数据库验证表是否存在
    console.log('🔍 重新加载数据库验证表结构...');
    const reloadedBuffer = fs.readFileSync(dbPath);
    const reloadedDb = new SQL.Database(reloadedBuffer);
    const tablesResult = reloadedDb.exec("SELECT name FROM sqlite_master WHERE type='table'");
    
    if (tablesResult && tablesResult[0]) {
      const tables = tablesResult[0].values.map(row => row[0]);
      console.log(`✅ 重新加载后发现的表:`, tables);
      
      // 检查每个必需的表是否都存在
      requiredTables.forEach(table => {
        if (tables.includes(table.name)) {
          console.log(`✅ 表 ${table.name} 验证存在`);
        } else {
          console.error(`❌ 表 ${table.name} 验证不存在！`);
        }
      });
    }
    
    reloadedDb.close();
    db.close();
    console.log('✅ 数据库连接已关闭');
    
    console.log('🎉 数据库迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    process.exit(1);
  }
}

// 执行迁移
if (require.main === module) {
  runMigration();
}