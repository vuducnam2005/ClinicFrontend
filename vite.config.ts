import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/gateway': {
        target: 'http://180.93.98.14:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gateway/, '/apigateway'),
      },
      '/n1': {
        target: 'http://180.93.98.14:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/n1/, '/appointment'),
      },
      '/n2': {
        target: 'http://180.93.98.14:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/n2/, '/medical'),
      },
      '/n3': {
        target: 'http://180.93.98.14:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/n3/, '/pharmacy'),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
