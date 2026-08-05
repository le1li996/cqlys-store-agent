import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 站点基础路径：根路径 '/'
  // 说明：当前目标为「公开可访问链接」，已部署到 CloudStudio 云空间，
  // 静态服务入口在根路径，故 base 用 '/'。cqlys 品牌保留在标题/logo。
  // （若日后自有服务器 + cqlys.ai 域名，可用 nginx 反代根路径，base 无需再改。）
  base: '/',
  // 缓存放到 /tmp，避免 sudo 运行时在项目目录留下 root 权限的 .vite 缓存
  cacheDir: '/tmp/cqlys-vite-cache',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    // 开发期：把 /api 转发到本地 Node 后端（server/index.mjs，默认 8787）
    // VITE_API_MODE=real 时前端调用 /api/* 即走此代理。
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
