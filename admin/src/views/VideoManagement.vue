<template>
  <div class="video-management-container"> <!-- 添加单个根元素 -->
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
        <el-select v-model="searchForm.category" placeholder="选择分类" clearable :popper-append-to-body="false" class="auto-width-select">
          <el-option v-for="category in categories" :key="category.value" :label="category.label" :value="category.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="选择状态" clearable :popper-append-to-body="false" class="auto-width-select">
          <el-option label="上架" :value="'1'" />
          <el-option label="下架" :value="'0'" />
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
          <div class="video-cover-container" @click="playVideo(scope.row)">
            <!-- 使用预计算的封面URL -->
            <el-image 
              :key="`cover-${scope.row.id}`" 
              :src="processVideoCover(scope.row)" 
              fit="cover" 
              :preview-src-list="[processVideoCover(scope.row)]"
              :lazy="false"
            />
            <div class="play-icon-overlay">
              <el-icon class="play-icon"><VideoPlay /></el-icon>
            </div>
          </div>
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
          <el-select v-model="videoForm.categoryId" placeholder="选择分类" :popper-append-to-body="false" class="auto-width-select">
            <el-option v-for="category in categories" :key="category.value" :label="category.label" :value="category.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="视频封面" prop="coverUrl">
          <el-upload
            class="avatar-uploader"
            :http-request="handleCustomCoverUpload"
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <!-- 直接使用已处理的videoForm.coverUrl，避免重复转换导致闪烁 -->
            <img v-if="videoForm.coverUrl" :src="videoForm.coverUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频文件" prop="videoUrl">
          <el-upload
            class="upload-demo"
            :http-request="handleCustomVideoUpload"
            :auto-upload="true"
            :file-list="fileList"
            accept=".mp4,.avi,.mov"
            :before-upload="beforeVideoUpload"
            :on-change="handleVideoFileChange"
          >
            <template #trigger>
              <el-button type="primary">选择并上传视频</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持mp4、avi、mov格式，文件大小不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频描述" prop="description">
          <el-input v-model="videoForm.description" type="textarea" :rows="3" placeholder="请输入视频描述" />
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
  
  <!-- 视频播放对话框 -->
  <el-dialog
    v-model="videoDialogVisible"
    :title="currentVideo?.title || '视频播放'"
    width="80%"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    destroy-on-close
  >
    <div class="video-dialog-content">
      <video
        id="current-video-player"
        controls
        class="video-player"
        :src="currentVideo?.videoUrl"
        style="width: 100%; max-height: 70vh;"
      >
        您的浏览器不支持HTML5视频播放
      </video>
      <div v-if="currentVideo" class="video-info">
        <p><strong>分类：</strong>{{ currentVideo.categoryName }}</p>
        <p><strong>时长：</strong>{{ formatDuration(currentVideo.duration) }}</p>
        <p><strong>播放量：</strong>{{ currentVideo.playCount }}</p>
        <p><strong>点赞数：</strong>{{ currentVideo.likeCount }}</p>
      </div>
    </div>
  </el-dialog>
  </div> <!-- 关闭根元素 -->
</template>

<script>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox, ElPagination } from 'element-plus'
import axios from 'axios'
import { Plus, VideoPlay } from '@element-plus/icons-vue'
import { videoApi, videoCategoryApi } from '@/api'
import { formatDateTime } from '@/utils/date'

