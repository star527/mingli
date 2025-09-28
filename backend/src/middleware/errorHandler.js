/**
 * 错误处理中间件
 * 统一处理应用程序中的错误
 */

class ErrorHandlerMiddleware {
  /**
   * 错误处理中间件
   */
  handleError(err, req, res, next) {
    console.error('Error occurred:', err);

    // 默认错误响应
    let statusCode = 500;
    let message = '服务器内部错误';
    let details = null;

    // 处理不同类型的错误
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = '数据验证失败';
      details = err.details;
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      message = '未授权访问';
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      message = '访问被拒绝';
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
      message = '资源不存在';
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = '文件大小超过限制';
    } else if (err.code === 'ECONNREFUSED') {
      statusCode = 503;
      message = '服务暂时不可用';
    }

    // 开发环境下的详细错误信息
    const errorResponse = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        error: err.message,
        stack: err.stack,
        details
      })
    };

    // 生产环境下隐藏敏感信息
    if (process.env.NODE_ENV !== 'development') {
      delete errorResponse.error;
      delete errorResponse.stack;
      delete errorResponse.details;
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * 404 错误处理
   */
  handleNotFound(req, res, next) {
    const error = new Error(`路由不存在: ${req.method} ${req.originalUrl}`);
    error.name = 'NotFoundError';
    error.status = 404;
    next(error);
  }

  /**
   * 异步错误包装器
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 创建自定义错误
   */
  createError(name, message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.name = name;
    error.status = statusCode;
    error.details = details;
    return error;
  }

  /**
   * 验证错误
   */
  validationError(message, details = null) {
    return this.createError('ValidationError', message, 400, details);
  }

  /**
   * 未授权错误
   */
  unauthorizedError(message = '未授权访问') {
    return this.createError('UnauthorizedError', message, 401);
  }

  /**
   * 禁止访问错误
   */
  forbiddenError(message = '访问被拒绝') {
    return this.createError('ForbiddenError', message, 403);
  }

  /**
   * 资源不存在错误
   */
  notFoundError(message = '资源不存在') {
    return this.createError('NotFoundError', message, 404);
  }

  /**
   * 业务逻辑错误
   */
  businessError(message, statusCode = 400, details = null) {
    return this.createError('BusinessError', message, statusCode, details);
  }
}

module.exports = new ErrorHandlerMiddleware();