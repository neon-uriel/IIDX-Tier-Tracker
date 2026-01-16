/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend server
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Removed rewrite
      },
      '/auth': {
        target: 'http://localhost:5000', // Your backend server for authentication
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/auth/, '/auth'), // Removed rewrite
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
