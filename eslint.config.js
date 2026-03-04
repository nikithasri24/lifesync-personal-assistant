import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist', '__mocks__', 'tests/**/*.ts', 'vitest.config.ts', 'playwright.config.ts']),
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
      // Architecture: Supabase Access Control
      // ==========================================
      // Supabase client should only be imported in src/api/ and src/lib/
      // Type imports are allowed everywhere
      // This is enforced via file-specific overrides below
      'no-restricted-imports': [
        'warn', // Warn for now during migration, change to 'error' when migration is complete
        {
          paths: [
            {
              name: '@/lib/supabase',
              importNames: ['supabase'],
              message: 'Direct Supabase client imports are only allowed in src/api/ and src/lib/. Use API layer functions instead. Type imports are allowed.',
            },
            {
              name: '../lib/supabase',
              importNames: ['supabase'],
              message: 'Direct Supabase client imports are only allowed in src/api/ and src/lib/. Use API layer functions instead. Type imports are allowed.',
            },
            {
              name: '../../lib/supabase',
              importNames: ['supabase'],
              message: 'Direct Supabase client imports are only allowed in src/api/ and src/lib/. Use API layer functions instead. Type imports are allowed.',
            },
            {
              name: '../../../lib/supabase',
              importNames: ['supabase'],
              message: 'Direct Supabase client imports are only allowed in src/api/ and src/lib/. Use API layer functions instead. Type imports are allowed.',
            },
            {
              name: '@/hooks/useFinanceQuery',
              importNames: ['useFinanceMergedConnectionQuery'],
              message: 'Deprecated. Use useFinanceMergedConnection() from @/finance/hooks/useFinanceMergedMode instead.',
            },
          ],
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
  // ==========================================
  // Exception: API Files (CRUD operations)
  // ==========================================
  {
    files: ['**/api/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 700, skipBlankLines: true, skipComments: true }], // API files with CRUD can be longer
      'no-restricted-imports': 'off', // API layer is allowed to import Supabase
    },
  },
  // ==========================================
  // Exception: Lib Files (Infrastructure)
  // ==========================================
  {
    files: ['**/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off', // Lib layer is allowed to import Supabase
    },
  },
  // ==========================================
  // Exception: Service Files (Complex Logic)
  // ==========================================
  {
    files: ['**/services/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }], // Service files with complex logic can be longer
    },
  },
  // ==========================================
  // Exception: Complex View Components
  // ==========================================
  {
    files: ['**/components/views/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }], // View components can be longer
    },
  },
  // ==========================================
  // Exception: React Query Hooks (Multiple Queries/Mutations)
  // ==========================================
  {
    files: ['**/hooks/**/*Query.{ts,tsx}', '**/hooks/**/*Mutation.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }], // Query/mutation hooks with many operations can be longer
    },
  },
  // ==========================================
  // Exception: Logger Service (needs console)
  // ==========================================
  {
    files: ['src/services/logger.ts', 'cli/src/utils/logger.ts'],
    rules: {
      'no-console': 'off', // Logger implementation needs console
    },
  },
  // ==========================================
  // Exception: Auth Provider (needs direct Supabase access)
  // ==========================================
  {
    files: ['src/providers/AuthProvider.tsx', 'src/components/AuthGate.tsx'],
    rules: {
      'no-restricted-imports': 'off', // Auth needs direct Supabase access
    },
  },
  // ==========================================
  // Exception: Domain API Files (allowed in api/ folders)
  // ==========================================
  // Note: Files in **/api/** are already covered by the rule on line 180
  // Domain-specific API files (src/goals/api/, src/travel/api/, etc.) are compliant
  // ==========================================
  // Exception: CLI Files (different module system)
  // ==========================================
  {
    files: ['cli/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './cli/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  // ==========================================
  // STATE MANAGEMENT BOUNDARIES
  // ==========================================
  // Enforce clear separation: Zustand = UI State, React Query = Server State
  {
    files: ['src/stores/slices/**/*.ts'],
    rules: {
      // Prevent server state in Zustand slices
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@tanstack/react-query', '@tanstack/react-query/*'],
              message: 'Zustand slices should NOT use React Query. Use React Query hooks in components instead. Zustand is for UI state only (filters, modals, view modes).',
            },
            {
              group: ['**/api/**', '@/api/**'],
              message: 'Zustand slices should NOT import from API layer. API calls belong in React Query hooks, not Zustand. Keep Zustand for UI state only.',
            },
            {
              group: ['@/lib/supabase', '../../../lib/supabase', '../../lib/supabase', '../lib/supabase'],
              message: 'Zustand slices should NOT use Supabase client. Database operations belong in API layer with React Query hooks. Keep Zustand for UI state only.',
            },
          ],
        },
      ],
      // Prevent data fetching patterns in Zustand slices
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="fetch"]',
          message: 'Zustand slices should NOT fetch data. Use React Query hooks in components. Zustand is for UI state only (filters, modals, view modes).',
        },
        {
          selector: 'AwaitExpression[argument.callee.object.name="supabase"]',
          message: 'Zustand slices should NOT query Supabase. Use React Query hooks in components. Zustand is for UI state only (filters, modals, view modes).',
        },
        {
          selector: 'ImportDeclaration[source.value="axios"] ~ * CallExpression[callee.object.name="axios"]',
          message: 'Zustand slices should NOT make HTTP requests. Use React Query hooks in components. Zustand is for UI state only (filters, modals, view modes).',
        },
      ],
    },
  },
])
