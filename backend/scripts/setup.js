#!/usr/bin/env node

/**
 * 项目初始化脚本
 * 自动设置开发环境
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始初始化AI算命八字排盘项目...\n');

// 检查Node.js版本
const nodeVersion = process.version;
console.log(`📋 Node.js版本: ${nodeVersion}`);

if (parseFloat(nodeVersion.slice(1)) < 16.0) {
  console.error('❌ 需要Node.js 16.0或更高版本');
  process.exit(1);
}

// 检查是否在backend目录
const currentDir = process.cwd();
const isBackendDir = path.basename(currentDir) === 'backend';

if (!isBackendDir) {
  console.error('❌ 请在backend目录下运行此脚本');
  process.exit(1);
}

// 创建环境配置文件
function createEnvFile() {
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ 已创建.env配置文件');
    console.log('💡 请编辑.env文件配置数据库和微信小程序信息');
  } else {
    console.log('📁 .env文件已存在');
  }
}

// 安装依赖
function installDependencies() {
  console.log('\n📦 正在安装依赖...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ 依赖安装完成');
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
}

// 创建必要的目录
function createDirectories() {
  const directories = [
    'uploads',
    'uploads/videos',
    'uploads/images',
    'logs',
    'temp'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
  });
}

// 数据库初始化提示
function showDatabaseSetup() {
  console.log('\n🗄️  数据库设置指南:');
  console.log('1. 创建MySQL数据库:');
  console.log('   mysql -u root -p -e "CREATE DATABASE mingli CHARACTER SET utf8mb4;"');
  console.log('');
  console.log('2. 导入表结构:');
  console.log('   mysql -u root -p mingli < database/schema.sql');
  console.log('');
  console.log('3. 配置.env文件中的数据库连接信息');
}

// 微信小程序配置提示
function showWechatSetup() {
  console.log('\n📱 微信小程序配置:');
  console.log('1. 在微信公众平台创建小程序');
  console.log('2. 获取AppID和AppSecret');
  console.log('3. 配置.env文件中的微信小程序信息');
  console.log('4. 配置服务器域名（需要备案域名）');
}

// 运行初始化
async function main() {
  try {
    createEnvFile();
    createDirectories();
    installDependencies();
    
    console.log('\n🎉 项目初始化完成！');
    
    showDatabaseSetup();
    showWechatSetup();
    
    console.log('\n🚀 下一步操作:');
    console.log('1. 完成数据库和微信小程序配置');
    console.log('2. 运行: npm run dev 启动开发服务器');
    console.log('3. 访问: http://localhost:3000 测试API');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 如果是直接运行
if (require.main === module) {
  main();
}

module.exports = { main };