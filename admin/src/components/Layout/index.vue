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
          <el-menu-item index="/membership">
            <el-icon><StarFilled /></el-icon>
            <span>会员管理</span>
          </el-menu-item>
          <el-menu-item index="/videos">
            <el-icon><VideoPlay /></el-icon>
            <span>视频课程管理</span>
          </el-menu-item>
          <el-menu-item index="/finance">
            <el-icon><Wallet /></el-icon>
            <span>财务管理</span>
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
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, User, StarFilled, VideoPlay, Wallet, DataAnalysis, Menu, ArrowDown } from '@element-plus/icons-vue'
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
    ArrowDown
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
          localStorage.removeItem('adminToken')
          router.push('/login')
        })
        .catch(err => {
          console.error('退出登录失败:', err)
          localStorage.removeItem('adminToken')
          router.push('/login')
        })
    }
    
    // 获取当前用户信息
    const fetchCurrentUser = () => {
      authApi.getCurrentUser()
        .then(res => {
          currentUser.value = res.data
        })
        .catch(err => {
          console.error('获取用户信息失败:', err)
          // 如果获取用户信息失败，可能是token过期，跳转到登录页
          localStorage.removeItem('adminToken')
          router.push('/login')
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
      handleDropdownCommand
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