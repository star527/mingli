<template>
  <div class="management-card">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>提现管理</span>
        </div>
      </template>
      
      <!-- 搜索筛选区域 -->
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="提现ID">
            <el-input v-model="searchForm.withdrawalId" placeholder="请输入提现ID"></el-input>
          </el-form-item>
          <el-form-item label="用户ID">
            <el-input v-model="searchForm.userId" placeholder="请输入用户ID"></el-input>
          </el-form-item>
          <el-form-item label="提现状态">
            <el-select v-model="searchForm.status" placeholder="请选择提现状态">
              <el-option label="全部" value=""></el-option>
              <el-option label="待处理" value="pending"></el-option>
              <el-option label="已同意" value="approved"></el-option>
              <el-option label="已拒绝" value="rejected"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="失败" value="failed"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="申请时间">
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
      
      <!-- 提现列表 -->
      <div class="table-section">
        <el-table
          v-loading="loading"
          :data="withdrawalList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="id" label="提现ID" width="180"></el-table-column>
          <el-table-column prop="userId" label="用户ID" width="120"></el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="scope">¥{{ scope.row.amount.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="appliedAt" label="申请时间" width="180">
            <template #default="scope">{{ formatDateTime(scope.row.appliedAt) }}</template>
          </el-table-column>
          <el-table-column prop="processedAt" label="处理时间" width="180">
            <template #default="scope">{{ scope.row.processedAt ? formatDateTime(scope.row.processedAt) : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button type="text" @click="handleViewDetail(scope.row)">详情</el-button>
              <el-button 
                v-if="scope.row.status === 'pending'" 
                type="primary" 
                text 
                @click="handleProcess(scope.row)"
              >
                处理
              </el-button>
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
      
      <!-- 提现详情对话框 -->
      <el-dialog
        v-model="dialogVisible"
        title="提现详情"
        width="600px"
      >
        <div v-if="currentWithdrawal" class="withdrawal-detail">
          <el-descriptions border :column="1">
            <el-descriptions-item label="提现ID">{{ currentWithdrawal.id }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ currentWithdrawal.userId }}</el-descriptions-item>
            <el-descriptions-item label="提现金额">¥{{ currentWithdrawal.amount.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="提现状态">{{ getStatusText(currentWithdrawal.status) }}</el-descriptions-item>
            <el-descriptions-item label="账户类型">
              {{ getAccountTypeText(currentWithdrawal.accountInfo) }}
            </el-descriptions-item>
            <el-descriptions-item label="账户信息">
              <div v-for="(value, key) in formatAccountInfo(currentWithdrawal.accountInfo)" :key="key">
                <span style="font-weight: bold;">{{ getAccountFieldLabel(key) }}:</span> {{ value }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentWithdrawal.reason" label="处理备注">{{ currentWithdrawal.reason }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDateTime(currentWithdrawal.appliedAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="currentWithdrawal.processedAt" label="处理时间">{{ formatDateTime(currentWithdrawal.processedAt) }}</el-descriptions-item>
            <el-descriptions-item v-if="currentWithdrawal.processedBy" label="处理人">{{ currentWithdrawal.processedBy }}</el-descriptions-item>
            <el-descriptions-item v-if="currentWithdrawal.transactionId" label="交易ID">{{ currentWithdrawal.transactionId }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>

      <!-- 处理提现对话框 -->
      <el-dialog
        v-model="processDialogVisible"
        title="处理提现申请"
        width="500px"
      >
        <div v-if="processingWithdrawal" class="process-form">
          <p>提现ID: {{ processingWithdrawal.id }}</p>
          <p>用户ID: {{ processingWithdrawal.userId }}</p>
          <p>提现金额: ¥{{ processingWithdrawal.amount.toFixed(2) }}</p>
          
          <el-form :model="processForm" :rules="processRules" ref="processFormRef">
            <el-form-item label="处理方式" prop="action">
              <el-radio-group v-model="processForm.action">
                <el-radio label="approve">同意</el-radio>
                <el-radio label="reject">拒绝</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item 
              v-if="processForm.action === 'reject'" 
              label="拒绝原因" 
              prop="reason"
            >
              <el-input
                v-model="processForm.reason"
                type="textarea"
                placeholder="请输入拒绝原因"
                :rows="3"
              ></el-input>
            </el-form-item>
          </el-form>
        </div>
        
        <template #footer>
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProcess">确认处理</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { format } from 'date-fns'
import withdrawalService from '../api/withdrawalService'

export default {
  name: 'WithdrawalManagement',
  setup() {
    // 响应式数据
    const loading = ref(false)
    const dialogVisible = ref(false)
    const processDialogVisible = ref(false)
    const currentWithdrawal = ref(null)
    const processingWithdrawal = ref(null)
    const dateRange = ref([])
    const selectedRows = ref([])
    const searchForm = reactive({
      withdrawalId: '',
      userId: '',
      status: ''
    })
    
    // 处理表单
    const processForm = reactive({
      action: 'approve',
      reason: ''
    })
    
    const processRules = {
      action: [
        { required: true, message: '请选择处理方式', trigger: 'change' }
      ],
      reason: [
        { required: true, message: '请输入拒绝原因', trigger: 'change' }
      ]
    }
    
    const processFormRef = ref()
    
    // 分页数据
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 提现列表
    const withdrawalList = ref([])
    
    // 获取提现列表
    const fetchWithdrawals = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          withdrawalId: searchForm.withdrawalId,
          userId: searchForm.userId,
          status: searchForm.status
        }
        
        if (dateRange.value && dateRange.value.length === 2) {
          params.startDate = dateRange.value[0]
          params.endDate = dateRange.value[1]
        }
        
        const response = await withdrawalService.getWithdrawals(params)
        withdrawalList.value = response.data.list
        pagination.total = response.data.total
      } catch (error) {
        ElMessage.error('获取提现列表失败')
        console.error('获取提现列表失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      fetchWithdrawals()
    }
    
    // 重置
    const handleReset = () => {
      searchForm.withdrawalId = ''
      searchForm.userId = ''
      searchForm.status = ''
      dateRange.value = []
      pagination.currentPage = 1
      fetchWithdrawals()
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      fetchWithdrawals()
    }
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      fetchWithdrawals()
    }
    
    // 查看详情
    const handleViewDetail = (row) => {
      currentWithdrawal.value = { ...row }
      dialogVisible.value = true
    }
    
    // 处理提现
    const handleProcess = (row) => {
      processingWithdrawal.value = { ...row }
      processForm.action = 'approve'
      processForm.reason = ''
      processDialogVisible.value = true
    }
    
    // 提交处理
    const submitProcess = async () => {
      if (!processForm.action) {
        ElMessage.warning('请选择处理方式')
        return
      }
      
      if (processForm.action === 'reject' && !processForm.reason.trim()) {
        ElMessage.warning('拒绝时请输入原因')
        return
      }
      
      try {
        await withdrawalService.processWithdrawal(processingWithdrawal.value.id, {
          action: processForm.action,
          reason: processForm.reason
        })
        
        ElMessage.success(processForm.action === 'approve' ? '已同意提现' : '已拒绝提现')
        processDialogVisible.value = false
        fetchWithdrawals()
      } catch (error) {
        ElMessage.error('处理失败')
        console.error('处理提现失败:', error)
      }
    }
    
    // 选择变化
    const handleSelectionChange = (rows) => {
      selectedRows.value = rows
    }
    
    // 格式化日期时间
    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      try {
        return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')
      } catch (e) {
        return dateString
      }
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'pending': '待处理',
        'approved': '已同意',
        'rejected': '已拒绝',
        'completed': '已完成',
        'failed': '失败'
      }
      return statusMap[status] || status
    }
    
    // 获取状态类型
    const getStatusType = (status) => {
      const typeMap = {
        'pending': 'warning',
        'approved': 'info',
        'rejected': 'danger',
        'completed': 'success',
        'failed': 'danger'
      }
      return typeMap[status] || 'info'
    }
    
    // 获取账户类型文本
    const getAccountTypeText = (accountInfoStr) => {
      try {
        const accountInfo = JSON.parse(accountInfoStr)
        const typeMap = {
          'alipay': '支付宝',
          'wechat': '微信',
          'bank': '银行卡'
        }
        return typeMap[accountInfo.type] || '未知'
      } catch (e) {
        return '未知'
      }
    }
    
    // 格式化账户信息
    const formatAccountInfo = (accountInfoStr) => {
      try {
        const accountInfo = JSON.parse(accountInfoStr)
        const formatted = {}
        
        if (accountInfo.type === 'alipay') {
          formatted.account = accountInfo.account || ''
          formatted.name = accountInfo.name || ''
        } else if (accountInfo.type === 'wechat') {
          formatted.account = accountInfo.account || ''
          formatted.name = accountInfo.name || ''
        } else if (accountInfo.type === 'bank') {
          formatted.bank_name = accountInfo.bank_name || ''
          formatted.account_number = accountInfo.account_number || ''
          formatted.name = accountInfo.name || ''
        }
        
        return formatted
      } catch (e) {
        return { error: '解析失败' }
      }
    }
    
    // 获取账户字段标签
    const getAccountFieldLabel = (field) => {
      const labelMap = {
        bank_name: '银行名称',
        account_number: '银行卡号',
        account: '账号',
        name: '持卡人姓名'
      }
      return labelMap[field] || field
    }
    
    // 初始化
    onMounted(() => {
      fetchWithdrawals()
    })
    
    return {
      loading,
      dialogVisible,
      processDialogVisible,
      currentWithdrawal,
      processingWithdrawal,
      dateRange,
      searchForm,
      processForm,
      processRules,
      processFormRef,
      pagination,
      withdrawalList,
      selectedRows,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleViewDetail,
      handleProcess,
      submitProcess,
      handleSelectionChange,
      formatDateTime,
      getStatusText,
      getStatusType,
      getAccountTypeText,
      formatAccountInfo,
      getAccountFieldLabel
    }
  }
}
</script>

<style scoped>
.management-card {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.withdrawal-detail .el-descriptions-item__content {
  font-size: 14px;
}

.withdrawal-detail .el-descriptions-item__content > div {
  margin-bottom: 8px;
}

.withdrawal-detail .el-descriptions-item__content > div:last-child {
  margin-bottom: 0;
}

.process-form {
  margin-bottom: 20px;
}

.process-form p {
  margin-bottom: 10px;
}
</style>