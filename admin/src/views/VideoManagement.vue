<template>
  <el-card shadow="never" class="management-card">
    <template #header>
      <div class="card-header">
        <span>视频管理</span>
        <el-button type="primary" @click="handleAddVideo" size="small">
          <el-icon><Plus /></el-icon>
          新增视频
        </el-button>
      </div>
    </template>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form" label-width="80px">
      <el-form-item label="视频标题">
        <el-input v-model="searchForm.title" placeholder="请输入视频标题" clearable />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="searchForm.category" placeholder="选择分类" clearable>
          <el-option v-for="category in categories" :key="category.value" :label="category.label" :value="category.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
          <el-option label="上架" value="1" />
          <el-option label="下架" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 视频列表 -->
    <el-table v-loading="loading" :data="videoList" style="width: 100%">
      <el-table-column prop="id" label="视频ID" width="80" />
      <el-table-column label="封面" width="100">
        <template #default="scope">
          <el-image :src="scope.row.coverUrl" fit="cover" :preview-src-list="[scope.row.coverUrl]" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="视频标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="120" />
      <el-table-column prop="duration" label="时长" width="100">
        <template #default="scope">
          {{ formatDuration(scope.row.duration) }}
        </template>
      </el-table-column>
      <el-table-column prop="playCount" label="播放量" width="100" />
      <el-table-column prop="likeCount" label="点赞数" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleEditVideo(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="handleDeleteVideo(scope.row.id)">删除</el-button>
          <el-button 
            :type="scope.row.status === 1 ? 'warning' : 'success'" 
            link 
            @click="handleToggleStatus(scope.row.id, scope.row.status === 1 ? 0 : 1)"
          >
            {{ scope.row.status === 1 ? '下架' : '上架' }}
          </el-button>
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

    <!-- 视频编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增视频' : '编辑视频'" width="600px">
      <el-form :model="videoForm" :rules="rules" ref="videoFormRef" label-width="80px">
        <el-form-item label="视频标题" prop="title">
          <el-input v-model="videoForm.title" placeholder="请输入视频标题" />
        </el-form-item>
        <el-form-item label="视频分类" prop="categoryId">
          <el-select v-model="videoForm.categoryId" placeholder="选择分类">
            <el-option v-for="category in categories" :key="category.value" :label="category.label" :value="category.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="视频封面" prop="coverUrl">
          <el-upload
            class="avatar-uploader"
            action="/api/upload/image"
            :show-file-list="false"
            :on-success="handleCoverUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="videoForm.coverUrl" :src="videoForm.coverUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频文件" prop="videoUrl">
          <el-upload
            class="upload-demo"
            action="/api/upload/video"
            :auto-upload="false"
            :file-list="fileList"
            accept=".mp4,.avi,.mov"
            :before-upload="beforeVideoUpload"
          >
            <template #trigger>
              <el-button type="primary">选择视频文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持mp4、avi、mov格式，文件大小不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频描述" prop="description">
          <el-input v-model="videoForm.description" type="textarea" rows="3" placeholder="请输入视频描述" />
        </el-form-item>
        <el-form-item label="是否上架" prop="status">
          <el-switch v-model="videoForm.status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getVideoList, addVideo, updateVideo, deleteVideo, toggleVideoStatus, uploadCover } from '@/api'
import { formatDateTime } from '@/utils/date'

export default {
  name: 'VideoManagement',
  components: {
    Plus
  },
  setup() {
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogType = ref('add')
    const videoFormRef = ref()
    const fileList = ref([])
    
    // 搜索表单
    const searchForm = reactive({
      title: '',
      category: '',
      status: ''
    })
    
    // 视频表单
    const videoForm = reactive({
      id: '',
      title: '',
      categoryId: '',
      coverUrl: '',
      videoUrl: '',
      description: '',
      status: 1
    })
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 视频列表
    const videoList = ref([])
    
    // 视频分类
    const categories = ref([
      { label: '基础课程', value: 1 },
      { label: '进阶课程', value: 2 },
      { label: '实战案例', value: 3 },
      { label: '行业解析', value: 4 }
    ])
    
    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入视频标题', trigger: 'blur' },
        { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
      ],
      categoryId: [
        { required: true, message: '请选择视频分类', trigger: 'change' }
      ],
      coverUrl: [
        { required: true, message: '请上传视频封面', trigger: 'blur' }
      ],
      videoUrl: [
        { required: true, message: '请上传视频文件', trigger: 'blur' }
      ]
    }
    
    // 加载视频列表
    const loadVideoList = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          keyword: searchForm.title,
          category: searchForm.category,
          status: searchForm.status
        }
        const response = await getVideoList(params)
        if (response.code === 200) {
          videoList.value = response.data.list
          pagination.total = response.data.total
        }
      } catch (error) {
        ElMessage.error('获取视频列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadVideoList()
    }
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        title: '',
        category: '',
        status: ''
      })
      pagination.currentPage = 1
      loadVideoList()
    }
    
    // 新增视频
    const handleAddVideo = () => {
      dialogType.value = 'add'
      Object.assign(videoForm, {
        id: '',
        title: '',
        categoryId: '',
        coverUrl: '',
        videoUrl: '',
        description: '',
        status: 1
      })
      fileList.value = []
      dialogVisible.value = true
    }
    
    // 编辑视频
    const handleEditVideo = (row) => {
      dialogType.value = 'edit'
      Object.assign(videoForm, {
        id: row.id,
        title: row.title,
        categoryId: row.categoryId,
        coverUrl: row.coverUrl,
        videoUrl: row.videoUrl,
        description: row.description,
        status: row.status
      })
      fileList.value = row.videoUrl ? [{ name: row.title, url: row.videoUrl }] : []
      dialogVisible.value = true
    }
    
    // 提交表单
    const handleSubmit = async () => {
      await videoFormRef.value.validate()
      loading.value = true
      try {
        const formData = { ...videoForm }
        if (dialogType.value === 'add') {
          await addVideo(formData)
          ElMessage.success('新增视频成功')
        } else {
          await updateVideo(formData)
          ElMessage.success('编辑视频成功')
        }
        dialogVisible.value = false
        loadVideoList()
      } catch (error) {
        ElMessage.error(dialogType.value === 'add' ? '新增视频失败' : '编辑视频失败')
      } finally {
        loading.value = false
      }
    }
    
    // 删除视频
    const handleDeleteVideo = async (id) => {
      try {
        await ElMessageBox.confirm('确定要删除这条视频吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await deleteVideo(id)
        ElMessage.success('删除成功')
        loadVideoList()
      } catch (error) {
        // 用户取消不提示错误
      }
    }
    
    // 切换视频状态
    const handleToggleStatus = async (id, status) => {
      try {
        await toggleVideoStatus(id, { status })
        ElMessage.success(status === 1 ? '上架成功' : '下架成功')
        loadVideoList()
      } catch (error) {
        ElMessage.error(status === 1 ? '上架失败' : '下架失败')
      }
    }
    
    // 封面上传成功
    const handleCoverUploadSuccess = (response, file) => {
      videoForm.coverUrl = response.data.url
    }
    
    // 上传前校验
    const beforeUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      const isLt1M = file.size / 1024 / 1024 < 1
      if (!isImage) {
        ElMessage.error('只能上传图片文件！')
      }
      if (!isLt1M) {
        ElMessage.error('上传图片大小不能超过 1MB！')
      }
      return isImage && isLt1M
    }
    
    // 视频上传前校验
    const beforeVideoUpload = (file) => {
      const isVideo = ['video/mp4', 'video/avi', 'video/quicktime'].includes(file.type)
      const isLt100M = file.size / 1024 / 1024 < 100
      if (!isVideo) {
        ElMessage.error('只能上传mp4、avi、mov格式的视频文件！')
      }
      if (!isLt100M) {
        ElMessage.error('上传视频大小不能超过 100MB！')
      }
      return isVideo && isLt100M
    }
    
    // 格式化时长
    const formatDuration = (seconds) => {
      if (!seconds) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadVideoList()
    }
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadVideoList()
    }
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadVideoList()
    })
    
    return {
      loading,
      dialogVisible,
      dialogType,
      videoFormRef,
      searchForm,
      videoForm,
      pagination,
      videoList,
      categories,
      fileList,
      rules,
      formatDateTime,
      formatDuration,
      handleSearch,
      handleReset,
      handleAddVideo,
      handleEditVideo,
      handleSubmit,
      handleDeleteVideo,
      handleToggleStatus,
      handleCoverUploadSuccess,
      beforeUpload,
      beforeVideoUpload,
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

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 120px;
  height: 80px;
  display: block;
}
</style>