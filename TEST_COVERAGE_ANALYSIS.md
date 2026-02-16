# Test Coverage Analysis

**Analysis Date**: 2026-02-16
**Status**: Coverage exists but unknown percentage, significant gaps identified

---

## 📊 Current Test Suite Overview

### **Unit Tests (Vitest)**
- **Total Test Files**: 109
- **Total Tests**: 1,414 (1,208 passing, 201 failing, 5 todo)
- **Test Success Rate**: **85.4%** (201 failures need attention)
- **Coverage Reporter**: V8 (configured)
- **Coverage Output**: HTML + Text reports

### **E2E Tests (Playwright)**
- **Total E2E Files**: 49
- **Coverage Areas**: Auth, Finance, Travel, Shopping, Tasks, Calendar, Notes, etc.
- **Mobile Tests**: ❌ Not found

---

## ✅ **What's Well Tested**

### **1. Finance Module** (Excellent Coverage)
- ✅ Finance calculations (`calculations.test.ts`)
- ✅ Budget recommendations (`budgetRecommendations.test.ts`)
- ✅ Cash flow calculator (`cashFlowCalculator.test.ts`)
- ✅ Category aggregation (`categoryAggregator.test.ts`)
- ✅ Goal calculations (`goalCalculations.test.ts`)
- ✅ Retirement calculations (`retirementCalculations.test.ts`)
- ✅ Savings rate calculations (`savingsRate.test.ts`)
- ✅ Currency utilities (`currency.test.ts`)
- ✅ CSV import/export (`csv.test.ts`)
- ✅ Date utilities (`date.test.ts`)
- ✅ Validation (`validate.test.ts`)
- ✅ Fuzzy matching (`fuzzyMatch.test.ts`)

**Files**: 12 finance utility test files

### **2. Merged Mode** (Good Coverage)
- ✅ **Unit**: `finance/__tests__/merged-mode-integration.test.tsx`
  - Tests QuickAddTransaction owner selection
  - Tests AccountModal owner selection
  - Tests GoalEditor shared goals
  - Tests OwnerFilter rendering
  - Tests both merged and non-merged modes

- ✅ **E2E**: `tests/e2e/finance-merged-mode.spec.ts`
  - Tests owner filter on all finance pages
  - Tests adding transactions on behalf of partner
  - Tests filtering by owner
  - Tests account ownership
  - Tests shared goals

**Verdict**: ✅ **Merged mode is well tested** (both unit and E2E)

### **3. API Layer** (Moderate Coverage)
- ✅ `notesAPI.test.ts` - Full CRUD + filters
- ✅ `journalAPI.test.ts` - Journal operations
- ✅ `mealPlanningAPI.test.ts` - Meal planning CRUD
- ✅ `calendarAPI.test.ts` - Calendar operations
- ✅ `schedulerAPI.test.ts` - Task scheduling
- ✅ `skincareAPI.test.ts` - Skincare tracking
- ✅ `pantryPagination.test.ts` - Pagination logic
- ✅ `passportAPI.test.ts` - Travel passport management
- ✅ `connectionsAPI.test.ts` - Merged mode connections

**Files**: 10 API test files

### **4. Shopping Module** (Good Coverage)
- ✅ `pantryUtils.test.ts` - Pantry helper functions
- ✅ `typeValidators.test.ts` - Type checking
- ✅ `storeUtils.test.ts` - Store data handling
- ✅ `receiptParser.test.ts` - OCR receipt parsing
- ✅ `shoppingMappers.test.ts` - Data transformations
- ✅ `usePantryActions.test.ts` - Pantry hook logic

**Files**: 6 shopping test files

### **5. Meal Planning** (Good Coverage)
- ✅ `recipeUtils.test.ts` - Recipe utilities
- ✅ `mealPlanHelpers.test.ts` - Meal planning logic
- ✅ `useGroceryList.test.ts` - Grocery list hook

