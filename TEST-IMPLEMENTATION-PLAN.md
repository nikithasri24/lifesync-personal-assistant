# Test Implementation Plan - Quality First

## Current State Analysis

### What You Have ✅
- **50+ existing E2E tests** covering various features
- **Playwright + Vitest** infrastructure setup
- **Test accounts** in place (test1@lifesync.app, test2@lifesync.app)
- **QA documentation** with 500+ scenarios identified

### Quality Issues Found 🔴

#### 1. **Defensive Programming Anti-Patterns**
```typescript
// ❌ BAD - From notes.spec.ts
if (await createButton.isVisible()) {
  await createButton.click();
  await page.waitForTimeout(500);

  if (await titleInput.isVisible()) {
    await titleInput.fill(testNoteTitle);
  }
}
```

**Problems:**
- Masks real failures
- Tests pass when features are broken
- Hard to debug
- Not maintainable

**Fix:**
```typescript
// ✅ GOOD - Trust Playwright's auto-waiting
await createButton.click();
await titleInput.fill(testNoteTitle);
// If element doesn't exist, test SHOULD fail!
```

#### 2. **Try-Catch Blocks**
```typescript
// ❌ BAD - From habits.spec.ts
await page.getByRole('button', { name: 'Habits' })
  .click({ trial: true })
  .catch(async () => {
    const maybeNav = page.getByText('Habits', { exact: true })
    if (await maybeNav.count()) await maybeNav.first().click()
  })
```

**Problems:**
- Hides errors
- Makes tests flaky
- No clear failure message
- Maintenance nightmare

**Fix:**
```typescript
// ✅ GOOD - One reliable selector
await page.getByRole('link', { name: 'Habits' }).click();
// If it fails, investigate and fix the selector or the UI
```

#### 3. **Arbitrary Timeouts**
```typescript
// ❌ BAD
await page.waitForTimeout(500);
await page.waitForTimeout(1000);
```

**Problems:**
- Flaky tests (timing-dependent)
- Slower than necessary
- Doesn't wait for actual conditions

**Fix:**
```typescript
// ✅ GOOD - Wait for actual conditions
await expect(modal).toBeVisible();
await page.waitForLoadState('networkidle');
```

#### 4. **Weak Selectors**
```typescript
// ❌ BAD
await page.getByText('Add Task').click();
await page.locator('button').filter({ hasText: /^$/ }).first().click();
```

**Problems:**
- Breaks when text changes
- Ambiguous (which "Add Task"?)
- Not accessible

**Fix:**
```typescript
// ✅ GOOD - Semantic, accessible selectors
await page.getByRole('button', { name: /add task/i }).click();
await page.getByRole('checkbox', { name: /complete task/i }).click();
```

---

## Quality Standards

### 1. **No Defensive Programming**
- Trust Playwright's auto-waiting
- Let tests fail when features are broken
- Clear failure messages

### 2. **No Try-Catch**
- Tests should fail loudly
- Use proper selectors instead
- Fix flaky tests, don't hide them

### 3. **No Arbitrary Timeouts**
- Use `waitForLoadState('networkidle')`
- Use `expect()` with auto-retrying assertions
- Wait for specific conditions

### 4. **Semantic Selectors**
Priority order:
1. `getByRole()` - Best for accessibility
2. `getByLabel()` - Good for forms
3. `getByPlaceholder()` - OK for inputs
4. `getByTestId()` - Last resort
5. ❌ Never use CSS selectors or `.first()` without context

### 5. **Page Object Pattern**
- Encapsulate selectors
- Reusable actions
- Clear intent

### 6. **Test Data Management**
- Use unique test data (timestamps)
- Clean up after tests
- No hardcoded values

---

## Implementation Plan

### Phase 1: Fix Critical Issues (Week 1)

**Priority 0: Fix QA-Discovered Bugs**

Based on QA-ISSUES-FOUND.md:

#### Task 1.1: Fix Dashboard "Add Task" Modal Bug
- **Issue**: Modal opens but no form fields render
- **Test**: Create regression test BEFORE fixing
- **File**: `tests/e2e/dashboard/add-task-modal.spec.ts`

```typescript
test('Dashboard Add Task modal renders form fields', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /add task/i }).click();

  const modal = page.getByRole('dialog', { name: /add.*task/i });

  // These MUST be visible (catches the bug)
  await expect(modal.getByRole('textbox', { name: /title/i })).toBeVisible();
  await expect(modal.getByRole('textbox', { name: /description/i })).toBeVisible();
  await expect(modal.getByRole('button', { name: /create/i })).toBeVisible();
});
```

