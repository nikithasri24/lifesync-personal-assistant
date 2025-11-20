# Testing Coverage & localStorage Usage Analysis

**Date**: 2025-11-19
**Analysis**: Comprehensive review of test coverage and localStorage vs Supabase usage

---

## Executive Summary

### Test Coverage
- **Total Test Files**: 52 test files found
- **Well-Tested Features**: Todos, Habits, Finance, Projects (legacy), 75 Hard
- **Missing Tests**: Journal, Travel, Skincare, Shopping, Meal Planning, Shared/Connections, Goals, Notes

### localStorage Usage
- **19 files** still using localStorage
- **Critical Issues**: Notes, Goals, Dreams use localStorage exclusively (no Supabase)
- **Migration Status**: Journal has migration utility, others don't

---

## Part 1: Test Coverage Analysis

### ✅ Features WITH Tests (Good Coverage)

#### 1. **Todos/Tasks** (Excellent Coverage - 17 test files)
- ✅ `Todos.dragdrop.test.tsx` - Drag and drop functionality
- ✅ `Todos.filters.sort.test.tsx` - Filtering and sorting
- ✅ `Todos.project.modal.test.tsx` - Project modal
- ✅ `Todos.drag.project.test.tsx` - Project drag operations
- ✅ `Todos.bulk-actions.test.tsx` - Bulk operations
- ✅ `Todos.bulk.select.filtered.test.tsx` - Bulk selection with filters
- ✅ `Todos.quickadd.selectedProject.test.tsx` - Quick add with project
- ✅ `Todos.calendar.date.test.tsx` - Calendar date selection
- ✅ `Todos.calendar.hour.test.tsx` - Calendar hour selection
- ✅ `Todos.status.star.test.tsx` - Status and starred todos
- ✅ `Todos.filters.combinations.test.tsx` - Filter combinations
- ✅ `Todos.badges.counts.test.tsx` - Badge counts
- ✅ `Todos.filters.status.project.test.tsx` - Status and project filters
- ✅ `Todos.inline-edit.test.tsx` - Inline editing
- ✅ `TaskDragDrop.test.tsx` - Component-level drag/drop
- ✅ `TaskFocusIntegration.test.tsx` - Focus integration
- ✅ `quickAdd.test.ts` - Quick add utility

**Status**: EXCELLENT ✅

#### 2. **Habits** (Excellent Coverage - 14 test files)
- ✅ `Habits.add.test.tsx` - Add new habit
- ✅ `Habits.complete.test.tsx` - Complete habit
- ✅ `Habits.edit.test.tsx` - Edit habit
- ✅ `Habits.validation.test.tsx` - Form validation
- ✅ `Habits.errorToast.test.tsx` - Error handling
- ✅ `Habits.category.test.tsx` - Categories
- ✅ `Habits.progress.todayCount.test.tsx` - Today's progress
- ✅ `Habits.progress.completed.test.tsx` - Completion progress
- ✅ `Habits.category.updateLabel.test.tsx` - Category labels
- ✅ `Habits.frequency.custom.test.tsx` - Custom frequency
- ✅ `Habits.frequency.custom.edit.test.tsx` - Edit custom frequency
- ✅ `Habits.progress.custom.todayCount.test.tsx` - Custom progress
- ✅ `Habits.progress.weekly.monthly.test.tsx` - Weekly/monthly progress
- ✅ `habits.persistence.test.tsx` - Persistence testing

**Status**: EXCELLENT ✅

#### 3. **Projects** (Legacy - 4 test files)
- ✅ `ProjectTracking.test.tsx` - Basic tests
- ✅ `ProjectTracking.advanced.test.tsx` - Advanced features
- ✅ `ProjectTracking.dragdrop.test.tsx` - Drag and drop
- ✅ `ProjectTracking.e2e.test.tsx` - End-to-end

**Note**: These tests are for the OLD ProjectTrackingDebug component (not the new one we just built)

**Status**: LEGACY TESTS - NEW UI NEEDS TESTS ⚠️

#### 4. **Finance** (Good Coverage - 3 test files)
- ✅ `finance/dashboard.test.tsx` - Dashboard
- ✅ `finance/transactions.test.tsx` - Transactions
- ✅ `finance/budgets.test.tsx` - Budgets

**Status**: GOOD ✅

