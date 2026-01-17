/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

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
  css: { // Add this block
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