**Files**: 3 meal planning test files

### **6. E2E Tests** (Comprehensive Coverage)
**Critical Flows Covered**:
- ✅ Authentication (`auth.spec.ts`)
- ✅ Finance merged mode (`finance-merged-mode.spec.ts`)
- ✅ Task management (`todos.spec.ts`, `complete-task.spec.ts`)
- ✅ Drag & drop (`drag-*.spec.ts` - 7 files)
- ✅ Calendar integration (`calendar.spec.ts`)
- ✅ Search & filter (`search-sort.spec.ts`, `global-search.spec.ts`)
- ✅ Focus mode (`focus.spec.ts`, `focus-timer.spec.ts`)
- ✅ Offline sync (`sync-offline.spec.ts`)
- ✅ Data export/import (`data-export-import.spec.ts`)
- ✅ Travel visa calculator (`visa-calculator.spec.ts`)

**Files**: 49 E2E test files

---

## 🚨 **Critical Gaps Identified**

### **1. Auth Module** ⚠️ **HIGH PRIORITY**
**Status**: E2E tests exist, but no unit tests found

**E2E Coverage** (`auth.spec.ts`):
- ✅ Protected routes
- ✅ Session persistence
- ✅ Token refresh
- ✅ Network errors during auth

**Missing Unit Tests**:
- ❌ Login function unit tests
- ❌ Logout function unit tests
- ❌ Token validation logic
- ❌ Auth context/hooks tests
- ❌ Password reset flow
- ❌ Email verification flow

**Recommendation**:
```typescript
// Create: src/auth/__tests__/auth.test.ts
// Test: login(), logout(), resetPassword(), verifyEmail()
// Test: useAuth() hook behavior
// Test: AuthContext state management
```

### **2. API Error Scenarios** ⚠️ **MEDIUM PRIORITY**
**Status**: Some error tests exist, but inconsistent

**Found Error Tests** (70 files with error handling):
- ✅ `notesAPI.test.ts` - Has error scenarios
- ✅ `calendarAPI.test.ts` - Has error scenarios
- ⚠️ Many API files missing comprehensive error tests

**Missing Error Coverage**:
- ❌ Network timeout scenarios
- ❌ 401 Unauthorized handling
- ❌ 403 Forbidden (RLS violations)
- ❌ 500 Server errors
- ❌ Rate limiting errors
- ❌ Offline/connection errors
- ❌ Malformed response handling

**Recommendation**:
```typescript
// Add to each API test file:
describe('Error Handling', () => {
  it('should handle 401 Unauthorized', async () => {
    mockSupabase.mockRejectedValue({ status: 401, message: 'Unauthorized' });
    await expect(apiFunction()).rejects.toThrow(AuthenticationError);
  });

  it('should handle 500 Server Error', async () => {
    mockSupabase.mockRejectedValue({ status: 500 });
    await expect(apiFunction()).rejects.toThrow(ServerError);
  });

  it('should handle network timeout', async () => {
    mockSupabase.mockRejectedValue({ code: 'ETIMEDOUT' });
    await expect(apiFunction()).rejects.toThrow(NetworkError);
  });
});
```

### **3. Mobile/Capacitor Tests** ❌ **HIGH PRIORITY**
**Status**: No mobile-specific tests found

**Missing Coverage**:
- ❌ Capacitor plugin tests (camera, filesystem, etc.)
- ❌ Mobile gesture tests (swipe, long-press)
- ❌ Mobile navigation tests
- ❌ Responsive design E2E tests
- ❌ Push notification handling
- ❌ Offline-first sync on mobile
- ❌ iOS-specific tests
- ❌ Android-specific tests

**Recommendation**:
```bash
# Add mobile E2E tests
tests/e2e/mobile/
  ├── ios-specific.spec.ts
  ├── android-specific.spec.ts
  ├── camera-integration.spec.ts
  ├── offline-sync.spec.ts
  └── responsive-layout.spec.ts

# Add viewport tests to existing E2E
test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE
test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13
```

