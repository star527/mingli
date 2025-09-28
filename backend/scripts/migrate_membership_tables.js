/**
 * 会员服务相关数据库表迁移脚本
 * 创建会员记录表、自动续费配置表等
 */

// 直接导入数据库查询方法
const { query, close } = require('../src/config/database');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// 用于脚本直接运行时的数据库连接
let db = null;

// 创建数据库连接（用于脚本直接运行时）
async function createDbConnection() {
  try {
    const SQL = await initSqlJs();
    
    // 数据库文件路径
    const dbPath = path.resolve(__dirname, '../data/mingli.db');
    
    // 确保数据目录存在
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 尝试从文件加载现有数据库，如果不存在则创建新数据库
    let data = null;
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      data = new Uint8Array(fileBuffer);
    } catch (err) {
      console.log('创建新的SQLite数据库文件');
    }
    
    db = new SQL.Database(data);
    console.log('SQLite数据库连接成功');
    
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
    
    return db;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    throw error;
  }
}

// 执行SQL语句（用于脚本直接运行时）
async function executeQuery(sql, params = []) {
  if (!db) {
    await createDbConnection();
  }
  
  try {
    const stmt = db.prepare(sql);
    
    // 绑定参数
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    // 获取所有行
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    
    stmt.free();
    return rows;
  } catch (error) {
    console.error('数据库查询失败:', error.message);
    console.error('SQL:', sql);
    throw error;
  }
}

// 保存数据库更改（用于脚本直接运行时）
async function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      const dbPath = path.resolve(__dirname, '../data/mingli.db');
      fs.writeFileSync(dbPath, buffer);
      console.log('数据库更改已保存');
    } catch (error) {
      console.error('保存数据库失败:', error.message);
    }
  }
}

async function migrateMembershipTables() {
  try {
    console.log('开始创建会员服务相关数据表...');
    
    // 确定使用的查询方法（脚本直接运行或模块导入）
    const q = require.main === module ? executeQuery : query;
    
    // 1. 创建用户会员记录表
    console.log('创建 user_memberships 表...');
    await q(`
      CREATE TABLE IF NOT EXISTS user_memberships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        level INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        auto_renew INTEGER DEFAULT 0,
        payment_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE (user_id, created_at)
      );
    `);
    
    // 无论如何都尝试添加status字段（如果不存在）
    try {
      await q(`ALTER TABLE user_memberships ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);
      console.log('已添加status字段');
    } catch (e) {
      console.log('status字段可能已存在');
    }
    console.log('user_memberships 表创建成功');
    
    // 2. 创建自动续费配置表
    console.log('创建 auto_renew_configs 表...');
    await q(`
      CREATE TABLE IF NOT EXISTS auto_renew_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        member_level INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        next_renew_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        enabled INTEGER NOT NULL DEFAULT 1,
        payment_method_id TEXT,
        last_attempt_at TEXT,
        last_renewal_at TEXT,
        failure_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE (user_id)
      );
    `);
    
    // 确保所有必要字段都存在
    const fieldsToAdd = [
      { name: 'enabled', type: 'INTEGER NOT NULL DEFAULT 1' },
      { name: 'payment_method_id', type: 'TEXT' },
      { name: 'last_attempt_at', type: 'TEXT' },
      { name: 'last_renewal_at', type: 'TEXT' },
      { name: 'failure_reason', type: 'TEXT' },
      { name: 'failure_count', type: 'INTEGER DEFAULT 0' }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        await q(`ALTER TABLE auto_renew_configs ADD COLUMN ${field.name} ${field.type}`);
        console.log(`已添加${field.name}字段`);
      } catch (addError) {
        console.log(`${field.name}字段可能已存在`);
      }
    }
    console.log('auto_renew_configs 表创建成功');
    
    // 3. 创建会员权益记录表（可选，用于记录会员特权使用情况）
    console.log('创建 member_benefits_usage 表...');
    await q(`
      CREATE TABLE IF NOT EXISTS member_benefits_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        membership_id INTEGER NOT NULL,
        benefit_type TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        current_period TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (membership_id) REFERENCES user_memberships(id),
        UNIQUE (user_id, benefit_type, current_period)
      );
    `);
    console.log('member_benefits_usage 表创建成功');
    
    // 4. 创建视频访问权限表（可选，用于记录视频访问日志）
    console.log('创建 video_access_logs 表...');
    await q(`
      CREATE TABLE IF NOT EXISTS video_access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        video_id INTEGER NOT NULL,
        access_type TEXT NOT NULL,
        access_time TEXT NOT NULL,
        duration INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (video_id) REFERENCES videos(id)
      );
    `);
    console.log('video_access_logs 表创建成功');
    
    // 5. 更新用户表，添加会员相关字段（如果不存在）
    console.log('检查并更新 users 表...');
    try {
      // 尝试添加last_upgrade_date字段
      await q(`ALTER TABLE users ADD COLUMN last_upgrade_date TEXT`);
      console.log('已添加 last_upgrade_date 字段到 users 表');
    } catch (e) {
      console.log('users 表中的 last_upgrade_date 字段可能已存在');
    }
    
    console.log('会员服务相关数据表创建完成！');
    return {
      success: true,
      message: '所有会员相关表创建成功'
    };
    
  } catch (error) {
    console.error('创建会员相关数据表失败:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // 如果是脚本直接运行，保存更改并关闭连接
    if (require.main === module) {
      await saveDatabase();
      if (db) {
        db.close();
        console.log('数据库连接已关闭');
      }
    } else {
      // 如果是作为模块导入，尝试使用提供的close方法
      try {
        await close();
      } catch (e) {
        console.log('关闭数据库连接失败，但可能不影响结果');
      }
    }
  }
}

// 执行迁移
if (require.main === module) {
  migrateMembershipTables().catch(error => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = migrateMembershipTables;