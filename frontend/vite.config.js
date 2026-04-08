import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy all backend routes to Flask in development
    proxy: {
      '/predict':     { target: 'http://localhost:5000', changeOrigin: true },
      '/health':      { target: 'http://localhost:5000', changeOrigin: true },
      '/tickets':     { target: 'http://localhost:5000', changeOrigin: true },
      '/feedback':    { target: 'http://localhost:5000', changeOrigin: true },
      '/departments': { target: 'http://localhost:5000', changeOrigin: true },
      '/stats':       { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
