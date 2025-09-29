// 日期处理工具函数

// 格式化日期为YYYY-MM-DD
export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期时间为YYYY-MM-DD HH:mm:ss
export const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取相对时间描述（如：3小时前、2天前）
export const getRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const past = new Date(date)
  const diff = now - past
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

// 获取今天的开始时间
export const getTodayStart = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// 获取今天的结束时间
export const getTodayEnd = () => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return today
}

// 获取本周的开始时间（周一）
export const getWeekStart = () => {
  const now = new Date()
  const day = now.getDay() || 7 // 将周日的0转换为7
  const diff = now.getDate() - day + 1 // 获取周一
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// 获取本周的结束时间（周日）
export const getWeekEnd = () => {
  const monday = getWeekStart()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}