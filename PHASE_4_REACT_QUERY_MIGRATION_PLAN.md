# Phase 4: React Query Migration - Complete Plan

**Date**: 2025-12-23
**Status**: 🚀 **READY TO START**
**Duration**: 2-3 weeks (estimated)

---

## 🎯 Phase 4 Objectives

Migrate all remaining features from Zustand server state to React Query hooks, following the established pattern from Tasks, Habits, Projects, Goals, and Meal Planning.

**Benefits:**
- ✅ Automatic caching and background refetching
- ✅ Optimistic updates with automatic rollback on error
- ✅ Better loading and error states
- ✅ Reduced boilerplate code
- ✅ Improved performance
- ✅ Consistent data fetching patterns

---

## 📊 Current State Analysis

### ✅ **Already Migrated (5 features)**
1. **Tasks** - `src/tasks/hooks/useTasksQuery.ts` (15 hooks)
2. **Habits** - `src/habits/hooks/useHabitsQuery.ts` (17 hooks)
3. **Projects** - `src/projects/hooks/useProjectsQuery.ts` (11 hooks)
4. **Goals** - `src/goals/hooks/useGoalsQuery.ts` (17 hooks)
5. **Meal Planning** - `src/mealPlanning/hooks/useMealPlanningQuery.ts` (22 hooks)

**Total**: 82 React Query hooks already implemented ✅

---

### 🎯 **To Be Migrated (16 features)**

Based on ARCHITECTURE_MATRIX_UPDATED.md, these features need React Query migration:

#### **Week 1: High Priority (4 features)**
1. **Focus** - `src/hooks/useFocusQuery.ts` (90% maturity, needs RQ)
2. **Journal** - `src/hooks/useJournalQuery.ts` (88% maturity, needs RQ)
3. **Life Goals** - `src/goals/hooks/useLifeGoalsQuery.ts` (88% maturity, needs RQ)
4. **Notes** - `src/hooks/useNotesQuery.ts` (90% maturity, needs RQ)

#### **Week 2: Medium Priority (5 features)**
5. **Skincare** - `src/hooks/useSkincareQuery.ts` (92% maturity, needs RQ)
6. **Finances** - `src/finance/hooks/useFinanceQuery.ts` (95% maturity, needs RQ)
7. **Shopping** - `src/hooks/useShoppingQuery.ts` (93% maturity, needs RQ)
8. **Budgets** - Part of Finance (93% maturity)
9. **Recipes** - Part of Meal Planning (already has some RQ)

#### **Week 3: Lower Priority (7 features)**
10. **Travel** - `src/hooks/useTravelQuery.ts` (90% maturity, needs RQ)
11. **National Parks** - `src/hooks/useNationalParksQuery.ts` (92% maturity, needs RQ)
12. **Calendar** - `src/hooks/useCalendarQuery.ts` (88% maturity, needs RQ)
13. **Scheduler** - `src/hooks/useSchedulerQuery.ts` (88% maturity, needs RQ)
14. **Analytics** - `src/hooks/useAnalyticsQuery.ts` (70% maturity, needs RQ)
15. **Dashboard** - Aggregates only (65% maturity)
16. **Pantry** - Part of Meal Planning (already has some RQ)

---

## 📋 Migration Checklist (Per Feature)

For each feature, follow this checklist:

### 1. **Analysis** (30 min)
- [ ] Read existing Zustand slice (`src/stores/slices/{feature}Slice.ts`)
- [ ] Read existing API layer (`src/api/{feature}API.ts`)
- [ ] Identify server state vs UI state
- [ ] List all data fetching operations
- [ ] List all mutations (create/update/delete)

### 2. **Create React Query Hooks** (2-3 hours)
- [ ] Create hook file: `src/hooks/use{Feature}Query.ts` or `src/{feature}/hooks/use{Feature}Query.ts`
- [ ] Implement query hooks (GET operations)
- [ ] Implement mutation hooks (CREATE/UPDATE/DELETE operations)
- [ ] Add optimistic updates
- [ ] Add error handling
- [ ] Add TypeScript types
- [ ] Add JSDoc comments

### 3. **Update Zustand Slice** (30 min)
- [ ] Remove server state (data arrays/objects)
- [ ] Remove data fetching actions
- [ ] Keep UI state (filters, modals, view modes)
- [ ] Add deprecation notice
- [ ] Add migration guide comment

