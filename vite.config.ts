import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**']
    }
  },

  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.app/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],

  // 构建优化
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Vue 相关库分离
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将 Element Plus 分离
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          // 将 dayjs 分离
          'dayjs': ['dayjs']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