**After test passes**: Bug is fixed, regression prevented.

#### Task 1.2: Fix FAB Positioning
- **Issue**: FAB outside viewport
- **Test**: Verify FAB is clickable

```typescript
test('FAB button is visible and clickable', async ({ page }) => {
  await page.goto('/todos');

  const fab = page.getByRole('button', { name: /add task/i });

  // Should be visible in viewport
  await expect(fab).toBeInViewport();

  // Should be clickable (no "outside viewport" error)
  await fab.click();

  await expect(page.getByRole('dialog')).toBeVisible();
});
```

#### Task 1.3: Refactor Existing Tests
**Target**: Remove all defensive patterns

**Files to refactor**:
1. `tests/e2e/notes.spec.ts` (100 lines → 50 lines)
2. `tests/e2e/habits.spec.ts` (remove try-catch)
3. Any test with `if (await ... .isVisible())`

**Example refactor**:
```typescript
// BEFORE (notes.spec.ts - 35 lines)
test('should create a new note', async ({ page }) => {
  const createButton = page.locator('[data-testid="create-note"]').or(
    page.getByRole('button').filter({ hasText: /new note|add note|create|new/i }).first()
  );

  if (await createButton.isVisible()) {
    await createButton.click();
    await page.waitForTimeout(500);

    const titleInput = page.getByPlaceholder(/title|note title/i).first();
    if (await titleInput.isVisible()) {
      const testNoteTitle = `Test Note ${Date.now()}`;
      await titleInput.fill(testNoteTitle);

      const contentInput = page.getByPlaceholder(/content|write|note/i).first();
      if (await contentInput.isVisible()) {
        await contentInput.fill('This is a test note content');
      }

      const saveButton = page.getByRole('button', { name: /save|create|add/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  }
});

// AFTER (8 lines, clear failures)
test('should create a new note', async ({ page }) => {
  await page.getByRole('button', { name: /add note/i }).click();

  await page.getByRole('textbox', { name: /title/i }).fill(`Test Note ${Date.now()}`);
  await page.getByRole('textbox', { name: /content/i }).fill('Test note content');
  await page.getByRole('button', { name: /save/i }).click();

  await expect(page.getByText('Test Note')).toBeVisible();
});
```

**Deliverables**:
- [ ] Dashboard Add Task bug fixed + test
- [ ] FAB positioning fixed + test
- [ ] 3 existing test files refactored
- [ ] Quality baseline established

---

### Phase 2: Create Page Objects (Week 2)

**Purpose**: Eliminate duplication, improve maintainability

#### Task 2.1: Create Core Page Objects

**Priority order** (based on QA plan usage):
1. **DashboardPage** (already created as example)
2. **TasksPage**
3. **HabitsPage**
4. **TogetherPage** (multi-user testing)
5. **NotesPage**

**Pattern**:
```typescript
// tests/e2e/page-objects/tasks.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class TasksPage {
  readonly page: Page;

  // Selectors - semantic, accessible
  readonly addTaskButton: Locator;
  readonly quickAddModal: Locator;
  readonly taskList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.quickAddModal = page.getByRole('dialog', { name: /add.*task/i });
    this.taskList = page.getByRole('list', { name: /tasks/i });
  }

  // Actions - high-level, readable
  async goto() {
    await this.page.goto('/todos');
    await this.page.waitForLoadState('networkidle');
  }

  async createTask(title: string, options?: {
    description?: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    await this.addTaskButton.click();

    const modal = this.quickAddModal;
    await modal.getByRole('textbox', { name: /title/i }).fill(title);

    if (options?.description) {
      await modal.getByRole('textbox', { name: /description/i }).fill(options.description);
    }

    if (options?.priority) {
      await modal.getByRole('combobox', { name: /priority/i }).selectOption(options.priority);
    }

    await modal.getByRole('button', { name: /create/i }).click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible();
  }

  async completeTask(taskTitle: string) {
    const task = this.page.getByRole('listitem', { name: new RegExp(taskTitle, 'i') });
    await task.getByRole('checkbox').click();
  }

  // Assertions - clear expectations
  async expectTaskVisible(title: string) {
    await expect(this.page.getByRole('listitem', { name: new RegExp(title, 'i') })).toBeVisible();
  }

  async expectTaskCount(count: number) {
    await expect(this.taskList.getByRole('listitem')).toHaveCount(count);
  }
}
```

