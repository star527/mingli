<template>
  <el-card shadow="never" class="management-card">
    <template #header>
      <div class="card-header">
        <span>数据分析</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
      </div>
    </template>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">新增用户</div>
            <div class="stat-value">{{ formatNumber(newUsers) }}</div>
            <div class="stat-desc" :class="{ 'text-success': newUsersRate > 0, 'text-danger': newUsersRate < 0 }">
              环比 {{ newUsersRate > 0 ? '+' : '' }}{{ newUsersRate }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">活跃用户</div>
            <div class="stat-value">{{ formatNumber(activeUsers) }}</div>
            <div class="stat-desc" :class="{ 'text-success': activeUsersRate > 0, 'text-danger': activeUsersRate < 0 }">
              环比 {{ activeUsersRate > 0 ? '+' : '' }}{{ activeUsersRate }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">付费用户</div>
            <div class="stat-value">{{ formatNumber(payingUsers) }}</div>
            <div class="stat-desc" :class="{ 'text-success': payingUsersRate > 0, 'text-danger': payingUsersRate < 0 }">
              环比 {{ payingUsersRate > 0 ? '+' : '' }}{{ payingUsersRate }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">ARPU</div>
            <div class="stat-value">{{ formatMoney(arpu) }}</div>
            <div class="stat-desc" :class="{ 'text-success': arpuRate > 0, 'text-danger': arpuRate < 0 }">
              环比 {{ arpuRate > 0 ? '+' : '' }}{{ arpuRate }}%
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>用户增长趋势</span>
              <el-select v-model="userChartType" @change="handleChartTypeChange">
                <el-option label="新增用户" value="newUsers" />
                <el-option label="活跃用户" value="activeUsers" />
                <el-option label="付费用户" value="payingUsers" />
              </el-select>
            </div>
          </template>
          <div id="userGrowthChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>收入统计</span>
              <el-select v-model="incomeChartType" @change="handleChartTypeChange">
                <el-option label="日收入" value="daily" />
                <el-option label="周收入" value="weekly" />
                <el-option label="月收入" value="monthly" />
              </el-select>
            </div>
          </template>
          <div id="incomeChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>用户地域分布</span>
            </div>
          </template>
          <div id="regionChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>视频播放数据</span>
              <el-select v-model="videoChartType" @change="handleChartTypeChange">
                <el-option label="播放量" value="playCount" />
                <el-option label="完播率" value="completionRate" />
                <el-option label="平均观看时长" value="avgWatchTime" />
              </el-select>
            </div>
          </template>
          <div id="videoChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 热门视频和用户留存 -->
    <el-row :gutter="20" class="analysis-row">
      <el-col :span="12">
        <el-card shadow="hover" class="analysis-card">
          <template #header>
            <div class="analysis-header">
              <span>热门视频 TOP10</span>
            </div>
          </template>
          <el-table :data="hotVideos" style="width: 100%">
            <el-table-column label="排名" width="80">
              <template #default="scope">
                <span class="rank-number">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="视频标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="playCount" label="播放量" width="100" />
            <el-table-column prop="likeCount" label="点赞数" width="100" />
            <el-table-column prop="completionRate" label="完播率" width="100">
              <template #default="scope">
                {{ (scope.row.completionRate * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="analysis-card">
          <template #header>
            <div class="analysis-header">
              <span>用户留存率</span>
            </div>
          </template>
          <el-table :data="retentionRates" style="width: 100%">
            <el-table-column prop="period" label="周期" width="100" />
            <el-table-column prop="rate" label="留存率" width="120">
              <template #default="scope">
                <div class="retention-rate">
                  <span class="rate-text">{{ (scope.row.rate * 100).toFixed(1) }}%</span>
                  <el-progress :percentage="(scope.row.rate * 100).toFixed(1)" :show-text="false" />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="留存用户数" width="120" />
            <el-table-column prop="total" label="总用户数" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import Chart from 'chart.js/auto'
// 导入必要的格式化函数
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const formatMoney = (num) => {
  return '¥' + num.toFixed(2)
}

export default {
  name: 'DataAnalysis',
  setup() {
    // 日期范围
    const dateRange = ref(['', ''])
    
    // 图表类型选择
    const userChartType = ref('newUsers')
    const incomeChartType = ref('daily')
    const videoChartType = ref('playCount')
    
    // 图表实例
    let userGrowthChart = null
    let incomeChart = null
    let regionChart = null
    let videoChart = null
    
    // 核心指标数据
    const newUsers = ref(1256)
    const newUsersRate = ref(12.5)
    const activeUsers = ref(4589)
    const activeUsersRate = ref(8.3)
    const payingUsers = ref(789)
    const payingUsersRate = ref(15.7)
    const arpu = ref(234.5)
    const arpuRate = ref(5.2)
    
    // 热门视频数据
    const hotVideos = ref([])
    
    // 用户留存数据
    const retentionRates = ref([])
    
    // 加载仪表盘数据（使用模拟数据）
    const loadDashboardData = async () => {
      try {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // 根据日期范围调整数据（这里简化处理，实际应该根据日期范围计算）
        if (dateRange.value[0] && dateRange.value[1]) {
          // 可以根据实际需求调整模拟数据
          console.log('根据日期范围加载数据:', dateRange.value)
        }
        
        // 核心指标已经在定义时设置了默认值
      } catch (error) {
        ElMessage.error('获取仪表盘数据失败')
      }
    }
    
    // 用户增长图表使用模拟数据
    const loadUserGrowthChart = () => {
        try {
          // 获取DOM元素，确保存在再继续
          const chartElement = document.getElementById('userGrowthChart')
          if (!chartElement) {
            console.warn('未找到用户增长图表元素')
            return
          }
          
          // 根据选择的图表类型设置不同的模拟数据
          const mockData = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            values: userChartType.value === 'newUsers' ? [1200, 1900, 1500, 2100, 2500, 3000] :
                    userChartType.value === 'activeUsers' ? [3200, 3900, 3500, 4100, 4500, 5000] :
                    [500, 650, 580, 700, 750, 900]
          }
          
          if (userGrowthChart) {
            userGrowthChart.destroy()
          }
          
          userGrowthChart = new Chart(chartElement, {
            type: 'line',
            data: {
              labels: mockData.labels || [],
              datasets: [{
                label: userChartType.value === 'newUsers' ? '新增用户' : 
                       userChartType.value === 'activeUsers' ? '活跃用户' : '付费用户',
                data: mockData.values || [],
                borderColor: '#409EFF',
                backgroundColor: 'rgba(64, 158, 255, 0.1)',
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          })
        } catch (error) {
          console.error('渲染用户增长图表失败:', error)
          ElMessage.error('渲染用户增长图表失败')
        }
      }
    
    // 收入图表使用模拟数据
    const loadIncomeChart = () => {
      try {
        // 获取DOM元素，确保存在再继续
        const chartElement = document.getElementById('incomeChart')
        if (!chartElement) {
          console.warn('未找到收入图表元素')
          return
        }
        
        // 使用模拟数据进行图表渲染
        const mockData = {
          labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
          values: [15000, 21000, 18000, 24000, 23000, 27000]
        }
        
        if (incomeChart) {
          incomeChart.destroy()
        }
        
        incomeChart = new Chart(chartElement, {
          type: 'bar',
          data: {
            labels: mockData.labels || [],
            datasets: [{
              label: '收入',
              data: mockData.values || [],
              backgroundColor: '#67C23A'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '¥' + value
                  }
                }
              }
            }
          }
        })
      } catch (error) {
        ElMessage.error('渲染收入图表失败')
      }
    }
    
    // 地域分布图表使用模拟数据
    const loadRegionChart = () => {
        try {
          // 获取DOM元素，确保存在再继续
          const chartElement = document.getElementById('regionChart')
          if (!chartElement) {
            console.warn('未找到地域分布图表元素')
            return
          }
          
          // 使用模拟数据进行图表渲染
          const mockData = {
            labels: ['北京', '上海', '广州', '深圳', '其他'],
            values: [30, 25, 15, 10, 20]
          }
          
          if (regionChart) {
            regionChart.destroy()
          }
          
          regionChart = new Chart(chartElement, {
            type: 'pie',
            data: {
              labels: mockData.labels || [],
              datasets: [{
                data: mockData.values || [],
                backgroundColor: [
                  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
                  '#909399'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }
          })
        } catch (error) {
          ElMessage.error('渲染地域分布图表失败')
        }
      }
    
    // 视频数据图表使用模拟数据
    const loadVideoChart = () => {
        try {
          // 获取DOM元素，确保存在再继续
          const chartElement = document.getElementById('videoChart')
          if (!chartElement) {
            console.warn('未找到视频数据图表元素')
            return
          }
          
          // 根据选择的图表类型设置不同的模拟数据
          const mockData = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            values: videoChartType.value === 'playCount' ? [12000, 19000, 15000, 21000, 25000, 30000] :
                    videoChartType.value === 'completionRate' ? [0.65, 0.72, 0.68, 0.75, 0.8, 0.82] :
                    [180, 220, 200, 250, 280, 300]
          }
          
          if (videoChart) {
            videoChart.destroy()
          }
          
          videoChart = new Chart(chartElement, {
            type: 'bar',
            data: {
              labels: mockData.labels || [],
              datasets: [{
                label: videoChartType.value === 'playCount' ? '播放量' :
                       videoChartType.value === 'completionRate' ? '完播率' : '平均观看时长',
                data: mockData.values || [],
                backgroundColor: '#F56C6C'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      if (videoChartType.value === 'completionRate') {
                        return (value * 100).toFixed(0) + '%'
                      } else if (videoChartType.value === 'avgWatchTime') {
                        return (value / 60).toFixed(0) + '分钟'
                      }
                      return value
                    }
                  }
                }
              }
            }
          })
        } catch (error) {
          ElMessage.error('渲染视频数据图表失败')
        }
      }
    
    // 热门视频使用模拟数据
    const loadHotVideos = () => {
      try {
        // 模拟热门视频数据
        hotVideos.value = [
          { id: 1, title: '投资入门指南', playCount: 15800, likeCount: 3250, completionRate: 0.85 },
          { id: 2, title: '股票技术分析', playCount: 12500, likeCount: 2780, completionRate: 0.78 },
          { id: 3, title: '资产配置策略', playCount: 10200, likeCount: 2150, completionRate: 0.82 },
          { id: 4, title: '风险管理要点', playCount: 9800, likeCount: 1980, completionRate: 0.75 },
          { id: 5, title: '基金投资技巧', playCount: 8700, likeCount: 1820, completionRate: 0.80 },
          { id: 6, title: '财务报表解读', playCount: 7600, likeCount: 1540, completionRate: 0.72 },
          { id: 7, title: '房地产投资指南', playCount: 6800, likeCount: 1320, completionRate: 0.76 },
          { id: 8, title: '加密货币解析', playCount: 5900, likeCount: 1150, completionRate: 0.70 },
          { id: 9, title: '退休规划策略', playCount: 5200, likeCount: 1080, completionRate: 0.83 },
          { id: 10, title: '税务筹划技巧', playCount: 4800, likeCount: 950, completionRate: 0.71 }
        ]
      } catch (error) {
        ElMessage.error('加载热门视频失败')
      }
    }
    
    // 用户留存率使用模拟数据
    const loadRetentionRates = () => {
      try {
        // 模拟用户留存率数据
        retentionRates.value = [
          { period: '次日', rate: 0.58, count: 728, total: 1256 },
          { period: '7日', rate: 0.42, count: 528, total: 1256 },
          { period: '30日', rate: 0.28, count: 352, total: 1256 },
          { period: '90日', rate: 0.15, count: 188, total: 1256 }
        ]
      } catch (error) {
        ElMessage.error('加载用户留存率失败')
      }
    }
    
    // 日期范围变化
    const handleDateChange = () => {
      loadAllData()
    }
    
    // 图表类型变化
    const handleChartTypeChange = () => {
      // 使用setTimeout和nextTick确保DOM元素已经完全渲染完成
      setTimeout(() => {
        nextTick(() => {
          loadCharts()
        })
      }, 50)
    }
    
    // 加载所有数据
    const loadAllData = async () => {
      await Promise.all([
        loadDashboardData(),
        loadHotVideos(),
        loadRetentionRates()
      ])
      
      // 使用setTimeout和nextTick确保DOM元素已经完全渲染完成
      setTimeout(() => {
        nextTick(() => {
          loadCharts()
        })
      }, 100)
    }
    
    // 组件挂载时设置默认日期范围并加载数据
    onMounted(() => {
      // 设置默认日期范围为最近30天
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      dateRange.value = [
        start.toISOString().split('T')[0],
        end.toISOString().split('T')[0]
      ]
      
      // 先加载数据
      Promise.all([
        loadDashboardData(),
        loadHotVideos(),
        loadRetentionRates()
      ]).then(() => {
        // 使用setTimeout确保DOM完全渲染并稳定
        setTimeout(() => {
          nextTick(() => {
            loadCharts()
          })
        }, 100)
      })
    })
    
    // 统一的图表加载函数
    const loadCharts = () => {
      console.log('开始加载图表...')
      
      // 检查所有图表容器是否存在
      const containers = [
        { id: 'userGrowthChart', name: '用户增长图表' },
        { id: 'incomeChart', name: '收入图表' },
        { id: 'regionChart', name: '地域分布图表' },
        { id: 'videoChart', name: '视频数据图表' }
      ]
      
      containers.forEach(container => {
        const element = document.getElementById(container.id)
        console.log(`${container.name} 容器存在:`, !!element)
      })
      
      // 逐个加载图表，使用try-catch确保一个失败不影响其他
      try {
        loadUserGrowthChart()
      } catch (error) {
        console.error('加载用户增长图表失败:', error)
      }
      
      try {
        loadIncomeChart()
      } catch (error) {
        console.error('加载收入图表失败:', error)
      }
      
      try {
        loadRegionChart()
      } catch (error) {
        console.error('加载地域分布图表失败:', error)
      }
      
      try {
        loadVideoChart()
      } catch (error) {
        console.error('加载视频数据图表失败:', error)
      }
    }
    
    return {
      dateRange,
      userChartType,
      incomeChartType,
      videoChartType,
      newUsers,
      newUsersRate,
      activeUsers,
      activeUsersRate,
      payingUsers,
      payingUsersRate,
      arpu,
      arpuRate,
      hotVideos,
      retentionRates,
      formatNumber,
      formatMoney,
      handleDateChange,
      handleChartTypeChange
    }
  }
}
</script>

<style scoped>
.management-card {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  text-align: center;
  padding: 10px 0;
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-desc {
  font-size: 12px;
}

.text-success {
  color: #67C23A;
}

.text-danger {
  color: #F56C6C;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.analysis-row {
  margin-bottom: 20px;
}

.analysis-card {
  margin-bottom: 20px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-number {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background-color: #409EFF;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
}

.retention-rate {
  width: 100%;
}

.rate-text {
  display: block;
  text-align: center;
  font-weight: bold;
  margin-bottom: 5px;
  color: #409EFF;
}
</style>