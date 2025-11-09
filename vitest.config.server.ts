/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/__tests__/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
})

