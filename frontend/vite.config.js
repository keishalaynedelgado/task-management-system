import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    hmr: {
      overlay: false
    },
    // Forward API calls to the backend so the browser only talks to this
    // dev server. Same origin means no CORS errors, whatever host/port the
    // app is opened on (localhost, 127.0.0.1, LAN IP, VS Code preview...).
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  }
})