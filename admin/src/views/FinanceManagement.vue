<template>
  <el-card shadow="never" class="management-card">
    <template #header>
      <div class="card-header">
        <span>财务管理</span>
        <el-button type="primary" @click="handleExport" size="small">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </template>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">今日收入</div>
            <div class="stat-value">{{ formatMoney(todayIncome) }}</div>
            <div class="stat-desc">相比昨日 {{ todayIncomeRate > 0 ? '+' : '' }}{{ todayIncomeRate }}%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">本月收入</div>
            <div class="stat-value">{{ formatMoney(monthIncome) }}</div>
            <div class="stat-desc">相比上月 {{ monthIncomeRate > 0 ? '+' : '' }}{{ monthIncomeRate }}%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">本年收入</div>
            <div class="stat-value">{{ formatMoney(yearIncome) }}</div>
            <div class="stat-desc">总计交易 {{ totalOrders }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-title">待处理提现</div>
            <div class="stat-value">{{ formatMoney(pendingWithdrawals) }}</div>
            <div class="stat-desc">{{ pendingWithdrawalsCount }} 笔申请</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
      <el-form-item label="交易类型">
        <el-select v-model="searchForm.type" placeholder="选择交易类型" clearable>
          <el-option label="会员开通" value="1" />
          <el-option label="会员续费" value="2" />
          <el-option label="视频购买" value="3" />
          <el-option label="提现" value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="交易状态">
        <el-select v-model="searchForm.status" placeholder="选择交易状态" clearable>
          <el-option label="成功" value="1" />
          <el-option label="失败" value="0" />
          <el-option label="处理中" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="交易时间">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 交易列表 -->
    <el-table v-loading="loading" :data="financeList" style="width: 100%">
      <el-table-column prop="id" label="交易ID" width="120" />
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip />
      <el-table-column prop="orderNo" label="订单号" width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="交易类型" width="120">
        <template #default="scope">
          <el-tag :type="getTypeTagType(scope.row.type)">
            {{ getTypeLabel(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="交易金额" width="120">
        <template #default="scope">
          <span :class="scope.row.type === 4 ? 'text-danger' : 'text-success'">
            {{ scope.row.type === 4 ? '-' : '+' }}{{ formatMoney(scope.row.amount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="交易状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="paymentMethod" label="支付方式" width="100" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="交易时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleViewDetail(scope.row)">详情</el-button>
          <template v-if="scope.row.type === 4 && scope.row.status === 2">
            <el-button type="success" link @click="handleApproveWithdrawal(scope.row)">处理</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 交易详情对话框 -->
    <el-dialog v-model="detailVisible" title="交易详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="交易ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ detailData.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="交易类型">{{ getTypeLabel(detailData.type) }}</el-descriptions-item>
        <el-descriptions-item label="交易金额">
          <span :class="detailData.type === 4 ? 'text-danger' : 'text-success'">
            {{ detailData.type === 4 ? '-' : '+' }}{{ formatMoney(detailData.amount) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="交易状态">{{ getStatusLabel(detailData.status) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ detailData.paymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交易时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ detailData.completedAt ? formatDateTime(detailData.completedAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 提现处理对话框 -->
    <el-dialog v-model="withdrawalVisible" title="处理提现申请" width="400px">
      <el-form :model="withdrawalForm" :rules="withdrawalRules" ref="withdrawalFormRef" label-width="80px">
        <el-form-item label="提现金额">
          <el-input v-model="withdrawalForm.amount" disabled />
        </el-form-item>
        <el-form-item label="处理结果" prop="action">
          <el-radio-group v-model="withdrawalForm.action">
            <el-radio label="approve">同意</el-radio>
            <el-radio label="reject">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="withdrawalForm.action === 'reject'" label="拒绝原因" prop="reason">
          <el-input v-model="withdrawalForm.reason" type="textarea" rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="withdrawalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleWithdrawalSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getOrderList, getFinancialStats } from '@/api'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/common'

export default {
  name: 'FinanceManagement',
  components: {
    Download
  },
  setup() {
    const loading = ref(false)
    const detailVisible = ref(false)
    const withdrawalVisible = ref(false)
    const withdrawalFormRef = ref()
    
    // 搜索表单
    const searchForm = reactive({
      type: '',
      status: '',
      dateRange: []
    })
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 财务数据列表
    const financeList = ref([])
    
    // 统计数据
    const todayIncome = ref(0)
    const todayIncomeRate = ref(0)
    const monthIncome = ref(0)
    const monthIncomeRate = ref(0)
    const yearIncome = ref(0)
    const totalOrders = ref(0)
    const pendingWithdrawals = ref(0)
    const pendingWithdrawalsCount = ref(0)
    
    // 详情数据
    const detailData = ref({})
    
    // 提现处理表单
    const withdrawalForm = reactive({
      id: '',
      amount: '',
      action: 'approve',
      reason: ''
    })
    
    // 提现处理表单验证规则
    const withdrawalRules = {
      action: [
        { required: true, message: '请选择处理结果', trigger: 'change' }
      ],
      reason: [
        { required: true, message: '请输入拒绝原因', trigger: 'blur' }
      ]
    }
    
    // 加载统计数据
    const loadFinanceStats = async () => {
      try {
        const response = await getFinancialStats()
        const stats = response.data
        todayIncome.value = stats.todayIncome || 0
        todayIncomeRate.value = stats.todayIncomeRate || 0
        monthIncome.value = stats.monthIncome || 0
        monthIncomeRate.value = stats.monthIncomeRate || 0
        yearIncome.value = stats.yearIncome || 0
        totalOrders.value = stats.totalOrders || 0
        pendingWithdrawals.value = stats.pendingWithdrawals || 0
        pendingWithdrawalsCount.value = stats.pendingWithdrawalsCount || 0
      } catch (error) {
        ElMessage.error('获取统计数据失败')
      }
    }
    
    // 加载财务列表
    const loadFinanceList = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          type: searchForm.type,
          status: searchForm.status,
          startDate: searchForm.dateRange[0] || undefined,
          endDate: searchForm.dateRange[1] || undefined
        }
        const response = await getOrderList(params)
        financeList.value = response.data.list
        pagination.total = response.data.total
      } catch (error) {
        ElMessage.error('获取财务列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadFinanceList()
    }
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        type: '',
        status: '',
        dateRange: []
      })
      pagination.currentPage = 1
      loadFinanceList()
    }
    
    // 查看详情
    const handleViewDetail = (row) => {
      detailData.value = { ...row }
      detailVisible.value = true
    }
    
    // 处理提现申请
    const handleApproveWithdrawal = (row) => {
      Object.assign(withdrawalForm, {
        id: row.id,
        amount: row.amount,
        action: 'approve',
        reason: ''
      })
      withdrawalVisible.value = true
    }
    
    // 提交提现处理
    const handleWithdrawalSubmit = async () => {
      await withdrawalFormRef.value.validate()
      loading.value = true
      try {
        await handleWithdrawal(withdrawalForm.id, {
          action: withdrawalForm.action,
          reason: withdrawalForm.reason
        })
        ElMessage.success('处理成功')
        withdrawalVisible.value = false
        loadFinanceList()
        loadFinanceStats()
      } catch (error) {
        ElMessage.error('处理失败')
      } finally {
        loading.value = false
      }
    }
    
    // 导出财务数据 - 模拟实现
    const handleExport = async () => {
      try {
        loading.value = true
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 创建CSV内容
        let csvContent = '订单ID,用户ID,用户名,订单金额,订单类型,订单状态,创建时间\n'
        orderList.value.forEach(order => {
          csvContent += `"${order.orderId}","${order.userId}","${order.username}","${order.amount}","${getTypeLabel(order.type)}","${getStatusLabel(order.status)}","${formatDateTime(order.createdAt)}"\n`
        })
        
        // 创建下载链接
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `财务数据_${new Date().toLocaleDateString('zh-CN')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        ElMessage.success('导出成功')
      } catch (error) {
        ElMessage.error('导出失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
    
    // 获取交易类型标签类型
    const getTypeTagType = (type) => {
      const typeMap = {
        1: 'primary',
        2: 'success',
        3: 'warning',
        4: 'danger'
      }
      return typeMap[type] || 'info'
    }
    
    // 获取交易类型标签
    const getTypeLabel = (type) => {
      const typeMap = {
        1: '会员开通',
        2: '会员续费',
        3: '视频购买',
        4: '提现'
      }
      return typeMap[type] || '未知'
    }
    
    // 获取交易状态标签类型
    const getStatusTagType = (status) => {
      const statusMap = {
        1: 'success',
        0: 'danger',
        2: 'warning'
      }
      return statusMap[status] || 'info'
    }
    
    // 获取交易状态标签
    const getStatusLabel = (status) => {
      const statusMap = {
        1: '成功',
        0: '失败',
        2: '处理中'
      }
      return statusMap[status] || '未知'
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadFinanceList()
    }
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadFinanceList()
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadFinanceStats()
      loadFinanceList()
    })
    
    return {
      loading,
      detailVisible,
      withdrawalVisible,
      withdrawalFormRef,
      searchForm,
      pagination,
      financeList,
      detailData,
      withdrawalForm,
      withdrawalRules,
      todayIncome,
      todayIncomeRate,
      monthIncome,
      monthIncomeRate,
      yearIncome,
      totalOrders,
      pendingWithdrawals,
      pendingWithdrawalsCount,
      formatDateTime,
      formatMoney,
      handleSearch,
      handleReset,
      handleViewDetail,
      handleApproveWithdrawal,
      handleWithdrawalSubmit,
      handleExport,
      getTypeTagType,
      getTypeLabel,
      getStatusTagType,
      getStatusLabel,
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
  color: #909399;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.text-danger {
  color: var(--el-color-danger);
}

.text-success {
  color: var(--el-color-success);
}
</style>