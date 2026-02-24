# LifeSync Automated Testing Strategy

## Overview

This document outlines the automated testing strategy for LifeSync to efficiently cover all scenarios in the QA testing plan without manual repetition.

---

## 1. Test Pyramid

```
         /\
        /  \  E2E Tests (Playwright)
       /----\  - Critical user flows
      /      \ - Multi-user scenarios
     /--------\ Integration Tests (Vitest)
    /          \ - API integration
   /------------\ - Cross-module features
  /______________\ Unit Tests (Vitest)
                  - Hooks, utils, components
```

### Coverage Goals
- **Unit Tests**: 80% coverage target
- **Integration Tests**: All API endpoints, cross-module features
- **E2E Tests**: All critical user flows, all modules

---

## 2. Testing Tools

### E2E Testing: Playwright
- **What**: Full user flows, multi-user scenarios, visual testing
- **Where**: `tests/e2e/`
- **Run**: `npm run test:e2e`
- **Browsers**: Chromium, Firefox, WebKit

### Unit Testing: Vitest
- **What**: Hooks, utilities, pure functions
- **Where**: `src/**/*.test.{ts,tsx}`
- **Run**: `npm test`
- **Coverage**: `npm run test:coverage`

### Component Testing: React Testing Library
- **What**: React components in isolation
- **Where**: `src/**/*.test.tsx`
- **Run**: `npm test`

### Visual Regression: Playwright
- **What**: Screenshot comparison, design compliance
- **Where**: `tests/e2e/visual/`
- **Run**: `npm run test:visual`

---

## 3. Test Organization

### 3.1 E2E Tests (Playwright)

Organized by feature module matching the QA plan:

```
tests/e2e/specs/
├── 01-auth/
│   ├── sign-in.spec.ts
│   ├── sign-up.spec.ts
│   ├── session-persistence.spec.ts
│   └── sign-out.spec.ts
├── 02-dashboard/
│   ├── display.spec.ts
│   ├── quick-actions.spec.ts
│   └── integration.spec.ts
├── 03-tasks/
│   ├── creation.spec.ts
│   ├── operations.spec.ts
│   ├── views.spec.ts
│   ├── filters.spec.ts
│   └── merged-mode.spec.ts
├── 04-habits/
│   ├── creation.spec.ts
│   ├── tracking.spec.ts
│   ├── views.spec.ts
│   └── merged-mode.spec.ts
├── 05-notes/
├── 06-journal/
├── 07-goals/
├── 08-shopping/
├── 09-meals/
├── 10-finance/
├── 11-calendar/
├── 12-together/
├── 19-global-ui/
│   ├── theme.spec.ts
│   ├── modals.spec.ts
│   ├── forms.spec.ts
│   ├── navigation.spec.ts
│   └── toast.spec.ts
├── 20-accessibility/
│   ├── keyboard-navigation.spec.ts
│   ├── aria-labels.spec.ts
│   └── screen-reader.spec.ts
├── 21-integration/
│   ├── cross-feature.spec.ts
│   └── real-time.spec.ts
└── 22-multi-user/
    ├── partner-connection.spec.ts
    ├── merged-mode-tasks.spec.ts
    ├── merged-mode-habits.spec.ts
    └── owner-filtering.spec.ts
```

### 3.2 Page Object Model (POM)

Each feature has a page object for reusable selectors and actions:

```typescript
// Example: tests/e2e/page-objects/tasks.page.ts
export class TasksPage {
  constructor(private page: Page) {}

  // Selectors
  readonly fabButton = () => this.page.getByRole('button', { name: /add task/i });
  readonly taskList = () => this.page.getByTestId('task-list');
  readonly quickAddModal = () => this.page.getByRole('dialog', { name: /add task/i });

  // Actions
  async goto() {
    await this.page.goto('/todos');
  }

  async createTask(title: string) {
    await this.fabButton().click();
    await this.page.getByRole('textbox', { name: /title/i }).fill(title);
    await this.page.getByRole('button', { name: /create/i }).click();
  }

  async completeTask(taskName: string) {
    const task = this.page.getByRole('listitem', { name: taskName });
    await task.getByRole('checkbox').click();
  }

  // Assertions
  async expectTaskCount(count: number) {
    await expect(this.taskList().getByRole('listitem')).toHaveCount(count);
  }
}
```

