<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">仪表盘</h1>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateRangeChange"
          class="date-picker"
        />
      </div>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon user-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">总用户数</p>
            <h3 class="stat-value">{{ totalUsers }}</h3>
            <p class="stat-change" :class="{ positive: userGrowth > 0, negative: userGrowth < 0 }">
              <el-icon v-if="userGrowth > 0"><TrendCharts /></el-icon>
              <el-icon v-else-if="userGrowth < 0"><CaretBottom /></el-icon>
              <el-icon v-else><Histogram /></el-icon>
              {{ Math.abs(userGrowth) }}% {{ userGrowth > 0 ? '增长' : userGrowth < 0 ? '下降' : '持平' }}
            </p>
          </div>
        </div>
      </el-card>
      
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon member-icon">
            <el-icon><StarFilled /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">会员数</p>
            <h3 class="stat-value">{{ totalMembers }}</h3>
            <p class="stat-change" :class="{ positive: memberGrowth > 0, negative: memberGrowth < 0 }">
              <el-icon v-if="memberGrowth > 0"><TrendCharts /></el-icon>
              <el-icon v-else-if="memberGrowth < 0"><CaretBottom /></el-icon>
              <el-icon v-else><Histogram /></el-icon>
              {{ Math.abs(memberGrowth) }}% {{ memberGrowth > 0 ? '增长' : memberGrowth < 0 ? '下降' : '持平' }}
            </p>
          </div>
        </div>
      </el-card>
      
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon revenue-icon">
            <el-icon><Wallet /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">今日收入</p>
            <h3 class="stat-value">¥{{ todayRevenue }}</h3>
            <p class="stat-change" :class="{ positive: revenueGrowth > 0, negative: revenueGrowth < 0 }">
              <el-icon v-if="revenueGrowth > 0"><TrendCharts /></el-icon>
              <el-icon v-else-if="revenueGrowth < 0"><CaretBottom /></el-icon>
              <el-icon v-else><Histogram /></el-icon>
              {{ Math.abs(revenueGrowth) }}% {{ revenueGrowth > 0 ? '增长' : revenueGrowth < 0 ? '下降' : '持平' }}
            </p>
          </div>
        </div>
      </el-card>
      
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon video-icon">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-label">视频播放量</p>
            <h3 class="stat-value">{{ videoPlays }}</h3>
            <p class="stat-change" :class="{ positive: videoGrowth > 0, negative: videoGrowth < 0 }">
              <el-icon v-if="videoGrowth > 0"><TrendCharts /></el-icon>
              <el-icon v-else-if="videoGrowth < 0"><CaretBottom /></el-icon>
              <el-icon v-else><Histogram /></el-icon>
              {{ Math.abs(videoGrowth) }}% {{ videoGrowth > 0 ? '增长' : videoGrowth < 0 ? '下降' : '持平' }}
            </p>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-section">
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>用户增长趋势</span>
          </div>
        </template>
        <canvas ref="userGrowthChartRef" class="chart-container"></canvas>
      </el-card>
      
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="card-header">
            <span>收入统计</span>
          </div>
        </template>
        <canvas ref="revenueChartRef" class="chart-container"></canvas>
      </el-card>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activities">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
            <el-button type="text" size="small" @click="refreshActivities">刷新</el-button>
          </div>
        </template>
        <el-table :data="recentActivities" style="width: 100%">
          <el-table-column prop="time" label="时间" width="180"></el-table-column>
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              <el-tag :type="getActivityTypeTag(scope.row.type)">{{ getActivityTypeText(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
          <el-table-column prop="user" label="用户" width="120"></el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { User, StarFilled, Wallet, VideoPlay, TrendCharts, CaretBottom, Histogram } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { analyticsApi } from '@/api'
import Chart from 'chart.js/auto'

// 模拟数据
const mockStats = {
  totalUsers: 1256,
  userGrowth: 12.5,
  totalMembers: 328,
  memberGrowth: 8.3,
  todayRevenue: 8965.50,
  revenueGrowth: 15.2,
  videoPlays: 5689,
  videoGrowth: 7.8
}

const mockUserGrowthData = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  data: [890, 950, 1020, 1080, 1150, 1256]
}

const mockRevenueData = {
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  data: [25000, 32000, 38000, 45000, 52000, 58000]
}

const mockRecentActivities = [
  { id: 1, time: '2024-01-15 10:23:45', type: 'login', description: '管理员登录系统', user: 'admin' },
  { id: 2, time: '2024-01-15 09:45:12', type: 'payment', description: '用户开通高级会员', user: 'user123' },
  { id: 3, time: '2024-01-15 08:30:22', type: 'video', description: '用户购买视频课程《八字入门》', user: 'user456' },
  { id: 4, time: '2024-01-14 18:20:33', type: 'user', description: '新用户注册', user: 'user789' },
  { id: 5, time: '2024-01-14 16:15:44', type: 'member', description: '会员续费', user: 'user234' }
]

export default {
  name: 'Dashboard',
  components: {
    User,
    StarFilled,
    Wallet,
    VideoPlay,
    TrendCharts,
    CaretBottom,
    Histogram
  },
  setup() {
    const dateRange = ref([new Date(new Date().setDate(new Date().getDate() - 30)), new Date()])
    const userGrowthChartRef = ref(null)
    const revenueChartRef = ref(null)
    let userGrowthChart = null
    let revenueChart = null
    
    // 统计数据
    const totalUsers = ref(mockStats.totalUsers)
    const userGrowth = ref(mockStats.userGrowth)
    const totalMembers = ref(mockStats.totalMembers)
    const memberGrowth = ref(mockStats.memberGrowth)
    const todayRevenue = ref(mockStats.todayRevenue)
    const revenueGrowth = ref(mockStats.revenueGrowth)
    const videoPlays = ref(mockStats.videoPlays)
    const videoGrowth = ref(mockStats.videoGrowth)
    
    // 最近活动
    const recentActivities = ref(mockRecentActivities)
    
    // 处理日期范围变化
    const handleDateRangeChange = (val) => {
      console.log('日期范围变化:', val)
      // 这里可以根据日期范围重新加载数据
      loadDashboardData()
    }
    
    // 获取活动类型标签
    const getActivityTypeTag = (type) => {
      const typeMap = {
        login: 'info',
        payment: 'success',
        video: 'primary',
        user: 'warning',
        member: 'danger'
      }
      return typeMap[type] || 'info'
    }
    
    // 获取活动类型文本
    const getActivityTypeText = (type) => {
      const typeMap = {
        login: '登录',
        payment: '支付',
        video: '视频',
        user: '用户',
        member: '会员'
      }
      return typeMap[type] || '未知'
    }
    
    // 刷新活动列表
    const refreshActivities = () => {
      // 模拟刷新
      setTimeout(() => {
        recentActivities.value = [...mockRecentActivities]
        ElMessage.success('刷新成功')
      }, 500)
    }
    
    // 绘制用户增长图表
    const renderUserGrowthChart = () => {
      if (!userGrowthChartRef.value) return
      
      // 销毁已存在的图表
      if (userGrowthChart) {
        userGrowthChart.destroy()
      }
      
      const ctx = userGrowthChartRef.value.getContext('2d')
      userGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: mockUserGrowthData.categories,
          datasets: [{
            label: '用户数量',
            data: mockUserGrowthData.data,
            borderColor: '#409eff',
            backgroundColor: 'rgba(64, 158, 255, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      })
    }
    
    // 绘制收入图表
    const renderRevenueChart = () => {
      if (!revenueChartRef.value) return
      
      // 销毁已存在的图表
      if (revenueChart) {
        revenueChart.destroy()
      }
      
      const ctx = revenueChartRef.value.getContext('2d')
      revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: mockRevenueData.categories,
          datasets: [{
            label: '收入金额',
            data: mockRevenueData.data,
            backgroundColor: '#67c23a',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return '收入: ¥' + context.raw.toLocaleString()
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return '¥' + value.toLocaleString()
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      })
    }
    
    // 加载仪表盘数据
    const loadDashboardData = () => {
      // 在实际项目中，这里应该调用API获取真实数据
      console.log('加载仪表盘数据，日期范围:', dateRange.value)
      
      // 模拟API调用延迟
      setTimeout(() => {
        // 使用模拟数据
        totalUsers.value = mockStats.totalUsers
        userGrowth.value = mockStats.userGrowth
        totalMembers.value = mockStats.totalMembers
        memberGrowth.value = mockStats.memberGrowth
        todayRevenue.value = mockStats.todayRevenue
        revenueGrowth.value = mockStats.revenueGrowth
        videoPlays.value = mockStats.videoPlays
        videoGrowth.value = mockStats.videoGrowth
        
        nextTick(() => {
          renderUserGrowthChart()
          renderRevenueChart()
        })
      }, 500)
    }
    
    onMounted(() => {
      loadDashboardData()
    })
    
    onUnmounted(() => {
      // 销毁图表实例，避免内存泄漏
      if (userGrowthChart) {
        userGrowthChart.destroy()
      }
      if (revenueChart) {
        revenueChart.destroy()
      }
    })
    
    return {
      dateRange,
      userGrowthChartRef,
      revenueChartRef,
      totalUsers,
      userGrowth,
      totalMembers,
      memberGrowth,
      todayRevenue,
      revenueGrowth,
      videoPlays,
      videoGrowth,
      recentActivities,
      handleDateRangeChange,
      getActivityTypeTag,
      getActivityTypeText,
      refreshActivities
    }
  }
}
</script>

<style scoped>
.dashboard {
  height: 100%;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.date-picker {
  width: 300px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.user-icon {
  background-color: #409eff;
}

.member-icon {
  background-color: #e6a23c;
}

.revenue-icon {
  background-color: #67c23a;
}

.video-icon {
  background-color: #f56c6c;
}

.stat-info {
  flex: 1;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  margin: 0 0 8px;
}

.stat-value {
  color: #303133;
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
}

.stat-change {
  font-size: 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  height: 300px;
}

.chart-container {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-activities {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .date-picker {
    width: 100%;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .chart-card {
    height: 250px;
  }
}
</style>