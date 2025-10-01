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
    this.SQL = null;
    
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
      this.SQL = await initSqlJs();
      
      // 尝试从文件加载现有数据库，如果不存在则创建新数据库
      let data = null;
      try {
        if (fs.existsSync(this.dbPath)) {
          const fileBuffer = fs.readFileSync(this.dbPath);
          data = new Uint8Array(fileBuffer);
          console.log(`✅ 成功加载数据库文件，大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
        } else {
          console.log('📝 数据库文件不存在，将创建新数据库');
        }
      } catch (err) {
        console.error('⚠️ 读取数据库文件出错，将创建新数据库:', err.message);
      }
      
      this.db = new this.SQL.Database(data);
      
      // 设置全局引用，使其他模块可以直接访问数据库实例
      global.dbInstance = this;
      console.log('✅ SQLite数据库连接成功并设置了全局引用');
      
      // 启用外键约束和WAL模式以提高性能
      this.db.run('PRAGMA foreign_keys = ON');
      this.db.run('PRAGMA journal_mode = WAL');
      
      // 初始化必要的表结构（如果不存在）
      await this.initializeTables();
      
      // 设置定期保存数据到文件的定时器
      this.setupAutoSave();
      
      return this.db;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 初始化必要的表结构
   */
  async initializeTables() {
    try {
      console.log('🔧 检查并初始化必要的表结构...');
      
      // 检查表是否存在
      const tablesResult = this.db.exec('SELECT name FROM sqlite_master WHERE type="table"');
      const existingTables = new Set();
      
      if (tablesResult.length > 0 && tablesResult[0].values) {
        tablesResult[0].values.forEach(row => {
          if (row[0]) existingTables.add(row[0]);
        });
      }
      
      console.log(`📋 现有表: ${Array.from(existingTables).join(', ')}`);
      
      // 如果videos表不存在，创建它
      if (!existingTables.has('videos')) {
        console.log('⚠️ videos表不存在，正在创建...');
        const createVideosTable = `
          CREATE TABLE IF NOT EXISTS videos (
            id VARCHAR(64) PRIMARY KEY COMMENT '视频ID',
            title VARCHAR(200) NOT NULL COMMENT '视频标题',
            description TEXT COMMENT '视频描述',
            category VARCHAR(50) NOT NULL COMMENT '分类',
            
            -- 视频信息
            duration INT COMMENT '视频时长(秒)',
            file_size BIGINT COMMENT '文件大小(字节)',
            storage_path VARCHAR(500) COMMENT '存储路径',
            play_url VARCHAR(500) COMMENT '播放地址',
            thumbnail_url VARCHAR(500) COMMENT '缩略图',
            
            -- 业务信息
            is_premium TINYINT DEFAULT 0 COMMENT '是否会员视频',
            price DECIMAL(10,2) DEFAULT 0 COMMENT '价格',
            status VARCHAR(20) DEFAULT 'active' COMMENT '状态：active/inactive',
            
            -- 统计信息
            view_count INT DEFAULT 0 COMMENT '播放次数',
            like_count INT DEFAULT 0 COMMENT '点赞数',
            share_count INT DEFAULT 0 COMMENT '分享数',
            
            -- 扩展信息
            chapters TEXT COMMENT '章节信息(JSON)',
            available_qualities TEXT COMMENT '可用画质(JSON)',
            transcoded_urls TEXT COMMENT '转码后的URLs(JSON)',
            
            -- 关联信息
            creator_id VARCHAR(64) COMMENT '创建者ID',
            
            -- 时间戳
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
          ) COMMENT '视频课程表';
        `;
        this.db.run(createVideosTable);
        console.log('✅ videos表创建成功');
        
        // 保存更改到文件
        this.saveDatabase();
      }
      
      console.log('✅ 表结构检查完成');
    } catch (error) {
      console.error('❌ 初始化表结构失败:', error.message);
    }
  }
  
  /**
   * 设置自动保存定时器
   */
  setupAutoSave() {
    // 每30秒自动保存一次
    setInterval(() => {
      this.saveDatabase();
    }, 30000);
    
    console.log('⏱️  数据库自动保存已设置（每30秒）');
    
    // 在进程退出前保存数据
    process.on('exit', () => {
      console.log('💾 进程退出，正在保存数据库...');
      this.saveDatabase();
    });
    
    // 在收到SIGINT信号（Ctrl+C）时保存数据
    process.on('SIGINT', () => {
      console.log('💾 收到中断信号，正在保存数据库...');
      this.saveDatabase();
      process.exit(0);
    });
  }
  
  /**
   * 将数据库保存到文件
   */
  saveDatabase() {
    try {
      if (this.db && this.SQL) {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
        console.log(`💾 数据库已保存到文件，大小: ${(buffer.length / 1024).toFixed(2)} KB`);
        return true;
      }
    } catch (error) {
      console.error('❌ 保存数据库失败:', error.message);
    }
    return false;
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
      
      // 检查SQL语句类型，区分SELECT查询和修改操作
      const isSelectQuery = sql.trim().toUpperCase().startsWith('SELECT');
      
      if (isSelectQuery) {
        // 处理SELECT查询
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
        
        // 释放语句
        stmt.free();
        
        return rows;
      } else {
        // 处理INSERT、UPDATE、DELETE等修改操作
        // 对于修改操作，使用run方法执行
        const stmt = db.prepare(sql);
        
        // 绑定参数
        if (params.length > 0) {
          stmt.bind(params);
        }
        
        // 执行语句
        const result = stmt.run();
        
        // 释放语句
        stmt.free();
        
        // 对于修改操作，返回修改的行数等信息
        return result;
      }
    } catch (error) {
      console.error('❌ 数据库查询失败:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }
  
  /**
   * 兼容MySQL的execute方法
   * 返回[rows, fields]格式，用于兼容现有代码
   */
  async execute(sql, params = []) {
    try {
      // 调用query方法执行SQL
      const result = await this.query(sql, params);
      
      // 对于SELECT查询，返回[rows, fields]
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        // 模拟fields信息
        const fields = [];
        if (result.length > 0) {
          // 获取第一行的所有字段名
          const firstRow = result[0];
          for (const fieldName in firstRow) {
            fields.push({
              name: fieldName,
              table: sql.includes('FROM') ? sql.split('FROM')[1].split(' ')[0].replace(/[`'"\s]/g, '') : '',
              originalName: fieldName
            });
          }
        }
        return [result, fields];
      }
      
      // 对于修改操作，返回[result, undefined]
      // 为INSERT语句添加insertId属性
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        // 获取最后插入的ID（SQLite的last_insert_rowid()函数）
        const idResult = await this.query('SELECT last_insert_rowid() as lastId');
        result.insertId = idResult[0]?.lastId || null;
      }
      
      return [result, undefined];
    } catch (error) {
      console.error('❌ 数据库execute失败:', error.message);
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
  execute: (sql, params) => database.execute(sql, params),
  transaction: (callback) => database.transaction(callback),
  healthCheck: () => database.healthCheck(),
  getStats: () => database.getStats(),
  close: () => database.close()
};