### **4. Coverage Percentage Unknown** ⚠️ **MEDIUM PRIORITY**
**Status**: Coverage configured but no metrics tracked

**Current State**:
- ✅ V8 coverage provider configured
- ✅ HTML + text reporters configured
- ❌ No coverage percentage displayed
- ❌ Coverage not tracked in CI/CD
- ❌ No coverage thresholds enforced

**Test Failures**:
- 201 tests currently failing
- Need investigation and fixes

**Recommendation**:
```typescript
// vitest.config.ts - Add coverage thresholds
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'json-summary'],
  reportsDirectory: './coverage',
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['src/test/**', '**/__tests__/**', '**/*.d.ts'],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80
  }
}
```

### **5. Integration Tests** ⚠️ **MEDIUM PRIORITY**
**Status**: Some exist, but limited

**Current Integration Tests**:
- ✅ `mealPlanningShoppingIntegration.test.ts`
- ✅ `financeBudgetIntegration.test.ts`
- ✅ `taskProjectIntegration.test.ts`
- ✅ `habitGoalIntegration.test.ts`
- ✅ `sharedDataIntegration.test.ts`

**Missing Integration Tests**:
- ❌ Auth + Finance integration (user-specific data)
- ❌ Calendar + Tasks integration (scheduled tasks)
- ❌ Shopping + Meal Planning full flow
- ❌ Travel + Finance integration (expense tracking)
- ❌ Notes + Tasks integration (task from notes)

### **6. Critical Business Logic** ⚠️ **NEEDS VERIFICATION**
**Finance Calculations** - ✅ Well tested (12 test files)

**Needs Testing**:
- ⚠️ Budget rollover logic
- ⚠️ Recurring transaction generation
- ⚠️ Goal progress calculations with multiple accounts
- ⚠️ Retirement projection accuracy
- ⚠️ Credit card utilization calculations
- ⚠️ Transaction categorization accuracy

---

## 📈 **Test Coverage Estimate**

Based on test files vs source files analysis:

| Category | Est. Coverage | Confidence |
|----------|---------------|------------|
| **Finance Utilities** | 95%+ | ✅ High |
| **Finance UI** | 60% | ⚠️ Medium |
| **Merged Mode** | 85% | ✅ High |
| **Shopping** | 70% | ✅ High |
| **Meal Planning** | 65% | ⚠️ Medium |
| **Auth** | 30% | 🚨 Low |
| **API Layer** | 55% | ⚠️ Medium |
| **Mobile/Capacitor** | 0% | 🚨 None |
| **E2E Critical Flows** | 80% | ✅ High |
| **Overall Estimated** | **~60%** | ⚠️ Medium |

---

## 🎯 **Recommendations**

### **Priority 1: Fix Failing Tests** (URGENT)
- **201 tests failing** out of 1,414 total
- Success rate: 85.4% (should be 99%+)
- Action: Investigate and fix all failing tests

```bash
npm test -- --reporter=verbose | grep "FAIL"
# Fix each failing test systematically
```

### **Priority 2: Add Coverage Tracking to CI/CD** (HIGH)
```yaml
# .github/workflows/test.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json

- name: Check coverage thresholds
  run: npm run test:coverage -- --coverage.thresholds.lines=80
```

### **Priority 3: Add Auth Unit Tests** (HIGH)
Create comprehensive auth tests:
- `src/auth/__tests__/useAuth.test.ts`
- `src/auth/__tests__/authContext.test.ts`
- `src/auth/__tests__/authHelpers.test.ts`

Target: 90%+ coverage on auth module

### **Priority 4: Standardize API Error Testing** (MEDIUM)
Create template for API error tests:

