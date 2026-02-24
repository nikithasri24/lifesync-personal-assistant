# Test Quality Standards

## The Golden Rules

### 1. **Tests Should Fail Loudly**
When something is broken, the test should scream, not whisper.

```typescript
// ❌ BAD - Test passes even when feature is broken
if (await button.isVisible()) {
  await button.click();
}
// Test passes → You think everything works → Ship broken code

// ✅ GOOD - Test fails when feature is broken
await button.click();
// Button doesn't exist → Test fails → You know to fix it
```

---

### 2. **No Try-Catch in Tests**
Exception: Database cleanup in `afterEach` hooks only.

```typescript
// ❌ BAD - Hides real errors
try {
  await page.getByRole('button').click();
} catch (error) {
  await page.getByText('Button').click(); // Wrong solution
}

// ✅ GOOD - One reliable path
await page.getByRole('button', { name: /submit/i }).click();
// If this fails, fix the selector or the UI, don't hide the problem
```

**Why no try-catch?**
- Masks failures
- Creates multiple code paths
- Hard to debug
- Tests become flaky
- You don't know what actually failed

**When try-catch IS allowed**:
```typescript
// ✅ OK - Cleanup in hooks
test.afterEach(async ({ page }) => {
  try {
    await cleanupTestData();
  } catch (error) {
    // Log but don't fail test
    console.error('Cleanup failed:', error);
  }
});
```

---

### 3. **No Defensive If Statements**
Trust Playwright's auto-waiting. Let tests fail when elements don't exist.

```typescript
// ❌ BAD - Defensive programming
if (await modal.isVisible()) {
  const titleInput = modal.getByRole('textbox');
  if (await titleInput.count() > 0) {
    await titleInput.fill('Test');
  }
}
// Test passes even if modal never opens

// ✅ GOOD - Clear expectations
const modal = page.getByRole('dialog');
await modal.getByRole('textbox', { name: /title/i }).fill('Test');
// If modal doesn't open → Test fails → You fix the bug
```

**Why no defensive ifs?**
- Tests pass when they should fail
- Hides bugs until production
- Makes tests complex
- Unclear what's being tested
- Hard to maintain

---

### 4. **No Arbitrary Timeouts**
Wait for actual conditions, not time to pass.

```typescript
// ❌ BAD - Timing-dependent
await page.getByRole('button').click();
await page.waitForTimeout(1000); // Maybe enough? Maybe not?
await expect(modal).toBeVisible();

// ✅ GOOD - Wait for actual condition
await page.getByRole('button').click();
await expect(modal).toBeVisible(); // Auto-retries until true
```

**Allowed timeouts**:
```typescript
// ✅ OK - Debounce testing
await input.fill('search query');
await page.waitForTimeout(600); // Explicit debounce delay
const saved = await localStorage.getItem('draft');

// ✅ OK - Animation completion
await modal.click(); // Triggers 500ms animation
await page.waitForTimeout(500); // Known animation duration
```

**Better alternatives**:
```typescript
// ✅ Best - Wait for load state
await page.waitForLoadState('networkidle');

// ✅ Best - Wait for specific element
await expect(page.getByText('Loaded')).toBeVisible();

// ✅ Best - Wait for URL change
await page.waitForURL('/dashboard');
```

---

### 5. **Use Semantic Selectors**

**Priority order** (best to worst):

#### 1. `getByRole()` - Best ✅
Most resilient, enforces accessibility.

```typescript
// Perfect - accessible, semantic, resilient
await page.getByRole('button', { name: /submit/i }).click();
await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
await page.getByRole('checkbox', { name: /agree/i }).check();
await page.getByRole('link', { name: /home/i }).click();
```

**Common roles**:
- `button` - Buttons
- `link` - Links
- `textbox` - Text inputs
- `checkbox` - Checkboxes
- `radio` - Radio buttons
- `combobox` - Select dropdowns
- `dialog` - Modals
- `navigation` - Nav sections
- `main` - Main content
- `heading` - Headings (h1-h6)
- `list` - Lists (ul, ol)
- `listitem` - List items (li)

#### 2. `getByLabel()` - Good ✅
Great for forms.

