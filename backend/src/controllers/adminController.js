/**
 * 管理员控制器
 * 处理管理后台相关的业务逻辑
 */

// 引入数据库连接
const db = require('../config/database');

class AdminController {
  constructor() {
    // 数据库连接已通过require引入
  }

  /**
   * 获取统计数据
   */
  async getStats(req, res) {
    try {
      // TODO: 从数据库获取统计数据
      const stats = {
        totalUsers: 1000,
        activeUsers: 500,
        totalVideos: 50,
        totalOrders: 200,
        totalRevenue: 5000,
        todayRevenue: 100,
        membershipDistribution: {
          FREE: 700,
          BASIC: 200,
          PREMIUM: 100
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  }

  /**
   * 获取用户列表
   */
  async getUserList(req, res) {
    try {
      const { page = 1, limit = 20, keyword } = req.query;
      
      // TODO: 从数据库获取用户列表
      const users = await this.getUsers(parseInt(page), parseInt(limit), keyword);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: users.length,
            totalPages: Math.ceil(users.length / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败'
      });
    }
  }

  /**
   * 上传视频
   */
  async uploadVideo(req, res) {
    try {
      const { title, description, category, price, isFree, membershipRequired } = req.body;
      
      // TODO: 处理视频文件上传
      // TODO: 保存视频信息到数据库
      
      const video = {
        id: Date.now(),
        title,
        description,
        category,
        price: parseFloat(price),
        isFree: isFree === 'true',
        membershipRequired,
        status: 'active',
        createdAt: new Date()
      };

      res.json({
        success: true,
        message: '视频上传成功',
        data: video
      });
    } catch (error) {
      console.error('上传视频失败:', error);
      res.status(500).json({
        success: false,
        message: '上传视频失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取会员等级列表
   */
  async getMembershipLevels(req, res) {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const limit = parseInt(pageSize);
      const offset = (parseInt(page) - 1) * limit;
      
      // 查询总数
      const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM membership_levels');
      const total = totalResult[0].total;
      
      // 查询分页数据
      const [levels] = await db.execute(
        'SELECT * FROM membership_levels ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      res.json({
        code: 200,
        data: {
          items: levels,
          total: total,
          page: parseInt(page),
          pageSize: limit
        }
      });
    } catch (error) {
      console.error('获取会员等级列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取会员等级列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 创建会员等级
   */
  async createMembershipLevel(req, res) {
    try {
      const { name, price, duration, description, benefits = '', sortOrder = 0 } = req.body;
      
      // 检查名称是否已存在
      const [existing] = await db.execute(
        'SELECT id FROM membership_levels WHERE name = ?',
        [name]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '会员等级名称已存在'
        });
      }
      
      // 插入新数据
      const [result] = await db.execute(
        'INSERT INTO membership_levels (name, price, duration, description, benefits, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [name, parseFloat(price), parseInt(duration), description, benefits, parseInt(sortOrder)]
      );
      
      // 获取新创建的记录
      const [newLevel] = await db.execute(
        'SELECT * FROM membership_levels WHERE id = ?',
        [result.insertId]
      );
      
      res.json({
        code: 200,
        message: '创建成功',
        data: newLevel[0]
      });
    } catch (error) {
      console.error('创建会员等级失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建会员等级失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新会员等级
   */
  async updateMembershipLevel(req, res) {
    try {
      const { id } = req.params;
      const { name, price, duration, description, benefits, sortOrder } = req.body;
      
      // 检查记录是否存在
      const [existing] = await db.execute(
        'SELECT id FROM membership_levels WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '会员等级不存在'
        });
      }
      
      // 检查名称是否已被其他记录使用
      const [nameCheck] = await db.execute(
        'SELECT id FROM membership_levels WHERE name = ? AND id != ?',
        [name, id]
      );
      
      if (nameCheck.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '会员等级名称已存在'
        });
      }
      
      // 更新数据
      await db.execute(
        'UPDATE membership_levels SET name = ?, price = ?, duration = ?, description = ?, benefits = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, parseFloat(price), parseInt(duration), description, benefits || '', parseInt(sortOrder) || 0, id]
      );
      
      // 获取更新后的记录
      const [updated] = await db.execute(
        'SELECT * FROM membership_levels WHERE id = ?',
        [id]
      );
      
      res.json({
        code: 200,
        message: '更新成功',
        data: updated[0]
      });
    } catch (error) {
      console.error('更新会员等级失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新会员等级失败',
        error: error.message
      });
    }
  }
  
  /**
   * 删除会员等级
   */
  async deleteMembershipLevel(req, res) {
    try {
      const { id } = req.params;
      
      // 检查记录是否存在
      const [existing] = await db.execute(
        'SELECT id FROM membership_levels WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '会员等级不存在'
        });
      }
      
      // 删除记录
      await db.execute(
        'DELETE FROM membership_levels WHERE id = ?',
        [id]
      );
      
      res.json({
        code: 200,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除会员等级失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除会员等级失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取视频分类列表
   */
  async getVideoCategories(req, res) {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      const limit = parseInt(pageSize);
      const offset = (parseInt(page) - 1) * limit;
      
      // 查询总数
      const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM video_categories');
      const total = totalResult[0].total;
      
      // 查询分页数据
      const [categories] = await db.execute(
        'SELECT * FROM video_categories ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      res.json({
        code: 200,
        data: {
          items: categories,
          total: total,
          page: parseInt(page),
          pageSize: limit
        }
      });
    } catch (error) {
      console.error('获取视频分类列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取视频分类列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 创建视频分类
   */
  async createVideoCategory(req, res) {
    try {
      const { name, description, sortOrder = 0 } = req.body;
      
      // 检查名称是否已存在
      const [existing] = await db.execute(
        'SELECT id FROM video_categories WHERE name = ?',
        [name]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '视频分类名称已存在'
        });
      }
      
      // 插入新数据
      const [result] = await db.execute(
        'INSERT INTO video_categories (name, description, sort_order) VALUES (?, ?, ?)',
        [name, description, parseInt(sortOrder)]
      );
      
      // 获取新创建的记录
      const [newCategory] = await db.execute(
        'SELECT * FROM video_categories WHERE id = ?',
        [result.insertId]
      );
      
      res.json({
        code: 200,
        message: '创建成功',
        data: newCategory[0]
      });
    } catch (error) {
      console.error('创建视频分类失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建视频分类失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新视频分类
   */
  async updateVideoCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, sortOrder } = req.body;
      
      // 检查记录是否存在
      const [existing] = await db.execute(
        'SELECT id FROM video_categories WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '视频分类不存在'
        });
      }
      
      // 检查名称是否已被其他记录使用
      const [nameCheck] = await db.execute(
        'SELECT id FROM video_categories WHERE name = ? AND id != ?',
        [name, id]
      );
      
      if (nameCheck.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '视频分类名称已存在'
        });
      }
      
      // 更新数据
      await db.execute(
        'UPDATE video_categories SET name = ?, description = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, parseInt(sortOrder) || 0, id]
      );
      
      // 获取更新后的记录
      const [updated] = await db.execute(
        'SELECT * FROM video_categories WHERE id = ?',
        [id]
      );
      
      res.json({
        code: 200,
        message: '更新成功',
        data: updated[0]
      });
    } catch (error) {
      console.error('更新视频分类失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新视频分类失败',
        error: error.message
      });
    }
  }
  
  /**
   * 删除视频分类
   */
  async deleteVideoCategory(req, res) {
    try {
      const { id } = req.params;
      
      // 检查记录是否存在
      const [existing] = await db.execute(
        'SELECT id FROM video_categories WHERE id = ?',
        [id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({
          code: 404,
          message: '视频分类不存在'
        });
      }
      
      // 检查是否有视频使用此分类
      const [videos] = await db.execute(
        'SELECT COUNT(*) as count FROM videos WHERE category = (SELECT name FROM video_categories WHERE id = ?)',
        [id]
      );
      
      if (videos[0].count > 0) {
        return res.status(400).json({
          code: 400,
          message: `该分类下有 ${videos[0].count} 个视频，无法删除`
        });
      }
      
      // 删除记录
      await db.execute(
        'DELETE FROM video_categories WHERE id = ?',
        [id]
      );
      
      res.json({
        code: 200,
        message: '删除成功'
      });
    } catch (error) {
      console.error('删除视频分类失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除视频分类失败',
        error: error.message
      });
    }
  }

  /**
   * 更新视频信息
   */
  async updateVideo(req, res) {
    try {
      const { videoId } = req.params;
      const updateData = req.body;
      
      // TODO: 更新视频信息到数据库
      
      res.json({
        success: true,
        message: '视频更新成功',
        data: {
          id: parseInt(videoId),
          ...updateData
        }
      });
    } catch (error) {
      console.error('更新视频失败:', error);
      res.status(500).json({
        success: false,
        message: '更新视频失败'
      });
    }
  }

  /**
   * 获取订单列表
   */
  async getOrderList(req, res) {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      
      // TODO: 从数据库获取订单列表
      const orders = await this.getOrders(parseInt(page), parseInt(limit), status, type);
      
      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: orders.length,
            totalPages: Math.ceil(orders.length / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败'
      });
    }
  }

  /**
   * 获取用户列表（模拟）
   */
  async getUsers(page, limit, keyword) {
    const start = (page - 1) * limit;
    
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: start + i + 1,
      nickname: `用户${start + i + 1}`,
      avatar: '',
      membership: i % 3 === 0 ? 'PREMIUM' : i % 2 === 0 ? 'BASIC' : 'FREE',
      analysisCount: Math.floor(Math.random() * 20),
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  /**
   * 获取订单列表（模拟）
   */
  async getOrders(page, limit, status, type) {
    const start = (page - 1) * limit;
    
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `order_${start + i + 1}`,
      userId: start + i + 1,
      type: type || (i % 2 === 0 ? 'membership' : 'video'),
      productId: i % 2 === 0 ? 'BASIC' : `video_${i + 1}`,
      amount: i % 2 === 0 ? 29 : 9.9,
      status: status || (i % 3 === 0 ? 'success' : i % 2 === 0 ? 'pending' : 'failed'),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }
}

module.exports = new AdminController();