### 3.3 Test Fixtures

Shared test setup and teardown:

```typescript
// tests/e2e/fixtures/auth.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Login with test account
    await page.goto('/');
    await page.getByRole('textbox', { name: /email/i }).fill('test1@lifesync.app');
    await page.getByRole('textbox', { name: /password/i }).fill('TestAccount123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/');

    await use(page);

    // Cleanup if needed
  },
});
```

---

## 4. Test Execution Strategy

### 4.1 Local Development

```bash
# Run all unit tests (fast feedback)
npm test

# Run unit tests in watch mode
npm test -- --watch

# Run E2E tests for specific module
npm run test:e2e -- tests/e2e/specs/03-tasks/

# Run E2E tests with UI (debugging)
npm run test:e2e -- --ui

# Run visual regression tests
npm run test:visual
```

### 4.2 Pre-Commit (Fast)

```bash
# Run changed tests only
npm test -- --changed

# Run linting
npm run lint
```

### 4.3 Pre-Push (Comprehensive)

```bash
# Run all unit tests
npm test -- --run

# Run critical E2E flows
npm run test:e2e -- --grep "@critical"

# Check coverage
npm run coverage:check
```

### 4.4 CI/CD (Complete)

```bash
# Full test suite
npm run validate  # typecheck + lint + unit tests
npm run test:e2e  # All E2E tests on 3 browsers
npm run test:visual  # Visual regression
npm run coverage:check  # Coverage thresholds
```

---

## 5. Test Data Management

### 5.1 Test Accounts

**DO NOT hardcode credentials**. Use environment variables:

```env
# .env.test
TEST_ACCOUNT_1_EMAIL=test1@lifesync.app
TEST_ACCOUNT_1_PASSWORD=TestAccount123!
TEST_ACCOUNT_2_EMAIL=test2@lifesync.app
TEST_ACCOUNT_2_PASSWORD=TestAccount456!
```

### 5.2 Test Data Generators

```typescript
// tests/e2e/fixtures/test-data.ts
export const testData = {
  task: (overrides?: Partial<Task>) => ({
    title: `Test Task ${Date.now()}`,
    description: 'Created by automated test',
    priority: 'medium',
    status: 'todo',
    ...overrides,
  }),

  habit: (overrides?: Partial<Habit>) => ({
    name: `Test Habit ${Date.now()}`,
    frequency: 'daily',
    category: 'health',
    ...overrides,
  }),
};
```

### 5.3 Database State Management

```typescript
// tests/e2e/fixtures/database.ts
export async function cleanupTestData(userId: string) {
  // Delete all test tasks
  await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .like('title', 'Test Task%');
}

export async function seedTestData(userId: string) {
  // Create baseline data for tests
  await supabase.from('tasks').insert([
    { user_id: userId, title: 'Existing Task 1', status: 'todo' },
    { user_id: userId, title: 'Existing Task 2', status: 'done' },
  ]);
}
```

---

## 6. Coverage Mapping: QA Plan → Automated Tests

### QA Plan Section 3: TASKS MODULE → `tests/e2e/specs/03-tasks/`

| QA Test Case | Automated Test | Priority |
|--------------|---------------|----------|
| Create task from FAB | `creation.spec.ts` - FAB creation | P0 |
| Quick add modal | `creation.spec.ts` - Quick add | P0 |
| Voice input | `creation.spec.ts` - Voice input | P1 |
| Edit task | `operations.spec.ts` - Edit | P0 |
| Complete task | `operations.spec.ts` - Complete | P0 |
| Delete task | `operations.spec.ts` - Delete | P0 |
| 6 view modes | `views.spec.ts` - All views | P1 |
| Filter by status | `filters.spec.ts` - Status filter | P1 |
| Search tasks | `filters.spec.ts` - Search | P1 |
| Merged mode | `merged-mode.spec.ts` - Partner tasks | P1 |

