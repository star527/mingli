// 引入axios实例和mock数据
import request from './axios'
import { mockApi } from './mock'

// 是否使用mock数据（开发环境使用，生产环境使用真实API）
// 现在使用真实API
const USE_MOCK = false

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

// 会员等级相关API
export const membershipLevelApi = {
  // 获取会员等级列表
  list: (params) => USE_MOCK ? mockApi.getMembershipLevels(params) : request.get('/admin/membership-levels', { params }),
  // 创建会员等级
  create: (data) => USE_MOCK ? Promise.resolve({ code: 200, data: { ...data, id: Date.now() } }) : request.post('/admin/membership-levels', data),
  // 更新会员等级
  update: (data) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.put(`/admin/membership-levels/${data.id}`, data),
  // 删除会员等级
  delete: (id) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.delete(`/admin/membership-levels/${id}`)
}

// 视频分类相关API
export const videoCategoryApi = {
  // 获取视频分类列表
  list: (params) => USE_MOCK ? mockApi.getVideoCategories(params) : request.get('/admin/video-categories', { params }),
  // 创建视频分类
  create: (data) => USE_MOCK ? Promise.resolve({ code: 200, data: { ...data, id: Date.now() } }) : request.post('/admin/video-categories', data),
  // 更新视频分类
  update: (data) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.put(`/admin/video-categories/${data.id}`, data),
  // 删除视频分类
  delete: (id) => USE_MOCK ? Promise.resolve({ code: 200 }) : request.delete(`/admin/video-categories/${id}`)
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
  uploadCover: (formData) => USE_MOCK ? Promise.resolve({ code: 200, data: { url: 'mock-cover-url.jpg' } }) : request.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 30000 // 增加超时时间到30秒
  }),
  // 上传视频文件
  uploadVideo: (formData) => USE_MOCK ? Promise.resolve({ code: 200, data: { url: 'mock-video-url.mp4' } }) : request.post('/upload/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 30000 // 增加超时时间到30秒
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

// 认证相关API
export const authApi = {
  // 管理员登录
  login: (data) => USE_MOCK ? Promise.resolve({ code: 200, data: { token: 'mock-token', user: { id: 1, username: 'admin' } } }) : request.post('/admin/login', data),
  // 管理员退出登录
  logout: () => USE_MOCK ? Promise.resolve({ code: 200 }) : request.post('/admin/logout'),
  // 获取当前用户信息
  getCurrentUser: () => USE_MOCK ? Promise.resolve({ code: 200, data: { id: 1, username: 'admin' } }) : request.get('/admin/current-user')
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

// 认证相关API（导出了各个独立方法作为别名）
export const authenticationApi = authApi

// 导出新增的API
export const membershipLevelList = membershipLevelApi.list
export const createMembershipLevel = membershipLevelApi.create
export const updateMembershipLevel = membershipLevelApi.update
export const deleteMembershipLevel = membershipLevelApi.delete
export const videoCategoryList = videoCategoryApi.list
export const createVideoCategory = videoCategoryApi.create
export const updateVideoCategory = videoCategoryApi.update
export const deleteVideoCategory = videoCategoryApi.delete