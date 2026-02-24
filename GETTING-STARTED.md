# Getting Started - First Test

## What We've Set Up ✅

### 1. Regression Test for QA Bug #1
**File**: `tests/e2e/dashboard/add-task-modal-bug.spec.ts`

This test will:
- Login with test account
- Navigate to dashboard
- Click "Add Task" button
- Verify form fields exist (currently broken per QA findings)

### 2. Authentication Helper
**File**: `tests/e2e/fixtures/test-accounts.ts`

Handles login for all tests using:
- Email: `test1@lifesync.app`
- Password: `TestAccount123!`

---

## Next Steps - Run the Test

### Step 1: Make Sure Dev Server is Running

```bash
# Terminal 1 - Start dev server
npm run dev
```

Wait until you see: `Local: http://localhost:5173`

### Step 2: Run the Test (In a New Terminal)

```bash
# Terminal 2 - Run the test
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts -- --project=chromium
```

---

## What Should Happen

### If the Bug Exists (Expected):
```
❌ Test FAILS
Error: locator.click: Timeout
  waiting for getByRole('button', { name: /add task/i })
```

**This is GOOD!** It proves:
1. The button doesn't exist on the dashboard
2. The test correctly catches the bug
3. Once you fix the bug, this test prevents regression

### If Test Passes:
```
✅ Test PASSES
5/5 tests passed
```

**This means**:
- Either the bug is already fixed
- OR the test needs adjustment (check what actually appears on dashboard)

---

## Understanding the Test Output

The test creates screenshots and videos automatically:

```
test-results/
├── dashboard-add-task-modal.../
│   ├── test-failed-1.png          ← Screenshot at failure
│   ├── video.webm                  ← Video of test run
│   └── error-context.md            ← Error details
```

**To view the HTML report**:
```bash
npx playwright show-report
```

This opens a browser with:
- Test results
- Screenshots
- Videos
- Detailed error logs

---

## Debugging the Test

### If Login Fails

The test might fail at login. Check if login form uses different selectors:

```typescript
// Current login code uses:
await page.getByLabel(/email/i).fill('test1@lifesync.app');
await page.getByLabel(/password/i).fill('TestAccount123!');
await page.getByRole('button', { name: /sign in|login/i }).click();
```

**To debug**:
1. Run with `--headed` flag to see browser:
   ```bash
   npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts -- --headed
   ```

2. Add `--debug` to pause at failures:
   ```bash
   npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts -- --debug
   ```

### If Dashboard Button Has Different Name

Check the actual button text on your dashboard and update test:

```typescript
// Try different patterns:
await page.getByRole('button', { name: /add.*task/i }).click();
await page.getByRole('button', { name: /new task/i }).click();
await page.getByRole('button', { name: /create task/i }).click();
```

---

## After the Test Runs

### Scenario 1: Test Fails (Bug Confirmed)

✅ **Good!** The test proves the bug exists.

**Next steps**:
1. Fix the Dashboard component (add form fields to modal)
2. Run test again
3. Test should pass
4. Bug fixed + regression prevented!

### Scenario 2: Button Not Found

The test can't find the "Add Task" button on dashboard.

**Debug**:
```typescript
// Add to test temporarily:
await page.screenshot({ path: 'dashboard-debug.png', fullPage: true });
```

Then check `dashboard-debug.png` to see what's actually on the page.

### Scenario 3: Login Fails

Test times out at login page.

**Fix**:
1. Check test account exists: `test1@lifesync.app`
2. Check password is correct: `TestAccount123!`
3. Verify login form selectors match your actual form

---

## Quality Standards Reminder

This test follows our quality standards:
- ✅ No try-catch blocks
- ✅ No defensive if statements
- ✅ No arbitrary timeouts
- ✅ Semantic selectors (getByRole, getByLabel)
- ✅ Clear test descriptions
- ✅ Tagged with priority (@critical)

**If the test fails, we FIX the bug or the test - never hide failures!**

---

## Next Test to Write

After this first test works, the next step is:

### Fix FAB Positioning Bug (QA Issue #2)

```bash
touch tests/e2e/tasks/fab-visibility.spec.ts
```

```typescript
test('FAB is visible and clickable @critical', async ({ page }) => {
  const tasks = new TasksPage(page);
  await tasks.goto();

  const fab = page.getByRole('button', { name: /add task/i });
  await expect(fab).toBeInViewport();
  await fab.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
```

---

## Quick Reference Commands

```bash
# Run one test file
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts

# Run with browser visible
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts -- --headed

# Debug mode
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts -- --debug

# View report
npx playwright show-report

# Run only tests tagged @critical
npm run test:e2e -- --grep "@critical"
```

---

## Success Criteria

You'll know it's working when:

1. **Test runs** without timeout
2. **Test reaches** the dashboard (login successful)
3. **Test fails** at "Add Task" button click (proving bug exists)
4. **Screenshot** shows dashboard page
5. **Error** is clear: "Can't find button" or "Modal has no fields"

Then you **fix the bug** and **test passes**! 🎉

---

## Need Help?

**Common Issues**:

| Issue | Solution |
|-------|----------|
| "Executable doesn't exist" | Run: `npx playwright install` |
| "Test timeout" | Server not running: `npm run dev` |
| "Can't find email input" | Login selectors need adjustment |
| "Navigation failed" | Check test account exists |

---

**Ready to run your first test!**

Start dev server, then run:
```bash
npm run test:e2e tests/e2e/dashboard/add-task-modal-bug.spec.ts -- --headed
```

Watch it login, navigate to dashboard, and try to find the "Add Task" button!