### 4. **Update Components** (1-2 hours)
- [ ] Replace Zustand calls with React Query hooks
- [ ] Update imports
- [ ] Preserve all UI behavior
- [ ] Maintain loading/error states
- [ ] Keep optimistic updates

### 5. **Testing** (1 hour)
- [ ] Run TypeScript check (`npm run typecheck`)
- [ ] Run existing tests (`npm test`)
- [ ] Manual smoke test in browser
- [ ] Verify all CRUD operations work
- [ ] Verify loading/error states

### 6. **Documentation** (15 min)
- [ ] Update feature documentation
- [ ] Add to REACT_QUERY_MIGRATION_SUMMARY.md
- [ ] Update ARCHITECTURE_MATRIX_UPDATED.md

**Total per feature**: ~5-7 hours

---

## 🗓️ Week-by-Week Plan

### **Week 1: High Priority Features (4 features)**

**Day 1-2: Focus & Journal**
- Monday AM: Focus migration (5 hours)
- Monday PM: Journal migration (5 hours)
- Tuesday: Testing and documentation (2 hours)

**Day 3-4: Life Goals & Notes**
- Wednesday AM: Life Goals migration (5 hours)
- Wednesday PM: Notes migration (5 hours)
- Thursday: Testing and documentation (2 hours)

**Day 5: Buffer & Review**
- Friday: Fix any issues, comprehensive testing

**Week 1 Total**: 4 features, ~24 hours

---

### **Week 2: Medium Priority Features (5 features)**

**Day 1-2: Skincare & Finances**
- Monday AM: Skincare migration (5 hours)
- Monday PM: Finances migration (6 hours)
- Tuesday: Testing and documentation (2 hours)

**Day 3-4: Shopping & Budgets**
- Wednesday AM: Shopping migration (5 hours)
- Wednesday PM: Budgets migration (4 hours)
- Thursday: Testing and documentation (2 hours)

**Day 5: Recipes & Buffer**
- Friday AM: Recipes migration (3 hours)
- Friday PM: Testing and review

**Week 2 Total**: 5 features, ~27 hours

---

### **Week 3: Lower Priority Features (7 features)**

**Day 1-2: Travel & National Parks**
- Monday AM: Travel migration (5 hours)
- Monday PM: National Parks migration (5 hours)
- Tuesday: Testing and documentation (2 hours)

**Day 3-4: Calendar & Scheduler**
- Wednesday AM: Calendar migration (5 hours)
- Wednesday PM: Scheduler migration (5 hours)
- Thursday: Testing and documentation (2 hours)

**Day 5: Analytics, Dashboard, Pantry**
- Friday AM: Analytics migration (4 hours)
- Friday PM: Dashboard & Pantry (3 hours)

**Week 3 Total**: 7 features, ~31 hours

---

## 📈 Success Metrics

### **Completion Criteria**
- [ ] All 16 features migrated to React Query
- [ ] 0 TypeScript errors
- [ ] All existing tests passing
- [ ] Manual testing complete for all features
- [ ] Documentation updated

### **Expected Outcomes**
- **React Query Coverage**: 5/21 → 21/21 (100%)
- **Total React Query Hooks**: 82 → ~200+
- **Code Quality**: Reduced boilerplate, better error handling
- **Performance**: Improved caching, reduced re-renders
- **Developer Experience**: Consistent patterns across all features

---

## 🎓 Migration Pattern (Reference)

### **Standard Hook Structure**
```typescript
// src/hooks/use{Feature}Query.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/{feature}API';

// Query Hooks
export function use{Features}Query(filters?) {
  return useQuery({
    queryKey: ['{feature}', filters],
    queryFn: () => api.get{Features}(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutation Hooks
export function useCreate{Feature}Mutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.create{Feature},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{feature}'] });
    },
  });
}
```

---

## 🚀 Getting Started

**Ready to start?** Let's begin with Week 1, Feature 1: **Focus**

**Next Steps:**
1. Analyze Focus feature (Zustand slice + API)
2. Create `src/hooks/useFocusQuery.ts`
3. Migrate components
4. Test and document

---

**Phase 4 Start Date**: 2025-12-23
**Estimated Completion**: 2026-01-13 (3 weeks)

