/**
 * 数据库配置
 * SQLite数据库连接和连接池管理（兼容MySQL接口）
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    // 使用绝对路径确保一致性
    this.dbPath = path.resolve(__dirname, '../../data/mingli.db');
    
    // 确保数据目录存在
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    console.log(`📁 数据库文件路径: ${this.dbPath}`);
  }

  /**
   * 创建数据库连接
   */
  async createPool() {
    try {
      const SQL = await initSqlJs();
      
      // 尝试从文件加载现有数据库，如果不存在则创建新数据库
      let data = null;
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        data = new Uint8Array(fileBuffer);
      } catch (err) {
        // 文件不存在，将创建新数据库
        console.log('📝 创建新的SQLite数据库文件');
      }
      
      this.db = new SQL.Database(data);
      console.log('✅ SQLite数据库连接成功');
      
      // 启用外键约束
      this.db.run('PRAGMA foreign_keys = ON');
      
      return this.db;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取数据库连接
   */
  async getConnection() {
    if (!this.db) {
      await this.createPool();
    }
    
    return this.db;
  }

  /**
   * 执行查询
   */
  async query(sql, params = []) {
    try {
      const db = await this.getConnection();
      
      // sql.js使用?作为参数占位符
      const stmt = db.prepare(sql);
      
      // 绑定参数（如果有的话）
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      // 获取所有行
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      
      // 释放语句
      stmt.free();
      
      return rows;
    } catch (error) {
      console.error('❌ 数据库查询失败:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * 执行事务
   */
  async transaction(callback) {
    const db = await this.getConnection();
    try {
      db.run('BEGIN TRANSACTION');
      const result = await callback(db);
      db.run('COMMIT');
      return result;
    } catch (error) {
      db.run('ROLLBACK');
      console.error('❌ 事务执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.db) {
      try {
        // 保存数据库到文件
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
        
        this.db.close();
        console.log('✅ 数据库连接已关闭');
        this.db = null;
      } catch (error) {
        console.error('❌ 关闭数据库连接失败:', error.message);
      }
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as status');
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取数据库统计信息（SQLite兼容）
   */
  async getStats() {
    try {
      const tables = await this.query(`
        SELECT name as table_name
        FROM sqlite_master 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      const stats = [];
      for (const table of tables) {
        const countResult = await this.query(`SELECT COUNT(*) as row_count FROM ${table.table_name}`);
        stats.push({
          table_name: table.table_name,
          row_count: countResult[0].row_count || 0
        });
      }
      
      return stats;
    } catch (error) {
      console.error('获取数据库统计信息失败:', error.message);
      return [];
    }
  }
}

// 创建全局数据库实例
const database = new Database();

/**
 * 连接数据库（应用启动时调用）
 */
async function connectDatabase() {
  try {
    await database.createPool();
    
    // 检查数据库表是否存在
    await checkDatabaseTables();
    
    return database;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

/**
 * 检查数据库表结构
 */
async function checkDatabaseTables() {
  try {
    console.log('🔍 开始检查表结构...');
    
    // 打印数据库文件的绝对路径
    console.log(`📂 当前使用的数据库文件: ${database.dbPath}`);
    
    // 获取数据库中所有表（排除SQLite系统表）
    const tables = await database.query(`
      SELECT name 
      FROM sqlite_master 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    // 提取所有存在的表名，并保留原始名称用于调试
    const existingTables = [];
    const originalTableNames = [];
    tables.forEach(t => {
      const name = t.name || '';
      existingTables.push(name.toLowerCase());
      originalTableNames.push(`${name} (${name.toLowerCase()})`);
    });
    
    console.log('🗄️  数据库中存在的表 (原始名/小写):', originalTableNames.join(', '));
    console.log('📊 所有表名（小写）:', JSON.stringify(existingTables));
    
    // 现在users表已存在，将其包含在关键表中
    const criticalTables = ['users', 'bazi_records', 'videos', 'orders'];
    const missingCriticalTables = criticalTables.filter(t => !existingTables.includes(t));
    
    // 调试日志：详细列出每个关键表的状态
    console.log('📋 关键表检查结果:');
    criticalTables.forEach(table => {
      const index = existingTables.indexOf(table);
      if (index !== -1) {
        console.log(`✅ ${table} - 表存在 (原始名称: ${tables[index].name})`);
      } else {
        console.log(`❌ ${table} - 表不存在，现有表中未找到`);
      }
    });
    
    // 额外的直接查询验证
    try {
      const baziCheck = await database.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='bazi_records'`);
      console.log('🔍 bazi_records表直接查询结果:', baziCheck.length > 0 ? '存在' : '不存在', baziCheck);
    } catch (e) {
      console.error('🔴 bazi_records表查询失败:', e.message);
    }
    
    if (missingCriticalTables.length > 0) {
      console.warn('⚠️  缺少关键数据表:', missingCriticalTables.join(', '));
      console.log('💡 请运行数据库迁移脚本: npm run db:migrate');
    } else {
      console.log('✅ 所有关键数据库表结构检查通过');
    }
    
  } catch (error) {
    console.error('检查数据库表结构失败:', error.message);
  }
}

module.exports = {
  database,
  connectDatabase,
  getConnection: () => database.getConnection(),
  query: (sql, params) => database.query(sql, params),
  transaction: (callback) => database.transaction(callback),
  healthCheck: () => database.healthCheck(),
  getStats: () => database.getStats(),
  close: () => database.close()
};