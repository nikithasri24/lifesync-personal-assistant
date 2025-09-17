/**
 * Vitest Configuration for ProjectTracking Component Tests
 * 
 * This configuration ensures all our tests run properly with the right
 * environment and mocks set up.
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: [
      './src/test/setup.ts'
    ],
    
    // Global test configuration
    globals: true,
    
    // Test timeout
    testTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/pages/ProjectTracking.tsx'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/__tests__/**',
        'src/**/*.test.*',
        'src/**/*.spec.*'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        'src/pages/ProjectTracking.tsx': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      }
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../src'),
      '@components': path.resolve(__dirname, '../../../src/components'),
      '@pages': path.resolve(__dirname, '../../../src/pages'),
      '@utils': path.resolve(__dirname, '../../../src/utils'),
      '@types': path.resolve(__dirname, '../../../src/types'),
    },
  },
});