#### 5. **75 Hard** (Good Coverage - 3 test files)
- ✅ `SeventyFiveHard.removals.test.tsx` - Challenge removal
- ✅ `SeventyFiveHard.core.test.tsx` - Core functionality
- ✅ `seventyFiveHardActions.performance.test.ts` - Performance
- ✅ `SeventyFiveHardWidget.test.tsx` - Widget component

**Status**: GOOD ✅

#### 6. **Core Components** (Good Coverage - 5 test files)
- ✅ `LoadingSpinner.test.tsx` - Loading spinner
- ✅ `Layout.test.tsx` - Main layout
- ✅ `FormField.test.tsx` - Form fields
- ✅ `ErrorState.test.tsx` - Error states
- ✅ `Dashboard.test.tsx` - Dashboard page

**Status**: GOOD ✅

#### 7. **Utilities & Hooks** (Good Coverage)
- ✅ `useTheme.test.ts` - Theme hook
- ✅ `useLocalStorage.test.tsx` - LocalStorage hook
- ✅ `useAppStore.test.ts` - App store
- ✅ `validation.test.ts` - Validation utilities

**Status**: GOOD ✅

---

### ❌ Features WITHOUT Tests (Missing Coverage)

#### 1. **Journal** (NEW FEATURE - NO TESTS)
**Files**:
- `src/pages/Journal.tsx`
- `src/pages/GridJournalEnhanced.tsx`
- `src/api/journalAPI.ts`
- `src/utils/migrateJournalEntries.ts`

**Missing Tests**:
- ❌ Create journal entry
- ❌ Edit journal entry
- ❌ Delete journal entry with confirmation
- ❌ Search/filter functionality
- ❌ Mood filtering
- ❌ Tag filtering
- ❌ Migration utility
- ❌ API layer (getJournalEntries, createJournalEntry, etc.)

**Priority**: HIGH 🔴 (New feature, needs validation)

---

#### 2. **Travel** (COMPLEX FEATURE - NO TESTS)
**Files**:
- `src/pages/Travel.tsx`
- `src/travel/pages/VisaPage.tsx`
- `src/travel/components/TripPlanner.tsx`
- `src/travel/components/VisaCalculator.tsx`
- `src/travel/components/ExpiryAlerts.tsx`
- `src/travel/api/tripAPI.ts`

**Missing Tests**:
- ❌ State/country tracking
- ❌ Visa calculator
- ❌ Trip planner CRUD
- ❌ Expiry alerts
- ❌ Map visualizations
- ❌ Trip API layer

**Priority**: HIGH 🔴 (Complex logic, visa calculations)

---

#### 3. **Skincare** (NEW TAB - NO TESTS)
**Files**:
- `src/pages/Skincare.tsx`

**Missing Tests**:
- ❌ Skincare tracking functionality
- ❌ Product management
- ❌ Routine tracking

**Priority**: MEDIUM 🟡 (New feature)

---

#### 4. **Shopping** (NO TESTS)
**Files**:
- `src/pages/ShoppingSmart.tsx`
- `src/components/SmartBillTracker.tsx`

**Missing Tests**:
- ❌ Shopping list management
- ❌ Item CRUD operations
- ❌ Bill tracking
- ❌ Price tracking

**Priority**: MEDIUM 🟡 (User-facing feature)

---

#### 5. **Meal Planning** (NO TESTS)
**Files**:
- `src/pages/MealPlanning.tsx`

**Missing Tests**:
- ❌ Meal plan creation
- ❌ Recipe management
- ❌ Weekly planning
- ❌ Pantry integration

**Priority**: MEDIUM 🟡 (Complex feature)

---

#### 6. **Notes** (NO TESTS - LOCALSTORAGE ONLY!)
**Files**:
- `src/pages/Notes.tsx`

**Missing Tests**:
- ❌ Note creation
- ❌ Note editing
- ❌ Note deletion
- ❌ Tag management
- ❌ Search functionality

**Priority**: HIGH 🔴 (No Supabase, no tests)

---

#### 7. **Goals** (NO TESTS - LOCALSTORAGE ONLY!)
**Files**:
- `src/pages/LifeGoals.tsx`

**Missing Tests**:
- ❌ Goal creation
- ❌ Goal progress tracking
- ❌ Goal completion
- ❌ Dream tracking

**Priority**: HIGH 🔴 (No Supabase, no tests)

---

