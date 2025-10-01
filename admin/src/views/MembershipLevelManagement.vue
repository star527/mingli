<template>
  <div class="membership-level-management">
    <el-page-header
      @back="goBack"
      content="会员等级管理"
    />
    
    <el-card class="management-card">
      <div class="card-header">
        <h2>会员等级列表</h2>
        <el-button type="primary" @click="showAddLevelDialog">新增等级</el-button>
      </div>
      
      <el-table :data="membershipLevels" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="等级名称" />
        <el-table-column prop="price" label="价格" />
        <el-table-column prop="duration" label="有效期(天)" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="editLevel(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteLevel(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑等级对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="等级名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入等级名称" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input v-model.number="formData.price" placeholder="请输入价格" type="number" />
        </el-form-item>
        <el-form-item label="有效期" prop="duration">
          <el-input v-model.number="formData.duration" placeholder="请输入有效期(天)" type="number" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" placeholder="请输入描述" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLevel">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { membershipLevelApi } from '@/api'

export default {
  name: 'MembershipLevelManagement',
  setup() {
    const router = useRouter()
    const membershipLevels = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增会员等级')
    const formData = ref({
      id: null,
      name: '',
      price: 0,
      duration: 0,
      description: ''
    })
    
    // 获取会员等级列表
    const fetchMembershipLevels = async () => {
      try {
        const res = await membershipLevelApi.list({
          page: currentPage.value,
          pageSize: pageSize.value
        })
        membershipLevels.value = res.data.items
        total.value = res.data.total
      } catch (error) {
        console.error('获取会员等级列表失败:', error)
        ElMessage.error('获取会员等级列表失败')
      }
    }
    
    // 新增等级
    const showAddLevelDialog = () => {
      formData.value = {
        id: null,
        name: '',
        price: 0,
        duration: 0,
        description: ''
      }
      dialogTitle.value = '新增会员等级'
      dialogVisible.value = true
    }
    
    // 编辑等级
    const editLevel = (row) => {
      formData.value = { ...row }
      dialogTitle.value = '编辑会员等级'
      dialogVisible.value = true
    }
    
    // 保存等级
    const saveLevel = async () => {
      try {
        if (formData.value.id) {
          // 更新
          await membershipLevelApi.update(formData.value)
          ElMessage.success('更新成功')
        } else {
          // 新增
          await membershipLevelApi.create(formData.value)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchMembershipLevels()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    }
    
    // 删除等级
    const deleteLevel = async (id) => {
      try {
        await membershipLevelApi.delete(id)
        ElMessage.success('删除成功')
        fetchMembershipLevels()
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size
      fetchMembershipLevels()
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
      fetchMembershipLevels()
    }
    
    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    onMounted(() => {
      fetchMembershipLevels()
    })
    
    // 格式化时间，添加8小时（UTC+8）
    const formatTime = (timeStr) => {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      // 添加8小时
      date.setHours(date.getHours() + 8)
      // 格式化时间
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    return {
      membershipLevels,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      dialogTitle,
      formData,
      showAddLevelDialog,
      editLevel,
      saveLevel,
      deleteLevel,
      handleSizeChange,
      handleCurrentChange,
      goBack,
      formatTime
    }
  }
}
</script>

<style scoped>
.membership-level-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>