**Test Tagging**:
```typescript
test('should create task from FAB @critical @p0', async ({ page }) => {
  // Test implementation
});

test('should filter tasks by status @filters @p1', async ({ page }) => {
  // Test implementation
});
```

**Run critical tests only**:
```bash
npm run test:e2e -- --grep "@critical"
```

---

## 7. Multi-User Testing Strategy

### 7.1 Parallel Browser Contexts

Use two authenticated contexts for multi-user scenarios:

```typescript
test('should show partner tasks in merged mode', async ({ browser }) => {
  // Account 1
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await loginAs(page1, 'test1@lifesync.app');

  // Account 2
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await loginAs(page2, 'test2@lifesync.app');

  // Test partner connection
  await connectPartners(page1, page2);

  // Test merged mode visibility
  await page1.goto('/todos?merged=true');
  await page2.createTask('Partner Task');
  await expect(page1.getByText('Partner Task')).toBeVisible();
});
```

### 7.2 Real-Time Subscription Testing

Test Supabase real-time features:

```typescript
test('should receive toast when partner sends message', async ({ browser }) => {
  const [page1, page2] = await createPartnerPages(browser);

  // Page 1 waits for toast
  const toastPromise = page1.waitForSelector('[role="alert"]');

  // Page 2 sends message
  await page2.goto('/together');
  await page2.getByRole('button', { name: /new message/i }).click();
  await page2.getByRole('textbox').fill('Test message');
  await page2.getByRole('button', { name: /send/i }).click();

  // Page 1 receives toast
  const toast = await toastPromise;
  await expect(toast).toContainText('New message');
});
```

---

## 8. Visual Regression Testing

### 8.1 Setup Visual Tests

```typescript
// tests/e2e/visual/design-compliance.spec.ts
import { test, expect } from '@playwright/test';

test('Dashboard matches design spec', async ({ page }) => {
  await page.goto('/');

  // Take full page screenshot
  await expect(page).toHaveScreenshot('dashboard-full.png', {
    fullPage: true,
    animations: 'disabled',
  });
});

test('Task modal matches design spec', async ({ page }) => {
  await page.goto('/todos');
  await page.getByRole('button', { name: /add task/i }).click();

  const modal = page.getByRole('dialog');
  await expect(modal).toHaveScreenshot('task-modal.png');
});
```

### 8.2 Design Spec Comparison

Compare against design HTML files:

```bash
# Generate baseline screenshots from design specs
npm run test:visual:baseline

# Run visual diff against baseline
npm run test:visual
```

---

## 9. Accessibility Testing

### 9.1 Automated a11y Tests

```typescript
// tests/e2e/specs/20-accessibility/keyboard-navigation.spec.ts
test('should navigate modals with keyboard', async ({ page }) => {
  await page.goto('/todos');

  // Open modal with keyboard
  await page.keyboard.press('Tab');  // Focus FAB
  await page.keyboard.press('Enter'); // Open modal

  // Modal should be visible
  await expect(page.getByRole('dialog')).toBeVisible();

  // Close modal with ESC
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// tests/e2e/specs/20-accessibility/aria-labels.spec.ts
import { injectAxe, checkA11y } from 'axe-playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/todos');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --run
      - run: npm run coverage:check

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:visual
```

### 10.2 Pre-commit Hooks (Husky)

```bash
# .husky/pre-commit
npm test -- --changed
npm run lint
```

---

## 11. Mobile Testing (Capacitor)

### 11.1 Mobile Web Testing

```typescript
// playwright.config.ts - Add mobile devices
{
  name: 'Mobile Chrome',
  use: { ...devices['Pixel 5'] },
},
{
  name: 'Mobile Safari',
  use: { ...devices['iPhone 13'] },
}
```

### 11.2 Native App Testing (Appium)

For iOS/Android native builds:

```bash
# Install Appium
npm install -g appium

# Run mobile tests
npm run test:mobile
```

