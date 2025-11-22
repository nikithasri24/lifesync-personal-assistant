import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist', '__mocks__']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ==========================================
      // TypeScript: No 'any' Types (CRITICAL)
      // ==========================================
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // ==========================================
      // TypeScript: Require Explicit Types
      // ==========================================
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true, // Allow inference in arrow functions used as expressions
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // ==========================================
      // Code Quality: No Console
      // ==========================================
      'no-console': 'error', // Don't allow ANY console usage - use logger instead

      // ==========================================
      // File Size Limit
      // ==========================================
      'max-lines': [
        'error',
        {
          max: 400,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // ==========================================
      // Code Quality: General
      // ==========================================
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'no-unused-vars': 'off', // Turn off base rule
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ==========================================
      // React Best Practices
      // ==========================================
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // Warn instead of error for flexibility

      // ==========================================
      // TypeScript: Prefer Type-Safe Patterns
      // ==========================================
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn', // Allow ! but warn
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
    },
  },
  // ==========================================
  // Exception: Allow 'any' in Test Files
  // ==========================================
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**/*.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'max-lines': 'off', // Allow longer test files
    },
  },
  // ==========================================
  // Exception: Type Declaration Files
  // ==========================================
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow in type declarations when needed
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // ==========================================
  // Exception: Data/Fixture Files
  // ==========================================
  {
    files: ['**/data/**/*.{ts,tsx}', '**/fixtures/**/*.{ts,tsx}'],
    rules: {
      'max-lines': 'off', // Data files can be large
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error
    },
  },
])
