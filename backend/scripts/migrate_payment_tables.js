/**
 * 支付相关数据库表迁移脚本
 * 创建订单表、优惠券表和优惠券使用记录表
 */

const { query } = require('../src/config/database');

async function migratePaymentTables() {
  try {
    console.log('开始创建支付相关数据库表...');
    
    // 1. 创建订单表
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        order_type VARCHAR(20) NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        original_amount DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        coupon_code VARCHAR(50) DEFAULT NULL,
        payment_method VARCHAR(20) DEFAULT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(100) DEFAULT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ 订单表创建成功');
    
    // 2. 创建优惠券表
    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(20) NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_order_amount DECIMAL(10, 2) DEFAULT 0,
        max_discount_amount DECIMAL(10, 2) DEFAULT NULL,
        usage_limit VARCHAR(50) DEFAULT NULL,
        max_usage INT DEFAULT 100,
        max_usage_per_user INT DEFAULT 1,
        active BOOLEAN DEFAULT TRUE,
        start_date DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);
    console.log('✓ 优惠券表创建成功');
    
    // 3. 创建优惠券使用记录表
    await query(`
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coupon_id INTEGER NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        order_id VARCHAR(50) NOT NULL,
        used_at DATETIME NOT NULL,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        UNIQUE (user_id, coupon_id, order_id)
      )
    `);
    console.log('✓ 优惠券使用记录表创建成功');
    
    // 4. 创建用户已购视频表
    await query(`
      CREATE TABLE IF NOT EXISTS user_purchased_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) NOT NULL,
        video_id VARCHAR(50) NOT NULL,
        purchased_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, video_id)
      )
    `);
    console.log('✓ 用户已购视频表创建成功');
    
    // 5. 暂时跳过测试优惠券数据插入，后续手动添加
    console.log('⚠️  跳过测试优惠券数据插入');
    
    console.log('🎉 支付相关数据库表创建完成！');
  } catch (error) {
    console.error('❌ 创建支付相关数据库表失败:', error);
    throw error;
  }
}

async function insertTestCoupons() {
  try {
    // 检查是否已有优惠券数据
    const [result] = await query('SELECT COUNT(*) as count FROM coupons');
    if (result.count > 0) {
      console.log('⚠️  优惠券表已有数据，跳过插入测试数据');
      return;
    }
    
    const now = new Date();
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 3); // 3个月后过期
    
    await query(`
      INSERT INTO coupons (
        code, discount_type, discount_value, min_order_amount, 
        usage_limit, max_usage, max_usage_per_user, active, 
        start_date, expires_at, created_at, updated_at
      ) VALUES
      ('NEWUSER10', 'fixed', 10, 20, 'all', 1000, 1, true, ?, ?, ?, ?),
      ('VIP20OFF', 'percentage', 20, 50, 'membership', 500, 2, true, ?, ?, ?, ?),
      ('VIDEO15', 'fixed', 15, 30, 'video', 300, 1, true, ?, ?, ?, ?)
    `, [now, expireDate, now, now, now, expireDate, now, now, now, expireDate, now, now]);
    
    console.log('✓ 测试优惠券数据插入成功');
  } catch (error) {
    console.error('❌ 插入测试优惠券数据失败:', error);
  }
}

// 执行迁移
if (require.main === module) {
  migratePaymentTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migratePaymentTables;