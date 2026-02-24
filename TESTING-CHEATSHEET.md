# Testing Cheat Sheet

Quick reference for testing LifeSync website + mobile apps.

---

## 🎯 Quick Commands

### Run Tests

```bash
# Unit tests (30 sec)
npm test
npm test -- --watch

# Desktop E2E (5 min)
npm run test:e2e
npm run test:e2e:headed        # See browser
npm run test:e2e:debug         # Debug mode

# Mobile E2E (5 min - REUSES desktop tests!)
npm run test:e2e:mobile        # iOS + Android
npm run test:e2e:ios           # iOS only
npm run test:e2e:android       # Android only

# Visual tests
npm run test:visual
npm run test:visual:update     # Update screenshots

# Coverage
npm run test:coverage
npm run coverage:report        # Open in browser

# Full validation
npm run validate              # Unit + lint + typecheck
npm run validate:full         # Above + E2E
```

---

## 📊 Test Type Decision Tree

```
Need to test something?
│
├─ Is it business logic (calculation, validation)?
│  └─ ✅ Unit Test
│     - Location: src/**/*.test.ts
│     - Run: npm test
│     - Works on: Web + iOS + Android
│
├─ Is it UI/UX (buttons, forms, navigation)?
│  ├─ Desktop/mobile web?
│  │  └─ ✅ E2E Test (Playwright)
│  │     - Location: tests/e2e/specs/
│  │     - Run: npm run test:e2e
│  │     - Works on: Web + mobile web
│  │
│  └─ Native feature (camera, push, Face ID)?
│     └─ ✅ Native Test (Appium)
│        - Location: tests/native/
│        - Run: npm run test:native
│        - Works on: iOS app + Android app
│
└─ Is it design compliance (looks correct)?
   └─ ✅ Visual Test
      - Location: tests/e2e/visual/
      - Run: npm run test:visual
      - Works on: All platforms
```

---

## 🎨 Test Types at a Glance

| Type | Speed | Coverage | Platforms | When |
|------|-------|----------|-----------|------|
| **Unit** | ⚡ Fast (sec) | Logic | All | Every save |
| **E2E Desktop** | 🐢 Slow (min) | UI flows | Web | Before commit |
| **E2E Mobile** | 🐢 Slow (min) | UI flows | Web + mobile | Before commit |
| **Native** | 🐢 Slow (min) | Native features | iOS + Android | Before release |
| **Visual** | 🐢 Slow (min) | Appearance | All | Design changes |

---

## 📁 Where to Put Tests

```
tests/
├── e2e/
│   ├── fixtures/
│   │   ├── test-accounts.ts       # Login helpers
│   │   └── test-data.ts           # Test data generators
│   ├── helpers/
│   │   ├── modal.helpers.ts       # Modal interactions
│   │   └── navigation.helpers.ts  # Navigation
│   ├── page-objects/
│   │   ├── dashboard.page.ts      # Page object models
│   │   └── tasks.page.ts
│   ├── specs/
│   │   ├── auth/
│   │   │   └── sign-in.spec.ts
│   │   ├── dashboard/
│   │   │   └── quick-actions.spec.ts
│   │   ├── tasks/
│   │   │   ├── creation.spec.ts
│   │   │   ├── operations.spec.ts
│   │   │   └── filters.spec.ts
│   │   └── habits/
│   └── visual/
│       └── design-compliance.spec.ts
│
└── native/                         # Only for native features
    ├── push-notifications.spec.ts
    ├── camera.spec.ts
    └── biometrics.spec.ts

src/
├── hooks/
│   └── useTasksQuery.test.ts      # Unit tests
├── utils/
│   └── dateHelpers.test.ts        # Unit tests
└── components/
    └── TaskCard.test.tsx           # Component tests
```

---

## 🔨 Test Templates

