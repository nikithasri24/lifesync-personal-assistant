# Finance Module Testing Guide
**How to Test Without Manual Clicking**

---

## 🎯 Quick Test (30 seconds)

Run the validation script:

```bash
./scripts/validate-finance-merged.sh
```

This checks:
- ✅ OwnerFilter integrated in all pages
- ✅ Owner selection in creation modals
- ✅ Backend API support
- ✅ Type definitions
- ✅ Filter state management
- ✅ Data filtering implementation

---

## 🤖 Use the Validation Skill (Claude Agent)

```bash
/validate-finance-merged
```

The agent will:
1. Analyze all Finance module code
2. Trace data flow from UI → API → Database
3. Check component integration
4. Validate with mock data
5. Return detailed report with file:line references

**Benefits:**
- No manual clicking needed
- Finds issues automatically
- Provides specific file locations
- Can focus on specific areas

---

## 🧪 Run Automated Tests

### Option 1: Component Tests (Fast - ~5 seconds)

```bash
npm test -- src/finance/__tests__/merged-mode-integration.test.tsx
```

Tests:
- Owner selection appears in merged mode
- Owner selection submits correct userId
- Shared goal checkbox works
- OwnerFilter renders on all pages
- Features hidden in non-merged mode

### Option 2: E2E Tests (Comprehensive - ~2 minutes)

```bash
npx playwright test tests/e2e/finance-merged-mode.spec.ts
```

Tests complete user flows:
- Adding transaction on behalf of partner
- Creating shared goals
- Filtering by owner
- Filter persistence across navigation
- Owner badges display
- Account creation with owner selection

---

## 🔍 Explore Agent Analysis

Use the Explore agent to investigate specific areas:

```bash
# Check how owner filtering works
claude explore "How does owner filtering work in the Finance module?" --thoroughness medium

# Check if all modals have owner selection
claude explore "Which Finance modals have owner selection?" --thoroughness quick

# Find potential issues
claude explore "Are there any Finance components that don't support merged mode?" --thoroughness very thorough
```

---

## 📊 Testing Matrix

| Test Type | Speed | Coverage | When to Use |
|-----------|-------|----------|-------------|
| **Validation Script** | ⚡ 30s | Code structure | Before committing |
| **Validation Skill** | 🔄 2min | Full analysis | After implementation |
| **Component Tests** | ⚡ 5s | Unit level | During development |
| **E2E Tests** | 🐌 2min | End-to-end | Before deployment |
| **Explore Agent** | 🔄 1min | Targeted deep dive | Investigating issues |

---

## 🎪 Mock Data Testing

Test with mock data (no database needed):

```typescript
// In src/finance/data/index.ts, temporarily use mock API
export const getFinanceAPI = async (): Promise<FinanceAPI> => {
  return new MockFinanceAPI(); // Instead of SupabaseFinanceAPI
};
```

Then run the app and test:
1. Owner filtering works
2. Owner badges display
3. Creation modals show owner selection
4. Shared goals can be created

**Benefits:**
- No database setup needed
- Predictable test data
- Fast iteration

---

## 🚀 Continuous Testing Workflow

### Before Committing:
```bash
./scripts/validate-finance-merged.sh && npm test -- finance
```

### After Implementation:
```bash
/validate-finance-merged
```

### Before Deployment:
```bash
npx playwright test tests/e2e/finance-merged-mode.spec.ts
```

---

## 🐛 Debugging Failed Tests

### If validation script fails:

The script outputs file:line references:
```
❌ src/finance/pages/GoalsPage.tsx missing OwnerFilter import
```

Fix: Add import and integration

### If component tests fail:

Check test output for specific assertion:
```
Expected: objectContaining({ userId: 'partner-789' })
Received: { userId: 'user-123' }
```

Fix: Update component to use selected userId

### If E2E tests fail:

Playwright shows screenshot and trace:
```
npx playwright show-trace trace.zip
```

Visual debugging of exact failure point

---

## 💡 Testing Best Practices

1. **Run validation script frequently** - Catches issues early
2. **Use validation skill for big changes** - Comprehensive analysis
3. **Write component tests for new features** - Fast feedback loop
4. **Run E2E tests before deployment** - Ensure full flow works
5. **Use Explore agent for investigation** - Find root causes quickly

---

## 📝 Example Test Session

```bash
# 1. Quick check before committing
./scripts/validate-finance-merged.sh
# ✅ All checks passed!

# 2. Run component tests
npm test -- merged-mode-integration
# ✅ 15 tests passed

# 3. Use validation skill for detailed analysis
/validate-finance-merged
# ✅ All validation criteria met
# 📝 Recommendation: Add E2E tests for budget filtering

# 4. Run E2E tests before deployment
npx playwright test finance-merged-mode
# ✅ 8 tests passed

# Ready to deploy! 🚀
```

---

## 🔧 Troubleshooting

### "OwnerFilter not found"
- Check import path: `'../components/OwnerFilter'`
- Ensure component exists in `src/finance/components/`

### "useFinanceMergedConnectionQuery is not a function"
- Check export in `src/hooks/useFinanceQuery.ts`
- Ensure hook is properly defined

### "Filter state not persisting"
- Check `localStorage` key: `finance_filters_v1`
- Ensure Zustand subscribe is saving state

### "Owner selection not visible in merged mode"
- Check `mergedConnection && user && partnerId` conditional
- Ensure merged connection query is returning data

---

## 🎯 Success Criteria

Before considering Finance merged mode complete:

- ✅ Validation script passes 100%
- ✅ Validation skill reports no issues
- ✅ All component tests pass
- ✅ All E2E tests pass
- ✅ No TypeScript errors
- ✅ Manual smoke test confirms UX

---

## 🚀 Quick Start

**For immediate validation (no setup):**
```bash
./scripts/validate-finance-merged.sh
```

**For comprehensive testing:**
```bash
/validate-finance-merged && npm test -- finance && npx playwright test finance-merged-mode
```

**For investigation:**
```bash
claude explore "Finance merged mode implementation" --thoroughness medium
```

---

**All testing tools are now available - no manual clicking required!** 🎉
