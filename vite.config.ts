import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/finance': path.resolve(__dirname, './src/finance'),
      '@/goals': path.resolve(__dirname, './src/goals'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/skincare': path.resolve(__dirname, './src/skincare'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/travel': path.resolve(__dirname, './src/travel'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  }
})
