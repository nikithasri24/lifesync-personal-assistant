# Testing Guide

## Overview

LifeSync uses a comprehensive testing strategy with unit tests, integration tests, and E2E tests.

## Test Stack

- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Coverage**: Vitest coverage (c8)

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run watch:unit

# Run tests with UI
npm test:ui

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage

# Run type checking + tests in watch mode (recommended during development)
npm run guard
```

## Test Structure

```
src/
├── components/__tests__/
├── hooks/__tests__/
├── pages/__tests__/
├── utils/__tests__/
└── api/__tests__/

tests/
└── e2e/
    ├── reorder.spec.ts
    ├── subtask-quickadd.spec.ts
    └── quickadd-parse.spec.ts
```

## Current Test Coverage

### Well-Tested Features ✅
- **Tasks/Todos**: 27 test files covering:
  - Filters and sorting
  - Bulk actions
  - Drag and drop
  - Quick-add parsing
  - Inline editing
  - Calendar integration
  - Project management

- **Habits**: 14 test files covering:
  - CRUD operations
  - Progress tracking
  - Frequency patterns
  - Category management
  - Validation

- **Utilities**:
  - `validation.ts`
  - `dataManager.ts`
  - `healthSync.ts`
  - `motivationalQuotes.ts`

### Needs Tests ⚠️
- Travel features
- Shopping lists
- Meal planning
- Skincare tracking
- Notes (API exists, no tests)
- Goals/Dreams (API exists, no tests)
- Journal (API exists, no tests)
- Main store (`useRealAppStore`)

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { parseQuickAddText } from '../utils/quickAdd';

describe('Quick Add Parser', () => {
  it('should parse project assignment', () => {
    const result = parseQuickAddText('Buy milk #project:Shopping');
    expect(result.title).toBe('Buy milk');
    expect(result.projectName).toBe('Shopping');
  });

  it('should parse due date', () => {
    const result = parseQuickAddText('Call mom @tomorrow');
    expect(result.title).toBe('Call mom');
    expect(result.dueDate).toBeDefined();
  });
});
```

### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingSpinner message="Saving..." />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('task reordering persists', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Create tasks
  await page.fill('[data-testid="task-input"]', 'First task');
  await page.click('[data-testid="add-task"]');

  await page.fill('[data-testid="task-input"]', 'Second task');
  await page.click('[data-testid="add-task"]');

  // Drag and drop
  const firstTask = page.locator('[data-testid="task-0"]');
  const secondTask = page.locator('[data-testid="task-1"]');
  await firstTask.dragTo(secondTask);

  // Verify order persists after reload
  await page.reload();
  const tasks = page.locator('[data-testid^="task-"]');
  await expect(tasks.first()).toContainText('Second task');
});
```

## Testing Best Practices

### Do's ✅
- Test behavior, not implementation
- Use `data-testid` attributes for reliable selectors
- Mock external dependencies (Supabase, APIs)
- Test error states and edge cases
- Keep tests focused and atomic
- Use descriptive test names

### Don'ts ❌
- Don't test implementation details
- Don't make tests dependent on each other
- Don't use brittle selectors (CSS classes, nth-child)
- Don't ignore async operations
- Don't skip cleanup

## Mocking Supabase

```typescript
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: '1', title: 'Test' }],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '1', title: 'Test' },
            error: null
          }))
        }))
      }))
    }))
  },
  isSupabaseConfigured: true
}));
```

## Quick-Add Token Syntax

The quick-add parser supports these tokens:

- `#project:Name` or `#project:"Name With Spaces"` - Project assignment
- `#tag1 #tag2` or `@tag1 @tag2` - Tags
- `@today`, `@tomorrow`, `@YYYY-MM-DD` - Due dates
- `!urgent`, `!high`, `!medium`, `!low` or `!1`, `!2`, `!3`, `!4` - Priority

Example:
```
Buy groceries #project:Personal @tomorrow !high #shopping #food
```

Results in:
- Title: "Buy groceries"
- Project: "Personal"
- Due: Tomorrow's date
- Priority: "high"
- Tags: ["shopping", "food"]

## CI/CD Integration

Tests run automatically on:
- Every push to any branch
- Every pull request
- Pre-push git hook (via Husky)

GitHub Actions workflow:
```yaml
- name: Run tests
  run: npm test

- name: Type check
  run: npm run typecheck

- name: E2E tests
  run: npm run test:e2e
```

## Test Data Management

### Test Users
E2E tests should use dedicated test accounts:
```
test-user-1@example.com
test-user-2@example.com
```

### Database State
- Tests should clean up after themselves
- Use transactions when possible
- Reset test data between E2E test runs

## Debugging Tests

### Vitest UI
```bash
npm run test:ui
```
Opens a browser-based UI for debugging tests.

### Playwright Inspector
```bash
npx playwright test --debug
```
Step through E2E tests with visual debugging.

### Console Logs
```typescript
import { screen, logRoles } from '@testing-library/react';

// Log DOM structure
logRoles(screen.getByRole('main'));

// Log specific element
screen.debug(screen.getByText('Hello'));
```

## Coverage Goals

Target coverage levels:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Current coverage (as of latest):
- **Tasks/Todos**: ~90%
- **Habits**: ~85%
- **Utilities**: ~70%
- **Overall**: ~40% (many features untested)

## Adding Tests for New Features

When adding a new feature:

1. **Create test file**: `src/features/myFeature/__tests__/MyFeature.test.tsx`
2. **Write unit tests**: Test pure functions and utilities
3. **Write component tests**: Test UI interactions
4. **Write integration tests**: Test API integration
5. **Write E2E test**: Test critical user flow
6. **Verify coverage**: Ensure >80% coverage for new code

## Common Testing Patterns

### Testing Async Operations
```typescript
it('loads data on mount', async () => {
  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing User Events
```typescript
it('handles button click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button', { name: 'Submit' }));
  expect(screen.getByText('Submitted')).toBeInTheDocument();
});
```

### Testing Forms
```typescript
it('submits form with valid data', async () => {
  const onSubmit = vi.fn();
  render(<MyForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