#### 8. **Shared/Connections** (NEW FEATURE - NO TESTS)
**Files**:
- `src/pages/Shared.tsx`
- `src/shared/components/ConnectionsList.tsx`
- `src/shared/components/InvitationsPanel.tsx`
- `src/shared/components/NewConnectionForm.tsx`
- `src/shared/components/PermissionManager.tsx`
- `src/shared/api/*`

**Missing Tests**:
- ❌ Connection invitations
- ❌ Permission management
- ❌ Data sharing
- ❌ Connection acceptance/rejection
- ❌ Real-time updates

**Priority**: HIGH 🔴 (Security-critical, complex logic)

---

#### 9. **Focus Sessions** (PARTIAL TESTS)
**Files**:
- `src/pages/Focus.tsx`
- `src/services/focus/FocusService.ts`

**Missing Tests**:
- ❌ Focus session creation
- ❌ Timer functionality
- ❌ Session completion
- ❌ Break management

**Priority**: MEDIUM 🟡 (Has some integration tests)

---

#### 10. **Calendar/Period Tracking** (NO TESTS)
**Files**:
- `src/pages/Calendar.tsx`
- `src/pages/AppleHealthCyclesSimple.tsx`
- `src/pages/AppleHealthCycles.tsx`

**Missing Tests**:
- ❌ Calendar event management
- ❌ Period tracking
- ❌ Health sync

**Priority**: MEDIUM 🟡

---

## Part 2: localStorage Usage Analysis

### 🔴 Critical: Features Using ONLY localStorage (No Supabase)

#### 1. **Notes** (`src/pages/Notes.tsx`)
```typescript
// Uses useAppStore which stores in localStorage
addNote: (noteInput) => {
  const note: Note = {
    ...noteInput,
    id: createId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: noteInput.tags ?? [],
  }
  set((state) => ({ notes: [note, ...state.notes] }))
}
```

**Issue**: No Supabase integration at all!
**Impact**: Notes don't sync across devices, lost on cache clear
**Fix Needed**: Create `notes` table, API layer, migration utility

---

#### 2. **Goals** (`src/pages/LifeGoals.tsx`)
```typescript
// Uses useAppStore which stores in localStorage
addGoal: (goalInput) => {
  const goal: Goal = {
    ...goalInput,
    id: createId(),
    createdAt: new Date(),
  }
  set((state) => ({ goals: [...state.goals, goal] }))
}
```

**Issue**: No Supabase integration at all!
**Impact**: Goals don't sync across devices, lost on cache clear
**Fix Needed**: Create `goals` table, API layer, migration utility

---

#### 3. **Dreams** (`src/pages/LifeGoals.tsx`)
```typescript
// Uses useAppStore which stores in localStorage
addDream: (dreamInput) => {
  const dream: Dream = {
    ...dreamInput,
    id: createId(),
    createdAt: new Date(),
    lastUpdated: new Date(),
    notes: dreamInput.notes ?? '',
  }
  set((state) => ({ dreams: [...state.dreams, dream] }))
}
```

**Issue**: No Supabase integration at all!
**Impact**: Dreams don't sync across devices, lost on cache clear
**Fix Needed**: Create `dreams` table, API layer, migration utility

---

#### 4. **Mood Entries** (`useRealAppStore.ts`)
```typescript
addMoodEntry: (entry) => {
  const moodEntry: MoodEntry = {
    ...entry,
    id: createId(),
    createdAt: new Date(),
  }
  set((state) => ({ moodEntries: [moodEntry, ...state.moodEntries] }))
}
```

**Issue**: No Supabase integration!
**Impact**: Mood data doesn't sync
**Note**: Mood tab was removed, but data model still exists
**Fix Needed**: Either remove entirely or migrate to Supabase

---

### 🟡 Features with localStorage for Settings/UI State (Acceptable)

#### 1. **Theme** (`src/hooks/useTheme.ts`)
```typescript
localStorage.setItem('theme', theme)
```
**Status**: ✅ OK - UI preference, doesn't need sync

---

#### 2. **Active View** (`src/stores/useRealAppStore.ts`)
```typescript
localStorage.setItem('lifesync:activeView', view)
```
**Status**: ✅ OK - UI state, doesn't need sync

---

#### 3. **Sidebar State** (`src/stores/useRealAppStore.ts`)
```typescript
localStorage.setItem('lifesync:settings:weekStartsOn', String(ws))
```
**Status**: ✅ OK - UI preference

