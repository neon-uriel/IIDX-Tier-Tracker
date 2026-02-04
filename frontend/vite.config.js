/// <reference types="vitest" />
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
