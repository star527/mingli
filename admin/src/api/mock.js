// Mock数据服务，用于模拟后端API响应

// 生成随机ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 生成模拟用户数据
const generateUsers = (count = 50) => {
  const users = []
  const statuses = [0, 1]
  const userTypes = [0, 1, 2]
  
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      username: `user${i}`,
      email: `user${i}@example.com`,
      phone: `138${Math.random().toString().slice(2, 10)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      userType: userTypes[Math.floor(Math.random() * userTypes.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return users
}

// 生成模拟会员数据
const generateMemberships = (count = 30) => {
  const memberships = []
  const levels = [1, 2, 3, 4, 5]
  const autoRenews = [true, false]
  
  for (let i = 1; i <= count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)]
    const startDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 30 * level)
    
    memberships.push({
      id: i,
      userId: i,
      username: `user${i}`,
      level,
      levelName: `会员等级${level}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: autoRenews[Math.floor(Math.random() * autoRenews.length)],
      status: endDate > new Date() ? 1 : 0,
      createdAt: startDate.toISOString()
    })
  }
  
  return memberships
}

// 生成模拟视频数据
const generateVideos = (count = 20) => {
  const videos = []
  const categories = [
    { id: 1, name: '基础课程' },
    { id: 2, name: '进阶课程' },
    { id: 3, name: '实战案例' },
    { id: 4, name: '行业解析' }
  ]
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    videos.push({
      id: i,
      title: `视频标题${i} - ${category.name}`,
      categoryId: category.id,
      categoryName: category.name,
      coverUrl: `https://picsum.photos/seed/video${i}/400/225`,
      videoUrl: `/videos/video${i}.mp4`,
      duration: Math.floor(Math.random() * 3600) + 600, // 10分钟到1小时
      playCount: Math.floor(Math.random() * 10000),
      likeCount: Math.floor(Math.random() * 1000),
      status: Math.random() > 0.1 ? 1 : 0, // 90%上架
      description: `这是视频${i}的详细描述，包含了视频的主要内容和学习要点。`,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return videos
}

// 生成模拟财务数据
const generateFinanceRecords = (count = 100) => {
  const records = []
  const types = [1, 2, 3, 4]
  const statuses = [0, 1, 2]
  const paymentMethods = ['支付宝', '微信支付', '银行卡']
  
  for (let i = 1; i <= count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const amount = type === 4 
      ? Math.floor(Math.random() * 5000) + 1000 // 提现金额1000-6000
      : Math.floor(Math.random() * 900) + 100 // 消费金额100-1000
    
    records.push({
      id: generateId(),
      userId: Math.floor(Math.random() * 50) + 1,
      username: `user${Math.floor(Math.random() * 50) + 1}`,
      orderNo: `ORD${Date.now()}${i}`,
      type,
      amount,
      status: type === 4 && Math.random() > 0.8 ? 2 : 1, // 80%提现已处理
      paymentMethod: type !== 4 ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null,
      remark: type === 4 ? `提现申请${i}` : `订单描述${i}`,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: statuses[Math.floor(Math.random() * statuses.length)] === 1 
        ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        : null
    })
  }
  
  return records
}

// 生成模拟统计数据
const generateStats = () => {
  return {
    newUsers: 128,
    newUsersRate: 15.6,
    activeUsers: 356,
    activeUsersRate: 8.2,
    payingUsers: 45,
    payingUsersRate: 23.4,
    arpu: 128.5,
    arpuRate: 5.1,
    todayIncome: 5680,
    todayIncomeRate: 12.3,
    monthIncome: 156000,
    monthIncomeRate: 18.5,
    yearIncome: 1280000,
    totalOrders: 3580,
    pendingWithdrawals: 5600,
    pendingWithdrawalsCount: 12
  }
}

// 生成模拟图表数据
const generateChartData = (type) => {
  const labels = []
  const values = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
    
    switch (type) {
      case 'userGrowth':
        values.push(Math.floor(Math.random() * 50) + 20)
        break
      case 'income':
        values.push(Math.floor(Math.random() * 5000) + 1000)
        break
      case 'videoPlay':
        values.push(Math.floor(Math.random() * 200) + 50)
        break
      default:
        values.push(Math.floor(Math.random() * 100))
    }
  }
  
  return { labels, values }
}

// 生成模拟地域数据
const generateRegionData = () => {
  const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安']
  const data = regions.map(region => ({
    name: region,
    value: Math.floor(Math.random() * 1000) + 200
  }))
  
  return {
    labels: data.map(item => item.name),
    values: data.map(item => item.value)
  }
}

// 生成模拟热门视频
const generateHotVideos = () => {
  const videos = []
  for (let i = 1; i <= 10; i++) {
    videos.push({
      id: i,
      title: `热门视频标题${i}`,
      playCount: 10000 - i * 500 + Math.floor(Math.random() * 1000),
      likeCount: 1000 - i * 50 + Math.floor(Math.random() * 100),
      completionRate: Math.random() * 0.5 + 0.5 // 50%-100%
    })
  }
  return videos.sort((a, b) => b.playCount - a.playCount)
}

// 生成模拟留存数据
const generateRetentionRates = () => {
  return [
    { period: '次日', rate: 0.45, count: 215, total: 478 },
    { period: '3日', rate: 0.32, count: 153, total: 478 },
    { period: '7日', rate: 0.21, count: 100, total: 478 },
    { period: '15日', rate: 0.15, count: 72, total: 478 },
    { period: '30日', rate: 0.08, count: 38, total: 478 }
  ]
}

// 模拟数据存储
const mockData = {
  users: generateUsers(),
  memberships: generateMemberships(),
  videos: generateVideos(),
  financeRecords: generateFinanceRecords(),
  stats: generateStats()
}

// 延迟函数，模拟网络延迟
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API 服务
export const mockApi = {
  // 登录
  login: async (username, password) => {
    await delay()
    if (username === 'admin' && password === 'admin123') {
      return {
        code: 200,
        data: {
          token: 'mock-token-' + Date.now(),
          userInfo: {
            id: 1,
            username: 'admin',
            role: 'admin'
          }
        }
      }
    }
    throw new Error('用户名或密码错误')
  },
  
  // 获取用户列表
  getUserList: async (params) => {
    await delay()
    let filtered = [...mockData.users]
    
    // 搜索过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.includes(keyword)
      )
    }
    if (params.status !== undefined && params.status !== '') {
      filtered = filtered.filter(user => user.status === params.status)
    }
    
    // 分页
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginated = filtered.slice(start, end)
    
    return {
      code: 200,
      data: {
        list: paginated,
        total: filtered.length,
        page,
        pageSize
      }
    }
  },
  
  // 获取会员列表
  getMembershipList: async (params) => {
    await delay()
    let filtered = [...mockData.memberships]
    
    // 搜索过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filtered = filtered.filter(m => m.username.toLowerCase().includes(keyword))
    }
    if (params.level !== undefined && params.level !== '') {
      filtered = filtered.filter(m => m.level === params.level)
    }
    if (params.status !== undefined && params.status !== '') {
      filtered = filtered.filter(m => m.status === parseInt(params.status))
    }
    
    // 分页
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginated = filtered.slice(start, end)
    
    return {
      code: 200,
      data: {
        list: paginated,
        total: filtered.length,
        page,
        pageSize
      }
    }
  },
  
  // 获取视频列表
  getVideoList: async (params) => {
    await delay()
    let filtered = [...mockData.videos]
    
    // 搜索过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filtered = filtered.filter(v => v.title.toLowerCase().includes(keyword))
    }
    if (params.category) {
      filtered = filtered.filter(v => v.categoryName === params.category)
    }
    if (params.status !== undefined && params.status !== '') {
      filtered = filtered.filter(v => v.status === params.status)
    }
    
    // 分页
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginated = filtered.slice(start, end)
    
    return {
      code: 200,
      data: {
        list: paginated,
        total: filtered.length,
        page,
        pageSize
      }
    }
  },
  
  // 获取订单列表
  getOrderList: async (params) => {
    await delay()
    let filtered = [...mockData.financeRecords]
    
    // 搜索过滤
    if (params.type) {
      filtered = filtered.filter(f => f.type === params.type)
    }
    if (params.status) {
      filtered = filtered.filter(f => f.status === params.status)
    }
    
    // 分页
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginated = filtered.slice(start, end)
    
    return {
      code: 200,
      data: {
        list: paginated,
        total: filtered.length,
        page,
        pageSize
      }
    }
  },
  
  // 导出数据
  users: mockData.users,
  memberships: mockData.memberships,
  videos: mockData.videos,
  financeRecords: mockData.financeRecords,
  stats: mockData.stats
}