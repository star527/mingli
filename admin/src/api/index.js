// 引入axios实例和mock数据
import request from './axios'
import { mockApi } from './mock'

// 是否使用mock数据（开发环境使用，生产环境使用真实API）
const USE_MOCK = import.meta.env.MODE === 'development'

// 用户相关API
export const userApi = {
  // 获取用户列表
  getUserList: (params) => USE_MOCK ? mockApi.getUserList(params) : request.get('/admin/users', { params }),
  // 获取用户详情
  getUserDetail: (id) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get(`/admin/users/${id}`),
  // 更新用户状态
  updateUserStatus: (id, status) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.put(`/admin/users/${id}/status`, { status }),
  // 删除用户
  deleteUser: (id) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.delete(`/admin/users/${id}`)
}

// 会员相关API
export const membershipApi = {
  // 获取会员列表
  getMembershipList: (params) => USE_MOCK ? mockApi.getMembershipList(params) : request.get('/admin/memberships', { params }),
  // 获取会员详情
  getMembershipDetail: (id) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get(`/admin/memberships/${id}`),
  // 更新会员状态
  updateMembershipStatus: (id, data) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.put(`/admin/memberships/${id}`, data),
  // 获取会员等级配置
  getMembershipLevels: () => USE_MOCK ? Promise.resolve({ code: 200, data: [] }) : request.get('/admin/membership-levels')
}

// 视频相关API
export const videoApi = {
  // 获取视频列表
  getVideoList: (params) => USE_MOCK ? mockApi.getVideoList(params) : request.get('/admin/videos', { params }),
  // 获取视频详情
  getVideoDetail: (id) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get(`/admin/videos/${id}`),
  // 创建视频
  createVideo: (data) => USE_MOCK ? Promise.resolve({ code: 200, data: { ...data, id: Date.now() } }) : request.post('/admin/videos', data),
  // 更新视频
  updateVideo: (id, data) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.put(`/admin/videos/${id}`, data),
  // 删除视频
  deleteVideo: (id) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.delete(`/admin/videos/${id}`),
  // 上传视频封面
  uploadCover: (formData) => USE_MOCK ? Promise.resolve({ code: 200, data: { url: 'mock-cover-url.jpg' } }) : request.post('/admin/videos/upload-cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  // 上传视频文件
  uploadVideo: (formData) => USE_MOCK ? Promise.resolve({ code: 200, data: { url: 'mock-video-url.mp4' } }) : request.post('/admin/videos/upload-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 财务相关API
export const financeApi = {
  // 获取订单列表
  getOrderList: (params) => USE_MOCK ? mockApi.getOrderList(params) : request.get('/admin/orders', { params }),
  // 获取订单详情
  getOrderDetail: (id) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get(`/admin/orders/${id}`),
  // 获取财务统计
  getFinancialStats: (params) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get('/admin/finance/stats', { params })
}

// 数据分析相关API
export const analyticsApi = {
  // 获取用户统计
  getUserStats: (params) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get('/admin/analytics/user-stats', { params }),
  // 获取会员统计
  getMembershipStats: (params) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get('/admin/analytics/membership-stats', { params }),
  // 获取视频观看统计
  getVideoWatchStats: (params) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get('/admin/analytics/video-stats', { params }),
  // 获取收入统计
  getRevenueStats: (params) => USE_MOCK ? Promise.resolve({ code: 200, data: {} }) : request.get('/admin/analytics/revenue-stats', { params })
}

// 登录相关API
export const authApi = {
  // 登录
  login: (data) => USE_MOCK ? mockApi.login(data.username, data.password) : request.post('/admin/login', data),
  // 登出
  logout: () => USE_MOCK ? Promise.resolve({ code: 200 }) : request.post('/admin/logout'),
  // 获取当前用户信息
  getCurrentUser: () => USE_MOCK ? Promise.resolve({ code: 200, data: { id: 1, username: 'admin', role: 'admin' } }) : request.get('/admin/current-user')
}

// 导出API方法
export const getUserList = userApi.getUserList
export const getUserDetail = userApi.getUserDetail
export const updateUserStatus = userApi.updateUserStatus
export const deleteUser = userApi.deleteUser
export const getMembershipList = membershipApi.getMembershipList
export const getMembershipDetail = membershipApi.getMembershipDetail
export const updateMembershipStatus = membershipApi.updateMembershipStatus
export const getMembershipLevels = membershipApi.getMembershipLevels
export const getVideoList = videoApi.getVideoList
export const getVideoDetail = videoApi.getVideoDetail
export const createVideo = videoApi.createVideo
export const updateVideo = videoApi.updateVideo
export const deleteVideo = videoApi.deleteVideo
export const uploadCover = videoApi.uploadCover
export const uploadVideo = videoApi.uploadVideo
export const getOrderList = financeApi.getOrderList
export const getOrderDetail = financeApi.getOrderDetail
export const getFinancialStats = financeApi.getFinancialStats
export const getUserStats = analyticsApi.getUserStats
export const getMembershipStats = analyticsApi.getMembershipStats
export const getVideoWatchStats = analyticsApi.getVideoWatchStats
export const getRevenueStats = analyticsApi.getRevenueStats
export const login = authApi.login
export const logout = authApi.logout
export const getCurrentUser = authApi.getCurrentUser

// 认证相关API（别名）
export const authenticationApi = authApi