# Testing Comparison: Website vs Mobile App

## Quick Reference Guide

### **Question: Do I need different tests for website and mobile app?**

**Short Answer**: Mostly NO! 90% of tests are shared. Only 10% need platform-specific testing.

---

## Test Coverage Breakdown

```
┌─────────────────────────────────────────────────────────┐
│ 🧪 UNIT TESTS (80% of codebase)                        │
│ ✅ Works for: Website + iOS + Android                  │
│ ✅ No changes needed - business logic is the same      │
│ Tests: Functions, hooks, utilities                     │
│ Run: npm test                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🌐 WEB E2E TESTS (Desktop) - 500+ scenarios            │
│ ✅ Works for: Website only                             │
│ Tests: Desktop browser workflows                       │
│ Run: npm run test:e2e                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📱 MOBILE WEB E2E TESTS (90% of mobile testing)         │
│ ✅ Works for: iOS Safari + Android Chrome browsers     │
│ ✅ REUSES desktop tests with mobile viewport           │
│ Tests: Same workflows as desktop, mobile UI/UX         │
│ Run: npm run test:e2e:mobile                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📲 NATIVE APP TESTS (10% of mobile testing)            │
│ ✅ Works for: iOS/Android apps only                    │
│ ✅ NEW tests for native features                       │
│ Tests: Push notifications, camera, biometrics          │
│ Run: npm run test:native                               │
└─────────────────────────────────────────────────────────┘
```

---

## What Gets Tested Where

### ✅ Same Tests for Web & Mobile (90%)

These scenarios work identically on website and mobile app:

| Feature | Test Once | Works On | Example |
|---------|-----------|----------|---------|
| Task creation | Unit + E2E | Web + iOS + Android | `createTask()` function |
| Form validation | Unit | Web + iOS + Android | Email format validation |
| Date calculations | Unit | Web + iOS + Android | Recurrence logic |
| API calls | Unit + Integration | Web + iOS + Android | Supabase queries |
| React components | Component tests | Web + iOS + Android | `<TaskCard />` rendering |
| Business logic | Unit | Web + iOS + Android | Budget calculations |
| Modal behavior | E2E | Web + iOS + Android | ESC closes modal |
| Navigation | E2E | Web + iOS + Android | Click link → navigate |

**Run these once, they work everywhere:**
```bash
npm test                    # Unit tests
npm run test:e2e           # Desktop web
npm run test:e2e:mobile    # Mobile web (reuses desktop tests!)
```

---

### 🎯 Mobile-Specific Tests (10%)

These scenarios ONLY apply to mobile apps and need separate tests:

| Feature | Why Mobile-Only | Test Type | Platform |
|---------|----------------|-----------|----------|
| Push notifications | Native feature | Native E2E | iOS + Android |
| Camera/photo picker | Native API | Native E2E | iOS + Android |
| Biometric auth (Face ID, fingerprint) | Native API | Native E2E | iOS only / Android only |
| App icon/splash screen | Native app | Manual | iOS + Android |
| App store metadata | Native app | Manual | iOS + Android |
| Background sync | Native feature | Native E2E | iOS + Android |
| Offline storage | Native feature | Native E2E | iOS + Android |
| Touch gestures (swipe) | Mobile-specific | Mobile Web E2E | iOS + Android |
| Bottom tab navigation | Mobile UI | Mobile Web E2E | iOS + Android |
| Safe area insets (notch) | iOS-specific | Mobile Web E2E | iOS only |

**Run these separately for native features:**
```bash
npm run test:native:ios       # iOS-specific
npm run test:native:android   # Android-specific
```

---

## Scenario Comparison

### Example: "Create a Task"

#### Desktop Website Test ✅
```typescript
// tests/e2e/specs/tasks/creation.spec.ts
test('user creates task from dashboard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /add task/i }).click();
  await page.getByRole('textbox').fill('Test task');
  await page.getByRole('button', { name: /create/i }).click();
  await expect(page.getByText('Test task')).toBeVisible();
});
```

**✅ This SAME test works on mobile web!** Just run it with a mobile viewport:
```bash
npm run test:e2e -- --project="Mobile Safari"
```

