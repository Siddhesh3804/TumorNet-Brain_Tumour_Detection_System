import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/register': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
})