### Unit Test
```typescript
// src/utils/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### E2E Test
```typescript
// tests/e2e/specs/feature/test.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAccount1 } from '../../fixtures/test-accounts';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAccount1(page);
    await page.goto('/feature');
  });

  test('should do something @p0', async ({ page }) => {
    await page.getByRole('button').click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Visual Test
```typescript
// tests/e2e/visual/design.spec.ts
import { test, expect } from '@playwright/test';

test('component matches design', async ({ page }) => {
  await page.goto('/feature');
  await expect(page.locator('.component')).toHaveScreenshot();
});
```

---

## 🏷️ Test Tags

Use tags to filter tests:

```typescript
test('critical flow @critical @p0', async ({ page }) => {
  // High-priority test
});

test('accessibility @a11y', async ({ page }) => {
  // Accessibility test
});

test('mobile layout @mobile', async ({ page }) => {
  // Mobile-specific
});
```

Run tagged tests:
```bash
npm run test:e2e -- --grep "@critical"
npm run test:e2e -- --grep "@p0"
npm run test:e2e -- --grep "@a11y"
```

---

## 🐛 Debugging

### See What's Happening
```bash
npm run test:e2e:headed          # Watch browser
npm run test:e2e:debug           # Pause on failure
npm run test:e2e:ui              # Interactive mode
```

### Find Failures
```bash
# After test run, view report
npx playwright show-report

# Screenshots (auto-captured on failure)
ls playwright-report/screenshots/

# Videos (auto-recorded on failure)
ls test-results/*/video.webm
```

### Fix Flaky Tests
```bash
# Run test 10 times
npm run test:e2e -- --repeat-each=10 my-test.spec.ts

# If it fails sometimes → flaky test!
# Fix by:
# 1. Add explicit waits
# 2. Use better selectors
# 3. Wait for network idle
```

---

## 📈 Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# View HTML report
npm run coverage:report

# Check thresholds (fail if < 60%)
npm run coverage:check
```

**Good coverage:**
- Lines: > 60%
- Functions: > 55%
- Branches: > 50%

---

## 🎯 Test Prioritization

### P0 - Critical (Must pass for release)
- User can sign in/out
- User can create/view/complete tasks
- User can track habits
- Dashboard displays correctly
- Multi-user features work

### P1 - High (Should pass)
- All CRUD operations
- Filters and search
- Modal behaviors
- Form validation
- Navigation

### P2 - Medium (Nice to have)
- Edge cases
- Performance tests
- Visual regressions
- Accessibility

### P3 - Low (Optional)
- Polish features
- Experimental features

**Run by priority:**
```bash
npm run test:e2e -- --grep "@p0"      # Critical only
npm run test:e2e -- --grep "@p0|@p1"  # Critical + high
```

---

## 🌐 Platform Coverage

### One Test = Three Platforms

```typescript
test('user creates task', async ({ page }) => {
  // ... test code
});
```

**This one test runs on:**
1. ✅ Desktop Chrome, Firefox, Safari
2. ✅ iOS Safari (mobile web)
3. ✅ Android Chrome (mobile web)

**Total platforms tested: 6!**

---

## 📱 Mobile-Specific Testing

### Mobile Web (90% of mobile testing)
```bash
# Run desktop tests on mobile browsers
npm run test:e2e:mobile

# This REUSES all your desktop tests!
# No extra work needed!
```

### Native App (10% of mobile testing)
```bash
# Only for native features
npm run test:native:ios        # Push, camera, Face ID
npm run test:native:android    # Push, camera, fingerprint
```

---

## ⏱️ Test Timing

| Test Suite | Time | When to Run |
|------------|------|-------------|
| Unit tests | 30 sec | Every file save |
| E2E Desktop | 5 min | Before commit |
| E2E Mobile | 5 min | Before commit |
| Native tests | 6 min | Before release |
| Visual tests | 3 min | Design changes |
| **Full suite** | **17 min** | **CI/CD** |

---

## 🚦 CI/CD Integration

Tests run automatically on:
- **Pre-commit**: Unit tests + linting
- **Pre-push**: All unit tests + critical E2E
- **Pull Request**: Full test suite
- **Main branch**: Full suite + visual regression

---

## 📝 Test Writing Checklist

Before writing a test:
- [ ] Check if test already exists
- [ ] Determine test type (unit/E2E/native)
- [ ] Write descriptive test name
- [ ] Add appropriate tags (@p0, @critical, etc.)
- [ ] Use page objects for E2E tests
- [ ] Use test data generators
- [ ] Follow Arrange-Act-Assert pattern
- [ ] Clean up test data after test

After writing a test:
- [ ] Run test locally
- [ ] Check it passes on all browsers
- [ ] Verify it catches the bug/validates the feature
- [ ] Update documentation if needed

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright configuration |
| `vitest.config.ts` | Vitest configuration |
| `tests/e2e/fixtures/` | Reusable test helpers |
| `tests/e2e/page-objects/` | Page object models |
| `.env.test` | Test environment variables |

---

## 💡 Best Practices

### ✅ DO
- Use semantic selectors (`getByRole`, `getByLabel`)
- Wait for elements with Playwright auto-waiting
- Use page objects for common actions
- Tag tests with priority
- Clean up test data
- Write descriptive test names

### ❌ DON'T
- Use `setTimeout` or `waitForTimeout`
- Use brittle CSS selectors
- Duplicate test code
- Test implementation details
- Commit test data to git
- Skip tests (fix or delete them)

---

## 📚 Quick Links

- [TESTING-SUMMARY.md](./TESTING-SUMMARY.md) - Complete overview
- [TESTING-QUICKSTART.md](./TESTING-QUICKSTART.md) - Getting started
- [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) - Full strategy
- [MOBILE-TESTING-STRATEGY.md](./MOBILE-TESTING-STRATEGY.md) - Mobile testing
- [TESTING-COMPARISON.md](./TESTING-COMPARISON.md) - Web vs mobile
- [QA-TESTING-PLAN.md](./QA-TESTING-PLAN.md) - Test scenarios

---

**Print this page and keep it handy!** 📄

Last Updated: February 23, 2026
