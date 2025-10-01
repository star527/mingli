import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 使用/api作为基础路径，与vite代理配置匹配
  timeout: 60000, // 请求超时时间 - 增加到1分钟以支持视频上传
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许携带凭证
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage或sessionStorage获取token
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 针对上传请求增加特殊处理
    if (config.url.includes('/upload/')) {
      // 上传文件请求使用更长的超时时间 - 2分钟
      config.timeout = 120000
      // 对于multipart/form-data请求，让axios自动处理Content-Type
      if (config.headers['Content-Type'] === 'multipart/form-data') {
        delete config.headers['Content-Type']
      }
    }
    
    // 记录请求URL
    console.log('请求URL:', config.baseURL + config.url)
    return config
  },
  error => {
    console.error('请求错误:', error)
    // 确保错误对象包含明确的错误信息
    const errorMessage = error.response?.data?.message || error.message || '网络请求失败'
    const enhancedError = new Error(errorMessage)
    enhancedError.originalError = error
    enhancedError.response = error.response
    return Promise.reject(enhancedError)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    console.log('API响应:', response.config.url, res)
    
    // 明确处理成功响应
    if (res.success === true || res.code === 200) {
      return res
    }
    
    // 处理失败响应
    console.error('请求失败:', response.config.url, res.message || res.error)
    
    // 如果未授权，可以跳转到登录页
    if (res.code === 401 || res.status === 401) {
      localStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user_info')
      sessionStorage.removeItem('admin_user_info')
      window.location.href = '/login'
    }
    
    // 创建包含明确错误信息的错误对象
    const errorMsg = res.message || res.error || '请求失败'
    const error = new Error(errorMsg)
    error.response = res
    error.statusCode = res.code || res.status
    return Promise.reject(error)
  },
  error => {
    console.error('响应错误:', error.config?.url || '未知URL', error.message)
    
    // 处理网络错误或服务器错误
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
      
      // 如果是401错误，清除token并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('admin_token')
        sessionStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user_info')
        sessionStorage.removeItem('admin_user_info')
        window.location.href = '/login'
      }
      
      // 从响应中提取错误信息
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `服务器错误 (${error.response.status})`
      
      const enhancedError = new Error(errorMessage)
      enhancedError.response = error.response.data
      enhancedError.statusCode = error.response.status
      enhancedError.originalError = error
      
      return Promise.reject(enhancedError)
    } else if (error.request) {
      // 请求已发出但没有收到响应
      const networkError = new Error('网络错误，服务器无响应')
      networkError.originalError = error
      return Promise.reject(networkError)
    } else {
      // 请求配置出错
      return Promise.reject(error)
    }
  }
)

export default service