export default {
  name: 'VideoManagement',
  components: {
    Plus,
    VideoPlay
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
    
    // 添加调试监听器，监控searchForm的变化
    watch(searchForm, (newVal) => {
      console.log('searchForm变化:', { ...newVal })
    }, { deep: true })
    
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
    const categories = ref([])
    
    // 加载分类列表
    const loadCategories = async () => {
      console.log('开始加载分类数据')
      try {
        const response = await videoCategoryApi.list({ pageSize: 100 }) // 获取所有分类
        console.log('分类API响应:', response)
        if (response.code === 200 && response.data && response.data.items) {
          // 转换为element-plus select需要的格式
          categories.value = response.data.items.map(cat => ({
            label: cat.name,
            value: String(cat.id) // 确保value是字符串类型，与el-select兼容
          }))
          console.log('转换后的分类数据:', categories.value)
        }
      } catch (error) {
        console.error('加载分类失败:', error)
        // 如果API调用失败，使用默认分类作为备用
        categories.value = [
          { label: '基础课程', value: '1' }, // 确保value是字符串类型
          { label: '进阶课程', value: '2' }, // 确保value是字符串类型
          { label: '实战案例', value: '3' }, // 确保value是字符串类型
          { label: '行业解析', value: '4' }  // 确保value是字符串类型
        ]
        console.log('使用备用分类数据:', categories.value)
      }
    }
    
    // localStorage键名
    const STORAGE_KEY = 'video_management_data'
    
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
        { 
          required: true, 
          message: '请上传视频文件', 
          trigger: ['blur', 'change'],
          validator: (rule, value, callback) => {
            console.log('videoUrl验证器被调用，值:', value)
            if (value && value.trim()) {
              callback() // 验证通过
            } else {
              callback(new Error('请上传视频文件')) // 验证失败
            }
          }
        }
      ]
    }
    
    // 从localStorage加载视频数据
    const loadFromStorage = () => {
      try {
        const storedData = localStorage.getItem(STORAGE_KEY)
        if (storedData) {
          return JSON.parse(storedData)
        }
        return null
      } catch (error) {
        console.error('从localStorage加载数据失败:', error)
        return null
      }
    }
    
    // 保存视频数据到localStorage
    const saveToStorage = (data) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('保存数据到localStorage失败:', error)
      }
    }
    
    // 加载视频列表
    const loadVideoList = async () => {
      loading.value = true
      try {
        // 构建查询参数，在传递时进行类型转换，不修改原searchForm
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          title: searchForm.title,
          // 确保category参数正确传递，并添加详细日志
          category: searchForm.category ? Number(searchForm.category) : undefined,
          status: searchForm.status ? Number(searchForm.status) : undefined
        }
        console.log('构建的API参数:', { ...params })
        // 添加分类搜索的详细日志
        if (searchForm.category) {
          const selectedCategory = categories.value.find(c => c.value === searchForm.category)
          console.log('当前选择的分类:', selectedCategory ? selectedCategory.label : '未知分类', 'ID:', searchForm.category)
        } else {
          console.log('未选择分类，显示全部')
        }
        
        // 调用后端API获取视频列表
        const response = await videoApi.getVideoList(params)
        
        console.log('API响应格式:', response)
        
        // 同时支持两种可能的响应格式：{code: 200, data: {...}} 和 {success: true, data: {...}}
        let success = false
        let videoData = []
        let totalCount = 0
        
        if (response.code === 200 && response.data) {
          // 格式1：{code: 200, data: {list: [...]}}
          success = true
          videoData = response.data.list || []
          totalCount = response.data.total || 0
          console.log('使用code格式响应，列表长度:', videoData.length)
        } else if (response.success === true && response.data) {
          // 格式2：{success: true, data: {videos: [...], pagination: {...}}}
          success = true
          videoData = response.data.videos || []
          totalCount = response.data.pagination?.total || response.data.total || 0
          console.log('使用success格式响应，列表长度:', videoData.length)
        }
        
        if (success) {
          // 更新视频列表和分页信息
          videoList.value = videoData
          pagination.total = totalCount
          
          // 确保每个视频都有categoryName，注意类型转换
          videoList.value = videoList.value.map(video => {
            // 同时支持category_id和categoryId字段
            const catId = video.category_id !== undefined ? video.category_id : video.categoryId
            return {
              ...video,
              categoryName: categories.value.find(c => Number(c.value) === Number(catId))?.label || '未分类',
              categoryId: Number(catId) || 0
            }
          })
        } else {
          console.error('API响应不符合预期:', response)
          throw new Error('获取视频列表失败')
        }
        
      } catch (error) {
        console.error('加载视频列表失败:', error)
        ElMessage.error('获取视频列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      // 调试：打印搜索前的searchForm值
      console.log('搜索前searchForm值:', { ...searchForm })
      // 不直接修改searchForm，避免影响下拉框显示
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
      // 新增视频时设置默认分类为第一个分类
      const defaultCategoryId = categories.value.length > 0 ? categories.value[0].value : 0
      
      Object.assign(videoForm, {
        id: '',
        title: '',
        categoryId: defaultCategoryId,
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
      // 确保categoryId是有效数字，默认为第一个分类或0
      const validCategoryId = row.categoryId && Number(row.categoryId) > 0 
        ? Number(row.categoryId) 
        : (categories.value.length > 0 ? categories.value[0].value : 0)
      
      // 处理封面URL，添加完整的后端服务器地址
      let coverUrl = row.coverUrl || ''
      if (coverUrl && coverUrl.startsWith('/uploads/')) {
        coverUrl = `http://localhost:3000${coverUrl}`
      }
      
      Object.assign(videoForm, {
        id: row.id,
        title: row.title,
        categoryId: validCategoryId,
        coverUrl: coverUrl,
        videoUrl: row.videoUrl,
        description: row.description,
        status: row.status
      })
      fileList.value = row.videoUrl ? [{ name: row.title, url: row.videoUrl }] : []
      dialogVisible.value = true
    }
    
    // 提交表单 - 使用后端API实现数据持久化
    const handleSubmit = async () => {
      console.log('准备提交表单，videoForm内容:', { ...videoForm })
      console.log('videoForm.videoUrl值:', videoForm.videoUrl, '类型:', typeof videoForm.videoUrl)
      
      // 手动验证必填字段
      if (!videoForm.title || !videoForm.title.trim()) {
        ElMessage.error('请输入视频标题')
        return
      }
      
      if (!videoForm.categoryId) {
        ElMessage.error('请选择视频分类')
        return
      }
      
      if (!videoForm.coverUrl || !videoForm.coverUrl.trim()) {
        ElMessage.error('请上传视频封面')
        return
      }
      
      // 关键验证：只要videoUrl有值就允许提交
      if (!videoForm.videoUrl || !videoForm.videoUrl.trim()) {
        ElMessage.error('请上传视频文件')
        return
      }
      
      console.log('所有必填字段验证通过，开始提交表单')
      
      loading.value = true
      try {
        // 创建formData对象，保持categoryId字段名
        const formData = {
          title: videoForm.title,
          categoryId: videoForm.categoryId,
          coverUrl: videoForm.coverUrl,
          videoUrl: videoForm.videoUrl,
          description: videoForm.description,
          status: videoForm.status,
          duration: videoForm.duration || 0,
          playCount: videoForm.playCount || 0,
          likeCount: videoForm.likeCount || 0
        }
        
        // 如果是编辑模式，添加id
        if (dialogType.value === 'edit') {
          formData.id = videoForm.id
        }
        
        console.log('提交给后端的数据:', formData)
        
        if (dialogType.value === 'add') {
          // 调用创建视频API
          const response = await videoApi.createVideo(formData)
          
          if (response.code === 200) {
            ElMessage.success('新增视频成功')
            // 重新加载视频列表
            await loadVideoList()
          } else {
            throw new Error('新增视频失败')
          }
        } else {
          // 调用更新视频API
          const response = await videoApi.updateVideo(videoForm.id, formData)
          
          if (response.code === 200) {
            ElMessage.success('编辑视频成功')
            // 重新加载视频列表
            await loadVideoList()
          } else {
            throw new Error('编辑视频失败')
          }
        }
        
        // 关闭对话框
        dialogVisible.value = false
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error(dialogType.value === 'add' ? '新增视频失败' : '编辑视频失败')
      } finally {
        loading.value = false
      }
    }
    
    // 删除视频 - 使用后端API实现
    const handleDeleteVideo = async (id) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除该视频吗？删除后将无法恢复。',
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        loading.value = true
        console.log('开始删除视频，ID:', id)
        
        // 调用删除视频API
        const response = await videoApi.deleteVideo(id)
        console.log('删除视频API响应:', response)
        
        if (response.code === 200) {
          ElMessage.success('删除视频成功')
          // 重新加载视频列表
          await loadVideoList()
        } else {
          // 使用后端返回的错误信息，如果没有则使用默认信息
          const errorMessage = response.message || response.data?.message || '删除视频失败'
          console.error('删除视频失败:', response)
          throw new Error(errorMessage)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除视频失败:', error.message || error)
          // 显示具体的错误信息给用户
          ElMessage.error(error.message || '删除视频失败')
        }
      } finally {
        loading.value = false
      }
    }
    
    // 切换视频状态（上架/下架）- 使用后端API实现
    const handleToggleStatus = async (id, status) => {
      loading.value = true
      try {
        console.log('开始切换视频状态，ID:', id, '新状态:', status)
        
        // 调用更新视频API，只更新状态字段
        const response = await videoApi.updateVideo(id, { status: status })
        console.log('切换视频状态API响应:', response)
        
        if (response.code === 200) {
          // 本地更新状态以提供即时反馈
          const video = videoList.value.find(v => v.id === id)
          if (video) {
            video.status = status
            console.log('本地视频状态已更新:', video.title, '状态:', status)
          }
          
          const statusText = status === 1 ? '上架' : '下架'
          ElMessage.success(`视频已${statusText}`)
        } else {
          // 使用后端返回的错误信息
          const errorMessage = response.message || response.data?.message || '切换视频状态失败'
          console.error('切换视频状态失败:', response)
          throw new Error(errorMessage)
        }
      } catch (error) {
        console.error('切换状态失败:', error.message || error)
        // 显示具体的错误信息给用户
        ElMessage.error(error.message || '切换状态失败')
      } finally {
        loading.value = false
      }
    }
    
    // 自定义封面上传方法
    const handleCustomCoverUpload = async (uploadData) => {
      try {
        const file = uploadData.file
        const formData = new FormData()
        formData.append('cover', file)
        
        const response = await videoApi.uploadCover(formData)
        
        // 关键修复：在设置coverUrl前就处理URL，避免后续模板中的转换导致闪烁
        let coverUrl = response.data.url || ''
        if (coverUrl && coverUrl.startsWith('/uploads/')) {
          coverUrl = `http://localhost:3000${coverUrl}`
        }
        
        // 直接设置处理后的完整URL
        videoForm.coverUrl = coverUrl
        uploadData.onSuccess(response)
      } catch (error) {
        console.error('封面上传失败:', error)
        // 提供更明确的错误信息，避免显示为Object
        const errorMessage = error.response?.data?.message || error.message || '上传失败，请重试'
        uploadData.onError(new Error(errorMessage))
        ElMessage.error('封面上传失败: ' + errorMessage)
      }
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
    
    // 视频文件变化处理
    const handleVideoFileChange = (file, fileList) => {
      // 只保留最后选择的文件并更新到我们的响应式变量中
      if (fileList.length > 0) {
        const lastFile = fileList[fileList.length - 1]
        fileList.value = [lastFile] // 直接设置为只包含最后一个文件的数组
      }
    }
    
    // 提交视频上传
    const submitVideoUpload = () => {
      if (fileList.value.length > 0) {
        // 触发自定义上传
        const uploadData = {
          file: fileList.value[0].raw,
          onSuccess: (response) => {
            // 上传成功后必须更新videoForm.videoUrl，否则表单验证会失败
            if (response && response.data && response.data.url) {
              videoForm.videoUrl = response.data.url
              ElMessage.success('视频上传成功，视频路径已设置')
            } else {
              ElMessage.error('视频上传成功但响应格式不正确')
            }
          },
          onError: (error) => {
            ElMessage.error('视频上传失败')
          }
        }
        handleCustomVideoUpload(uploadData)
      } else {
        ElMessage.warning('请先选择视频文件')
      }
    }
    
    // 自定义视频上传方法 - 使用真实API
    const handleCustomVideoUpload = async (uploadData) => {
      try {
        console.log('开始视频上传:', uploadData.file.name, '大小:', uploadData.file.size);
        
        const formData = new FormData()
        formData.append('file', uploadData.file)
        
        // 调用真实的视频上传API
        const response = await videoApi.uploadVideo(formData)
        
        if (response.code === 200 && response.data && response.data.url) {
          videoForm.videoUrl = response.data.url
          console.log('视频上传成功，设置URL:', videoForm.videoUrl);
          ElMessage.success('视频上传成功并已设置视频路径');
          uploadData.onSuccess(response);
        } else {
          throw new Error('视频上传成功但响应格式不正确')
        }
      } catch (error) {
        console.error('视频上传失败:', error);
        ElMessage.error('视频上传失败: ' + (error.message || '未知错误'));
        uploadData.onError(error);
      }
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
    
    // 常量定义 - 直接内联到方法中减少变量依赖
    
    // 专门处理封面URL的函数，用于编辑对话框中
    const processVideoCoverUrl = (coverUrl) => {
      try {
        // 安全地获取封面URL
        const url = (coverUrl || '').trim();
        
        // 关键修复：为/uploads开头的URL添加完整的后端服务器地址
        if (url && url.startsWith('/uploads/')) {
          // 使用后端服务器地址：http://localhost:3000
          return `http://localhost:3000${url}`;
        }
        
        // 其他URL格式直接返回
        return url;
      } catch (error) {
        console.error('[ERROR] 处理封面URL时出错:', error);
        return '';
      }
    };

    // 处理视频封面的核心函数，使用真实的封面URL
    const processVideoCover = (video) => {
      try {
        // 直接内联SVG占位图，避免外部依赖
        const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22100%22 height%3D%2280%22 viewBox%3D%220 0 100 80%22%3E%3Crect width%3D%22100%22 height%3D%2280%22 fill%3D%22%23f5f5f5%22%3E%3C%2Frect%3E%3Ctext x%3D%2250%22 y%3D%2245%22 font-size%3D%2214%22 text-anchor%3D%22middle%22 fill%3D%22%23909399%22%3E视频封面%3C%2Ftext%3E%3C%2Fsvg%3E';
        
        // 安全地获取封面URL
        const coverUrl = (video?.coverUrl || video?.thumbnail_url || '').trim();
        
        // 简化的调试信息
        console.log('[SIMPLE DEBUG] 封面URL处理:', {
          videoId: video?.id,
          originalCoverUrl: coverUrl,
          hasCover: !!coverUrl
        });
        
        // 关键修复：为/uploads开头的URL添加完整的后端服务器地址
        // 因为静态文件服务在后端的3000端口，而不是前端的5173端口
        let finalUrl = coverUrl;
        if (coverUrl && coverUrl.startsWith('/uploads/')) {
          // 使用后端服务器地址：http://localhost:3000
          finalUrl = `http://localhost:3000${coverUrl}`;
          console.log('[SIMPLE DEBUG] 转换为完整URL:', finalUrl);
        } else if (coverUrl) {
          // 其他有效的URL格式也使用
          console.log('[SIMPLE DEBUG] 使用其他URL:', finalUrl);
        }
        
        // 如果有最终URL，使用它；否则使用占位图
        if (finalUrl) {
          return finalUrl;
        }
        
        console.log('[SIMPLE DEBUG] 使用占位图');
        return DEFAULT_PLACEHOLDER;
      } catch (error) {
        console.error('[ERROR] 处理视频封面时出错:', error);
        return 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22100%22 height%3D%2280%22 viewBox%3D%220 0 100 80%22%3E%3Crect width%3D%22100%22 height%3D%2280%22 fill%3D%22%23ffebee%22%3E%3C%2Frect%3E%3Ctext x%3D%2250%22 y%3D%2245%22 font-size%3D%2212%22 text-anchor%3D%22middle%22 fill%3D%22%23c62828%22%3E加载失败%3C%2Ftext%3E%3C%2Fsvg%3E';
      }
    }
    
    // 播放视频相关状态
    const videoDialogVisible = ref(false)
    const currentVideo = ref(null)
    
    // 播放视频
    const playVideo = (video) => {
      try {
        console.log('尝试播放视频，原始URL:', video.videoUrl);
        
        // 智能处理视频URL，确保正确指向后端服务
        let backendVideoUrl;
        
        if (video.videoUrl) {
          // 根据不同情况处理URL
          if (video.videoUrl.startsWith('http')) {
            // 如果已经是完整URL，直接使用
            backendVideoUrl = video.videoUrl;
          } else if (video.videoUrl.startsWith('/')) {
            // 如果以/开头，添加域名
            backendVideoUrl = `http://localhost:3000${video.videoUrl}`;
          } else {
            // 如果只是文件名，添加完整路径
            backendVideoUrl = `http://localhost:3000/uploads/${video.videoUrl}`;
          }
        } else {
          throw new Error('视频URL为空');
        }
        
        console.log('构建的视频播放URL:', backendVideoUrl);
          
        // 创建包含正确视频URL的对象副本
        currentVideo.value = {
          ...video,
          videoUrl: backendVideoUrl
        };
        
        videoDialogVisible.value = true
        
        // 在下一个DOM更新周期后设置视频自动播放
        nextTick(() => {
          const videoElement = document.getElementById('current-video-player')
          if (videoElement) {
            // 监听错误事件
            videoElement.onerror = (e) => {
              console.error('视频加载错误:', e);
              ElMessage.error('视频文件不存在或无法访问，请检查文件是否已正确上传');
            };
            
            setTimeout(() => {
              videoElement.play().catch(err => {
                console.warn('视频自动播放被阻止:', err)
              })
            }, 100)
          }
        })
      } catch (error) {
        console.error('播放视频失败:', error);
        ElMessage.error(`播放视频失败: ${error.message}`);
      }
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
    onMounted(async () => {
      // 先加载分类数据，确保等待完成
      await loadCategories()
      // 再加载视频列表
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
      playVideo,
      videoDialogVisible,
      currentVideo,
      processVideoCover,
      processVideoCoverUrl,
      handleSearch,
      handleReset,
      handleAddVideo,
      handleEditVideo,
      handleSubmit,
      handleDeleteVideo,
      handleToggleStatus,
      handleCustomCoverUpload,
      beforeUpload,
      beforeVideoUpload,
      handleVideoFileChange,
      submitVideoUpload,
      handleCustomVideoUpload,
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
/* 视频播放器样式 */
.video-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-info {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.video-info p {
  margin: 5px 0;
  color: #666;
}

/* 视频封面容器样式增强 */
.video-cover-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 80px;
  height: 60px;
  overflow: hidden;
  border-radius: 4px;
}

.video-cover-container:hover {
  transform: scale(1.05);
}

.play-icon-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 32px!important;
  height: 32px!important;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-cover-container:hover .play-icon-overlay {
  opacity: 1;
}

.play-icon {
  color: white;
  font-size: 16px;
}

.video-cover-container img {
  width: 100%;
  height: 100%;
  transition: filter 0.3s ease;
}

.video-cover-container:hover img {
  filter: brightness(0.8);
}

.el-image{
  width: 80px;
  height: 60px!important;
}

/* 让下拉框自适应宽度 */
.auto-width-select {
  /* 基础宽度设置 */
  min-width: 120px;
}

/* 下拉菜单自适应内容宽度 */
.auto-width-select .el-select-dropdown {
  min-width: 100%;
  width: auto;
  white-space: nowrap;
}

/* 确保下拉菜单项不会换行 */
.auto-width-select .el-select-dropdown__item {
  white-space: nowrap;
  overflow: visible;
}
</style>