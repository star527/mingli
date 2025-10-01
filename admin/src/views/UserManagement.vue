<template>
  <div class="user-management">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
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
            <el-form-item label="用户状态">
              <el-select v-model="searchForm.status" placeholder="请选择用户状态">
                <el-option label="全部" value=""></el-option>
                <el-option label="正常" value="active"></el-option>
                <el-option label="禁用" value="inactive"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="会员状态">
              <el-select v-model="searchForm.membership" placeholder="请选择会员状态">
                <el-option label="全部" value=""></el-option>
                <el-option label="非会员" value="free"></el-option>
                <el-option label="普通会员" value="basic"></el-option>
                <el-option label="高级会员" value="premium"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="注册时间">
              <el-date-picker
                v-model="searchForm.registerTime"
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
    
    <!-- 用户列表 -->
    <el-card shadow="hover" class="user-list-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <span class="total-count">共 {{ total }} 条记录</span>
        </div>
      </template>
      
      <el-table
        :data="userList"
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="用户ID" width="100"></el-table-column>
        <el-table-column prop="username" label="用户名" width="150">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="32" :src="scope.row.avatar"></el-avatar>
              <span>{{ scope.row.username }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="openid" label="OpenID" show-overflow-tooltip></el-table-column>
        <el-table-column prop="phone" label="手机号" width="120"></el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="180"></el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录时间" width="180"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="membershipLevel" label="会员等级" width="120">
          <template #default="scope">
            <el-tag :type="getMembershipTagType(scope.row.membershipLevel)">
              {{ getMembershipText(scope.row.membershipLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="membershipExpire" label="会员到期" width="180"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" text size="small" @click="viewUserDetail(scope.row)">查看</el-button>
            <el-button
              :type="scope.row.status === 'active' ? 'danger' : 'success'"
              text
              size="small"
              @click="toggleUserStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
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
    
    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="userDetailVisible"
      title="用户详情"
      width="600px"
      @close="closeUserDetail"
    >
      <el-form :model="currentUser" label-width="100px" class="user-detail-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="用户基本信息">
              <div class="user-basic-info">
                <el-avatar :size="80" :src="currentUser.avatar"></el-avatar>
                <div class="user-basic-text">
                  <h3>{{ currentUser.username }}</h3>
                  <p>用户ID: {{ currentUser.id }}</p>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="OpenID">
              <el-input v-model="currentUser.openid" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="currentUser.phone" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册时间">
              <el-input v-model="currentUser.registerTime" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最后登录时间">
              <el-input v-model="currentUser.lastLoginTime" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户状态">
              <el-tag :type="currentUser.status === 'active' ? 'success' : 'danger'" disabled>
                {{ currentUser.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员等级">
              <el-tag :type="getMembershipTagType(currentUser.membershipLevel)" disabled>
                {{ getMembershipText(currentUser.membershipLevel) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员到期时间">
              <el-input :value="currentUser.membershipExpire || '非会员'" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="八字排盘次数">
              <el-input v-model="currentUser.baziCount" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="closeUserDetail">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, updateUserStatus } from '@/api'

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: '张三',
    openid: 'oXK8a5Vh_1234567890abcdef',
    phone: '138****1234',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    registerTime: '2024-01-01 10:30:00',
    lastLoginTime: '2024-01-15 14:23:11',
    status: 'active',
    membershipLevel: 'premium',
    membershipExpire: '2025-01-15 23:59:59',
    baziCount: 12
  },
  {
    id: '2',
    username: '李四',
    openid: 'oXK8a5Vh_0987654321fedcba',
    phone: '139****5678',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    registerTime: '2024-01-02 15:45:00',
    lastLoginTime: '2024-01-14 09:12:33',
    status: 'active',
    membershipLevel: 'basic',
    membershipExpire: '2024-02-14 23:59:59',
    baziCount: 8
  },
  {
    id: '3',
    username: '王五',
    openid: 'oXK8a5Vh_abcdef1234567890',
    phone: '137****9012',
    avatar: 'https://cube.elemecdn.com/1/8e/aeffeb4de20e1f1594338fa6b2443jpeg.jpeg',
    registerTime: '2024-01-03 09:20:00',
    lastLoginTime: '2024-01-13 18:45:22',
    status: 'active',
    membershipLevel: 'free',
    membershipExpire: null,
    baziCount: 5
  },
  {
    id: '4',
    username: '赵六',
    openid: 'oXK8a5Vh_fedcba0987654321',
    phone: '136****3456',
    avatar: 'https://cube.elemecdn.com/2/11/6535b159ddf4f1099022458209e59jpeg.jpeg',
    registerTime: '2024-01-04 11:10:00',
    lastLoginTime: '2024-01-12 16:30:45',
    status: 'inactive',
    membershipLevel: 'free',
    membershipExpire: null,
    baziCount: 2
  },
  {
    id: '5',
    username: '钱七',
    openid: 'oXK8a5Vh_1122334455667788',
    phone: '135****7890',
    avatar: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg',
    registerTime: '2024-01-05 14:55:00',
    lastLoginTime: '2024-01-11 10:15:33',
    status: 'active',
    membershipLevel: 'premium',
    membershipExpire: '2024-06-11 23:59:59',
    baziCount: 15
  }
]

export default {
  name: 'UserManagement',
  setup() {
    const loading = ref(false)
    const userList = ref([])
    const total = ref(0)
    const selectedUsers = ref([])
    
    // 搜索表单
    const searchForm = reactive({
      username: '',
      status: '',
      membership: '',
      registerTime: null
    })
    
    // 分页
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10
    })
    
    // 用户详情对话框
    const userDetailVisible = ref(false)
    const currentUser = reactive({})
    
    // 获取会员标签类型
    const getMembershipTagType = (level) => {
      // 确保level是字符串类型且有效
      const validLevel = typeof level === 'string' ? level : 'free'
      const typeMap = {
        free: 'default',
        basic: 'primary',
        premium: 'success'
      }
      return typeMap[validLevel] || 'default'
    }
    
    // 获取会员等级文本
    const getMembershipText = (level) => {
      // 确保level是字符串类型且有效
      const validLevel = typeof level === 'string' ? level : 'free'
      const textMap = {
        free: '非会员',
        basic: '普通会员',
        premium: '高级会员'
      }
      return textMap[validLevel] || '未知'
    }
    
    // 加载用户列表
    const loadUserList = async () => {
      try {
        loading.value = true
        
        // 在实际环境中调用API，这里直接使用mock数据进行展示
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 根据搜索条件过滤mock数据
        let filteredUsers = [...mockUsers]
        
        // 用户名搜索
        if (searchForm.username) {
          const keyword = searchForm.username.toLowerCase()
          filteredUsers = filteredUsers.filter(user => 
            user.username.toLowerCase().includes(keyword)
          )
        }
        
        // 状态过滤
        if (searchForm.status) {
          filteredUsers = filteredUsers.filter(user => 
            user.status === searchForm.status
          )
        }
        
        // 会员状态过滤
        if (searchForm.membership) {
          filteredUsers = filteredUsers.filter(user => 
            user.membershipLevel === searchForm.membership
          )
        }
        
        // 时间范围过滤（简化实现）
        if (searchForm.registerTime && searchForm.registerTime.length === 2) {
          const startTime = new Date(searchForm.registerTime[0])
          const endTime = new Date(searchForm.registerTime[1])
          filteredUsers = filteredUsers.filter(user => {
            const registerTime = new Date(user.registerTime)
            return registerTime >= startTime && registerTime <= endTime
          })
        }
        
        // 分页处理
        const start = (pagination.currentPage - 1) * pagination.pageSize
        const end = start + pagination.pageSize
        const paginatedUsers = filteredUsers.slice(start, end)
        
        userList.value = paginatedUsers
        total.value = filteredUsers.length
        
        // 在实际环境中，这里应该调用API
        // const params = {
        //   ...searchForm,
        //   page: pagination.currentPage,
        //   pageSize: pagination.pageSize
        // }
        // const response = await getUserList(params)
        // if (response.code === 200) {
        //   userList.value = response.data.list
        //   total.value = response.data.total
        // }
      } catch (error) {
        ElMessage.error(error.message || '获取用户列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadUserList()
    }
    
    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = key === 'registerTime' ? null : ''
      })
      pagination.currentPage = 1
      loadUserList()
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedUsers.value = selection
    }
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadUserList()
    }
    
    // 处理当前页变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadUserList()
    }
    
    // 查看用户详情
    const viewUserDetail = (user) => {
      Object.assign(currentUser, user)
      userDetailVisible.value = true
    }
    
    // 关闭用户详情
    const closeUserDetail = () => {
      userDetailVisible.value = false
      // 清空当前用户数据
      Object.keys(currentUser).forEach(key => {
        delete currentUser[key]
      })
    }
    
    // 切换用户状态
    const toggleUserStatus = (user) => {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const statusText = newStatus === 'active' ? '启用' : '禁用'
      
      ElMessageBox.confirm(
        `确定要${statusText}用户「${user.username}」吗？`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      .then(async () => {
        try {
          loading.value = true
          await updateUserStatus(user.id, newStatus)
          user.status = newStatus
          ElMessage.success(`${statusText}成功`)
        } catch (error) {
          ElMessage.error(error.message || `${statusText}失败`)
          // 恢复原状态
          user.status = user.status === 'active' ? 'inactive' : 'active'
        } finally {
          loading.value = false
        }
      })
      .catch(() => {
        ElMessage.info('已取消操作')
      })
    }
    
    onMounted(() => {
      loadUserList()
    })
    
    return {
      loading,
      userList,
      total,
      selectedUsers,
      searchForm,
      pagination,
      userDetailVisible,
      currentUser,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      viewUserDetail,
      closeUserDetail,
      toggleUserStatus,
      getMembershipTagType,
      getMembershipText
    }
  }
}
</script>

<style scoped>
.user-management {
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

.user-list-card {
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

.user-detail-form {
  margin-bottom: 0;
}

.user-basic-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-basic-text h3 {
  margin: 0 0 10px;
  color: #303133;
}

.user-basic-text p {
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