# Phase 1.3: Clean up Zustand Stores - Remove Server State

## ✅ Completed (5 slices converted to UI-only state)

### 1. tasksSlice.ts ✅
- **Before**: 147 lines with server state (tasks array, loading, CRUD operations)
- **After**: 85 lines with UI-only state (view modes, filters, sorting)
- **React Query hooks**: useTasksQuery.ts (already exists)
- **Commit**: c602f12

### 2. habitsSlice.ts ✅
- **Before**: 196 lines with server state (habits, entries, loading, CRUD operations)
- **After**: 78 lines with UI-only state (view modes, filters, sorting)
- **React Query hooks**: useHabitsQuery.ts (already exists)
- **Commit**: c602f12

### 3. notesSlice.ts ✅
- **Before**: 94 lines with server state (notes array, loading, CRUD operations)
- **After**: 68 lines with UI-only state (view modes, filters, search)
- **React Query hooks**: useNotesQuery.ts (already exists)
- **Commit**: f8f963d

### 4. journalSlice.ts ✅
- **Before**: 117 lines with server state (journal entries, loading, CRUD operations)
- **After**: 74 lines with UI-only state (view modes, filters, mood, date range)
- **React Query hooks**: useJournalQuery.ts (already exists)
- **Commit**: f8f963d

### 5. goalsSlice.ts ✅
- **Before**: 203 lines with server state (goals, dreams, loading, CRUD operations)
- **After**: 123 lines with UI-only state (view modes, filters for both goals and dreams)
- **React Query hooks**: useGoalsQuery.ts, useLifeGoalsQuery.ts (already exist)
- **Commit**: f8f963d

## 📊 Progress Summary

- **Slices Converted**: 5 / 12 (42%)
- **Lines Removed**: ~400 lines of server state code
- **Lines Added**: ~428 lines of UI state code
- **Net Change**: Cleaner separation of concerns

## ⏳ Remaining Slices to Convert

### 6. mealsSlice.ts
- **Current**: 109 lines with server state (meal plans, planned meals, CRUD)
- **React Query hooks**: useMealPlanningQuery.ts ✅ (exists)
- **UI state needed**: View modes, filters, date range, meal type filters

### 7. shoppingSlice.ts
- **Current**: 115 lines with server state (shopping lists, items, CRUD)
- **React Query hooks**: useShoppingQuery.ts ✅ (exists)
- **UI state needed**: View modes, filters, list selection, item grouping

### 8. projectsSlice.ts
- **Current**: 258 lines with server state (projects, milestones, tasks, CRUD)
- **React Query hooks**: useProjectsQuery.ts ✅ (exists)
- **UI state needed**: View modes, filters, status, milestone view, task linking UI

### 9. financeSlice.ts
- **Current**: Unknown (need to check)
- **React Query hooks**: useFinanceQuery.ts ✅ (exists)
- **UI state needed**: View modes, filters, date range, category filters

### 10. focusSlice.ts
- **Current**: Unknown (need to check)
- **React Query hooks**: useFocusQuery.ts ✅ (exists)
- **UI state needed**: Timer state, session view, break mode

### 11. calendarSlice.ts
- **Current**: Unknown (need to check)
- **React Query hooks**: useCalendarQuery.ts ✅ (exists)
- **UI state needed**: View modes (day/week/month), selected date, filters

### 12. Other slices
- schedulerSlice.ts
- travelSlice.ts
- skincareSlice.ts
- lifeGoalsSlice.ts
- nationalParksSlice.ts

## 🎯 Next Steps

1. Convert remaining slices (meals, shopping, projects, finance, focus, calendar)
2. Update selectors in useComposedStore for each converted slice
3. Verify no components are broken by the changes
4. Remove any legacy hooks that depend on old Zustand server state
5. Update documentation

## 📝 Pattern Established

For each slice conversion:
1. Identify UI state (view modes, filters, sorting, selections)
2. Remove server state (data arrays, loading flags, CRUD operations)
3. Update interface to only include UI state and actions
4. Update selector in useComposedStore
5. Add deprecation notice pointing to React Query hooks
6. Commit with descriptive message

## 🎉 Benefits Achieved So Far

- **Cleaner separation**: Server state (React Query) vs UI state (Zustand)
- **Better caching**: React Query handles all server data caching
- **Optimistic updates**: React Query provides automatic rollback on error
- **Reduced complexity**: Zustand slices are now much simpler
- **Type safety**: Clearer interfaces for UI-only state
