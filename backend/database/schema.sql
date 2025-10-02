-- AI算命八字排盘工具 - 数据库设计 (SQLite版本)
-- 包含用户管理、会员系统、视频课程等核心功能

-- 用户表
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY, -- 用户ID
    openid VARCHAR(128) UNIQUE, -- 微信openid
    unionid VARCHAR(128), -- 微信unionid
    nickname VARCHAR(100), -- 用户昵称
    avatar_url VARCHAR(500), -- 头像URL
    gender TINYINT DEFAULT 0, -- 性别: 0-未知, 1-男, 2-女
    phone VARCHAR(20), -- 手机号
    email VARCHAR(100), -- 邮箱
    
    -- 会员信息
    member_level TINYINT DEFAULT 0, -- 会员等级: 0-免费, 1-普通, 2-高级
    member_expire_date DATETIME, -- 会员过期时间
    last_upgrade_date DATETIME, -- 最后升级时间
    
    -- 统计信息
    analysis_count INT DEFAULT 0, -- 总分析次数
    video_watch_time INT DEFAULT 0, -- 视频观看总时长(分钟)
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME -- 最后登录时间
);

CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_member_level ON users(member_level);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 八字分析记录表
CREATE TABLE bazi_records (
    id VARCHAR(64) PRIMARY KEY, -- 记录ID
    user_id VARCHAR(64) NOT NULL, -- 用户ID
    
    -- 出生信息
    birth_year INT NOT NULL, -- 出生年份
    birth_month INT NOT NULL, -- 出生月份
    birth_day INT NOT NULL, -- 出生日期
    birth_hour INT NOT NULL, -- 出生时辰
    birth_minute INT, -- 出生分钟
    gender TINYINT NOT NULL, -- 性别
    
    -- 八字结果
    year_gan VARCHAR(4), -- 年干
    year_zhi VARCHAR(4), -- 年支
    month_gan VARCHAR(4), -- 月干
    month_zhi VARCHAR(4), -- 月支
    day_gan VARCHAR(4), -- 日干
    day_zhi VARCHAR(4), -- 日支
    hour_gan VARCHAR(4), -- 时干
    hour_zhi VARCHAR(4), -- 时支
    
    -- 分析结果
    wu_xing_analysis TEXT, -- 五行分析
    shi_shen_analysis TEXT, -- 十神分析
    character_analysis TEXT, -- 性格分析
    career_analysis TEXT, -- 事业分析
    relationship_analysis TEXT, -- 感情分析
    health_analysis TEXT, -- 健康分析
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_favorite BOOLEAN DEFAULT FALSE, -- 是否收藏
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bazi_records_user_id ON bazi_records(user_id);
CREATE INDEX idx_bazi_records_created_at ON bazi_records(created_at);

-- 视频课程表
CREATE TABLE videos (
    id VARCHAR(64) PRIMARY KEY, -- 视频ID
    title VARCHAR(200) NOT NULL, -- 视频标题
    description TEXT, -- 视频描述
    category VARCHAR(50) NOT NULL, -- 分类
    
    -- 视频信息
    duration INT, -- 视频时长(秒)
    file_size BIGINT, -- 文件大小(字节)
    storage_path VARCHAR(500), -- 存储路径
    play_url VARCHAR(500), -- 播放地址
    thumbnail_url VARCHAR(500), -- 缩略图
    
    -- 权限和价格
    is_premium BOOLEAN DEFAULT FALSE, -- 是否高级会员专属
    price DECIMAL(10,2) DEFAULT 0, -- 单独购买价格
    status VARCHAR(20) DEFAULT 'active', -- 状态: active, inactive, processing
    
    -- 统计信息
    view_count INT DEFAULT 0, -- 观看次数
    like_count INT DEFAULT 0, -- 点赞数
    share_count INT DEFAULT 0, -- 分享次数
    
    -- 章节信息(TEXT格式存储JSON)
    chapters TEXT, -- 视频章节
    
    -- 转码信息
    available_qualities TEXT, -- 可用清晰度
    transcoded_urls TEXT, -- 转码后URL
    
    -- 系统字段
    creator_id VARCHAR(64), -- 创建者ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at);

-- 用户观看记录表
CREATE TABLE user_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL, -- 用户ID
    video_id VARCHAR(64) NOT NULL, -- 视频ID
    
    -- 观看进度
    progress INT DEFAULT 0, -- 观看进度(秒)
    duration INT, -- 视频总时长(秒)
    percentage DECIMAL(5,2) DEFAULT 0, -- 观看百分比
    
    -- 完成状态
    is_completed BOOLEAN DEFAULT FALSE, -- 是否看完
    completed_at DATETIME, -- 完成时间
    
    -- 系统字段
    last_watched DATETIME DEFAULT CURRENT_TIMESTAMP, -- 最后观看时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE(user_id, video_id)
);

CREATE INDEX idx_user_videos_user_id ON user_videos(user_id);
CREATE INDEX idx_user_videos_video_id ON user_videos(video_id);
CREATE INDEX idx_user_videos_last_watched ON user_videos(last_watched);

-- 视频点赞表
CREATE TABLE video_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL, -- 用户ID
    video_id VARCHAR(64) NOT NULL, -- 视频ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE(user_id, video_id)
);

CREATE INDEX idx_video_likes_video_id ON video_likes(video_id);

-- 订单表
CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY, -- 订单ID
    user_id VARCHAR(64) NOT NULL, -- 用户ID
    
    -- 订单信息
    order_type VARCHAR(50) NOT NULL, -- 订单类型: membership, video, consultation
    product_id VARCHAR(64), -- 产品ID
    product_name VARCHAR(200), -- 产品名称
    
    -- 金额信息
    amount DECIMAL(10,2) NOT NULL, -- 订单金额
    original_amount DECIMAL(10,2), -- 原价
    discount_amount DECIMAL(10,2) DEFAULT 0, -- 优惠金额
    
    -- 支付信息
    payment_method VARCHAR(50), -- 支付方式: wechat, alipay
    payment_status VARCHAR(20) DEFAULT 'pending', -- 支付状态
    transaction_id VARCHAR(128), -- 支付平台交易ID
    paid_at DATETIME, -- 支付时间
    
    -- 会员订单特有字段
    member_level TINYINT, -- 购买的会员等级
    member_duration INT, -- 会员时长(天)
    
    -- 系统字段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

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