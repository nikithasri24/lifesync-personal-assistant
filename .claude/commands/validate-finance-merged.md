# Validate Finance Merged Mode

Validates that the Finance module's merged mode implementation is complete and functional.

## What This Does

1. **Code Analysis**
   - Checks that OwnerFilter is integrated in all required pages
   - Verifies owner selection exists in creation modals
   - Validates backend API accepts userId/connectionId parameters
   - Ensures types are properly defined

2. **Data Flow Validation**
   - Traces how transactions flow from UI → API → Database
   - Checks filter state persistence (localStorage)
   - Validates merged connection queries
   - Confirms RLS policies are referenced

3. **Component Integration**
   - Verifies QuickAddTransaction has owner dropdown
   - Checks AccountModal has owner dropdown
   - Validates GoalEditor has shared goal checkbox
   - Confirms all pages import useFinanceFilters

4. **Mock Data Testing**
   - Validates mock API responses include userId fields
   - Checks that filtering logic works with test data
   - Ensures owner badges display correctly

## Usage

```bash
# Run validation
/validate-finance-merged

# Or with specific checks
/validate-finance-merged --focus=owner-selection
/validate-finance-merged --focus=shared-goals
/validate-finance-merged --focus=filters
```

## Exit Criteria

✅ All creation modals have owner selection in merged mode
✅ All pages have OwnerFilter component integrated
✅ Backend APIs accept userId/connectionId parameters
✅ Filter state persists correctly
✅ Mock data includes proper userId fields
✅ No TypeScript errors in Finance module

## Output

Returns a detailed report with:
- ✅ Passed checks
- ❌ Failed checks with file:line references
- 🟡 Warnings for potential issues
- 📝 Recommendations for improvements
