const multer = require('multer');
const path = require('path');
const config = require('../config/appConfig');

// 确保临时上传目录存在
const fs = require('fs');
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// 视频文件过滤器
const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/3gp',
    'video/mkv'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的视频格式。请上传MP4、AVI、MOV、WMV、FLV、3GP或MKV格式的视频。'), false);
  }
};

// 视频文件限制
const videoLimits = {
  fileSize: config.upload.maxVideoSize || 200 * 1024 * 1024, // 默认200MB
  files: 1
};

// 创建上传中间件实例
const upload = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: videoLimits
});

// 导出单文件上传中间件
exports.single = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          let message = '上传错误';
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = `文件大小超过限制。最大允许 ${videoLimits.fileSize / (1024 * 1024)}MB。`;
              break;
            case 'LIMIT_FILE_COUNT':
              message = '超过文件数量限制';
              break;
            default:
              message = err.message;
          }
          return res.status(400).json({ 
            success: false, 
            error: '文件上传失败', 
            message: message 
          });
        }
        return res.status(400).json({ 
          success: false, 
          error: '文件上传失败', 
          message: err.message 
        });
      }
      next();
    });
  };
};

// 导出多文件上传中间件（如果需要）
exports.array = (fieldName, maxCount = 1) => {
  return upload.array(fieldName, maxCount);
};

// 导出any上传中间件
exports.any = () => {
  return upload.any();
};

// 导出清理临时文件的辅助函数
exports.cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`临时文件已清理: ${filePath}`);
    } catch (error) {
      console.error(`清理临时文件失败: ${error.message}`);
    }
  }
};