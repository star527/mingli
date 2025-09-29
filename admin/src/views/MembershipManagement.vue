<template>
  <div class="membership-management">
    <div class="page-header">
      <h1 class="page-title">会员管理</h1>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card shadow="hover" class="search-card">
      <el-form :model="searchForm" class="search-form" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="用户名">
              <el-input v-model="searchForm.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="会员等级">
              <el-select v-model="searchForm.level" placeholder="请选择会员等级">
                <el-option label="全部" value=""></el-option>
                <el-option label="普通会员" value="basic"></el-option>
                <el-option label="高级会员" value="premium"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="会员状态">
              <el-select v-model="searchForm.status" placeholder="请选择会员状态">
                <el-option label="全部" value=""></el-option>
                <el-option label="有效" value="active"></el-option>
                <el-option label="已过期" value="expired"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="开通时间">
              <el-date-picker
                v-model="searchForm.startTime"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="16" class="search-actions">
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    
    <!-- 会员列表 -->
    <el-card shadow="hover" class="membership-list-card">
      <template #header>
        <div class="card-header">
          <span>会员列表</span>
          <span class="total-count">共 {{ total }} 条记录</span>
        </div>
      </template>
      
      <el-table
        :data="membershipList"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="userId" label="用户ID" width="100"></el-table-column>
        <el-table-column prop="username" label="用户名" width="150">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="32" :src="scope.row.avatar"></el-avatar>
              <span>{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="会员等级" width="120">
          <template #default="scope">
            <el-tag :type="getMembershipTagType(scope.row.level)">
              {{ getMembershipText(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开通时间" width="180"></el-table-column>
        <el-table-column prop="expireTime" label="到期时间" width="180"></el-table-column>
        <el-table-column prop="duration" label="有效期(天)" width="120"></el-table-column>
        <el-table-column prop="autoRenew" label="自动续费" width="100">
          <template #default="scope">
            <el-switch v-model="scope.row.autoRenew" active-color="#13ce66" inactive-color="#dcdfe6" @change="toggleAutoRenew(scope.row)"></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '有效' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderId" label="订单号" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" text size="small" @click="viewMemberDetail(scope.row)">查看</el-button>
            <el-button type="warning" text size="small" @click="renewMembership(scope.row)">续费</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
    
    <!-- 会员详情对话框 -->
    <el-dialog
      v-model="memberDetailVisible"
      title="会员详情"
      width="600px"
      @close="closeMemberDetail"
    >
      <el-form :model="currentMember" label-width="100px" class="member-detail-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="用户信息">
              <div class="user-info">
                <el-avatar :size="80" :src="currentMember.avatar"></el-avatar>
                <div class="user-text">
                  <h3>{{ currentMember.username }}</h3>
                  <p>用户ID: {{ currentMember.userId }}</p>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员等级">
              <el-tag :type="getMembershipTagType(currentMember.level)" disabled>
                {{ getMembershipText(currentMember.level) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员状态">
              <el-tag :type="currentMember.status === 'active' ? 'success' : 'danger'" disabled>
                {{ currentMember.status === 'active' ? '有效' : '已过期' }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开通时间">
              <el-input v-model="currentMember.startTime" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期时间">
              <el-input v-model="currentMember.expireTime" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期">
              <el-input :value="currentMember.duration + ' 天'" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自动续费">
              <el-tag :type="currentMember.autoRenew ? 'success' : 'info'" disabled>
                {{ currentMember.autoRenew ? '是' : '否' }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单号">
              <el-input v-model="currentMember.orderId" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付金额">
              <el-input :value="'¥' + currentMember.amount" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="closeMemberDetail">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 续费对话框 -->
    <el-dialog
      v-model="renewVisible"
      title="会员续费"
      width="400px"
      @close="closeRenew"
    >
      <el-form :model="renewForm" :rules="renewRules" ref="renewFormRef" label-width="80px">
        <el-form-item label="续费用户">
          <el-input v-model="renewForm.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="当前等级">
          <el-tag :type="getMembershipTagType(renewForm.level)" disabled>
            {{ getMembershipText(renewForm.level) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="续费时长" prop="duration">
          <el-select v-model="renewForm.duration" placeholder="请选择续费时长">
            <el-option label="1个月" :value="30"></el-option>
            <el-option label="3个月" :value="90"></el-option>
            <el-option label="6个月" :value="180"></el-option>
            <el-option label="1年" :value="365"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="自动续费">
          <el-switch v-model="renewForm.autoRenew" active-color="#13ce66" inactive-color="#dcdfe6"></el-switch>
        </el-form-item>
        <el-form-item label="续费金额">
          <el-input :value="'¥' + calculateRenewAmount" disabled></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeRenew">取消</el-button>
        <el-button type="primary" @click="confirmRenew">确认续费</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMembershipList, updateMembershipStatus } from '@/api'

// 模拟会员数据
const mockMemberships = [
  {
    id: '1',
    userId: '1',
    username: '张三',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    level: 'premium',
    startTime: '2024-01-15 10:30:00',
    expireTime: '2025-01-15 10:30:00',
    duration: 365,
    autoRenew: true,
    status: 'active',
    orderId: 'ORD2024011510300001',
    amount: 198.00
  },
  {
    id: '2',
    userId: '2',
    username: '李四',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    level: 'basic',
    startTime: '2024-01-14 09:12:33',
    expireTime: '2024-02-14 09:12:33',
    duration: 30,
    autoRenew: false,
    status: 'active',
    orderId: 'ORD2024011409123301',
    amount: 38.00
  },
  {
    id: '3',
    userId: '5',
    username: '钱七',
    avatar: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg',
    level: 'premium',
    startTime: '2024-01-11 10:15:33',
    expireTime: '2024-06-11 10:15:33',
    duration: 150,
    autoRenew: true,
    status: 'active',
    orderId: 'ORD2024011110153301',
    amount: 98.00
  },
  {
    id: '4',
    userId: '6',
    username: '孙八',
    avatar: 'https://cube.elemecdn.com/5/6c/557b5c3a4825f385dd22e7c3e69ddpng.png',
    level: 'basic',
    startTime: '2023-12-15 14:20:00',
    expireTime: '2024-01-15 14:20:00',
    duration: 30,
    autoRenew: false,
    status: 'expired',
    orderId: 'ORD2023121514200001',
    amount: 38.00
  }
]

export default {
  name: 'MembershipManagement',
  setup() {
    const loading = ref(false)
    const membershipList = ref([])
    const total = ref(0)
    const selectedMembers = ref([])
    
    // 搜索表单
    const searchForm = reactive({
      username: '',
      level: '',
      status: '',
      startTime: null
    })
    
    // 分页
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10
    })
    
    // 会员详情对话框
    const memberDetailVisible = ref(false)
    const currentMember = reactive({})
    
    // 续费对话框
    const renewVisible = ref(false)
    const renewFormRef = ref(null)
    const renewForm = reactive({
      userId: '',
      username: '',
      level: '',
      duration: '',
      autoRenew: false
    })
    
    const renewRules = {
      duration: [{ required: true, message: '请选择续费时长', trigger: 'change' }]
    }
    
    // 获取会员标签类型
    const getMembershipTagType = (level) => {
      const typeMap = {
        basic: 'primary',
        premium: 'success'
      }
      return typeMap[level] || 'default'
    }
    
    // 获取会员等级文本
    const getMembershipText = (level) => {
      const textMap = {
        basic: '普通会员',
        premium: '高级会员'
      }
      return textMap[level] || '未知'
    }
    
    // 计算续费金额
    const calculateRenewAmount = computed(() => {
      if (!renewForm.duration) return 0
      
      const rates = {
        basic: {
          30: 38,
          90: 98,
          180: 178,
          365: 298
        },
        premium: {
          30: 98,
          90: 268,
          180: 498,
          365: 898
        }
      }
      
      return rates[renewForm.level]?.[renewForm.duration] || 0
    })
    
    // 加载会员列表
    const loadMembershipList = async () => {
      loading.value = true
      
      try {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 根据搜索条件过滤数据
        let filteredMembers = [...mockMemberships]
        
        // 按用户名搜索
        if (searchForm.username) {
          filteredMembers = filteredMembers.filter(member => 
            member.username.toLowerCase().includes(searchForm.username.toLowerCase())
          )
        }
        
        // 按会员等级过滤
        if (searchForm.level) {
          filteredMembers = filteredMembers.filter(member => 
            member.level === searchForm.level
          )
        }
        
        // 按会员状态过滤
        if (searchForm.status) {
          filteredMembers = filteredMembers.filter(member => 
            member.status === searchForm.status
          )
        }
        
        // 按开通时间范围过滤
        if (searchForm.startTime && searchForm.startTime.length === 2) {
          const startDate = new Date(searchForm.startTime[0])
          const endDate = new Date(searchForm.startTime[1])
          endDate.setHours(23, 59, 59, 999)
          
          filteredMembers = filteredMembers.filter(member => {
            const memberStartDate = new Date(member.startTime)
            return memberStartDate >= startDate && memberStartDate <= endDate
          })
        }
        
        // 计算分页
        total.value = filteredMembers.length
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        
        // 更新会员列表
        membershipList.value = filteredMembers.slice(startIndex, endIndex)
        
      } catch (error) {
        ElMessage.error('获取会员列表失败')
      } finally {
        loading.value = false
      }
      
      /* 真实API调用
      try {
        const params = {
          ...searchForm,
          page: pagination.currentPage,
          pageSize: pagination.pageSize
        }
        const response = await getMembershipList(params)
        if (response.code === 200) {
          membershipList.value = response.data.list
          total.value = response.data.total
        }
      } catch (err) {
        ElMessage.error(err.message || '获取会员列表失败')
      } finally {
        loading.value = false
      }
      */
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadMembershipList()
    }
    
    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = key === 'startTime' ? null : ''
      })
      pagination.currentPage = 1
      loadMembershipList()
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedMembers.value = selection
    }
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadMembershipList()
    }
    
    // 处理当前页变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadMembershipList()
    }
    
    // 查看会员详情
    const viewMemberDetail = (member) => {
      Object.assign(currentMember, member)
      memberDetailVisible.value = true
    }
    
    // 关闭会员详情
    const closeMemberDetail = () => {
      memberDetailVisible.value = false
      // 清空当前会员数据
      Object.keys(currentMember).forEach(key => {
        delete currentMember[key]
      })
    }
    
    // 打开续费对话框
    const renewMembership = (member) => {
      renewForm.userId = member.userId
      renewForm.username = member.username
      renewForm.level = member.level
      renewForm.duration = ''
      renewForm.autoRenew = member.autoRenew
      renewVisible.value = true
    }
    
    // 关闭续费对话框
    const closeRenew = () => {
      renewVisible.value = false
      if (renewFormRef.value) {
        renewFormRef.value.resetFields()
      }
    }
    
    // 确认续费
    const confirmRenew = () => {
      renewFormRef.value.validate((valid) => {
        if (valid) {
          ElMessageBox.confirm(
            `确定要为用户「${renewForm.username}」续费吗？`,
            '确认续费',
            {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'info'
            }
          )
          .then(() => {
            // 模拟API调用
            setTimeout(() => {
              ElMessage.success('续费成功')
              closeRenew()
              loadMembershipList()
            }, 500)
            
            /* 真实API调用
            membershipApi.updateMembershipStatus(renewForm.userId, {
              duration: renewForm.duration,
              autoRenew: renewForm.autoRenew
            })
            .then(() => {
              ElMessage.success('续费成功')
              closeRenew()
              loadMembershipList()
            })
            .catch(err => {
              ElMessage.error(err.message || '续费失败')
            })
            */
          })
          .catch(() => {
            ElMessage.info('已取消续费')
          })
        }
      })
    }
    
    // 切换自动续费
    const toggleAutoRenew = (member) => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage.success(`自动续费已${member.autoRenew ? '开启' : '关闭'}`)
      }, 300)
      
      /* 真实API调用
      membershipApi.updateMembershipStatus(member.userId, {
        autoRenew: member.autoRenew
      })
      .catch(err => {
        // 失败时恢复原状态
        member.autoRenew = !member.autoRenew
        ElMessage.error(err.message || '更新失败')
      })
      */
    }
    
    onMounted(() => {
      loadMembershipList()
    })
    
    return {
      loading,
      membershipList,
      total,
      selectedMembers,
      searchForm,
      pagination,
      memberDetailVisible,
      currentMember,
      renewVisible,
      renewFormRef,
      renewForm,
      renewRules,
      calculateRenewAmount,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      viewMemberDetail,
      closeMemberDetail,
      renewMembership,
      closeRenew,
      confirmRenew,
      toggleAutoRenew,
      getMembershipTagType,
      getMembershipText
    }
  }
}
</script>

<style scoped>
.membership-management {
  height: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
}

.membership-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.member-detail-form {
  margin-bottom: 0;
}

.user-text h3 {
  margin: 0 0 10px;
  color: #303133;
}

.user-text p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-actions {
    justify-content: flex-start;
    margin-top: 10px;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>