-- AI算命八字排盘工具 - 数据库设计
-- 包含用户管理、会员系统、视频课程等核心功能

CREATE DATABASE IF NOT EXISTS mingli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mingli;

-- 用户表
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY COMMENT '用户ID',
    openid VARCHAR(128) UNIQUE COMMENT '微信openid',
    unionid VARCHAR(128) COMMENT '微信unionid',
    nickname VARCHAR(100) COMMENT '用户昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    gender TINYINT DEFAULT 0 COMMENT '性别: 0-未知, 1-男, 2-女',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    
    -- 会员信息
    member_level TINYINT DEFAULT 0 COMMENT '会员等级: 0-免费, 1-普通, 2-高级',
    member_expire_date DATETIME COMMENT '会员过期时间',
    last_upgrade_date DATETIME COMMENT '最后升级时间',
    
    -- 统计信息
    analysis_count INT DEFAULT 0 COMMENT '总分析次数',
    video_watch_time INT DEFAULT 0 COMMENT '视频观看总时长(分钟)',
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME COMMENT '最后登录时间',
    
    INDEX idx_openid (openid),
    INDEX idx_member_level (member_level),
    INDEX idx_created_at (created_at)
) COMMENT '用户表';

-- 八字分析记录表
CREATE TABLE bazi_records (
    id VARCHAR(64) PRIMARY KEY COMMENT '记录ID',
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    
    -- 出生信息
    birth_year INT NOT NULL COMMENT '出生年份',
    birth_month INT NOT NULL COMMENT '出生月份',
    birth_day INT NOT NULL COMMENT '出生日期',
    birth_hour INT NOT NULL COMMENT '出生时辰',
    birth_minute INT COMMENT '出生分钟',
    gender TINYINT NOT NULL COMMENT '性别',
    
    -- 八字结果
    year_gan VARCHAR(4) COMMENT '年干',
    year_zhi VARCHAR(4) COMMENT '年支',
    month_gan VARCHAR(4) COMMENT '月干',
    month_zhi VARCHAR(4) COMMENT '月支',
    day_gan VARCHAR(4) COMMENT '日干',
    day_zhi VARCHAR(4) COMMENT '日支',
    hour_gan VARCHAR(4) COMMENT '时干',
    hour_zhi VARCHAR(4) COMMENT '时支',
    
    -- 分析结果
    wu_xing_analysis TEXT COMMENT '五行分析',
    shi_shen_analysis TEXT COMMENT '十神分析',
    character_analysis TEXT COMMENT '性格分析',
    career_analysis TEXT COMMENT '事业分析',
    relationship_analysis TEXT COMMENT '感情分析',
    health_analysis TEXT COMMENT '健康分析',
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_favorite BOOLEAN DEFAULT FALSE COMMENT '是否收藏',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) COMMENT '八字分析记录表';

-- 视频课程表
CREATE TABLE videos (
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
    
    -- 权限和价格
    is_premium BOOLEAN DEFAULT FALSE COMMENT '是否高级会员专属',
    price DECIMAL(10,2) DEFAULT 0 COMMENT '单独购买价格',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active, inactive, processing',
    
    -- 统计信息
    view_count INT DEFAULT 0 COMMENT '观看次数',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    share_count INT DEFAULT 0 COMMENT '分享次数',
    
    -- 章节信息(JSON格式)
    chapters JSON COMMENT '视频章节',
    
    -- 转码信息
    available_qualities JSON COMMENT '可用清晰度',
    transcoded_urls JSON COMMENT '转码后URL',
    
    -- 系统字段
    creator_id VARCHAR(64) COMMENT '创建者ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT '视频课程表';

-- 用户观看记录表
CREATE TABLE user_videos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    video_id VARCHAR(64) NOT NULL COMMENT '视频ID',
    
    -- 观看进度
    progress INT DEFAULT 0 COMMENT '观看进度(秒)',
    duration INT COMMENT '视频总时长(秒)',
    percentage DECIMAL(5,2) DEFAULT 0 COMMENT '观看百分比',
    
    -- 完成状态
    is_completed BOOLEAN DEFAULT FALSE COMMENT '是否看完',
    completed_at DATETIME COMMENT '完成时间',
    
    -- 系统字段
    last_watched DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后观看时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_video (user_id, video_id),
    INDEX idx_user_id (user_id),
    INDEX idx_video_id (video_id),
    INDEX idx_last_watched (last_watched)
) COMMENT '用户观看记录表';

-- 视频点赞表
CREATE TABLE video_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    video_id VARCHAR(64) NOT NULL COMMENT '视频ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_video_like (user_id, video_id),
    INDEX idx_video_id (video_id)
) COMMENT '视频点赞表';

