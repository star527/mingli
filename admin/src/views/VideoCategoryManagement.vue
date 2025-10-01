<template>
  <div class="video-category-management">
    <el-page-header
      @back="goBack"
      content="视频分类管理"
    />
    
    <el-card class="management-card">
      <div class="card-header">
        <h2>视频分类列表</h2>
        <el-button type="primary" @click="showAddCategoryDialog">新增分类</el-button>
      </div>
      
      <el-table :data="categories" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="description" label="分类描述" />
        <el-table-column prop="sort_order" label="排序" width="100" />
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
            <el-button type="primary" size="small" @click="editCategory(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteCategory(scope.row.id)">删除</el-button>
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
    
    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input v-model="formData.description" placeholder="请输入分类描述" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input v-model.number="formData.sort_order" placeholder="请输入排序值" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { videoCategoryApi } from '@/api'

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

export default {
  name: 'VideoCategoryManagement',
  setup() {
    const router = useRouter()
    const categories = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增分类')
    const formData = ref({
      id: null,
      name: '',
      description: '',
      sort_order: 0
    })
    
    // 获取分类列表
    const fetchCategories = async () => {
      try {
        const res = await videoCategoryApi.list({
          page: currentPage.value,
          pageSize: pageSize.value
        })
        categories.value = res.data.items
        total.value = res.data.total
      } catch (error) {
        console.error('获取分类列表失败:', error)
        ElMessage.error('获取分类列表失败')
      }
    }
    
    // 新增分类
    const showAddCategoryDialog = () => {
      formData.value = {
        id: null,
        name: '',
        description: '',
        sort_order: 0
      }
      dialogTitle.value = '新增分类'
      dialogVisible.value = true
    }
    
    // 编辑分类
    const editCategory = (row) => {
      formData.value = { ...row }
      dialogTitle.value = '编辑分类'
      dialogVisible.value = true
    }
    
    // 保存分类
    const saveCategory = async () => {
      try {
        if (formData.value.id) {
          // 更新
          await videoCategoryApi.update(formData.value)
          ElMessage.success('更新成功')
        } else {
          // 新增
          await videoCategoryApi.create(formData.value)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchCategories()
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    }
    
    // 删除分类
    const deleteCategory = async (id) => {
      try {
        await videoCategoryApi.delete(id)
        ElMessage.success('删除成功')
        fetchCategories()
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size
      fetchCategories()
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
      fetchCategories()
    }
    
    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    onMounted(() => {
      fetchCategories()
    })
    
    return {
      categories,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      dialogTitle,
      formData,
      showAddCategoryDialog,
      editCategory,
      saveCategory,
      deleteCategory,
      handleSizeChange,
      handleCurrentChange,
      goBack,
      formatTime
    }
  }
}
</script>

<style scoped>
.video-category-management {
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