**Usage**:
```typescript
// tests/e2e/tasks/creation.spec.ts
import { test } from '@playwright/test';
import { TasksPage } from '../page-objects/tasks.page';

test('user creates task with all fields', async ({ page }) => {
  const tasksPage = new TasksPage(page);
  await tasksPage.goto();

  await tasksPage.createTask('Complete project', {
    description: 'Finish by Friday',
    priority: 'high',
  });

  await tasksPage.expectTaskVisible('Complete project');
});
```

**Benefits**:
- ✅ Tests read like specifications
- ✅ Selectors defined once
- ✅ Easy to maintain
- ✅ No duplication

**Deliverables**:
- [ ] 5 page objects created
- [ ] Existing tests refactored to use page objects
- [ ] 50% reduction in test code

---

### Phase 3: Systematic QA Plan Coverage (Weeks 3-6)

**Map each QA section to test files**

#### Week 3: High Priority Modules

| QA Section | Test File | Tests | Page Object |
|------------|-----------|-------|-------------|
| **3. Tasks** | `tasks/creation.spec.ts` | 10 tests | TasksPage |
| | `tasks/operations.spec.ts` | 8 tests | TasksPage |
| | `tasks/views.spec.ts` | 6 tests | TasksPage |
| | `tasks/filters.spec.ts` | 5 tests | TasksPage |
| **4. Habits** | `habits/creation.spec.ts` | 8 tests | HabitsPage |
| | `habits/tracking.spec.ts` | 10 tests | HabitsPage |
| | `habits/views.spec.ts` | 4 tests | HabitsPage |
| **12. Together** | `together/messages.spec.ts` | 8 tests | TogetherPage |
| | `together/milestones.spec.ts` | 6 tests | TogetherPage |
| | `together/challenges.spec.ts` | 5 tests | TogetherPage |

**Test Template** (tasks/creation.spec.ts):
```typescript
import { test, expect } from '@playwright/test';
import { TasksPage } from '../../page-objects/tasks.page';
import { testData } from '../../fixtures/test-data';

test.describe('Task Creation', () => {
  let tasksPage: TasksPage;

  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    await tasksPage.goto();
  });

  test('creates task with minimal fields @critical @p0', async ({ page }) => {
    const task = testData.task({ title: 'Minimal Task' });

    await tasksPage.createTask(task.title);
    await tasksPage.expectTaskVisible(task.title);
  });

  test('creates task with all fields @p0', async ({ page }) => {
    const task = testData.task({
      title: 'Complete Task',
      description: 'With all details',
      priority: 'high',
    });

    await tasksPage.createTask(task.title, {
      description: task.description,
      priority: task.priority,
    });

    await tasksPage.expectTaskVisible(task.title);
    await expect(page.getByText(task.description!)).toBeVisible();
  });

  test('validates required fields @p1', async ({ page }) => {
    await tasksPage.addTaskButton.click();

    // Try to submit without title
    const modal = tasksPage.quickAddModal;
    await modal.getByRole('button', { name: /create/i }).click();

    // Modal should still be visible (validation failed)
    await expect(modal).toBeVisible();
  });

  test('auto-saves draft to localStorage @p1', async ({ page }) => {
    const testTitle = `Draft Task ${Date.now()}`;

    await tasksPage.addTaskButton.click();
    await tasksPage.quickAddModal.getByRole('textbox', { name: /title/i }).fill(testTitle);

    // Wait for auto-save debounce
    await page.waitForTimeout(600);

    // Close modal without saving
    await page.keyboard.press('Escape');

    // Reopen modal
    await tasksPage.addTaskButton.click();

    // Draft should be restored
    const titleInput = tasksPage.quickAddModal.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toHaveValue(testTitle);

    // Clean up - submit to clear draft
    await tasksPage.quickAddModal.getByRole('button', { name: /create/i }).click();
  });
});
```

#### Week 4: Medium Priority Modules

| QA Section | Test File | Tests |
|------------|-----------|-------|
| **5. Notes** | `notes/creation.spec.ts` | 6 tests |
| **6. Journal** | `journal/entries.spec.ts` | 5 tests |
| **7. Goals** | `goals/goals.spec.ts` | 8 tests |
| | `goals/dreams.spec.ts` | 4 tests |
| **8. Shopping** | `shopping/items.spec.ts` | 10 tests |
| | `shopping/stores.spec.ts` | 6 tests |

