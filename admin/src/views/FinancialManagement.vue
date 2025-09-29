<template>
  <div class="management-card">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>财务管理</span>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.totalRevenue }}</div>
                <div class="stat-label">总营收</div>
                <div class="stat-change" :class="stats.revenueChange > 0 ? 'positive' : 'negative'">
                  {{ stats.revenueChange > 0 ? '+' : '' }}{{ stats.revenueChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.todayRevenue }}</div>
                <div class="stat-label">今日营收</div>
                <div class="stat-change" :class="stats.todayRevenueChange > 0 ? 'positive' : 'negative'">
                  {{ stats.todayRevenueChange > 0 ? '+' : '' }}{{ stats.todayRevenueChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.totalOrders }}</div>
                <div class="stat-label">总订单数</div>
                <div class="stat-change" :class="stats.orderChange > 0 ? 'positive' : 'negative'">
                  {{ stats.orderChange > 0 ? '+' : '' }}{{ stats.orderChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.averageOrder }}</div>
                <div class="stat-label">平均订单金额</div>
                <div class="stat-change" :class="stats.averageOrderChange > 0 ? 'positive' : 'negative'">
                  {{ stats.averageOrderChange > 0 ? '+' : '' }}{{ stats.averageOrderChange }}%
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 搜索筛选区域 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="订单号">
            <el-input v-model="searchForm.orderId" placeholder="请输入订单号"></el-input>
          </el-form-item>
          <el-form-item label="用户ID">
            <el-input v-model="searchForm.userId" placeholder="请输入用户ID"></el-input>
          </el-form-item>
          <el-form-item label="支付状态">
            <el-select v-model="searchForm.status" placeholder="请选择支付状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="已支付" value="1"></el-option>
              <el-option label="未支付" value="0"></el-option>
              <el-option label="已退款" value="2"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="订单类型">
            <el-select v-model="searchForm.type" placeholder="请选择订单类型">
              <el-option label="全部" value=""></el-option>
              <el-option label="会员购买" value="1"></el-option>
              <el-option label="课程购买" value="2"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 订单列表 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="orderList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="id" label="订单ID" width="180"></el-table-column>
          <el-table-column prop="userId" label="用户ID" width="120"></el-table-column>
          <el-table-column prop="username" label="用户名" width="150"></el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.type === 1 ? 'primary' : 'success'">
                {{ scope.row.type === 1 ? '会员购买' : '课程购买' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="scope">{{ formatDateTime(scope.row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="paidAt" label="支付时间" width="180">
            <template #default="scope">{{ scope.row.paidAt ? formatDateTime(scope.row.paidAt) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="text" @click="handleViewDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页控件 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
      
      <!-- 订单详情对话框 -->
      <el-dialog
        v-model="dialogVisible"
        title="订单详情"
        width="600px"
      >
        <div v-if="currentOrder" class="order-detail">
          <el-descriptions border :column="1">
            <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ currentOrder.username }}</el-descriptions-item>
            <el-descriptions-item label="订单金额">¥{{ currentOrder.amount.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="订单类型">{{ currentOrder.type === 1 ? '会员购买' : '课程购买' }}</el-descriptions-item>
            <el-descriptions-item label="支付状态">{{ getStatusText(currentOrder.status) }}</el-descriptions-item>
            <el-descriptions-item label="商品信息">{{ currentOrder.productInfo }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ currentOrder.paymentMethod }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ currentOrder.paidAt ? formatDateTime(currentOrder.paidAt) : '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { format } from 'date-fns'

export default {
  name: 'FinancialManagement',
  setup() {
    // 响应式数据
    const loading = ref(false)
    const dialogVisible = ref(false)
    const currentOrder = ref(null)
    const dateRange = ref([])
    const searchForm = reactive({
      orderId: '',
      userId: '',
      status: '',
      type: ''
    })
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    const orderList = ref([])
    const selectedOrders = ref([])
    const stats = reactive({
      totalRevenue: 89567.50,
      todayRevenue: 2345.80,
      totalOrders: 1256,
      averageOrder: 71.31,
      revenueChange: 12.5,
      todayRevenueChange: 8.2,
      orderChange: 5.3,
      averageOrderChange: 2.1
    })
    
    // 模拟订单数据
    const mockOrders = [
      {
        id: 'ORD202401250001',
        userId: '1001',
        username: '张三',
        amount: 199.00,
        type: 1,
        status: 1,
        productInfo: 'VIP会员月卡',
        paymentMethod: '支付宝',
        createdAt: '2024-01-25T08:30:00Z',
        paidAt: '2024-01-25T08:31:20Z'
      },
      {
        id: 'ORD202401250002',
        userId: '1002',
        username: '李四',
        amount: 299.00,
        type: 1,
        status: 1,
        productInfo: 'VIP会员季卡',
        paymentMethod: '微信支付',
        createdAt: '2024-01-25T09:15:00Z',
        paidAt: '2024-01-25T09:16:30Z'
      },
      {
        id: 'ORD202401250003',
        userId: '1003',
        username: '王五',
        amount: 399.00,
        type: 2,
        status: 1,
        productInfo: '高级投资课程',
        paymentMethod: '支付宝',
        createdAt: '2024-01-25T10:20:00Z',
        paidAt: '2024-01-25T10:21:45Z'
      },
      {
        id: 'ORD202401250004',
        userId: '1004',
        username: '赵六',
        amount: 899.00,
        type: 2,
        status: 1,
        productInfo: '全套投资课程',
        paymentMethod: '微信支付',
        createdAt: '2024-01-25T11:05:00Z',
        paidAt: '2024-01-25T11:06:10Z'
      },
      {
        id: 'ORD202401250005',
        userId: '1005',
        username: '钱七',
        amount: 599.00,
        type: 1,
        status: 0,
        productInfo: 'VIP会员半年卡',
        paymentMethod: '',
        createdAt: '2024-01-25T14:30:00Z',
        paidAt: null
      },
      {
        id: 'ORD202401250006',
        userId: '1006',
        username: '孙八',
        amount: 199.00,
        type: 2,
        status: 2,
        productInfo: '基金投资课程',
        paymentMethod: '支付宝',
        createdAt: '2024-01-24T15:45:00Z',
        paidAt: '2024-01-24T15:46:20Z'
      },
      {
        id: 'ORD202401250007',
        userId: '1007',
        username: '周九',
        amount: 1299.00,
        type: 1,
        status: 1,
        productInfo: 'VIP会员年卡',
        paymentMethod: '微信支付',
        createdAt: '2024-01-25T16:20:00Z',
        paidAt: '2024-01-25T16:21:35Z'
      },
      {
        id: 'ORD202401250008',
        userId: '1008',
        username: '吴十',
        amount: 299.00,
        type: 2,
        status: 1,
        productInfo: '股票技术分析课程',
        paymentMethod: '支付宝',
        createdAt: '2024-01-25T17:10:00Z',
        paidAt: '2024-01-25T17:11:25Z'
      }
    ]
    
    // 获取状态文本
    const getStatusText = (status) => {
      switch(status) {
        case 0: return '未支付'
        case 1: return '已支付'
        case 2: return '已退款'
        default: return '未知'
      }
    }
    
    // 获取状态标签类型
    const getStatusType = (status) => {
      switch(status) {
        case 0: return 'warning'
        case 1: return 'success'
        case 2: return 'danger'
        default: return 'info'
      }
    }
    
    // 格式化日期时间
    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')
    }
    
    // 加载订单列表
    const loadOrderList = async () => {
      loading.value = true
      try {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 根据搜索条件过滤数据
        let filteredOrders = [...mockOrders]
        
        // 按订单号搜索
        if (searchForm.orderId) {
          filteredOrders = filteredOrders.filter(order => 
            order.id.toLowerCase().includes(searchForm.orderId.toLowerCase())
          )
        }
        
        // 按用户ID搜索
        if (searchForm.userId) {
          filteredOrders = filteredOrders.filter(order => 
            order.userId.includes(searchForm.userId)
          )
        }
        
        // 按状态过滤
        if (searchForm.status !== '') {
          filteredOrders = filteredOrders.filter(order => 
            order.status === parseInt(searchForm.status)
          )
        }
        
        // 按类型过滤
        if (searchForm.type !== '') {
          filteredOrders = filteredOrders.filter(order => 
            order.type === parseInt(searchForm.type)
          )
        }
        
        // 按日期范围过滤
        if (dateRange.value && dateRange.value.length === 2) {
          const startDate = new Date(dateRange.value[0])
          const endDate = new Date(dateRange.value[1])
          endDate.setHours(23, 59, 59, 999)
          
          filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt)
            return orderDate >= startDate && orderDate <= endDate
          })
        }
        
        // 计算分页
        pagination.total = filteredOrders.length
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        
        // 更新订单列表
        orderList.value = filteredOrders.slice(startIndex, endIndex)
        
      } catch (error) {
        ElMessage.error('获取订单列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadOrderList()
    }
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        orderId: '',
        userId: '',
        status: '',
        type: ''
      })
      dateRange.value = []
      pagination.currentPage = 1
      loadOrderList()
    }
    
    // 查看订单详情
    const handleViewDetail = (row) => {
      currentOrder.value = row
      dialogVisible.value = true
    }
    
    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedOrders.value = val
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadOrderList()
    }
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadOrderList()
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadOrderList()
    })
    
    return {
      loading,
      dialogVisible,
      currentOrder,
      dateRange,
      searchForm,
      pagination,
      orderList,
      selectedOrders,
      stats,
      getStatusText,
      getStatusType,
      formatDateTime,
      handleSearch,
      handleReset,
      handleViewDetail,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange
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

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.search-form {
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-detail {
  max-height: 500px;
  overflow-y: auto;
}
</style>