#### Mobile App Test (if using native features)
```typescript
// tests/native/tasks/creation.spec.ts
test('user creates task with voice input (native)', async () => {
  await $('~Add Task').click();
  await $('~Voice Input').click();

  // Native iOS/Android voice recognition
  await browser.execute('mobile: typeIntoNativeInput', { text: 'Test task' });

  await $('~Create').click();
  await expect($('~Test task')).toBeDisplayed();
});
```

**Only needed if you use native voice API!** If you use web voice API, the desktop test covers it.

---

## Your QA Plan Coverage

### QA Testing Plan → Automated Tests

| QA Section | Desktop E2E | Mobile Web E2E | Native E2E | Unit Tests |
|------------|-------------|----------------|------------|------------|
| **1. Authentication** | ✅ All | ✅ Reuse | ✅ Biometric only | ✅ Auth logic |
| **2. Dashboard** | ✅ All | ✅ Reuse + mobile UI | ❌ None needed | ✅ Data logic |
| **3. Tasks** | ✅ All 50+ cases | ✅ Reuse + swipe | ✅ Voice input only | ✅ Task logic |
| **4. Habits** | ✅ All 30+ cases | ✅ Reuse | ❌ None needed | ✅ Streak logic |
| **5. Notes** | ✅ All | ✅ Reuse | ❌ None needed | ✅ Note logic |
| **6. Journal** | ✅ All | ✅ Reuse | ✅ Photo upload | ✅ Entry logic |
| **7. Goals** | ✅ All | ✅ Reuse | ❌ None needed | ✅ Goal logic |
| **8. Shopping** | ✅ All | ✅ Reuse | ✅ Barcode scanner | ✅ Item logic |
| **9. Meals** | ✅ All | ✅ Reuse | ✅ Recipe photo | ✅ Meal logic |
| **10. Finance** | ✅ All | ✅ Reuse | ❌ None needed | ✅ Calc logic |
| **11. Calendar** | ✅ All | ✅ Reuse | ❌ None needed | ✅ Date logic |
| **12. Together** | ✅ All | ✅ Reuse | ✅ Push notifs | ✅ Message logic |
| **19. Global UI** | ✅ All | ✅ Mobile layout | ❌ None needed | N/A |
| **20. Accessibility** | ✅ All | ✅ Touch targets | ✅ VoiceOver/TalkBack | N/A |
| **22. Multi-user** | ✅ All | ✅ Reuse | ✅ Real-time sync | ✅ Merge logic |

---

## Efficiency Calculation

### Without Shared Tests (Old Way - Wasteful)
```
Website tests:     500 scenarios × 3 browsers = 1,500 test runs
iOS tests:         500 scenarios × 1 platform = 500 test runs
Android tests:     500 scenarios × 1 platform = 500 test runs
───────────────────────────────────────────────────────────
TOTAL:             2,500 test runs
Writing time:      ~200 hours (duplicating everything)
Maintenance:       3× the work (fix bugs in 3 places)
```

### With Shared Tests (New Way - Efficient) ✅
```
Unit tests:        400 scenarios × 1 time = 400 test runs (works everywhere!)
Desktop E2E:       100 scenarios × 3 browsers = 300 test runs
Mobile Web E2E:    100 scenarios × 2 browsers = 200 test runs (reuses desktop!)
Native E2E:        10 scenarios × 2 platforms = 20 test runs (new, native-only)
───────────────────────────────────────────────────────────
TOTAL:             920 test runs
Writing time:      ~50 hours (write once, run everywhere)
Maintenance:       1× work (fix once, works everywhere)
```

**🎉 You save 75% of testing effort!**

---

## Test Execution Time

### Full Test Suite

```bash
# Desktop website
npm test                         # 30 seconds (unit tests)
npm run test:e2e                 # 5 minutes (E2E tests)
───────────────────────────────────────────────────
TOTAL: ~6 minutes

# Mobile website (reuses desktop tests)
npm run test:e2e:mobile          # 5 minutes (same tests, mobile viewport)
───────────────────────────────────────────────────
TOTAL: ~5 minutes

# Native apps (only new tests)
npm run test:native:ios          # 3 minutes (10% of tests)
npm run test:native:android      # 3 minutes (10% of tests)
───────────────────────────────────────────────────
TOTAL: ~6 minutes

═══════════════════════════════════════════════════
GRAND TOTAL: ~17 minutes for complete cross-platform testing
```

Compare to manual testing: **4-6 hours per platform** = 12-18 hours total!

