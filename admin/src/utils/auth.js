// 认证相关工具函数

// 存储token
export const setToken = (token, remember = false) => {
  if (remember) {
    localStorage.setItem('admin_token', token)
  } else {
    sessionStorage.setItem('admin_token', token)
  }
}

// 获取token
export const getToken = () => {
  return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')
}

// 移除token
export const removeToken = () => {
  localStorage.removeItem('admin_token')
  sessionStorage.removeItem('admin_token')
}

// 判断是否已登录
export const isLogin = () => {
  return !!getToken()
}

// 判断是否已登录（与路由配置保持一致）
export const isLoggedIn = isLogin

// 存储用户信息
export const setUserInfo = (userInfo, remember = false) => {
  if (remember) {
    localStorage.setItem('admin_user_info', JSON.stringify(userInfo))
  } else {
    sessionStorage.setItem('admin_user_info', JSON.stringify(userInfo))
  }
}

// 获取用户信息
export const getUserInfo = () => {
  const userInfo = localStorage.getItem('admin_user_info') || sessionStorage.getItem('admin_user_info')
  return userInfo ? JSON.parse(userInfo) : null
}

// 移除用户信息
export const removeUserInfo = () => {
  localStorage.removeItem('admin_user_info')
  sessionStorage.removeItem('admin_user_info')
}

// 退出登录
export const logout = () => {
  removeToken()
  removeUserInfo()
  
  // 重定向到登录页
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// 清空所有认证信息
export const clearAuth = logout

// 检查用户权限
export const checkPermission = (requiredPermission) => {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.permissions) {
    return false
  }
  
  // 如果用户是超级管理员，拥有所有权限
  if (userInfo.role === 'superadmin') {
    return true
  }
  
  // 检查用户是否拥有所需权限
  return userInfo.permissions.includes(requiredPermission)
}