/**
 * 数据库工具函数
 * 提供数据库连接、查询执行、保存和关闭功能
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// 全局数据库实例缓存
let dbInstance = null;
let sqljs = null;

// 数据库文件路径
const DB_PATH = path.join(__dirname, '..', 'data', 'mingli.db');

/**
 * 读取数据库文件
 */
async function readDatabase() {
  try {
    // 确保sql.js已初始化
    if (!sqljs) {
      sqljs = await initSqlJs();
    }
    
    if (fs.existsSync(DB_PATH)) {
      const dbBuffer = fs.readFileSync(DB_PATH);
      return new sqljs.Database(dbBuffer);
    } else {
      // 如果数据库文件不存在，创建新的数据库
      return new sqljs.Database();
    }
  } catch (error) {
    console.error('读取数据库失败:', error);
    throw error;
  }
}

/**
 * 创建数据库连接
 */
async function createDbConnection() {
  return readDatabase();
}

/**
 * 执行SQL查询
 * @param {Database} db - 数据库实例
 * @param {string} sql - SQL语句
 * @param {Array} params - 查询参数
 * @returns {Array} 查询结果
 */
async function executeQuery(db, sql, params = []) {
  try {
    const statement = db.prepare(sql);
    const results = [];
    
    // 绑定参数并执行查询
  if (params && params.length > 0) {
    params.forEach((param, index) => {
      statement.bind(index + 1, param);
    });
  }
    
    // 获取所有结果
    while (statement.step()) {
      const row = statement.getAsObject();
      results.push(row);
    }
    
    statement.free();
    return results;
  } catch (error) {
    console.error('执行查询失败:', sql, error);
    throw error;
  }
}

/**
 * 执行SQL语句（不返回结果）
 * @param {Database} db - 数据库实例
 * @param {string} sql - SQL语句
 * @param {Array} params - 查询参数
 */
async function executeNonQuery(db, sql, params = []) {
  try {
    const statement = db.prepare(sql);
    
    // 绑定参数
  if (params && params.length > 0) {
    params.forEach((param, index) => {
      statement.bind(index + 1, param);
    });
  }
    
    statement.step();
    statement.free();
  } catch (error) {
    console.error('执行非查询语句失败:', sql, error);
    throw error;
  }
}

/**
 * 保存数据库到文件
 * @param {Database} db - 数据库实例
 */
async function saveDatabase(db) {
  try {
    // 确保data目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 保存数据库
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    
    console.log('数据库保存成功');
  } catch (error) {
    console.error('保存数据库失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 * @param {Database} db - 数据库实例
 */
async function closeDb(db) {
  try {
    if (db) {
      db.close();
      console.log('数据库连接已关闭');
    }
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
  }
}

module.exports = {
  createDbConnection,
  executeQuery,
  executeNonQuery,
  saveDatabase,
  closeDb,
  DB_PATH
};