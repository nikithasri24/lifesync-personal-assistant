# TypeScript Build Errors - Progress Report

**Date**: 2025-12-23  
**Initial Errors**: 60+  
**Current Errors**: 98  
**Status**: In Progress - Encountering IDE auto-revert issues

---

## ✅ Fixed Errors

### 1. **vite.config.ts** - Terser Configuration
- **Error**: `terserOptions.compress` not recognized
- **Fix**: Changed from `terser` to `esbuild` minification
- **Status**: ✅ Fixed

### 2. **LifeCoachService.ts** - JournalMood Type Mismatch
- **Error**: Expected `{ mood?: number }[]` but got `JournalEntry[]` with `mood: JournalMood` (string)
- **Fix**: Added mood mapping from string to number in `calculateWellnessScore()`
- **Status**: ✅ Fixed

### 3. **supabaseApi.ts** - usedAmount Type Mismatch
- **Error**: `usedAmount: number | undefined` not assignable to `usedAmount: number`
- **Fix**: Changed `row.used_amount ? parseFloat(row.used_amount) : undefined` to `... : 0`
- **Status**: ✅ Fixed

---

## ❌ Remaining Errors (98 total)

### Category 1: Credit Card Components (9 errors)
**Files**: `BenefitsTab.tsx`, `OffersTab.tsx`

**Issues**:
1. Line 22: `useUpsertCardBenefitMutation(accountId)` - Expected 0 arguments
2. Line 37: `deleteMutation.mutateAsync(benefitId)` - Expected `{ benefitId, accountId }`
3. Line 41: `upsertMutation.mutateAsync(benefit)` - Expected `{ accountId, benefit }`
4. Line 22 (OffersTab): `useUpsertCardOfferMutation(accountId)` - Expected 0 arguments
5. Line 35 (OffersTab): `upsertMutation.mutateAsync(offer)` - Expected `{ accountId, offer }`

**Root Cause**: Mutation hooks don't take parameters, and mutateAsync expects objects with specific properties

**Attempted Fixes**: Made edits but IDE is auto-reverting changes (possible file watcher or formatter issue)

**Required Changes**:
```typescript
// BenefitsTab.tsx line 22
- const upsertMutation = useUpsertCardBenefitMutation(accountId);
+ const upsertMutation = useUpsertCardBenefitMutation();

// BenefitsTab.tsx line 37
- await deleteMutation.mutateAsync(benefitId);
+ await deleteMutation.mutateAsync({ benefitId, accountId });

// BenefitsTab.tsx line 41
- await upsertMutation.mutateAsync(benefit);
+ await upsertMutation.mutateAsync({ accountId, benefit });

// OffersTab.tsx line 22
- const upsertMutation = useUpsertCardOfferMutation(accountId);
+ const upsertMutation = useUpsertCardOfferMutation();

// OffersTab.tsx line 35
- await upsertMutation.mutateAsync(offer);
+ await upsertMutation.mutateAsync({ accountId, offer });
```

---

### Category 2: Automation API (2 errors)
**File**: `src/api/automationAPI.ts`

**Issues**:
1. Line 8: Module `"../services/types"` has no exported member `'AutomationRule'`
2. Line 8: Module `"../services/types"` has no exported member `'AutomationEventType'`

**Root Cause**: Types not exported from services/types

**Fix**: Export types or move to proper location

---

### Category 3: Calendar API (2 errors)
**File**: `src/api/calendarAPI.ts`

**Issues**:
1. Line 39: Left-hand side of `instanceof` must be object type
2. Line 45: Left-hand side of `instanceof` must be object type

**Root Cause**: Using `instanceof` with non-object types

---

### Category 4: Zustand Store Issues (15+ errors)
**Files**: `useApiTasks.ts`, `TaskFocusIntegration.test.tsx`

**Issues**:
- `Property 'tasks' does not exist on type 'ComposedStore'`
- `Property 'projects' does not exist on type 'ComposedStore'`
- `Property 'tasksLoading' does not exist on type 'ComposedStore'`
- `Property 'addTask' does not exist on type 'ComposedStore'`
- etc.

**Root Cause**: Tasks slice removed from Zustand store (Phase 1 work), but hooks still reference it

**Fix**: Update hooks to use React Query instead of Zustand

---

### Category 5: AI Services (30+ errors)
**Files**: `ContextAggregator.ts`, `PredictionService.ts`, `UserPatternService.ts`

**Issues**:
1. Property name mismatches (`current_streak` vs `streak`, `due_date` vs `dueDate`)
2. Status value mismatches (`"completed"` vs `"done"`)
3. Type mismatches (nullable vs required fields)

**Root Cause**: Direct Supabase access with snake_case columns vs camelCase TypeScript types

**Fix**: Either migrate to API layer (proper solution) or add type transformations

---

### Category 6: React Query (2 errors)
**File**: `src/lib/react-query.ts`

**Issues**:
1. Line 67: `onError` does not exist in type
2. Line 67: Parameter 'error' implicitly has 'any' type

**Root Cause**: React Query v5 removed `onError` callback

**Fix**: Use `throwOnError` or error boundaries instead

---

## 🚧 Blockers

### IDE Auto-Revert Issue
**Problem**: When editing `BenefitsTab.tsx` and `OffersTab.tsx`, changes are being reverted by IDE auto-formatting or file watcher

**Evidence**:
- `str-replace-editor` reports "Successfully edited"
- `cat` command shows old content
- `view` tool shows old content
- IDE reports "auto-formatting was applied" and reverts changes

**Possible Causes**:
1. File watcher (Vite HMR) reverting changes
2. IDE formatter with different config
3. Git auto-revert
4. File system caching

**Workaround Needed**: Stop dev server, make edits, restart

---

## 📋 Recommended Next Steps

### Option A: Stop Dev Server and Fix Files
1. Stop `npm run dev`
2. Make all edits to credit card components
3. Fix Zustand store issues
4. Fix AI service type mismatches
5. Run `npm run build` to verify
6. Restart dev server

### Option B: Skip Build for Now
1. Document remaining errors
2. Continue with Phase 3 quality improvements that don't require build
3. Return to fix errors later

### Option C: Disable Strict Type Checking Temporarily
1. Add `// @ts-nocheck` to problematic files
2. Complete Phase 3
3. Return to fix types properly later

---

## 🎯 Estimated Effort

- **Credit Card Components**: 15 minutes (if IDE cooperates)
- **Zustand Store Migration**: 2 hours (migrate hooks to React Query)
- **AI Services**: 3 hours (migrate to API layer or add transformations)
- **Other Fixes**: 1 hour

**Total**: ~6-7 hours for complete fix

---

**Recommendation**: Take Option A - stop dev server, fix files, verify build works

