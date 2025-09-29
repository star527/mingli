// 通用工具函数

// 格式化数字，添加千分位
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return Number(num).toLocaleString('zh-CN')
}

// 格式化金额，保留两位小数
export const formatMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '¥0.00'
  return `¥${Number(amount).toFixed(2)}`
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成唯一ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// 深拷贝对象
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) {
    const cloneArr = []
    for (let i = 0; i < obj.length; i++) {
      cloneArr[i] = deepClone(obj[i])
    }
    return cloneArr
  }
  if (obj instanceof Object) {
    const cloneObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneObj[key] = deepClone(obj[key])
      }
    }
    return cloneObj
  }
}

// 判断是否为空对象
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

// 防抖函数
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 数组去重
export const uniqueArray = (arr, key) => {
  if (!key) {
    return [...new Set(arr)]
  }
  const seen = new Set()
  return arr.filter(item => {
    const k = item[key]
    return seen.has(k) ? false : seen.add(k)
  })
}

// 获取URL参数
export const getUrlParam = (name) => {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
  const r = window.location.search.substr(1).match(reg)
  if (r != null) return decodeURIComponent(r[2])
  return null
}