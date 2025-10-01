<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-header">
        <h2 class="login-title">AI算命管理后台</h2>
        <p class="login-subtitle">管理员登录</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        class="login-form"
      >
        <el-form-item label="管理员ID" prop="adminId">
          <el-input
            v-model="loginForm.adminId"
            placeholder="请输入管理员ID"
            prefix-icon="User"
            clearable
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
        
        <el-divider></el-divider>
        
        <div class="login-tip">
          <p>💡 开发环境提示：</p>
          <p>初始管理员ID: 1</p>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    
    const loginForm = reactive({
      adminId: '',
      remember: false
    })
    
    const loginRules = {
      adminId: [
        { required: true, message: '请输入管理员ID', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      loginFormRef.value.validate(async (valid) => {
        if (valid) {
          loading.value = true
          
          try {
            // 使用真实的API进行登录
            const response = await authApi.login({
              adminId: loginForm.adminId
            })
            
            if (response.success) {
              // 保存token和用户信息
              const { token, user } = response.data
              
              if (loginForm.remember) {
                localStorage.setItem('admin_token', token)
                localStorage.setItem('admin_user_info', JSON.stringify(user))
                localStorage.setItem('savedAdminId', loginForm.adminId)
              } else {
                sessionStorage.setItem('admin_token', token)
                sessionStorage.setItem('admin_user_info', JSON.stringify(user))
              }
              
              loading.value = false
              ElMessage.success('登录成功')
              
              // 跳转到首页
              router.push('/')
            } else {
              loading.value = false
              ElMessage.error(response.message || '登录失败')
            }
          } catch (error) {
            loading.value = false
            console.error('登录错误:', error)
            ElMessage.error(error.response?.data?.message || '登录失败，请稍后重试')
          }
        }
      })
    }
    
    // 检查是否已登录
    onMounted(() => {
      const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')
      if (token) {
        // 如果已经登录，直接跳转到首页
        router.push('/')
      } else {
        // 尝试从localStorage恢复管理员ID
        const savedAdminId = localStorage.getItem('savedAdminId')
        if (savedAdminId) {
          loginForm.adminId = savedAdminId
          loginForm.remember = true
        } else {
          // 开发环境默认填充管理员ID
          loginForm.adminId = '1'
        }
      }
    })
    
    return {
      loginFormRef,
      loginForm,
      loginRules,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-form-wrapper {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-form-wrapper:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px;
}

.login-subtitle {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

.login-form {
  width: 100%;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.login-tip {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.login-tip p {
  margin: 5px 0;
  color: #606266;
  font-size: 13px;
}

.login-tip p:first-child {
  color: #303133;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-form-wrapper {
    padding: 30px 20px;
  }
  
  .login-title {
    font-size: 20px;
  }
  
  .login-tip {
    padding: 10px;
  }
  
  .login-tip p {
    font-size: 12px;
  }
}
</style>