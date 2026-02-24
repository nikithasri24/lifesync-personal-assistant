# Testing Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies (if needed)
```bash
npm install
npx playwright install --with-deps
```

### 2. Set Up Test Environment

Create `.env.test`:
```bash
# Test Accounts
TEST_ACCOUNT_1_EMAIL=test1@lifesync.app
TEST_ACCOUNT_1_PASSWORD=TestAccount123!
TEST_ACCOUNT_2_EMAIL=test2@lifesync.app
TEST_ACCOUNT_2_PASSWORD=TestAccount456!

# Test Database (if using separate test DB)
VITE_SUPABASE_URL=your-test-supabase-url
VITE_SUPABASE_ANON_KEY=your-test-anon-key
```

---

## 🧪 Running Tests

### Unit & Component Tests (Fast - ~seconds)

```bash
# Run all unit tests
npm test

# Run in watch mode (auto-rerun on file changes)
npm test -- --watch

# Run specific test file
npm test src/hooks/useTasksQuery.test.ts

# Run tests matching pattern
npm test -- --grep "should create task"

# Generate coverage report
npm run test:coverage

# Open coverage report in browser
npm run coverage:report
```

### E2E Tests (Slower - ~minutes)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/e2e/specs/dashboard/quick-actions.spec.ts

# Run with specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Run tests with specific tag
npm run test:e2e -- --grep "@critical"  # Critical tests only
npm run test:e2e -- --grep "@p0"        # Priority 0 tests

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run in debug mode (pause on failure)
npm run test:e2e -- --debug

# Run with UI mode (interactive debugging)
npm run test:e2e -- --ui
```

### Visual Regression Tests

```bash
# Run visual tests
npm run test:e2e -- tests/e2e/visual/

# Update baseline screenshots
npm run test:e2e -- --update-snapshots
```

---

## 📊 Understanding Test Results

### Test Output

```
✓ Dashboard Quick Actions > Add Task Button > should open modal (523ms)
✓ Dashboard Quick Actions > Add Task Button > should create task (892ms)
✗ Dashboard Quick Actions > Add Task Button > should validate fields (234ms)

3 passed (2s)
1 failed
```

### Coverage Report

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------| ---------|---------|--------
hooks/useTasksQuery.ts  |   85.71 |    75.00 |   88.88 |   84.61
utils/taskHelpers.ts    |   92.30 |    83.33 |   90.00 |   91.66
```

---

## 🎯 Test Organization

### What Gets Tested Where

| Test Type | What It Tests | Location | Speed |
|-----------|---------------|----------|-------|
| **E2E Tests** | Full user workflows, UI interactions | `tests/e2e/` | Slow (minutes) |
| **Unit Tests** | Pure functions, utilities, business logic | `src/**/*.test.ts` | Fast (seconds) |
| **Component Tests** | React components in isolation | `src/**/*.test.tsx` | Fast (seconds) |
| **Visual Tests** | UI appearance, design compliance | `tests/e2e/visual/` | Slow (minutes) |

### Examples

**E2E Test** - Tests complete user flow:
```typescript
test('user can create and complete a task', async ({ page }) => {
  await page.goto('/todos');
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByRole('textbox').fill('Test task');
  await page.getByRole('button', { name: /create/i }).click();
  await page.getByRole('checkbox').click();
  await expect(page.getByText('Test task')).not.toBeVisible();
});
```

**Unit Test** - Tests pure function logic:
```typescript
test('calculateNextOccurrence returns correct date for daily tasks', () => {
  const task = { recurrence: 'daily', dueDate: '2026-02-01' };
  const next = calculateNextOccurrence(task);
  expect(next).toBe('2026-02-02');
});
```

**Component Test** - Tests React component:
```typescript
test('TaskCard renders with correct props', () => {
  render(<TaskCard title="Test" priority="high" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
  expect(screen.getByText('High')).toHaveClass('text-red-500');
});
```

**Visual Test** - Tests appearance:
```typescript
test('modal matches design spec', async ({ page }) => {
  await page.goto('/todos');
  await page.getByRole('button', { name: /add/i }).click();
  await expect(page.getByRole('dialog')).toHaveScreenshot();
});
```

