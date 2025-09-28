/**
 * 数据库迁移脚本
 * 根据schema.sql文件创建数据库表
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// 解析SQL文件，提取独立的SQL语句
function parseSQLStatements(content) {
  const statements = [];
  const lines = content.split('\n');
  let currentStatement = '';
  
  for (const line of lines) {
    // 跳过空行和注释行
    if (line.trim() === '' || line.trim().startsWith('--')) {
      continue;
    }
    
    currentStatement += line + '\n';
    
    // 如果遇到分号，说明一个语句结束了
    if (line.trim().endsWith(';')) {
      const stmt = currentStatement.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      currentStatement = '';
    }
  }
  
  // 添加最后一个可能没有分号的语句
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim() + ';');
  }
  
  return statements;
}

// 从CREATE TABLE语句中提取索引定义并生成独立的CREATE INDEX语句
function extractIndexStatements(createTableStatement) {
  const indexStatements = [];
  
  // 提取表名
  const tableNameMatch = createTableStatement.match(/CREATE TABLE\s+(\w+)/i);
  if (!tableNameMatch) return indexStatements;
  
  const tableName = tableNameMatch[1];
  
  // 查找索引定义
  const indexMatches = createTableStatement.match(/INDEX\s+(\w+)\s*\(([^)]+)\)/gi) || [];
  const uniqueMatches = createTableStatement.match(/UNIQUE KEY\s+(\w+)\s*\(([^)]+)\)/gi) || [];
  
  // 生成CREATE INDEX语句
  indexMatches.forEach(match => {
    const parts = match.match(/INDEX\s+(\w+)\s*\(([^)]+)\)/i);
    if (parts) {
      indexStatements.push(`CREATE INDEX ${parts[1]} ON ${tableName} (${parts[2]});`);
    }
  });
  
  // 生成CREATE UNIQUE INDEX语句
  uniqueMatches.forEach(match => {
    const parts = match.match(/UNIQUE KEY\s+(\w+)\s*\(([^)]+)\)/i);
    if (parts) {
      indexStatements.push(`CREATE UNIQUE INDEX ${parts[1]} ON ${tableName} (${parts[2]});`);
    }
  });
  
  return indexStatements;
}

// 移除CREATE TABLE语句中的索引定义
function removeIndexDefinitions(createTableStatement) {
  return createTableStatement
    .replace(/,\s*INDEX\s+\w+\s*\([^)]+\)/gi, '')  // 移除INDEX定义
    .replace(/,\s*UNIQUE KEY\s+\w+\s*\([^)]+\)/gi, '')  // 移除UNIQUE KEY定义
    .replace(/\s+/g, ' ')  // 规范化空白字符
    .trim();
}

async function runMigration() {
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 数据库文件路径
    const dbPath = path.join(__dirname, '../data/mingli.db');
    
    // 尝试从文件加载现有数据库，如果不存在则创建新数据库
    let db;
    let data = null;
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      data = new Uint8Array(fileBuffer);
      console.log('📂 加载现有数据库文件');
    } catch (err) {
      // 文件不存在，将创建新数据库
      console.log('📝 创建新的SQLite数据库文件');
    }
    
    db = new SQL.Database(data);
    console.log('✅ SQLite数据库连接成功');
    
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
    
    // 读取schema.sql文件
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema文件不存在: ${schemaPath}`);
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // 解析SQL语句
    const rawStatements = parseSQLStatements(schemaContent);
    
    // 存储处理后的语句和索引语句
    const processedStatements = [];
    const indexStatements = [];
    
    // 处理SQL语句
    for (const statement of rawStatements) {
      let processedStatement = statement
        .replace(/CREATE DATABASE.*;/g, '') // 移除创建数据库语句
        .replace(/USE \w+;/g, '') // 移除USE语句
        .replace(/COMMENT '[^']*'/g, '') // 移除COMMENT注释
        .replace(/AUTO_INCREMENT/g, '') // 移除AUTO_INCREMENT
        .replace(/CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci/g, '') // 移除字符集设置
        .replace(/BIGINT/g, 'INTEGER') // SQLite使用INTEGER
        .replace(/JSON/g, 'TEXT') // SQLite没有原生JSON类型
        .replace(/VARCHAR\((\d+)\)/g, 'TEXT') // 简化字符串类型
        .replace(/DATETIME/g, 'TEXT') // SQLite使用TEXT存储日期时间
        .replace(/DECIMAL\(\d+,\d+\)/g, 'REAL') // SQLite使用REAL存储小数
        .replace(/TINYINT/g, 'INTEGER') // SQLite使用INTEGER
        .replace(/ON UPDATE CURRENT_TIMESTAMP/g, '') // 移除ON UPDATE CURRENT_TIMESTAMP
        .replace(/,\s* FOREIGN KEY[^(]*\([^)]*\)[^,]*,/g, ',') // 移除外键约束
        .replace(/,\s* FOREIGN KEY[^(]*\([^)]*\)[^,]*$/g, '') // 移除最后一个外键约束
        .replace(/\s+/g, ' ') // 规范化空白字符
        .trim();
      
      // 跳过空语句
      if (processedStatement.length === 0) continue;
      
      // 如果是CREATE TABLE语句，提取索引定义
      if (processedStatement.startsWith('CREATE TABLE')) {
        // 提取索引语句
        const extractedIndexes = extractIndexStatements(processedStatement);
        indexStatements.push(...extractedIndexes);
        
        // 移除索引定义
        processedStatement = removeIndexDefinitions(processedStatement);
      }
      
      processedStatements.push(processedStatement);
    }
    
    console.log(`📝 找到 ${processedStatements.length} 个SQL语句`);
    console.log(`📝 找到 ${indexStatements.length} 个索引语句`);
    
    // 执行每个SQL语句
    for (let i = 0; i < processedStatements.length; i++) {
      const statement = processedStatements[i];
      if (statement.startsWith('CREATE TABLE')) {
        try {
          // 提取表名
          const tableNameMatch = statement.match(/CREATE TABLE\s+(\w+)/i);
          if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            console.log(`📋 正在创建表: ${tableName}`);
            
            // 执行CREATE TABLE语句
            db.run(statement);
            console.log(`✅ 表 ${tableName} 创建成功`);
          }
        } catch (error) {
          // 如果表已存在，跳过
          if (error.message.includes('already exists')) {
            console.log(`⚠️  表已存在，跳过创建`);
          } else {
            console.error(`❌ 创建表失败:`, error.message);
            throw error;
          }
        }
      } else if (statement.startsWith('CREATE VIEW')) {
        try {
          // 提取视图名
          const viewNameMatch = statement.match(/CREATE VIEW\s+(\w+)/i);
          if (viewNameMatch) {
            const viewName = viewNameMatch[1];
            console.log(`📋 正在创建视图: ${viewName}`);
            
            // 执行CREATE VIEW语句
            db.run(statement);
            console.log(`✅ 视图 ${viewName} 创建成功`);
          }
        } catch (error) {
          // 如果视图已存在，跳过
          if (error.message.includes('already exists')) {
            console.log(`⚠️  视图已存在，跳过创建`);
          } else {
            console.error(`❌ 创建视图失败:`, error.message);
          }
        }
      } else if (statement.startsWith('INSERT INTO')) {
        try {
          console.log(`📋 执行插入语句...`);
          db.run(statement);
          console.log(`✅ 插入语句执行成功`);
        } catch (error) {
          console.error(`❌ 插入语句执行失败:`, error.message);
        }
      }
    }
    
    // 执行索引语句
    for (let i = 0; i < indexStatements.length; i++) {
      const statement = indexStatements[i];
      try {
        console.log(`📋 正在创建索引...`);
        db.run(statement);
        console.log(`✅ 索引创建成功`);
      } catch (error) {
        // 如果索引已存在，跳过
        if (error.message.includes('already exists')) {
          console.log(`⚠️  索引已存在，跳过创建`);
        } else {
          console.error(`❌ 创建索引失败:`, error.message);
        }
      }
    }
    
    // 保存数据库到文件
    const exportData = db.export();
    const buffer = Buffer.from(exportData);
    fs.writeFileSync(dbPath, buffer);
    console.log('💾 数据库更改已保存到文件');
    
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