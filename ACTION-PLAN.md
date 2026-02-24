# Test Implementation - Action Plan

## Quality-First Approach

**Principle**: Write fewer, better tests rather than many flaky tests.

---

## Current State (Quality Analysis)

### Existing Tests: 50+ files
**Issues found**:
- 🔴 **159 try-catch blocks** - Hiding failures
- 🔴 **593 defensive if statements** - Masking bugs
- 🔴 **Arbitrary timeouts** - Flaky tests
- 🔴 **Weak selectors** - Brittle tests

### Example of Poor Quality (notes.spec.ts):
```typescript
// Current: 100 lines, passes even when broken
if (await createButton.isVisible()) {
  await createButton.click();
  await page.waitForTimeout(500);

  if (await titleInput.isVisible()) {
    // More nested ifs...
  }
}
```

### Example of High Quality (todos.spec.ts):
```typescript
// Better: 20 lines, clear failures
await page.getByRole('button', { name: /add task/i }).click();
await page.getByRole('textbox', { name: /title/i }).fill('Task');
await page.getByRole('button', { name: /create/i }).click();

await expect(page.getByText('Task')).toBeVisible();
```

---

## The Plan

### Week 1: Foundation (Start Here)

#### Day 1-2: Fix Critical Bugs with Tests

**Task 1: Dashboard Add Task Modal Bug** (QA Issue #1)

```bash
# Create test file
mkdir -p tests/e2e/dashboard
touch tests/e2e/dashboard/add-task-modal-bug.spec.ts
```

```typescript
// tests/e2e/dashboard/add-task-modal-bug.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Add Task Modal (Bug Fix)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('modal renders all form fields @critical', async ({ page }) => {
    // Click "Add Task" on dashboard
    await page.getByRole('button', { name: /add task/i }).click();

    const modal = page.getByRole('dialog');

    // These MUST exist (QA found they don't)
    await expect(modal.getByRole('textbox', { name: /title/i })).toBeVisible();
    await expect(modal.getByRole('textbox', { name: /description/i })).toBeVisible();
    await expect(modal.getByRole('combobox', { name: /priority/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /create/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('can create task from dashboard modal @critical', async ({ page }) => {
    await page.getByRole('button', { name: /add task/i }).click();

    const modal = page.getByRole('dialog');
    await modal.getByRole('textbox', { name: /title/i }).fill('Dashboard Task');
    await modal.getByRole('button', { name: /create/i }).click();

    // Modal closes
    await expect(modal).not.toBeVisible();

    // Task appears on dashboard
    await expect(page.getByText('Dashboard Task')).toBeVisible();
  });
});
```

**Run it**:
```bash
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts
# Should FAIL - bug exists
```

**Fix the bug in your component**, then run again:
```bash
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts
# Should PASS - bug fixed, regression prevented
```

---

**Task 2: FAB Positioning Bug** (QA Issue #2)

```typescript
// tests/e2e/tasks/fab-visibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('FAB Button Visibility', () => {
  test('FAB is in viewport and clickable @critical', async ({ page }) => {
    await page.goto('/todos');

    const fab = page.getByRole('button', { name: /add task/i });

    // Should be visible in viewport (catches positioning bug)
    await expect(fab).toBeInViewport();

    // Should be clickable without JS tricks
    await fab.click();

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

---

#### Day 3-4: Refactor Worst Offenders

**Target**: notes.spec.ts (100 lines → 40 lines)

**Before** (poor quality):
```typescript
test('should create a new note', async ({ page }) => {
  const createButton = page.locator('[data-testid="create-note"]').or(
    page.getByRole('button').filter({ hasText: /new note|add note|create|new/i }).first()
  );

  if (await createButton.isVisible()) {
    await createButton.click();
    await page.waitForTimeout(500);

    const titleInput = page.getByPlaceholder(/title|note title/i).first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Note');

      const contentInput = page.getByPlaceholder(/content|write|note/i).first();
      if (await contentInput.isVisible()) {
        await contentInput.fill('Content');
      }
    }
  }
});
```

**After** (high quality):
```typescript
test('creates note with title and content', async ({ page }) => {
  await page.getByRole('button', { name: /add note/i }).click();

  const modal = page.getByRole('dialog');
  await modal.getByRole('textbox', { name: /title/i }).fill('Test Note');
  await modal.getByRole('textbox', { name: /content/i }).fill('Content');
  await modal.getByRole('button', { name: /save/i }).click();

  await expect(page.getByText('Test Note')).toBeVisible();
});
```

**Key improvements**:
- ❌ No try-catch
- ❌ No defensive ifs
- ❌ No arbitrary timeouts
- ✅ Clear selectors
- ✅ One path to success
- ✅ Fails loudly if broken

---

**Task 3: Remove Try-Catch from habits.spec.ts**

**Before**:
```typescript
await page.getByRole('button', { name: 'Habits' })
  .click({ trial: true })
  .catch(async () => {
    const maybeNav = page.getByText('Habits', { exact: true })
    if (await maybeNav.count()) await maybeNav.first().click()
  })
```

**After**:
```typescript
await page.getByRole('link', { name: /habits/i }).click();
```

**Why better**:
- If link doesn't exist → test fails → you fix the UI or selector
- No hidden errors
- Clear failure message
- Maintainable

---

#### Day 5: Create First Page Object

```typescript
// tests/e2e/page-objects/tasks.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class TasksPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly quickAddModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: /add task/i });
    this.quickAddModal = page.getByRole('dialog', { name: /add.*task/i });
  }

  async goto() {
    await this.page.goto('/todos');
    await this.page.waitForLoadState('networkidle');
  }

  async createQuickTask(title: string) {
    await this.addButton.click();
    await this.quickAddModal.getByRole('textbox', { name: /title/i }).fill(title);
    await this.quickAddModal.getByRole('button', { name: /create/i }).click();
    await expect(this.quickAddModal).not.toBeVisible();
  }

  async completeTask(title: string) {
    const task = this.page.getByRole('listitem', { name: new RegExp(title, 'i') });
    await task.getByRole('checkbox').click();
  }

  async expectTaskVisible(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }
}
```

**Usage**:
```typescript
// Clean, readable tests
test('user creates and completes task', async ({ page }) => {
  const tasks = new TasksPage(page);
  await tasks.goto();

  await tasks.createQuickTask('Buy milk');
  await tasks.expectTaskVisible('Buy milk');

  await tasks.completeTask('Buy milk');
});
```

---

### Week 2: Page Objects for Top 5 Features

**Priority** (based on QA plan frequency):
1. **TasksPage** ← Start here
2. **HabitsPage**
3. **DashboardPage** ← Already have example
4. **NotesPage**
5. **TogetherPage** ← Multi-user testing

**Deliverable**: 5 page objects, tests refactored to use them

---

### Week 3-4: Systematic Test Writing

**Strategy**: One QA section per day

#### Example: Tasks Module (QA Section 3)

**Day 1**: Task Creation (10 tests)
```
tests/e2e/tasks/creation.spec.ts
- creates task from FAB
- creates task from dashboard
- creates task with all fields
- validates required fields
- auto-saves draft
- voice input
- clears draft after submit
- handles long titles
- handles special characters
- cancels creation
```

**Day 2**: Task Operations (8 tests)
```
tests/e2e/tasks/operations.spec.ts
- edits task title
- edits task description
- changes priority
- marks complete
- deletes task
- restores deleted task
- permanently deletes
- stars/unstars task
```

**Day 3**: Task Views (6 tests)
```
tests/e2e/tasks/views.spec.ts
- switches to Today view
- switches to Inbox view
- switches to Upcoming view
- switches to Kanban board
- switches to Priority matrix
- view preference persists
```

**Pattern for every test**:
```typescript
test('descriptive name @priority', async ({ page }) => {
  // Arrange - set up state
  const tasks = new TasksPage(page);
  await tasks.goto();

  // Act - perform action
  await tasks.createTask('Test');

  // Assert - verify outcome
  await tasks.expectTaskVisible('Test');
});
```

---

### Week 5-6: Remaining Features

Cover all QA plan sections following same pattern.

**Target**: 150 tests total, 80% QA plan coverage

---

### Week 7: Advanced Testing

#### Visual Regression
```typescript
test('modal matches design spec', async ({ page }) => {
  await page.goto('/todos');
  await page.getByRole('button', { name: /add/i }).click();

  const modal = page.getByRole('dialog');
  await expect(modal).toHaveScreenshot('task-modal.png');
});
```

#### Multi-User Testing
```typescript
test('partner sees shared tasks', async ({ browser }) => {
  const [page1, page2] = await createPartnerPages(browser);

  const tasks1 = new TasksPage(page1);
  await tasks1.createTask('Shared Task');

  const tasks2 = new TasksPage(page2);
  await tasks2.goto();
  await page2.getByRole('switch', { name: /merged mode/i }).click();

  await tasks2.expectTaskVisible('Shared Task');
});
```

---

### Week 8: CI/CD

**Setup GitHub Actions** to run tests on:
- Every push
- Every pull request
- Every merge to main

---

## Quality Gates

### Every Test Must:
- [ ] Use semantic selectors (`getByRole`, `getByLabel`)
- [ ] Have NO try-catch blocks
- [ ] Have NO defensive if statements
- [ ] Have NO arbitrary timeouts
- [ ] Use page objects
- [ ] Be tagged with priority
- [ ] Pass on all browsers
- [ ] Pass on mobile viewports
- [ ] Clean up test data

### Code Review Rejects:
- ❌ `try { } catch { }`
- ❌ `if (await ... .isVisible())`
- ❌ `await page.waitForTimeout(1000)`
- ❌ `.first()` without reason
- ❌ CSS selectors

### Code Review Approves:
- ✅ `getByRole()`, `getByLabel()`
- ✅ `expect()` with auto-retry
- ✅ Page object usage
- ✅ Clear test names
- ✅ Unique test data

---

## Success Metrics

### By Week 8:
- ✅ 0 try-catch blocks
- ✅ 0 defensive if statements
- ✅ 150+ high-quality tests
- ✅ 80%+ code coverage
- ✅ < 20 min test suite
- ✅ CI/CD running
- ✅ All QA bugs fixed

---

## Start TODAY

```bash
# 1. Create bug regression test
touch tests/e2e/dashboard/add-task-modal-bug.spec.ts

# 2. Write the test (copy from above)

# 3. Run it (should fail)
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts

# 4. Fix the bug

# 5. Run again (should pass)
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts

# Congratulations! You've prevented a regression. 🎉
```

---

**Remember**: Quality over quantity. One good test is worth 10 flaky ones.
