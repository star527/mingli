#!/usr/bin/env node

/**
 * 创建初始管理员账号脚本
 * 在开发环境中为管理后台创建管理员用户
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// 数据库文件路径
const DB_PATH = path.resolve(__dirname, '../data/mingli.db');

// 管理员账号信息（开发环境）
const adminInfo = {
  id: 'admin_001',
  nickname: '系统管理员',
  email: 'admin@mingli.com',
  member_level: 99, // 超级管理员等级
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: new Date().toISOString()
};

async function createAdminUser() {
  try {
    console.log('🚀 开始创建初始管理员账号...');
    
    // 确保数据目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ 数据目录创建成功');
    }
    
    // 初始化SQL.js
    const SQL = await initSqlJs();
    
    // 读取或创建数据库文件
    let db;
    if (fs.existsSync(DB_PATH)) {
      console.log(`📁 正在加载数据库: ${DB_PATH}`);
      const fileBuffer = fs.readFileSync(DB_PATH);
      const data = new Uint8Array(fileBuffer);
      db = new SQL.Database(data);
    } else {
      console.log(`📁 创建新数据库: ${DB_PATH}`);
      db = new SQL.Database();
    }
    
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
    
    // 检查users表是否存在，如果不存在则创建
    const tableCheck = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `);
    
    if (!tableCheck.step()) {
      console.log('⚠️ users表不存在，正在创建...');
      
      // 创建users表
      db.run(`
        CREATE TABLE users (
          id VARCHAR(64) PRIMARY KEY,
          openid VARCHAR(128),
          unionid VARCHAR(128),
          nickname VARCHAR(100),
          avatar_url VARCHAR(500),
          gender TINYINT DEFAULT 0,
          phone VARCHAR(20),
          email VARCHAR(100),
          member_level TINYINT DEFAULT 0,
          member_expire_date DATETIME,
          last_upgrade_date DATETIME,
          analysis_count INT DEFAULT 0,
          video_watch_time INT DEFAULT 0,
          created_at DATETIME,
          updated_at DATETIME,
          last_login DATETIME
        );
        CREATE INDEX idx_openid ON users(openid);
        CREATE INDEX idx_member_level ON users(member_level);
        CREATE INDEX idx_created_at ON users(created_at);
      `);
      console.log('✅ users表创建成功');
    }
    
    // 检查管理员是否已存在
    const adminCheck = db.prepare('SELECT id FROM users WHERE id = ?');
    adminCheck.bind([adminInfo.id]);
    
    if (adminCheck.step()) {
      console.log('ℹ️  管理员账号已存在，正在更新信息...');
      // 更新管理员信息
      db.run(
        `UPDATE users 
         SET nickname = ?, email = ?, member_level = ?, updated_at = ? 
         WHERE id = ?`,
        [adminInfo.nickname, adminInfo.email, adminInfo.member_level, adminInfo.updated_at, adminInfo.id]
      );
      console.log('✅ 管理员信息更新成功');
    } else {
      console.log('✅ 正在插入管理员账号...');
      // 插入管理员账号
      db.run(
        `INSERT INTO users (id, nickname, email, member_level, created_at, updated_at, last_login)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminInfo.id, adminInfo.nickname, adminInfo.email, adminInfo.member_level, 
         adminInfo.created_at, adminInfo.updated_at, adminInfo.last_login]
      );
      console.log('✅ 管理员账号创建成功');
    }
    
    // 更新环境变量，添加管理员ID到ADMIN_USERS
    updateEnvFile(adminInfo.id);
    
    // 保存数据库
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    console.log('✅ 数据库保存成功');
    
    // 输出管理员信息
    console.log('\n🎉 初始管理员账号创建完成！');
    console.log('📋 管理员信息:');
    console.log(`  - 用户ID: ${adminInfo.id}`);
    console.log(`  - 昵称: ${adminInfo.nickname}`);
    console.log(`  - 邮箱: ${adminInfo.email}`);
    console.log(`  - 会员等级: ${adminInfo.member_level}`);
    console.log('\n💡 使用说明:');
    console.log('  1. 管理员账号已添加到数据库');
    console.log('  2. 已更新.env文件中的ADMIN_USERS配置');
    console.log('  3. 您可以使用此账号登录管理后台');
    
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    process.exit(1);
  }
}

function updateEnvFile(adminId) {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // 检查是否已存在ADMIN_USERS配置
      if (envContent.includes('ADMIN_USERS=')) {
        envContent = envContent.replace(/ADMIN_USERS=.*/, `ADMIN_USERS=${adminId}`);
      } else {
        envContent += `\n\n# 管理员配置\nADMIN_USERS=${adminId}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env文件更新成功，已添加ADMIN_USERS配置');
    }
  } catch (error) {
    console.error('⚠️ 更新.env文件失败:', error.message);
  }
}

// 运行脚本
createAdminUser();