/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

// Ensure env vars are available during tests. Prefer .env.test when NODE_ENV=test.
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : undefined })
import react from '@vitejs/plugin-react'

const r = (p: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), p)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      commander: r('cli/test/mocks/commander.ts'),
      inquirer: r('cli/test/mocks/inquirer.ts'),
      ora: r('cli/test/mocks/ora.ts'),
      chalk: r('cli/test/mocks/chalk.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'cli/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
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