---

## 🏷️ Test Tagging System

Tests are tagged for easy filtering:

| Tag | Meaning | Run Command |
|-----|---------|-------------|
| `@critical` | Must pass for production | `npm run test:e2e -- --grep "@critical"` |
| `@p0` | Priority 0 (highest) | `npm run test:e2e -- --grep "@p0"` |
| `@p1` | Priority 1 (high) | `npm run test:e2e -- --grep "@p1"` |
| `@p2` | Priority 2 (medium) | `npm run test:e2e -- --grep "@p2"` |
| `@a11y` | Accessibility tests | `npm run test:e2e -- --grep "@a11y"` |
| `@visual` | Visual regression | `npm run test:e2e -- --grep "@visual"` |
| `@integration` | Cross-module tests | `npm run test:e2e -- --grep "@integration"` |
| `@multi-user` | Multi-user scenarios | `npm run test:e2e -- --grep "@multi-user"` |

---

## 🐛 Debugging Failed Tests

### Playwright Debugging

```bash
# Run with trace
npm run test:e2e -- --trace on

# Open trace viewer
npx playwright show-trace trace.zip

# Run in debug mode
npm run test:e2e -- --debug

# Pause on failure
npm run test:e2e -- --headed --debug
```

### Viewing Test Reports

```bash
# Open Playwright HTML report
npx playwright show-report

# Open coverage report
npm run coverage:report
```

---

## 📝 Writing Your First Test

### 1. Create Test File

```bash
# E2E test
touch tests/e2e/specs/my-feature/my-test.spec.ts

# Unit test
touch src/myFeature/myFunction.test.ts
```

### 2. Write Test

**E2E Test Template:**
```typescript
import { test, expect } from '@playwright/test';
import { loginAsAccount1 } from '../../fixtures/test-accounts';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccount1(page);
    await page.goto('/my-feature');
  });

  test('should do something @p0', async ({ page }) => {
    // Arrange
    // ...

    // Act
    await page.getByRole('button').click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

**Unit Test Template:**
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return expected value', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 3. Run Your Test

```bash
# E2E
npm run test:e2e tests/e2e/specs/my-feature/my-test.spec.ts

# Unit
npm test src/myFeature/myFunction.test.ts
```

---

## 🔄 CI/CD Integration

Tests run automatically on:
- **Pre-commit**: Changed unit tests + linting
- **Pre-push**: All unit tests + critical E2E tests
- **Pull Request**: Full test suite (all browsers)
- **Main Branch**: Full suite + visual regression

---

## 📚 Next Steps

1. ✅ Read [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) for complete strategy
2. ✅ Review [QA-TESTING-PLAN.md](./QA-TESTING-PLAN.md) for test scenarios
3. ✅ Explore existing tests in `tests/e2e/`
4. ✅ Start writing tests for your QA plan scenarios
5. ✅ Set up CI/CD integration

---

## 💡 Pro Tips

### Speed Up E2E Tests
```bash
# Run tests in parallel
npm run test:e2e -- --workers=4

# Run only on one browser
npm run test:e2e -- --project=chromium
```

### Test Only What Changed
```bash
# Unit tests
npm test -- --changed

# E2E tests for specific module
npm run test:e2e tests/e2e/specs/dashboard/
```

### Debug Flaky Tests
```bash
# Run test 10 times to catch flakiness
npm run test:e2e -- --repeat-each=10 my-test.spec.ts
```

---

## ❓ Troubleshooting

### "Test timed out"
- Increase timeout: Add `test.setTimeout(60000)` in test file
- Check network conditions: Ensure dev server is running

### "Element not found"
- Use better selectors: Prefer `getByRole`, `getByLabel` over CSS
- Add explicit waits: `await page.waitForSelector()`

### "Screenshot mismatch"
- Update baseline: `npm run test:e2e -- --update-snapshots`
- Check viewport size: Ensure consistent browser size

---

## 🎓 Resources

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Your Testing Strategy](./TESTING-STRATEGY.md)