---

#### 4. **Finance Filters** (`src/finance/store/useFinanceFilters.ts`)
```typescript
localStorage.setItem('finance-filters', JSON.stringify(filters))
```
**Status**: ✅ OK - UI state for filters

---

#### 5. **Visited Maps State** (WorldVisitedMap, USVisitedSVG, etc.)
```typescript
localStorage.setItem('visitedStates', JSON.stringify(visited))
```
**Status**: ⚠️ SHOULD MIGRATE - Travel data should be in Supabase
**Fix Needed**: Migrate to travel database tables

---

### 🟢 Features with Migration Utilities (Good)

#### 1. **Journal** (`src/utils/migrateJournalEntries.ts`)
```typescript
export async function migrateJournalEntries(): Promise<{
  success: boolean;
  migrated: number;
  errors: number;
}>
```
**Status**: ✅ HAS MIGRATION - Good example to follow
**Runs**: Automatically on app startup

---

#### 2. **75 Hard** (Has cloud sync logic)
```typescript
// Old implementation had localStorage sync to Supabase
// New architecture uses Supabase directly
```
**Status**: ✅ MIGRATED - Uses Supabase exclusively now

---

### 📋 localStorage Usage Summary

| Feature | localStorage Usage | Supabase | Status | Priority |
|---------|-------------------|----------|--------|----------|
| **Notes** | ✅ Full data storage | ❌ None | 🔴 Critical | HIGH |
| **Goals** | ✅ Full data storage | ❌ None | 🔴 Critical | HIGH |
| **Dreams** | ✅ Full data storage | ❌ None | 🔴 Critical | HIGH |
| **Mood Entries** | ✅ Full data storage | ❌ None | 🔴 Critical | MEDIUM (tab removed) |
| **Visited Maps** | ✅ Travel data | ❌ Should migrate | 🟡 Warning | MEDIUM |
| **Journal** | ⚠️ Migration only | ✅ Primary | ✅ Good | DONE ✅ |
| **Tasks** | ❌ None | ✅ Exclusive | ✅ Good | DONE ✅ |
| **Habits** | ❌ None | ✅ Exclusive | ✅ Good | DONE ✅ |
| **Projects** | ❌ None | ✅ Exclusive | ✅ Good | DONE ✅ |
| **Finance** | ✅ Filters only | ✅ Data | ✅ Good | DONE ✅ |
| **75 Hard** | ❌ None (new arch) | ✅ Exclusive | ✅ Good | DONE ✅ |
| **Shared** | ❌ None | ✅ Exclusive | ✅ Good | DONE ✅ |
| **Theme** | ✅ UI preference | N/A | ✅ Good | OK ✅ |
| **Active View** | ✅ UI state | N/A | ✅ Good | OK ✅ |

---

## Part 3: Recommended Actions

### Priority 1: Fix Critical Data Loss Issues (HIGH 🔴)

#### 1. **Notes → Supabase Migration**
```sql
-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notes_user_id_created_at_idx ON notes(user_id, created_at DESC);
CREATE INDEX notes_tags_idx ON notes USING GIN(tags);
```

**Files to Create**:
- `supabase/migrations/20251119_add_notes.sql`
- `src/api/notesAPI.ts`
- `src/utils/migrateNotes.ts`

**Files to Update**:
- `src/stores/useRealAppStore.ts` - Update addNote/updateNote/deleteNote

---

