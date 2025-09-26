/// <reference types="vitest" />
import { defineConfig } from 'vite'
import dotenv from 'dotenv'

// Ensure env vars are available during tests. Prefer .env.test when NODE_ENV=test.
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : undefined })
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', '**/__tests__/**', '**/*.d.ts'],
    },
  },
})
