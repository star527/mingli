# AI算命八字排盘工具

## 项目简介
基于AI技术的智能八字排盘工具，包含微信小程序前端和管理后台，支持会员系统和视频课程功能。

## 功能特性

### 核心功能
- 🔮 智能八字排盘
- 🤖 AI命理解读
- 📊 运势预测分析
- 🎓 视频课程学习

### 会员功能
- 💎 多层级会员体系
- 📺 专属视频课程
- 🔒 深度命理分析
- 👨‍💼 专家咨询服务

## 技术栈

### 前端
- 微信小程序：原生开发 + Vant Weapp
- 管理后台：Vue3 + Element Plus

### 后端
- Node.js + Express
- MySQL + Redis
- 阿里云OSS（视频存储）

### AI服务
- 规则引擎 + LLM增强
- 命理知识图谱
- 个性化推荐

## 项目结构
```
mingli/
├── backend/          # 后端API服务
├── miniprogram/      # 微信小程序
├── admin/           # 管理后台
├── docs/            # 文档
└── shared/          # 共享工具库
```

## 快速开始

### 环境要求
- Node.js >= 16.0
- MySQL >= 5.7
- Redis >= 6.0

### 安装依赖
```bash
npm install

# 安装后端依赖
cd backend && npm install

# 安装管理后台依赖  
cd admin && npm install
```

### 数据库初始化
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE mingli CHARACTER SET utf8mb4;"

# 导入表结构
mysql -u root -p mingli < backend/database/schema.sql
```

### 启动开发环境
```bash
# 启动所有服务
npm run dev

# 或分别启动
npm run dev:backend  # 后端API (端口3000)
npm run dev:admin    # 管理后台 (端口8080)
```

## 部署说明

### 生产环境部署
1. 配置环境变量
2. 构建项目：`npm run build`
3. 使用PM2部署后端服务
4. Nginx反向代理配置

### 微信小程序部署
1. 在小程序后台配置域名
2. 上传小程序代码
3. 提交审核发布

## 会员系统配置

### 会员等级
- 免费用户：基础功能
- 普通会员：¥29/月，视频课程+深度分析
- 高级会员：¥99/月，专家咨询+专属服务

### 支付配置
- 微信支付商户号
- 支付宝商户号
- 支付回调地址配置

## 视频课程管理

### 视频上传
- 支持MP4/MOV格式
- 自动转码为HLS格式
- 防盗链保护

### 课程管理
- 分类管理
- 章节设置
- 学习进度跟踪

## 联系方式

如有问题请联系：your-email@example.com

## 许可证

MIT License