```typescript
await page.getByLabel('Email address').fill('test@example.com');
await page.getByLabel('Password').fill('secret');
await page.getByLabel(/accept terms/i).check();
```

#### 3. `getByPlaceholder()` - OK ✅
When label isn't available.

```typescript
await page.getByPlaceholder('Enter your email').fill('test@example.com');
```

#### 4. `getByTestId()` - Last Resort ⚠️
When semantic selectors aren't possible.

```typescript
// Add to component: data-testid="submit-button"
await page.getByTestId('submit-button').click();
```

#### 5. `getByText()` - Avoid ❌
Breaks when text changes.

```typescript
// ❌ Fragile - breaks if text changes
await page.getByText('Submit').click();

// ✅ Better - uses role
await page.getByRole('button', { name: /submit/i }).click();
```

#### 6. CSS Selectors - Never ❌❌
Completely brittle.

```typescript
// ❌ Never do this
await page.locator('.btn-primary').click();
await page.locator('#modal-submit').click();
await page.locator('div > button:nth-child(2)').click();
```

---

### 6. **Page Object Pattern**
Encapsulate page interactions.

```typescript
// ❌ BAD - Duplicated selectors in every test
test('test 1', async ({ page }) => {
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByRole('textbox', { name: /title/i }).fill('Task 1');
  await page.getByRole('button', { name: /create/i }).click();
});

test('test 2', async ({ page }) => {
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByRole('textbox', { name: /title/i }).fill('Task 2');
  await page.getByRole('button', { name: /create/i }).click();
});

// ✅ GOOD - Define once, use everywhere
class TasksPage {
  constructor(readonly page: Page) {}

  async createTask(title: string) {
    await this.page.getByRole('button', { name: /add task/i }).click();
    await this.page.getByRole('textbox', { name: /title/i }).fill(title);
    await this.page.getByRole('button', { name: /create/i }).click();
  }
}

test('test 1', async ({ page }) => {
  const tasks = new TasksPage(page);
  await tasks.createTask('Task 1');
});

test('test 2', async ({ page }) => {
  const tasks = new TasksPage(page);
  await tasks.createTask('Task 2');
});
```

---

### 7. **Clear Test Structure**
Follow Arrange-Act-Assert pattern.

```typescript
// ✅ GOOD - Clear sections
test('user creates task', async ({ page }) => {
  // Arrange - Set up state
  const tasks = new TasksPage(page);
  await tasks.goto();

  // Act - Perform action
  await tasks.createTask('Buy milk');

  // Assert - Verify outcome
  await tasks.expectTaskVisible('Buy milk');
});
```

---

### 8. **Unique Test Data**
Avoid conflicts between tests.

```typescript
// ❌ BAD - Hardcoded data
await tasks.createTask('Test Task');
// If test runs twice, might conflict

// ✅ GOOD - Unique data
await tasks.createTask(`Test Task ${Date.now()}`);
// Always unique

// ✅ BETTER - Use test data generator
const task = testData.task({ title: 'Buy milk' });
await tasks.createTask(task.title);
```

---

### 9. **Descriptive Test Names**
Test name should describe behavior, not implementation.

```typescript
// ❌ BAD - Implementation details
test('clicks button and fills form', async ({ page }) => {});

// ❌ BAD - Vague
test('test 1', async ({ page }) => {});

// ✅ GOOD - Clear behavior
test('user creates task with title and description', async ({ page }) => {});

// ✅ GOOD - User story format
test('user can complete a task by clicking checkbox', async ({ page }) => {});
```

---

### 10. **Use Test Tags**
Organize and filter tests.

```typescript
test('user signs in @critical @p0', async ({ page }) => {
  // Critical for production
});

test('user changes theme @p2', async ({ page }) => {
  // Lower priority
});

test('modal is keyboard accessible @a11y', async ({ page }) => {
  // Accessibility test
});
```

**Run specific tags**:
```bash
npm run test:e2e -- --grep "@critical"
npm run test:e2e -- --grep "@p0"
npm run test:e2e -- --grep "@a11y"
```

---

## Quality Checklist

