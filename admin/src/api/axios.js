import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:3000/api', // 直接使用后端API地址
  timeout: 10000, // 请求超时时间
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
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 根据后端返回的数据格式判断请求是否成功
    // 支持多种成功格式：{success: true} 或 {code: 200}
    if (res.success === false || (res.code && res.code !== 200)) {
      // 可以在这里处理错误逻辑
      console.error('请求失败:', res.message || res.error)
      // 如果未授权，可以跳转到登录页
      if (res.code === 401 || res.status === 401) {
        localStorage.removeItem('admin_token')
        sessionStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user_info')
        sessionStorage.removeItem('admin_user_info')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message || res.error || '请求失败'))
    }
    return res
  },
  error => {
    console.error('响应错误:', error)
    // 处理网络错误或服务器错误
    if (error.response) {
      // 如果是401错误，清除token并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('admin_token')
        sessionStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user_info')
        sessionStorage.removeItem('admin_user_info')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default service