#### Week 5: Remaining Modules

| QA Section | Test File | Tests |
|------------|-----------|-------|
| **9. Meals** | `meals/planning.spec.ts` | 8 tests |
| **11. Calendar** | `calendar/events.spec.ts` | 6 tests |
| **10. Finance** | `finance/accounts.spec.ts` | 5 tests (sample) |

#### Week 6: Cross-Cutting Concerns

| QA Section | Test File | Tests |
|------------|-----------|-------|
| **19. Global UI/UX** | `global/modals.spec.ts` | 8 tests |
| | `global/navigation.spec.ts` | 5 tests |
| | `global/theme.spec.ts` | 3 tests |
| **20. Accessibility** | `accessibility/keyboard.spec.ts` | 10 tests |
| | `accessibility/aria.spec.ts` | 8 tests |
| **21. Integration** | `integration/cross-module.spec.ts` | 6 tests |
| **22. Multi-user** | `multi-user/merged-mode.spec.ts` | 12 tests |

**Deliverables**:
- [ ] 150+ high-quality tests written
- [ ] All page objects complete
- [ ] 80% QA plan coverage
- [ ] Mobile tests running (same tests, mobile viewport)

---

### Phase 4: Advanced Testing (Week 7)

#### Task 4.1: Visual Regression Tests

**Target**: Design spec compliance

```typescript
// tests/e2e/visual/design-compliance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Design Compliance', () => {
  test('Dashboard matches design spec', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      animations: 'disabled',
      mask: [page.locator('[data-dynamic]')], // Hide dynamic content
    });
  });

  test('Task modal matches design', async ({ page }) => {
    await page.goto('/todos');
    await page.getByRole('button', { name: /add task/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toHaveScreenshot('task-modal.png');
  });

  // Compare against design-spec.html files
  test('Together page matches together-ui-mockup.html', async ({ page }) => {
    await page.goto('/together');

    // Reference implementation - should match exactly
    await expect(page).toHaveScreenshot('together-page.png', {
      fullPage: true,
    });
  });
});
```

#### Task 4.2: Multi-User Testing

**Target**: Partner connection, merged mode

```typescript
// tests/e2e/multi-user/merged-mode-tasks.spec.ts
import { test, expect } from '@playwright/test';
import { createPartnerPages } from '../../fixtures/test-accounts';
import { TasksPage } from '../../page-objects/tasks.page';

test.describe('Tasks Merged Mode', () => {
  test('partner sees tasks in merged mode', async ({ browser }) => {
    const [page1, page2] = await createPartnerPages(browser);

    const tasks1 = new TasksPage(page1);
    const tasks2 = new TasksPage(page2);

    // Account 1 creates task
    await tasks1.goto();
    await tasks1.createTask('Shared Task');

    // Account 2 enables merged mode
    await tasks2.goto();
    await page2.getByRole('button', { name: /merged mode/i }).click();

    // Should see Account 1's task
    await tasks2.expectTaskVisible('Shared Task');

    // Should show owner badge
    await expect(page2.getByText(/partner/i)).toBeVisible();
  });

  test('real-time updates across accounts', async ({ browser }) => {
    const [page1, page2] = await createPartnerPages(browser);

    // Both in merged mode
    await page1.goto('/todos?merged=true');
    await page2.goto('/todos?merged=true');

    // Account 1 creates task
    const tasks1 = new TasksPage(page1);
    await tasks1.createTask('Real-time Task');

    // Account 2 should see it appear (real-time subscription)
    await expect(page2.getByText('Real-time Task')).toBeVisible({ timeout: 5000 });
  });
});
```

#### Task 4.3: Performance Testing

```typescript
// tests/e2e/performance/page-load.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('Dashboard loads within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('Task creation is instant', async ({ page }) => {
    await page.goto('/todos');

    const startTime = Date.now();

    await page.getByRole('button', { name: /add task/i }).click();
    await page.getByRole('textbox', { name: /title/i }).fill('Test');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByText('Test')).toBeVisible();

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });
});
```

**Deliverables**:
- [ ] Visual regression baseline created
- [ ] Multi-user tests complete
- [ ] Performance benchmarks established

---

