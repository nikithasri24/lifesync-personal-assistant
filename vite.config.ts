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
      '@/journal': path.resolve(__dirname, './src/journal'),
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
    hmr: {
      // Fix WebSocket connection issues for iPhone
      clientPort: 5173,
      host: '192.168.1.240',
    },
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
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: true,

    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],

          // UI library chunks
          'ui-vendor': ['lucide-react', '@headlessui/react'],

          // Chart libraries (lazy loaded)
          'charts': ['recharts'],

          // Map libraries (lazy loaded)
          'maps': ['leaflet', 'react-leaflet'],

          // Finance module
          'finance': [
            './src/finance/pages/DashboardPage',
            './src/finance/pages/AccountsPage',
            './src/finance/pages/TransactionsPageGrouped',
            './src/finance/pages/RecurringPage',
            './src/finance/pages/NetWorthPage',
            './src/finance/pages/GoalsPage',
            './src/finance/pages/LoansPage',
            './src/finance/pages/RetirementPage',
            './src/finance/pages/ProjectionsPage',
            './src/finance/pages/CalculatorsPage',
            './src/finance/pages/CreditCardsPage',
            './src/finance/pages/InsurancePage',
            './src/finance/pages/SettingsPage',
          ],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB

    // Minification
    minify: 'esbuild', // Use esbuild for faster builds
  },
})
