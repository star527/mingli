/**
 * 云存储服务
 * 对接阿里云OSS实现视频上传、存储和转码功能
 */

const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const config = require('../config/appConfig');

class StorageService {
  constructor() {
    // 初始化阿里云OSS客户端
    this.client = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
    });
    
    // 本地临时目录
    this.tempDir = path.resolve(__dirname, '../../public/uploads/temp');
    
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // 支持的视频格式
    this.supportedFormats = ['mp4', 'mov', 'avi', 'mkv'];
    
    // 转码配置
    this.transcodeConfig = {
      qualities: [
        { name: '720p', width: 1280, height: 720, bitrate: '3M' },
        { name: '480p', width: 854, height: 480, bitrate: '1.5M' },
        { name: '360p', width: 640, height: 360, bitrate: '800k' }
      ]
    };
  }

  /**
   * 上传视频到OSS
   */
  async uploadVideo(videoData) {
    try {
      const { videoId, buffer, filename, category } = videoData;
      
      // 生成存储路径
      const timestamp = new Date().toISOString().split('T')[0];
      const ext = path.extname(filename);
      const ossPath = `videos/${category}/${timestamp}/${videoId}${ext}`;
      
      // 上传文件
      const result = await this.client.put(ossPath, Buffer.from(buffer));
      
      // 生成播放URL
      const playUrl = this.client.generateObjectUrl(ossPath, { expires: 3600 * 24 * 365 });
      
      return {
        success: true,
        path: ossPath,
        playUrl: playUrl,
        ossResult: result
      };
    } catch (error) {
      console.error('OSS上传失败:', error);
      throw new Error('视频上传失败: ' + error.message);
    }
  }

  /**
   * 转码视频为多种清晰度和HLS格式
   */
  async transcodeVideo(videoId, ossPath) {
    try {
      // 先下载源视频到本地临时目录
      const localPath = path.join(this.tempDir, `${videoId}_source.mp4`);
      await this.client.get(ossPath, localPath);
      
      // 创建输出目录
      const outputDir = path.join(this.tempDir, videoId);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 转码为多种清晰度
      const transcodedFiles = await this._transcodeToMultipleQualities(localPath, outputDir, videoId);
      
      // 生成HLS流媒体文件
      const hlsOutput = await this._generateHLS(localPath, outputDir, videoId);
      
      // 上传转码后的文件到OSS
      const ossUrls = await this._uploadTranscodedFiles(outputDir, videoId);
      
      // 清理临时文件
      this._cleanupTempFiles([localPath, outputDir]);
      
      return {
        success: true,
        urls: ossUrls,
        qualities: Object.keys(ossUrls),
        hlsUrl: ossUrls.hls,
        transcodedFiles: transcodedFiles,
        hlsFiles: hlsOutput.files
      };
    } catch (error) {
      console.error('视频转码失败:', error);
      throw new Error('视频转码失败: ' + error.message);
    }
  }

  /**
   * 转码为多种清晰度
   */
  async _transcodeToMultipleQualities(localPath, outputDir, videoId) {
    const transcodedFiles = [];
    
    for (const quality of this.transcodeConfig.qualities) {
      const outputPath = path.join(outputDir, `${videoId}_${quality.name}.mp4`);
      
      // 使用ffmpeg转码
      const cmd = `ffmpeg -i ${localPath} -vf scale=${quality.width}:${quality.height} -b:v ${quality.bitrate} -c:a aac -b:a 128k -y ${outputPath}`;
      
      try {
        await execPromise(cmd);
        transcodedFiles.push(outputPath);
        console.log(`转码${quality.name}完成: ${outputPath}`);
      } catch (error) {
        console.error(`转码${quality.name}失败:`, error);
        throw error;
      }
    }
    
    return transcodedFiles;
  }

  /**
   * 生成HLS流媒体格式
   */
  async _generateHLS(localPath, outputDir, videoId) {
    const hlsOutputDir = path.join(outputDir, 'hls');
    if (!fs.existsSync(hlsOutputDir)) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }
    
    const manifestPath = path.join(hlsOutputDir, `${videoId}.m3u8`);
    
    // 生成HLS分段
    const cmd = `ffmpeg -i ${localPath} -hls_time 10 -hls_list_size 0 -hls_segment_filename ${hlsOutputDir}/${videoId}_%03d.ts -c:v h264 -c:a aac -y ${manifestPath}`;
    
    try {
      await execPromise(cmd);
      
      // 读取生成的文件列表
      const files = fs.readdirSync(hlsOutputDir);
      
      return {
        success: true,
        manifestPath: manifestPath,
        files: files
      };
    } catch (error) {
      console.error('生成HLS失败:', error);
      throw error;
    }
  }

  /**
   * 上传转码后的文件到OSS
   */
  async _uploadTranscodedFiles(outputDir, videoId) {
    const ossUrls = {};
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 上传不同清晰度的文件
    for (const quality of this.transcodeConfig.qualities) {
      const localPath = path.join(outputDir, `${videoId}_${quality.name}.mp4`);
      const ossPath = `videos/transcoded/${timestamp}/${videoId}_${quality.name}.mp4`;
      
      try {
        await this.client.put(ossPath, localPath);
        ossUrls[quality.name] = this.client.generateObjectUrl(ossPath);
      } catch (error) {
        console.error(`上传${quality.name}文件失败:`, error);
        throw error;
      }
    }
    
    // 上传HLS文件
    const hlsDir = path.join(outputDir, 'hls');
    const hlsFiles = fs.readdirSync(hlsDir);
    
    for (const file of hlsFiles) {
      const localPath = path.join(hlsDir, file);
      const ossPath = `videos/hls/${timestamp}/${file}`;
      
      try {
        await this.client.put(ossPath, localPath);
        
        // 如果是m3u8文件，记录为主HLS URL
        if (file.endsWith('.m3u8')) {
          ossUrls.hls = this.client.generateObjectUrl(ossPath);
        }
      } catch (error) {
        console.error(`上传HLS文件${file}失败:`, error);
        throw error;
      }
    }
    
    return ossUrls;
  }

  /**
   * 获取视频时长（秒）
   * @param {string} videoPath - 视频文件路径
   * @returns {Promise<number>} - 视频时长（秒）
   */
  async getVideoDuration(videoPath) {
    try {
      // 使用ffprobe获取视频元数据
      const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
      const { stdout } = await execPromise(cmd);
      
      // 解析时长（秒）并转换为整数
      const duration = parseFloat(stdout.trim());
      
      if (isNaN(duration) || duration <= 0) {
        throw new Error('无法获取视频时长');
      }
      
      return Math.round(duration);
    } catch (error) {
      console.error('获取视频时长失败:', error);
      throw new Error('获取视频时长失败: ' + error.message);
    }
  }

  /**
   * 从OSS获取视频并计算时长
   * @param {string} ossPath - OSS上的视频路径
   * @returns {Promise<number>} - 视频时长（秒）
   */
  async getVideoDurationFromOSS(ossPath) {
    try {
      // 下载视频到临时文件
      const tempFilePath = path.join(this.tempDir, `temp_${Date.now()}.mp4`);
      await this.client.get(ossPath, tempFilePath);
      
      // 获取时长
      const duration = await this.getVideoDuration(tempFilePath);
      
      // 清理临时文件
      this._cleanupTempFiles([tempFilePath]);
      
      return duration;
    } catch (error) {
      console.error('从OSS获取视频时长失败:', error);
      throw error;
    }
  }

  /**
   * 清理临时文件
   */
  _cleanupTempFiles(paths) {
    paths.forEach(path => {
      try {
        if (fs.existsSync(path)) {
          if (fs.lstatSync(path).isDirectory()) {
            fs.rmSync(path, { recursive: true, force: true });
          } else {
            fs.unlinkSync(path);
          }
        }
      } catch (error) {
        console.error(`清理临时文件${path}失败:`, error);
        // 不抛出错误，继续执行
      }
    });
  }

  /**
   * 生成带防盗链签名的临时URL
   */
  generateSignedUrl(ossPath, expires = 3600) {
    try {
      return this.client.generateObjectUrl(ossPath, { expires });
    } catch (error) {
      console.error('生成签名URL失败:', error);
      throw error;
    }
  }

  /**
   * 删除视频文件 - 支持本地文件系统
   */
  async deleteVideo(filePath) {
    try {
      // 构建完整的本地文件路径（在public/uploads目录下）
      const uploadDir = path.resolve(__dirname, '../../public/uploads');
      const fullFilePath = path.join(uploadDir, filePath);
      
      console.log(`[STORAGE SERVICE] 尝试删除本地文件: ${fullFilePath}`);
      
      // 检查文件是否存在
      if (fs.existsSync(fullFilePath)) {
        // 删除文件
        fs.unlinkSync(fullFilePath);
        console.log(`[STORAGE SERVICE] 本地文件删除成功: ${fullFilePath}`);
        return { success: true };
      } else {
        console.warn(`[STORAGE SERVICE] 文件不存在，跳过删除: ${fullFilePath}`);
        return { success: true, message: '文件不存在，跳过删除' };
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      // 不抛出错误，允许数据库记录删除继续
      return { success: false, error: error.message };
    }
  }
}

module.exports = new StorageService();