### Before Committing a Test

- [ ] Uses `getByRole()` or `getByLabel()`
- [ ] No try-catch blocks
- [ ] No defensive if statements
- [ ] No arbitrary timeouts
- [ ] Uses page objects
- [ ] Has descriptive name
- [ ] Tagged with priority
- [ ] Unique test data
- [ ] Follows Arrange-Act-Assert
- [ ] Passes on all browsers
- [ ] Cleans up after itself

---

## Code Review Guidelines

### Auto-Reject If Test Has:
- ❌ `try { } catch { }`
- ❌ `if (await element.isVisible())`
- ❌ `await page.waitForTimeout(1000)` (without justification)
- ❌ `.locator('.css-class')`
- ❌ `.first()` without context
- ❌ Hardcoded test data
- ❌ No test description
- ❌ No cleanup

### Auto-Approve If Test Has:
- ✅ Semantic selectors
- ✅ Page object usage
- ✅ Clear test name
- ✅ Proper assertions
- ✅ Unique test data
- ✅ Tagged appropriately
- ✅ Clean structure

---

## Examples

### ❌ Poor Quality Test
```typescript
test('test notes', async ({ page }) => {
  const createButton = page.locator('[data-testid="create-note"]').or(
    page.getByRole('button').filter({ hasText: /new note|add note|create|new/i }).first()
  );

  if (await createButton.isVisible()) {
    await createButton.click();
    await page.waitForTimeout(500);

    const titleInput = page.getByPlaceholder(/title|note title/i).first();
    if (await titleInput.isVisible()) {
      try {
        await titleInput.fill('Test Note');
        const contentInput = page.getByPlaceholder(/content|write|note/i).first();
        if (await contentInput.isVisible()) {
          await contentInput.fill('Content');
        }
        const saveButton = page.getByRole('button', { name: /save|create|add/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('Failed to create note');
      }
    }
  }
});
```

**Problems**:
- ❌ Try-catch hides errors
- ❌ Defensive ifs everywhere
- ❌ Arbitrary timeouts
- ❌ Weak selectors (.first())
- ❌ No clear assertions
- ❌ Vague test name
- ❌ 30 lines for simple action

### ✅ High Quality Test
```typescript
test('user creates note with title and content @p0', async ({ page }) => {
  // Arrange
  const notes = new NotesPage(page);
  await notes.goto();

  const testNote = testData.note({
    title: 'Meeting Notes',
    content: 'Discussed project timeline',
  });

  // Act
  await notes.createNote(testNote);

  // Assert
  await notes.expectNoteVisible(testNote.title);
  await expect(page.getByText(testNote.content)).toBeVisible();
});
```

**Why better**:
- ✅ Clear test name
- ✅ Page object usage
- ✅ No try-catch
- ✅ No defensive code
- ✅ Semantic selectors (in page object)
- ✅ Unique test data
- ✅ Clear assertions
- ✅ 12 lines, easy to read

### NotesPage Implementation
```typescript
export class NotesPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly noteModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: /add note/i });
    this.noteModal = page.getByRole('dialog', { name: /note/i });
  }

  async goto() {
    await this.page.goto('/notes');
    await this.page.waitForLoadState('networkidle');
  }

  async createNote(note: { title: string; content: string }) {
    await this.addButton.click();

    await this.noteModal.getByRole('textbox', { name: /title/i }).fill(note.title);
    await this.noteModal.getByRole('textbox', { name: /content/i }).fill(note.content);
    await this.noteModal.getByRole('button', { name: /save/i }).click();

    await expect(this.noteModal).not.toBeVisible();
  }

  async expectNoteVisible(title: string) {
    await expect(this.page.getByRole('heading', { name: new RegExp(title, 'i') })).toBeVisible();
  }
}
```

---

## The Bottom Line

**Quality > Quantity**

Write 100 reliable tests, not 500 flaky ones.

- Each test should be maintainable
- Each test should fail for clear reasons
- Each test should be easy to debug
- Each test should be trustworthy

**If a test is flaky, fix it or delete it. Never accept flaky tests.**

---

Last Updated: February 23, 2026
