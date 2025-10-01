import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 后端API地址
        changeOrigin: true
        // 保留/api前缀，因为后端API路径需要这个前缀
      }
    }
  },
  build: {
    outDir: '../dist/admin',
    assetsDir: 'static',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('element-plus')) {
            return 'element-plus'
          }
          if (id.includes('vue-router')) {
            return 'vue-router'
          }
          if (id.includes('axios')) {
            return 'axios'
          }
        }
      }
    }
  }
})