---

## 12. Test Maintenance

### 12.1 Test Stability

**Avoid flaky tests**:
- ✅ Use Playwright's auto-waiting
- ✅ Wait for network idle
- ✅ Use proper selectors (role, label)
- ❌ Don't use `setTimeout`
- ❌ Don't use brittle selectors (CSS classes)

### 12.2 Test Data Isolation

**Each test should be independent**:
- ✅ Clean up test data after each test
- ✅ Use unique identifiers (timestamps)
- ✅ Reset database state in `beforeEach`
- ❌ Don't rely on test execution order

### 12.3 Test Documentation

**Document complex test scenarios**:

```typescript
/**
 * Tests the complete task recurrence workflow:
 * 1. Create recurring task
 * 2. Complete current instance
 * 3. Verify next instance is created
 * 4. Verify due date is calculated correctly
 *
 * @see QA-TESTING-PLAN.md Section 3.8
 */
test('should create next instance when recurring task is completed', async ({ page }) => {
  // Test implementation
});
```

---

## 13. Performance Testing

### 13.1 Performance Metrics

```typescript
// tests/e2e/specs/23-performance/page-load.spec.ts
test('Dashboard should load within 2 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(2000);
});
```

### 13.2 Lighthouse CI

```bash
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun
```

---

## 14. Test Reporting

### 14.1 Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
npm run coverage:report
```

### 14.2 Playwright HTML Reporter

```bash
# Run tests and generate report
npm run test:e2e

# Open report
npx playwright show-report
```

### 14.3 Test Metrics Dashboard

Track over time:
- Test count
- Coverage percentage
- Flaky test rate
- Average test duration
- Failure rate

---

## 15. Quick Reference

### Run Specific Tests

```bash
# Run one test file
npm run test:e2e tests/e2e/specs/03-tasks/creation.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "should create task"

# Run tests with specific tag
npm run test:e2e -- --grep "@critical"

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode (pause on failure)
npm run test:e2e -- --debug
```

### Update Snapshots

```bash
# Update all screenshots
npm run test:visual -- --update-snapshots

# Update specific test snapshots
npm run test:e2e -- --update-snapshots tests/e2e/visual/dashboard.spec.ts
```

---

## 16. Next Steps

### Phase 1: Foundation (Week 1)
- [ ] Set up test fixtures and helpers
- [ ] Create page object models for all features
- [ ] Write authentication tests
- [ ] Set up CI/CD pipeline

### Phase 2: Core Features (Week 2-3)
- [ ] Tasks module tests (50+ test cases)
- [ ] Habits module tests (40+ test cases)
- [ ] Dashboard tests (20+ test cases)
- [ ] Together module tests (30+ test cases)

### Phase 3: Remaining Features (Week 4-5)
- [ ] Notes, Journal, Goals modules
- [ ] Shopping, Meals modules
- [ ] Calendar module
- [ ] Finance module (sample)

### Phase 4: Advanced Testing (Week 6)
- [ ] Multi-user scenarios (all 6 modules)
- [ ] Integration tests (cross-feature)
- [ ] Accessibility tests
- [ ] Visual regression tests
- [ ] Performance tests

### Phase 5: Polish (Week 7)
- [ ] Stabilize flaky tests
- [ ] Improve test documentation
- [ ] Optimize test execution time
- [ ] Set up monitoring/dashboards

---

## 17. Resources

### Documentation
- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [axe-core](https://github.com/dequelabs/axe-core)

### Best Practices
- [LifeSync CLAUDE.md](./CLAUDE.md) - Coding standards
- [QA Testing Plan](./QA-TESTING-PLAN.md) - Test scenarios

### Internal
- Test accounts: See [scripts/README-test-accounts.md](./scripts/README-test-accounts.md)
- Test data: `tests/e2e/fixtures/test-data.ts`
- Page objects: `tests/e2e/page-objects/`

---

**Last Updated**: February 23, 2026
**Owner**: QA Team
**Status**: ✅ Active