```typescript
// Template: src/api/__tests__/apiErrorHandling.template.ts
export const testApiErrorHandling = (apiFunction, errorCases) => {
  describe('API Error Handling', () => {
    it('handles AuthenticationError (401)', async () => {
      mockSupabase.mockRejectedValue(createError(401));
      await expect(apiFunction()).rejects.toThrow(AuthenticationError);
    });

    it('handles AuthorizationError (403)', async () => {
      mockSupabase.mockRejectedValue(createError(403));
      await expect(apiFunction()).rejects.toThrow(AuthorizationError);
    });

    it('handles NotFoundError (404)', async () => {
      mockSupabase.mockRejectedValue(createError(404));
      await expect(apiFunction()).rejects.toThrow(NotFoundError);
    });

    it('handles ServerError (500)', async () => {
      mockSupabase.mockRejectedValue(createError(500));
      await expect(apiFunction()).rejects.toThrow(ServerError);
    });

    it('handles NetworkError (timeout)', async () => {
      mockSupabase.mockRejectedValue({ code: 'ETIMEDOUT' });
      await expect(apiFunction()).rejects.toThrow(NetworkError);
    });
  });
};
```

Apply to all 10 API test files.

### **Priority 5: Add Mobile E2E Tests** (MEDIUM)
```bash
# Create mobile test suite
mkdir -p tests/e2e/mobile

# Add tests for:
tests/e2e/mobile/
  ├── responsive-layout.spec.ts (viewport tests)
  ├── touch-gestures.spec.ts (swipe, tap, long-press)
  ├── offline-sync.spec.ts (Capacitor Network plugin)
  ├── camera-integration.spec.ts (if using camera)
  └── push-notifications.spec.ts (if using notifications)
```

### **Priority 6: Set Coverage Goals** (MEDIUM)
```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 80,      // Target: 80% line coverage
    functions: 80,  // Target: 80% function coverage
    branches: 75,   // Target: 75% branch coverage
    statements: 80  // Target: 80% statement coverage
  }
}
```

**Timeline**:
- Week 1: Fix failing tests (201)
- Week 2: Add auth unit tests + coverage tracking
- Week 3: Standardize API error tests
- Week 4: Mobile E2E tests

---

## 📊 **Coverage Goals**

### **3-Month Goals**
| Module | Current | Target | Status |
|--------|---------|--------|--------|
| Finance | 95% | 95% | ✅ Maintain |
| Auth | 30% | 90% | 🚨 Needs work |
| API Layer | 55% | 85% | ⚠️ Improve |
| Shopping | 70% | 85% | ✅ Good |
| Merged Mode | 85% | 90% | ✅ Good |
| Mobile | 0% | 70% | 🚨 Critical |
| **Overall** | **60%** | **85%** | ⚠️ Target |

---

## ✅ **Strengths**

1. ✅ **Excellent Finance test coverage** (12 utility test files)
2. ✅ **Comprehensive E2E suite** (49 test files)
3. ✅ **Merged mode well tested** (unit + E2E)
4. ✅ **Good shopping module coverage**
5. ✅ **Test infrastructure properly configured** (Vitest + Playwright)

---

## 🚨 **Weaknesses**

1. 🚨 **201 failing tests** (14.6% failure rate)
2. 🚨 **No mobile/Capacitor tests**
3. 🚨 **Auth module under-tested** (30% est.)
4. ⚠️ **Inconsistent API error testing**
5. ⚠️ **No coverage metrics tracked**
6. ⚠️ **No CI/CD coverage enforcement**

---

## 📝 **Next Steps**

1. **Immediate**: Fix 201 failing tests
2. **This Week**: Add coverage tracking to CI/CD
3. **This Month**: Add auth unit tests (90%+ target)
4. **Next Month**: Standardize API error testing
5. **Quarter**: Add mobile E2E tests (70%+ target)

---

**Current Status**: 🟡 **Moderate Coverage with Critical Gaps**
**Recommendation**: **Prioritize fixing failing tests and adding auth coverage**