### Phase 5: CI/CD Integration (Week 8)

#### Task 5.1: GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --run
      - run: npm run coverage:check

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}
        env:
          TEST_ACCOUNT_1_EMAIL: ${{ secrets.TEST_ACCOUNT_1_EMAIL }}
          TEST_ACCOUNT_1_PASSWORD: ${{ secrets.TEST_ACCOUNT_1_PASSWORD }}
          TEST_ACCOUNT_2_EMAIL: ${{ secrets.TEST_ACCOUNT_2_EMAIL }}
          TEST_ACCOUNT_2_PASSWORD: ${{ secrets.TEST_ACCOUNT_2_PASSWORD }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  mobile-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:mobile

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:visual

      - name: Upload visual diffs
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-diffs
          path: test-results/
```

#### Task 5.2: Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run unit tests for changed files
npm test -- --changed --run

# Lint
npm run lint
```

#### Task 5.3: Test Dashboard

**Metrics to track**:
- Test count (target: 200+)
- Code coverage (target: 80%+)
- Test duration (target: < 20 min)
- Flaky test rate (target: < 2%)
- Failure rate (target: < 5%)

**Deliverables**:
- [ ] CI/CD pipeline running
- [ ] Pre-commit hooks active
- [ ] Test metrics dashboard
- [ ] 100% QA plan coverage

---

## Quality Metrics

### Definition of Done for Each Test

- [ ] Uses semantic selectors (getByRole, getByLabel)
- [ ] No try-catch blocks
- [ ] No defensive if statements
- [ ] No arbitrary timeouts
- [ ] Uses page objects
- [ ] Has clear test description
- [ ] Tagged with priority (@p0, @p1, etc.)
- [ ] Passes on all browsers
- [ ] Passes on mobile viewports
- [ ] Test data is unique/isolated
- [ ] Cleanup handled

### Code Review Checklist

**Reject if test has**:
- ❌ `try { } catch { }`
- ❌ `if (await element.isVisible())`
- ❌ `await page.waitForTimeout(1000)`
- ❌ `.first()` without specific context
- ❌ CSS selectors (`.class-name`)
- ❌ Hardcoded test data

**Approve if test has**:
- ✅ `getByRole()`, `getByLabel()`
- ✅ `expect()` assertions with auto-retry
- ✅ `waitForLoadState('networkidle')`
- ✅ Page object usage
- ✅ Descriptive test names
- ✅ Unique test data (`Date.now()`)

---

## Timeline Summary

| Week | Focus | Deliverables | Quality Gate |
|------|-------|--------------|--------------|
| **1** | Fix bugs, refactor existing | 2 bugs fixed, 3 files refactored | All tests green |
| **2** | Page objects | 5 page objects created | Tests use page objects |
| **3** | High priority modules | 40+ tests | No defensive code |
| **4** | Medium priority modules | 40+ tests | Coverage > 60% |
| **5** | Remaining modules | 30+ tests | Coverage > 70% |
| **6** | Cross-cutting concerns | 40+ tests | Coverage > 80% |
| **7** | Advanced testing | Visual, multi-user, perf | All scenarios covered |
| **8** | CI/CD | Pipeline running | Tests run on every commit |

**Total**: 150+ high-quality tests, 80%+ coverage, full automation

---

## Immediate Next Steps

### This Week
1. **Fix Dashboard Add Task bug** + write regression test
2. **Fix FAB positioning** + write visibility test
3. **Refactor notes.spec.ts** - remove all defensive code

### Start Here (Today)
```bash
# 1. Create the regression test for Issue #1
touch tests/e2e/dashboard/add-task-modal-bug.spec.ts

# 2. Run it (should fail - bug exists)
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts

# 3. Fix the bug in src/

# 4. Run test again (should pass)
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts
```

**The regression test prevents this bug from ever happening again.**

---

## Success Criteria

### By End of Week 8:
- ✅ All 500+ QA scenarios automated
- ✅ Zero try-catch blocks in tests
- ✅ Zero defensive if statements
- ✅ 80%+ code coverage
- ✅ < 20 min full test suite
- ✅ CI/CD pipeline running
- ✅ Visual regression baseline
- ✅ Multi-user testing working
- ✅ Mobile tests passing
- ✅ All critical bugs fixed

**Quality over everything. Every test should be maintainable, reliable, and clear.**

---

Last Updated: February 23, 2026
Status: Ready to Execute