---

## Quick Decision Tree

```
                    Need to test a feature?
                            |
                            |
            ┌───────────────┴───────────────┐
            │                               │
      Is it business logic?           Is it UI/UX?
      (calculation, validation)       (buttons, forms, modals)
            │                               │
            ✅                              │
       Write Unit Test                     │
       (works everywhere!)        ┌────────┴────────┐
                                  │                 │
                            Is it desktop     Is it native-only?
                            or mobile web?    (camera, push, etc.)
                                  │                 │
                                  ✅                ✅
                          Write E2E Test      Write Native Test
                          (works on both!)    (iOS/Android only)
```

---

## Example Test Plan for ONE Feature

### Feature: "Shopping List with Barcode Scanner"

#### Tests Needed

| Test | Type | Coverage | Platforms |
|------|------|----------|-----------|
| Add item manually | E2E | Desktop + Mobile Web | All |
| Edit item | E2E | Desktop + Mobile Web | All |
| Delete item | E2E | Desktop + Mobile Web | All |
| Item validation | Unit | Logic | All |
| Item price calculation | Unit | Logic | All |
| Barcode scanner button | E2E | Desktop + Mobile Web | All |
| **Scan barcode (camera)** | **Native E2E** | **Native camera** | **iOS + Android only** |
| **Save scanned item** | E2E | Works after scan | All |

**Test effort**:
- Unit tests: 5 tests (works everywhere) ✅
- E2E tests: 6 tests (works on web + mobile web) ✅
- Native tests: 1 test (camera-specific) ✅

**Total**: 12 tests cover web + iOS + Android!

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```
tests/
├── website/
│   ├── auth.spec.ts          # Same test
│   ├── tasks.spec.ts         # Same test
│   └── habits.spec.ts        # Same test
├── ios/
│   ├── auth.spec.ts          # DUPLICATED! 😱
│   ├── tasks.spec.ts         # DUPLICATED! 😱
│   └── habits.spec.ts        # DUPLICATED! 😱
└── android/
    ├── auth.spec.ts          # DUPLICATED! 😱
    ├── tasks.spec.ts         # DUPLICATED! 😱
    └── habits.spec.ts        # DUPLICATED! 😱
```

### ✅ Do This Instead
```
tests/
├── unit/                      # Works everywhere
│   ├── auth.test.ts          # ✅ Shared
│   ├── tasks.test.ts         # ✅ Shared
│   └── habits.test.ts        # ✅ Shared
├── e2e/                       # Desktop + mobile web
│   ├── auth.spec.ts          # ✅ Shared
│   ├── tasks.spec.ts         # ✅ Shared
│   └── habits.spec.ts        # ✅ Shared
└── native/                    # ONLY native features
    ├── push-notifications.spec.ts  # ✅ New (iOS/Android only)
    ├── camera.spec.ts             # ✅ New (iOS/Android only)
    └── biometrics.spec.ts         # ✅ New (iOS/Android only)
```

---

## Summary: Your Testing Strategy

### What You'll Actually Do

#### Step 1: Write Unit Tests (Once)
```bash
npm test
# ✅ Works on: Website, iOS app, Android app
```

#### Step 2: Write Desktop E2E Tests (Once)
```bash
npm run test:e2e
# ✅ Works on: Website
```

#### Step 3: Run Same Tests on Mobile Web (Automatic!)
```bash
npm run test:e2e:mobile
# ✅ Works on: iOS Safari, Android Chrome
# ✅ Reuses desktop tests - no extra work!
```

#### Step 4: Write Native Tests (10% new tests)
```bash
npm run test:native
# ✅ Works on: iOS app, Android app
# ✅ Only for native features (camera, push, etc.)
```

### Total Effort

- **500+ test scenarios** from your QA plan
- **450 scenarios** covered by unit + E2E tests (90%) → Write once
- **50 scenarios** are mobile layout adaptations → Automatically handled by running desktop tests with mobile viewport
- **10-20 scenarios** need native tests (10%) → Write separately

**You write 470 tests, get coverage for 500+ scenarios across 3 platforms!**

---

**Ready to start?** See [TESTING-QUICKSTART.md](./TESTING-QUICKSTART.md) for commands and [MOBILE-TESTING-STRATEGY.md](./MOBILE-TESTING-STRATEGY.md) for mobile specifics.
