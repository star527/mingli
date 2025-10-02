<template>
  <div class="admin-layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside width="240px" class="sidebar">
        <div class="logo-container">
          <h1 class="logo-text">AI算命管理后台</h1>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          @select="handleMenuSelect"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/memberships">
            <el-icon><StarFilled /></el-icon>
            <span>会员管理</span>
          </el-menu-item>
          <el-menu-item index="/membership-levels">
            <el-icon><Medal /></el-icon>
            <span>会员等级管理</span>
          </el-menu-item>
          <el-menu-item index="/videos">
            <el-icon><VideoPlay /></el-icon>
            <span>视频课程管理</span>
          </el-menu-item>
          <el-menu-item index="/video-categories">
            <el-icon><Grid /></el-icon>
            <span>视频分类管理</span>
          </el-menu-item>
          <el-menu-item index="/finance">
            <el-icon><Wallet /></el-icon>
            <span>财务管理</span>
          </el-menu-item>
          <el-menu-item index="/withdrawals">
            <el-icon><Document /></el-icon>
            <span>提现管理</span>
          </el-menu-item>
          <el-menu-item index="/analytics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-button type="text" @click="toggleSidebar" class="sidebar-toggle">
              <el-icon><Menu /></el-icon>
            </el-button>
          </div>
          <div class="header-right">
            <!-- API测试按钮 -->
            <el-button type="primary" size="small" @click="testApi" style="margin-right: 10px;">测试API</el-button>
            <el-dropdown @command="handleDropdownCommand">
              <span class="user-info">
                <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"></el-avatar>
                <span class="username">{{ currentUser?.username || '管理员' }}</span>
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主内容区域 -->
        <el-main class="main-content">
          <!-- 优化路由视图渲染 -->
          <router-view v-slot="{ Component, route }">
            <!-- 只有当组件存在时才渲染 -->
            <div v-if="Component" :key="`${route.path}-${Date.now()}`">
              <!-- 添加时间戳确保每次都重新创建组件实例 -->
              <component :is="Component" />
            </div>
            <!-- 组件不存在时显示加载提示 -->
            <div v-else class="loading-placeholder">
              <el-empty description="页面加载中..." />
            </div>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, User, StarFilled, VideoPlay, Wallet, DataAnalysis, Menu, ArrowDown, Medal, Grid, Document } from '@element-plus/icons-vue'
import { authApi } from '@/api'

export default {
  name: 'AdminLayout',
  components: {
    HomeFilled,
    User,
    StarFilled,
    VideoPlay,
    Wallet,
    DataAnalysis,
    Menu,
    ArrowDown,
    Medal,
    Grid,
    Document
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const currentUser = ref({})
    const isSidebarCollapse = ref(false)
    
    // 计算当前激活的菜单
    const activeMenu = computed(() => {
      return route.path
    })
    
    // 切换侧边栏展开/收起
    const toggleSidebar = () => {
      isSidebarCollapse.value = !isSidebarCollapse.value
    }
    
    // 处理菜单选择
    const handleMenuSelect = (key, keyPath) => {
      console.log('菜单选中:', key, keyPath)
    }
    
    // 处理下拉菜单命令
    const handleDropdownCommand = (command) => {
      if (command === 'logout') {
        handleLogout()
      } else if (command === 'profile') {
        // 可以跳转到个人信息页面
        console.log('查看个人信息')
      }
    }
    
    // 退出登录
    const handleLogout = () => {
      authApi.logout()
        .then(() => {
          console.log('退出登录成功，清除token和用户信息')
          // 使用正确的token键名
          localStorage.removeItem('admin_token')
          sessionStorage.removeItem('admin_token')
          // 清除用户信息
          localStorage.removeItem('admin_user_info')
          sessionStorage.removeItem('admin_user_info')
          // 强制跳转登录页
          router.replace('/login')
        })
        .catch(err => {
          console.error('退出登录失败:', err)
          // 即使失败也要清除本地数据
          localStorage.removeItem('admin_token')
          sessionStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user_info')
          sessionStorage.removeItem('admin_user_info')
          router.replace('/login')
        })
    }
    
    // 获取当前用户信息
    const fetchCurrentUser = () => {
      // 直接使用默认管理员信息，避免API调用失败导致页面空白
      currentUser.value = {
        id: '1',
        username: '管理员',
        role: 'admin'
      }
      
      // 异步尝试获取真实用户信息，但不影响界面渲染
      authApi.getCurrentUser()
        .then(res => {
          if (res && res.data) {
            currentUser.value = res.data
          }
        })
        .catch(err => {
          console.error('获取用户信息失败:', err)
          // 失败时保持默认信息
        })
    }
    
    // 测试API请求
    const testApi = () => {
      console.log('开始测试API请求...')
      authApi.getCurrentUser()
        .then(res => {
          console.log('API请求测试完成，响应:', res)
        })
        .catch(err => {
          console.error('API测试失败:', err)
        })
    }
    
    onMounted(() => {
      fetchCurrentUser()
    })
    
    return {
      currentUser,
      isSidebarCollapse,
      activeMenu,
      toggleSidebar,
      handleMenuSelect,
      handleDropdownCommand,
      testApi
    }
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.sidebar {
  background-color: #001529;
  color: #fff;
  height: 100%;
  overflow-y: auto;
}

.logo-container {
  padding: 20px;
  border-bottom: 1px solid #1f2937;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  margin: 0;
  text-align: center;
}

.sidebar-menu {
  border-right: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.65);
  background-color: transparent;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #1890ff;
  color: #fff;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #1890ff;
  color: #fff;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.sidebar-toggle {
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f0f0f0;
}

.username {
  margin: 0 10px;
  font-size: 14px;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>