-- 订单表
CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY COMMENT '订单ID',
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    
    -- 订单信息
    order_type VARCHAR(50) NOT NULL COMMENT '订单类型: membership, video, consultation',
    product_id VARCHAR(64) COMMENT '产品ID',
    product_name VARCHAR(200) COMMENT '产品名称',
    
    -- 金额信息
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额',
    original_amount DECIMAL(10,2) COMMENT '原价',
    discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT '优惠金额',
    
    -- 支付信息
    payment_method VARCHAR(50) COMMENT '支付方式: wechat, alipay',
    payment_status VARCHAR(20) DEFAULT 'pending' COMMENT '支付状态',
    transaction_id VARCHAR(128) COMMENT '支付平台交易ID',
    paid_at DATETIME COMMENT '支付时间',
    
    -- 会员订单特有字段
    member_level TINYINT COMMENT '购买的会员等级',
    member_duration INT COMMENT '会员时长(天)',
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_type (order_type),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
) COMMENT '订单表';

-- 优惠券表
CREATE TABLE coupons (
    id VARCHAR(64) PRIMARY KEY COMMENT '优惠券ID',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '优惠券码',
    name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    
    -- 会员等级表
CREATE TABLE membership_levels (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '会员等级ID',
    name VARCHAR(100) NOT NULL COMMENT '等级名称',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '时长(天)',
    description TEXT COMMENT '等级描述',
    benefits TEXT COMMENT '会员权益',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order)
) COMMENT '会员等级表';

-- 视频分类表
CREATE TABLE video_categories (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order),
    UNIQUE KEY uk_name (name)
) COMMENT '视频分类表';    -- 优惠信息
    type VARCHAR(20) NOT NULL COMMENT '类型: percentage, fixed',
    value DECIMAL(10,2) NOT NULL COMMENT '优惠值',
    min_amount DECIMAL(10,2) DEFAULT 0 COMMENT '最低使用金额',
    
    -- 使用限制
    usage_limit INT DEFAULT 1 COMMENT '每人使用次数限制',
    total_quantity INT COMMENT '总发行量',
    used_quantity INT DEFAULT 0 COMMENT '已使用数量',
    
    -- 有效期
    valid_from DATETIME COMMENT '有效期开始',
    valid_to DATETIME COMMENT '有效期结束',
    
    -- 适用产品
    applicable_products JSON COMMENT '适用产品',
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_valid_to (valid_to)
) COMMENT '优惠券表';

-- 用户优惠券表
CREATE TABLE user_coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    coupon_id VARCHAR(64) NOT NULL COMMENT '优惠券ID',
    
    status VARCHAR(20) DEFAULT 'unused' COMMENT '状态: unused, used, expired',
    used_at DATETIME COMMENT '使用时间',
    used_order_id VARCHAR(64) COMMENT '使用的订单ID',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_coupon (user_id, coupon_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) COMMENT '用户优惠券表';

-- 咨询记录表
CREATE TABLE consultations (
    id VARCHAR(64) PRIMARY KEY COMMENT '咨询ID',
    user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
    expert_id VARCHAR(64) COMMENT '专家ID',
    
    -- 咨询信息
    type VARCHAR(50) NOT NULL COMMENT '咨询类型',
    question TEXT NOT NULL COMMENT '用户问题',
    answer TEXT COMMENT '专家回答',
    
    -- 状态信息
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending, answered, completed',
    answered_at DATETIME COMMENT '回答时间',
    completed_at DATETIME COMMENT '完成时间',
    
    -- 评价
    rating TINYINT COMMENT '评分(1-5)',
    review TEXT COMMENT '评价内容',
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expert_id (expert_id),
    INDEX idx_status (status)
) COMMENT '咨询记录表';

-- 系统配置表
CREATE TABLE system_configs (
    id VARCHAR(64) PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(200) COMMENT '配置描述',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key)
) COMMENT '系统配置表';

-- 插入初始配置数据
INSERT INTO system_configs (id, config_key, config_value, description) VALUES
('1', 'free_analysis_limit', '3', '免费用户每月分析次数限制'),
('2', 'basic_member_price', '29', '普通会员月费'),
('3', 'premium_member_price', '99', '高级会员月费'),
('4', 'video_upload_limit', '500', '视频上传大小限制(MB)'),
('5', 'consultation_base_price', '199', '基础咨询价格');

-- 会员等级表
CREATE TABLE membership_levels (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '会员等级ID',
    name VARCHAR(100) NOT NULL COMMENT '等级名称',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    duration INT NOT NULL COMMENT '时长(天)',
    description TEXT COMMENT '等级描述',
    benefits TEXT COMMENT '会员权益',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order)
) COMMENT '会员等级表';

-- 视频分类表
CREATE TABLE video_categories (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order),
    UNIQUE KEY uk_name (name)
) COMMENT '视频分类表';

-- 创建统计视图
CREATE VIEW member_stats AS
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN member_level = 0 THEN 1 ELSE 0 END) as free_users,
    SUM(CASE WHEN member_level = 1 THEN 1 ELSE 0 END) as basic_members,
    SUM(CASE WHEN member_level = 2 THEN 1 ELSE 0 END) as premium_members,
    AVG(analysis_count) as avg_analysis_count
FROM users;

CREATE VIEW video_stats AS
SELECT 
    COUNT(*) as total_videos,
    SUM(view_count) as total_views,
    AVG(duration) as avg_duration,
    SUM(like_count) as total_likes
FROM videos
WHERE status = 'active';