#### 2. **Goals → Supabase Migration**
```sql
-- Create goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  target_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dreams table
CREATE TABLE dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Files to Create**:
- `supabase/migrations/20251119_add_goals_dreams.sql`
- `src/api/goalsAPI.ts`
- `src/utils/migrateGoals.ts`

**Files to Update**:
- `src/stores/useRealAppStore.ts` - Update goal/dream methods

---

### Priority 2: Add Tests for Untested Features (HIGH 🔴)

#### 1. **Journal Tests**
Create: `src/pages/__tests__/Journal.test.tsx`
```typescript
describe('Journal', () => {
  test('creates new journal entry')
  test('edits existing entry')
  test('deletes entry with confirmation')
  test('searches entries by text')
  test('filters by mood')
  test('filters by tags')
  test('displays entries in grid')
})
```

Create: `src/api/__tests__/journalAPI.test.ts`
```typescript
describe('journalAPI', () => {
  test('getJournalEntries with filters')
  test('createJournalEntry')
  test('updateJournalEntry')
  test('deleteJournalEntry')
  test('getJournalTags')
  test('getMoodStats')
})
```

---

#### 2. **Travel Tests**
Create: `src/travel/__tests__/TripPlanner.test.tsx`
Create: `src/travel/__tests__/VisaCalculator.test.tsx`
Create: `src/travel/__tests__/ExpiryAlerts.test.tsx`

---

#### 3. **Shared/Connections Tests** (Security Critical!)
Create: `src/shared/__tests__/ConnectionsList.test.tsx`
Create: `src/shared/__tests__/PermissionManager.test.tsx`
Create: `src/shared/__tests__/InvitationsPanel.test.tsx`

---

#### 4. **New ProjectTracking Tests**
Create: `src/pages/__tests__/ProjectTracking.new.test.tsx`
```typescript
describe('ProjectTracking (New UI)', () => {
  test('displays project statistics')
  test('creates new project')
  test('edits project')
  test('deletes project with confirmation')
  test('filters by status')
  test('searches projects')
  test('toggles grid/list view')
  test('expands to show tasks')
  test('calculates progress correctly')
})
```

---

### Priority 3: Travel Data Migration (MEDIUM 🟡)

The visited states/countries in `WorldVisitedMap`, `USVisitedSVG`, etc. should migrate to the travel tables.

**Current**: localStorage with keys like `visitedStates`, `visitedCountries`
**Target**: Use existing travel database tables

---

## Part 4: Implementation Plan

### Week 1: Critical Data Migrations
- [ ] Day 1-2: Notes → Supabase (migration + API + tests)
- [ ] Day 3-4: Goals/Dreams → Supabase (migration + API + tests)
- [ ] Day 5: Verify migrations work, test on production data

### Week 2: High-Priority Tests
- [ ] Day 1-2: Journal tests (UI + API)
- [ ] Day 3-4: Shared/Connections tests (security critical)
- [ ] Day 5: New ProjectTracking tests

### Week 3: Medium-Priority Tests
- [ ] Day 1-2: Travel tests (TripPlanner, VisaCalculator, ExpiryAlerts)
- [ ] Day 3: Shopping tests
- [ ] Day 4: Meal Planning tests
- [ ] Day 5: Skincare tests

### Week 4: Cleanup
- [ ] Day 1: Travel data migration (visited maps → database)
- [ ] Day 2-3: Code review and refactoring
- [ ] Day 4-5: Documentation updates

---

## Part 5: Testing Best Practices (Reference)

### What to Test

1. **User Interactions**
   - Button clicks
   - Form submissions
   - Input changes
   - Modal open/close

2. **Data Operations**
   - CRUD operations
   - API calls
   - State updates
   - Error handling

3. **UI States**
   - Loading states
   - Empty states
   - Error states
   - Success states

4. **Edge Cases**
   - Empty data
   - Invalid input
   - Network errors
   - Concurrent operations

### Example Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup mocks
    vi.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    render(<ComponentName />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  test('handles errors gracefully', async () => {
    // Mock API to fail
    vi.mock('./api', () => ({
      fetchData: vi.fn().mockRejectedValue(new Error('API Error')),
    }));

    render(<ComponentName />);
    await waitFor(() => {
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });
});
```

---

## Conclusion

### Summary of Findings

1. **Test Coverage**: 52 test files exist, but major gaps in Journal, Travel, Shared, Notes, Goals, Shopping, Meal Planning
2. **localStorage Issues**: Notes, Goals, Dreams have NO Supabase integration - critical data loss risk
3. **Migration Status**: Only Journal has migration utility; Notes, Goals, Dreams need migrations urgently

### Critical Path

1. ✅ **Immediate**: Migrate Notes, Goals, Dreams to Supabase (prevent data loss)
2. ✅ **Week 1**: Add tests for Journal and Shared (recently built features)
3. ✅ **Week 2-3**: Add tests for Travel, Shopping, Meal Planning
4. ✅ **Week 4**: Clean up localStorage usage for Travel data

### Success Metrics

- [ ] All user data in Supabase (0% localStorage for data)
- [ ] 80%+ test coverage for user-facing features
- [ ] All new features have tests before deployment
- [ ] Migration utilities for all localStorage → Supabase transitions
