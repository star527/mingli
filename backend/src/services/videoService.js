/**
 * 视频课程服务模块
 * 处理视频上传、转码、播放权限管理
 */

const { query } = require('../config/database');
const storageService = require('./storageService');
const membershipService = require('./membershipService');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/appConfig');

class VideoService {
  constructor(db = null) {
    // 使用默认的数据库连接或传入的连接
    this.db = db || {
      // 提供默认的数据库操作方法
      getVideos: async (filters = {}) => {
        let sql = 'SELECT * FROM videos WHERE status = ?';
        const params = ['ready'];
        
        if (filters.category) {
          sql += ' AND category = ?';
          params.push(filters.category);
        }
        
        if (filters.isFree !== undefined) {
          sql += ' AND is_premium = ?';
          params.push(!filters.isFree ? 1 : 0);
        }
        
        if (filters.page && filters.limit) {
          const offset = (filters.page - 1) * filters.limit;
          sql += ' LIMIT ? OFFSET ?';
          params.push(filters.limit, offset);
        }
        
        return await query(sql, params);
      },
      
      getVideoById: async (id) => {
        const [video] = await query('SELECT * FROM videos WHERE id = ?', [id]);
        return video;
      },
      
      createVideo: async (videoData) => {
        const sql = `
          INSERT INTO videos 
          (id, title, description, category, duration, file_size, 
           storage_path, play_url, is_premium, price, status, creator_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        await query(sql, [
          videoData.id,
          videoData.title,
          videoData.description,
          videoData.category,
          videoData.duration || 0,
          videoData.fileSize || 0,
          videoData.storagePath,
          videoData.playUrl,
          videoData.isPremium ? 1 : 0,
          videoData.price || 0,
          videoData.status,
          videoData.creatorId
        ]);
        
        return await this.db.getVideoById(videoData.id);
      },
      
      getWatchProgress: async (userId, videoId) => {
        const [progress] = await query(
          'SELECT * FROM video_watch_progress WHERE user_id = ? AND video_id = ?', 
          [userId, videoId]
        );
        return progress;
      },
      
      getRelatedVideos: async (videoId, category, limit = 6) => {
        return await query(
          'SELECT * FROM videos WHERE id != ? AND category = ? AND status = ? LIMIT ?',
          [videoId, category, 'ready', limit]
        );
      },
      
      upsertWatchProgress: async (data) => {
        const sql = `
          INSERT INTO video_watch_progress (user_id, video_id, progress, duration, percentage, last_watched)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          progress = VALUES(progress), 
          duration = VALUES(duration), 
          percentage = VALUES(percentage), 
          last_watched = VALUES(last_watched)
        `;
        await query(sql, [
          data.userId, data.videoId, data.progress, 
          data.duration, data.percentage, data.lastWatched
        ]);
      },
      
      incrementVideoViewCount: async (videoId) => {
        await query('UPDATE videos SET view_count = view_count + 1 WHERE id = ?', [videoId]);
      },
      
      searchVideos: async (queryText, filters = {}) => {
        const sql = `
          SELECT *, 
          (CASE WHEN title LIKE ? THEN 10 ELSE 0 END + 
           CASE WHEN description LIKE ? THEN 5 ELSE 0 END) as relevance
          FROM videos WHERE status = ?
          AND (title LIKE ? OR description LIKE ?)
          ORDER BY relevance DESC
        `;
        const searchParam = `%${queryText}%`;
        const results = await query(sql, [
          searchParam, searchParam, 'ready', searchParam, searchParam
        ]);
        
        return { total: results.length, videos: results };
      },
      
      updateVideo: async (videoId, updates) => {
        const fields = [];
        const params = [];
        
        // 添加updated_at字段
        updates.updated_at = 'NOW()';
        
        Object.keys(updates).forEach(key => {
          fields.push(`${key} = ?`);
          params.push(updates[key]);
        });
        
        params.push(videoId);
        await query(`UPDATE videos SET ${fields.join(', ')} WHERE id = ?`, params);
        return true;
      },
      
      getUserLike: async (userId, videoId) => {
        const [like] = await query(
          'SELECT * FROM video_likes WHERE user_id = ? AND video_id = ?',
          [userId, videoId]
        );
        return like;
      },
      
      createLike: async (likeData) => {
        const sql = `
          INSERT INTO video_likes (user_id, video_id, created_at)
          VALUES (?, ?, ?)
        `;
        await query(sql, [likeData.userId, likeData.videoId, likeData.createdAt]);
      },
      
      deleteLike: async (userId, videoId) => {
        await query(
          'DELETE FROM video_likes WHERE user_id = ? AND video_id = ?',
          [userId, videoId]
        );
      },
      
      incrementVideoLikeCount: async (videoId) => {
        await query('UPDATE videos SET like_count = like_count + 1 WHERE id = ?', [videoId]);
      },
      
      decrementVideoLikeCount: async (videoId) => {
        await query('UPDATE videos SET like_count = like_count - 1 WHERE id = ? AND like_count > 0', [videoId]);
      },
      
      getUserLearningStats: async (userId) => {
        // 获取总观看视频数
        const [watchedResult] = await query(
          'SELECT COUNT(*) as count FROM video_watch_progress WHERE user_id = ?',
          [userId]
        );
        
        // 获取总观看时长（秒）
        const [timeResult] = await query(
          'SELECT SUM(duration) as total_time FROM video_watch_progress WHERE user_id = ?',
          [userId]
        );
        
        // 获取完成的课程数（观看进度>90%）
        const [completedResult] = await query(
          'SELECT COUNT(*) as count FROM video_watch_progress WHERE user_id = ? AND percentage > 90',
          [userId]
        );
        
        return {
          totalWatched: watchedResult.count || 0,
          totalTime: timeResult.total_time || 0,
          completedCourses: completedResult.count || 0,
          favoriteCategory: '基础命理', // 暂时硬编码，后续可以根据统计计算
          learningStreak: 0 // 需要额外的逻辑来计算连续学习天数
        };
      }
    };
    
    // 视频分类
    this.categories = {
      BASIC: '基础命理',
      ADVANCED: '高级命理',
      PRACTICAL: '实战应用',
      SPECIAL: '专题课程'
    };
    
    // 支持的视频格式
    this.supportedFormats = ['mp4', 'mov', 'avi', 'mkv'];
  }

  /**
   * 上传视频
   * @param {Object} videoData - 视频数据
   * @returns {Promise<Object>} - 上传结果
   */
  async uploadVideo(videoData, fileBuffer) {
    try {
      // 验证视频格式
      const ext = videoData.filename.split('.').pop().toLowerCase();
      if (!this.validateVideoFormat(ext)) {
        throw new Error('不支持的视频格式');
      }
      
      // 生成视频ID
      const videoId = this.generateVideoId();
      
      // 上传到阿里云OSS存储服务
      const uploadResult = await storageService.uploadVideo({
        videoId,
        buffer: fileBuffer,
        filename: videoData.filename,
        category: videoData.category
      });
      
      // 创建数据库记录
      const videoRecord = await this.db.createVideo({
        id: videoId,
        title: videoData.title,
        description: videoData.description,
        category: videoData.category,
        duration: videoData.duration,
        fileSize: fileBuffer.length,
        storagePath: uploadResult.objectKey,
        playUrl: uploadResult.playUrl,
        isPremium: videoData.isPremium || false,
        price: videoData.price || 0,
        status: 'uploading',
        creatorId: videoData.creatorId
      });
      
      // 启动异步转码
      this.startTranscoding(videoId);
      
      return {
        success: true,
        videoId: videoId,
        video: videoRecord
      };
    } catch (error) {
      console.error('视频上传失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证视频格式
   * @param {string} format - 视频格式
   * @returns {boolean} - 是否支持
   */
  validateVideoFormat(format) {
    const supportedFormats = config.video.supportedFormats || ['mp4', 'mkv', 'avi', 'mov', 'flv'];
    return supportedFormats.includes(format.toLowerCase());
  }
  
  /**
   * 生成视频ID
   * @returns {string} - 唯一的视频ID
   */
  generateVideoId() {
    return `video_${uuidv4().replace(/-/g, '')}`;
  }
  
  /**
   * 生成防盗链签名URL
   * @param {string} videoId - 视频ID
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} - 签名后的播放URL
   */
  async generateSignedPlayUrl(videoId, userId = null) {
    try {
      const video = await this.db.getVideoById(videoId);
      if (!video || video.status !== 'ready') {
        throw new Error('视频不存在或尚未准备就绪');
      }
      
      // 如果是免费视频，直接生成签名URL
      if (!video.is_premium) {
        return await storageService.generateSignedUrl(video.storage_path);
      }
      
      // 如果是付费视频，需要验证用户权限
      if (!userId) {
        throw new Error('观看付费视频需要登录');
      }
      
      // 验证用户会员权限
      const userMembership = await membershipService.getUserMembership(userId);
      if (!userMembership || userMembership.expires_at < new Date()) {
        throw new Error('需要会员权限才能观看');
      }
      
      // 生成带有用户信息的签名URL
      return await storageService.generateSignedUrl(
        video.storage_path,
        { userId, videoId },
        3600 // 1小时有效期
      );
    } catch (error) {
      console.error('生成播放URL失败:', error);
      throw error;
    }
  }

  /**
   * 启动视频转码
   * @param {string} videoId - 视频ID
   */
  async startTranscoding(videoId) {
    try {
      // 查找视频记录
      const video = await this.db.getVideoById(videoId);
      if (!video) {
        throw new Error('视频不存在');
      }
      
      // 更新状态为转码中
      await this.db.updateVideo(videoId, { status: 'transcoding' });
      
      // 调用阿里云OSS转码服务
      const transcodeResult = await storageService.transcodeVideo(videoId, video.storage_path);
      
      // 更新视频记录，包括转码后的播放URL和清晰度选项
      await this.db.updateVideo(videoId, {
        status: 'ready',
        play_url: transcodeResult.hlsUrl,
        availableQualities: transcodeResult.qualities,
        transcoded_at: new Date().toISOString()
      });
      
      console.log(`视频 ${videoId} 转码完成`);
      return true;
    } catch (error) {
      console.error(`视频转码失败 (${videoId}):`, error);
      
      // 更新状态为转码失败
      try {
        await this.db.updateVideo(videoId, {
          status: 'transcode_failed',
          transcode_error: error.message
        });
      } catch (dbError) {
        console.error(`更新转码失败状态失败:`, dbError);
      }
      return false;
    }
  }

  /**
   * 获取视频课程列表
   */
  async getVideoList(filters = {}) {
    try {
      const { page = 1, limit = 10, category, isFree } = filters;
      
      const videos = await this.db.getVideos({
        page,
        limit,
        category,
        isFree
      });
      
      // 获取总数的查询
      let countSql = 'SELECT COUNT(*) as total FROM videos WHERE status = ?';
      const countParams = ['ready'];
      
      if (category) {
        countSql += ' AND category = ?';
        countParams.push(category);
      }
      
      if (isFree !== undefined) {
        countSql += ' AND is_premium = ?';
        countParams.push(!isFree ? 1 : 0);
      }
      
      const [countResult] = await query(countSql, countParams);
      const total = countResult.total || 0;
      
      // 格式化返回数据
      const formattedVideos = videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        category: video.category,
        duration: video.duration,
        thumbnail: video.thumbnail,
        isPremium: video.is_premium === 1,
        price: video.price,
        viewCount: video.view_count || 0,
        likeCount: video.like_count || 0,
        createdAt: video.created_at,
        status: video.status
      }));
      
      return {
        success: true,
        data: {
          videos: formattedVideos,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('获取视频列表失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取视频详情
   */
  async getVideoDetail(videoId, userId = null) {
    try {
      console.log(`[SERVICE DEBUG] 开始获取视频详情，videoId: ${videoId}, userId: ${userId || '未登录'}`);
      
      // 检查videoId参数类型
      console.log(`[SERVICE DEBUG] videoId类型: ${typeof videoId}, 值: ${videoId}`);
      
      // 数据库查询 - 添加超时控制
      console.log(`[SERVICE DEBUG] 执行数据库查询获取视频`);
      // 确保this.db.getVideoById方法正确实现
      if (!this.db || typeof this.db.getVideoById !== 'function') {
        console.error(`[SERVICE DEBUG] 数据库方法未定义`);
        throw new Error('数据库服务不可用');
      }
      
      const video = await Promise.race([
        this.db.getVideoById(videoId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('数据库查询超时')), 3000))
      ]);
      console.log(`[SERVICE DEBUG] 数据库查询结果: ${video ? '找到视频' : '未找到视频'}`);
      
      if (!video) {
        console.log(`[SERVICE DEBUG] 视频不存在，videoId: ${videoId}`);
        return { success: false, error: '视频不存在' };
      }
      
      // 打印视频对象的基本信息
      console.log(`[SERVICE DEBUG] 视频标题: ${video.title || '无标题'}`);
      console.log(`[SERVICE DEBUG] 视频分类: ${video.category || '无分类'}`);
      
      // 获取用户观看进度（如果已登录）
      let watchProgress = null;
      if (userId && this.db.getWatchProgress) {
        console.log(`[SERVICE DEBUG] 获取用户观看进度`);
        try {
          watchProgress = await Promise.race([
            this.db.getWatchProgress(userId, videoId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('获取观看进度超时')), 2000))
          ]);
          console.log(`[SERVICE DEBUG] 观看进度获取成功`);
        } catch (err) {
          console.error(`[SERVICE DEBUG] 获取观看进度失败:`, err);
          watchProgress = null;
        }
      }
      
      // 获取相关推荐视频
      let relatedVideos = [];
      if (video.category) {
        console.log(`[SERVICE DEBUG] 获取相关推荐视频，分类: ${video.category}`);
        try {
          relatedVideos = await Promise.race([
            this.getRelatedVideos(videoId, video.category),
            new Promise((_, reject) => setTimeout(() => reject(new Error('获取相关视频超时')), 2000))
          ]);
          console.log(`[SERVICE DEBUG] 相关视频数量: ${relatedVideos ? relatedVideos.length : 0}`);
        } catch (err) {
          console.error(`[SERVICE DEBUG] 获取相关视频失败:`, err);
          relatedVideos = [];
        }
      }
      
      // 完全异步增加观看次数（不阻塞主流程）
      if (this.db.incrementVideoViewCount) {
        // 不使用await，完全异步执行
        Promise.race([
          this.db.incrementVideoViewCount(videoId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('增加观看次数超时')), 1000))
        ]).catch(err => {
          console.error(`[SERVICE DEBUG] 增加观看次数失败:`, err);
        });
      }
      
      // 格式化返回数据 - 避免JSON.parse可能的错误
      console.log(`[SERVICE DEBUG] 准备返回视频详情数据`);
      let qualities = [];
      if (video.availableQualities) {
        try {
          qualities = JSON.parse(video.availableQualities);
        } catch (e) {
          console.error(`[SERVICE DEBUG] 解析视频清晰度失败:`, e);
          qualities = [];
        }
      }
      
      return {
        success: true,
        data: {
          video: {
            id: video.id,
            title: video.title || '',
            description: video.description || '',
            category: video.category || '',
            duration: video.duration || 0,
            fileSize: video.file_size || 0,
            viewCount: video.view_count || 0,
            likeCount: video.like_count || 0,
            isPremium: video.is_premium === 1,
            price: video.price || 0,
            status: video.status || 'unknown',
            qualities: qualities,
            createdAt: video.created_at,
            updatedAt: video.updated_at,
            transcodedAt: video.transcoded_at
          },
          watchProgress,
          relatedVideos: (relatedVideos || []).map(v => ({
            id: v.id,
            title: v.title || '',
            category: v.category || '',
            isPremium: v.is_premium === 1,
            thumbnail: v.thumbnail
          })),
          needSignedUrl: video.is_premium === 1
        }
      };
    } catch (error) {
      console.error(`[SERVICE DEBUG] 获取视频详情服务错误:`, error);
      return { 
        success: false, 
        error: error.message || '获取视频详情失败',
        message: error.message || '获取视频详情失败'
      };
    }
  }

  /**
   * 记录观看进度
   */
  async recordWatchProgress(userId, videoId, progress) {
    try {
      // 验证视频是否存在
      const video = await this.db.getVideoById(videoId);
      if (!video) {
        throw new Error('视频不存在');
      }
      
      // 验证用户权限（如果是付费视频）
      if (video.is_premium === 1) {
        const userMembership = await membershipService.getUserMembership(userId);
        if (!userMembership || userMembership.expires_at < new Date()) {
          throw new Error('无权限观看此视频');
        }
      }
      
      // 计算观看百分比
      const percentage = progress.duration > 0 
        ? Math.min((progress.currentTime / progress.duration) * 100, 100) 
        : (progress.percentage || 0);
      
      await this.db.upsertWatchProgress({
        userId: userId,
        videoId: videoId,
        progress: progress.currentTime,
        duration: progress.duration,
        percentage: percentage,
        lastWatched: new Date()
      });
      
      // 更新视频观看次数
      if (percentage > 80) { // 观看超过80%算作一次完整观看
        await this.db.incrementVideoViewCount(videoId);
      }
      
      return { 
        success: true, 
        message: '进度保存成功',
        data: { percentage }
      };
    } catch (error) {
      console.error('记录观看进度失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 用户点赞视频
   */
  async likeVideo(userId, videoId) {
    try {
      const existingLike = await this.db.getUserLike(userId, videoId);
      
      if (existingLike) {
        // 取消点赞
        await this.db.deleteLike(userId, videoId);
        await this.db.decrementVideoLikeCount(videoId);
        
        // 获取更新后的点赞数
        const updatedVideo = await this.db.getVideoById(videoId);
        
        return { 
          success: true,
          liked: false,
          likeCount: updatedVideo.like_count || 0,
          message: '取消点赞成功'
        };
      } else {
        // 点赞
        await this.db.createLike({
          userId: userId,
          videoId: videoId,
          createdAt: new Date()
        });
        await this.db.incrementVideoLikeCount(videoId);
        
        // 获取更新后的点赞数
        const updatedVideo = await this.db.getVideoById(videoId);
        
        return { 
          success: true,
          liked: true,
          likeCount: updatedVideo.like_count || 0,
          message: '点赞成功'
        };
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 搜索视频课程
   */
  async searchVideos(query, filters = {}) {
    try {
      if (!query || query.trim().length === 0) {
        return { 
          success: false, 
          error: '搜索关键词不能为空' 
        };
      }
      
      const results = await this.db.searchVideos(query, filters);
      
      return {
        success: true,
        data: {
          query: query,
          total: results.total,
          videos: results.videos.map(video => ({
            id: video.id,
            title: video.title,
            description: video.description,
            category: video.category,
            duration: video.duration,
            isPremium: video.is_premium === 1,
            viewCount: video.view_count || 0,
            likeCount: video.like_count || 0,
            relevance: video.relevance
          }))
        }
      };
    } catch (error) {
      console.error('搜索视频失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户学习统计
   */
  async getUserLearningStats(userId) {
    try {
      const stats = await this.db.getUserLearningStats(userId);
      
      // 格式化学习时长（转换为小时和分钟）
      const hours = Math.floor(stats.totalTime / 3600);
      const minutes = Math.floor((stats.totalTime % 3600) / 60);
      
      return {
        success: true,
        data: {
          totalWatched: stats.totalWatched,
          totalTime: stats.totalTime,
          formattedTime: `${hours}小时${minutes}分钟`,
          completedCourses: stats.completedCourses,
          favoriteCategory: stats.favoriteCategory,
          learningStreak: stats.learningStreak,
          completionRate: stats.totalWatched > 0 
            ? Math.round((stats.completedCourses / stats.totalWatched) * 100) 
            : 0
        }
      };
    } catch (error) {
      console.error('获取学习统计失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 管理员功能：批量操作视频
   */
  async batchUpdateVideos(videoIds, updates) {
    try {
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return { 
          success: false, 
          error: '请提供有效的视频ID数组' 
        };
      }
      
      const results = [];
      let successfulCount = 0;
      
      for (const videoId of videoIds) {
        try {
          const result = await this.db.updateVideo(videoId, updates);
          const success = !!result;
          if (success) successfulCount++;
          
          results.push({
            videoId: videoId,
            success: success,
            error: success ? null : '更新失败'
          });
        } catch (err) {
          console.error(`更新视频 ${videoId} 失败:`, err);
          results.push({
            videoId: videoId,
            success: false,
            error: err.message
          });
        }
      }
      
      return {
        success: true,
        message: `成功更新 ${successfulCount}/${videoIds.length} 个视频`,
        data: {
          total: videoIds.length,
          successful: successfulCount,
          failed: videoIds.length - successfulCount,
          results: results
        }
      };
    } catch (error) {
      console.error('批量更新视频失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成视频分享链接
   */
  async generateShareLink(videoId, userId, options = {}) {
    try {
      const video = await this.db.getVideoById(videoId);
      if (!video || video.status !== 'ready') {
        throw new Error('视频不存在或尚未准备就绪');
      }
      
      const shareToken = this.generateShareToken(userId, videoId, options);
      const baseUrl = config.server.baseUrl || 'https://mingli.com';
      const shareUrl = `${baseUrl}/share/video/${videoId}?token=${shareToken}`;
      
      const expiresIn = options.expiresIn || 7 * 24 * 60 * 60 * 1000; // 7天有效
      
      return {
        success: true,
        data: {
          url: shareUrl,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          shareToken: shareToken,
          expiresIn: expiresIn,
          expiresAt: new Date(Date.now() + expiresIn)
        }
      };
    } catch (error) {
      console.error('生成分享链接失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成分享令牌
   */
  generateShareToken(userId, videoId, options = {}) {
    const payload = {
      userId: userId,
      videoId: videoId,
      expire: Date.now() + (options.expiresIn || 7 * 24 * 60 * 60 * 1000), // 7天有效
      random: uuidv4().substring(0, 8) // 增加随机性以提高安全性
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

module.exports = VideoService;