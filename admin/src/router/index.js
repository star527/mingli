import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/components/Layout/index.vue'),
    meta: { requiresAuth: true, title: '管理后台' },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true, title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/UserManagement.vue'),
        meta: { requiresAuth: true, title: '用户管理' }
      },
      {
        path: 'memberships',
        name: 'MembershipManagement',
        component: () => import('@/views/MembershipManagement.vue'),
        meta: { requiresAuth: true, title: '会员管理' }
      },
      {
        path: 'videos',
        name: 'VideoManagement',
        component: () => import('@/views/VideoManagement.vue'),
        meta: { requiresAuth: true, title: '视频管理' }
      },
      {
        path: 'finance',
        name: 'FinanceManagement',
        component: () => import('@/views/FinanceManagement.vue'),
        meta: { requiresAuth: true, title: '财务管理' }
      },
      {
        path: 'analytics',
        name: 'DataAnalysis',
        component: () => import('@/views/DataAnalysis.vue'),
        meta: { requiresAuth: true, title: '数据分析' }
      }
    ]
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { requiresAuth: false, title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '管理后台'} - 明礼管理系统`
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 需要认证，检查是否有token
    if (!getToken()) {
      // 没有token，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      // 有token，继续访问
      next()
    }
  } else {
    // 不需要认证，直接访问
    next()
  }
})

export default router