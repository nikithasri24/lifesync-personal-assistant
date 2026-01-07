# Architectural Drift Analysis

## Executive Summary

The codebase has **significant architectural drift** where multiple paths hit Supabase directly instead of through the centralized API layer. This undermines:

1. **Cache consistency** - React Query caches become stale/inconsistent
2. **Testing** - Direct Supabase calls are harder to mock
3. **Error handling** - Inconsistent error handling patterns
4. **Logging/Monitoring** - API layer provides centralized logging
5. **Auth checks** - API layer has `requireAuth()` built-in

## Current Architecture (As Documented)

```
Components → React Query Hooks → API Layer → Supabase
                   ↓
              Query Cache
```

The API layer (`src/api/*.ts`) provides:
- Centralized Supabase access
- Consistent error handling via `apiWrapper.ts`
- Auth validation via `requireAuth()`
- Logging via `logger`

## Violations Found

### 🔴 Critical: Services with Direct Supabase Access

| File | Tables Accessed | Impact |
|------|-----------------|--------|
| `src/services/analytics.ts` | tasks, habits, habit_entries, focus_sessions, journal_entries, projects, transactions, budgets | High - aggregates from 8 tables |
| `src/services/database.ts` | tasks, projects | High - full CRUD operations |
| `src/skincare/data.ts` | skincare tables | Medium |
| `src/travel/data.ts` | travel tables | Medium |
| `src/scheduler/tools.ts` | scheduler tables | High |

### 🟠 High: Hooks with Direct Supabase Access

| File | Purpose | Impact |
|------|---------|--------|
| `src/hooks/useTaskReminders.ts` | Fetches scheduled tasks | **Your error source!** |
| `src/hooks/useHabitReminders.ts` | Fetches habits for reminders | Medium |
| `src/hooks/useBillReminders.ts` | Fetches upcoming bills | Medium |
| `src/hooks/useImportantDateReminders.ts` | Fetches important dates | Medium |
| `src/hooks/useReminderPreferences.ts` | User preferences | Low |

### 🟡 Other Direct Access

| File | Purpose |
|------|---------|
| `src/services/pushNotificationService.ts` | Push subscriptions |
| `src/services/ConversationPersistenceService.ts` | AI conversations |
| `src/services/nutrition/FoodPhotoService.ts` | Food photo uploads |
| `src/shared/services/SharedDataProvider.ts` | Shared data contexts |

## Specific Issue: `useTaskReminders.ts`

The error you saw:
```
column tasks.scheduled_start does not exist
```

This hook directly queries Supabase:
```typescript
// src/hooks/useTaskReminders.ts
import { supabase } from '@/lib/supabase';

// Direct query - BYPASSES API layer
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .neq('status', 'done')
  .or('scheduled_start.not.is.null,due_date.gte.${date}')
```

**Problem**: When `scheduled_start` column doesn't exist, the query fails. If this used the API layer, we could:
1. Handle the error gracefully
2. Log it properly
3. Have React Query retry with backoff

## Recommended Fixes

### Priority 1: Fix Reminder Hooks (Quick Wins)

```typescript
// Before (direct access)
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('tasks').select('*')...

// After (use API layer)
import { getTasks } from '@/api/tasksAPI';
const tasks = await getTasks({ status: 'scheduled' });
```

### Priority 2: Migrate Analytics Service

Create `src/api/analyticsAPI.ts` that wraps analytics queries:
```typescript
// src/api/analyticsAPI.ts (already exists but underused)
export async function getProductivityMetrics(dateRange) {
  // Consolidated, cacheable query
}
```

### Priority 3: Deprecate DatabaseService

`src/services/database.ts` duplicates the API layer entirely. It should be:
1. Marked as deprecated
2. Gradually migrated to use `@/api/tasksAPI` and `@/api/projectsAPI`
3. Eventually removed

## Migration Path

### Phase 1: Immediate Fixes (1-2 days)
1. [ ] Fix `useTaskReminders.ts` to use `getScheduledTasks()` from API
2. [ ] Fix `useHabitReminders.ts` to use `getHabits()` from API
3. [ ] Fix `useBillReminders.ts` to use bills API
4. [ ] Apply database migration for `scheduled_start` column

### Phase 2: Service Migration (3-5 days)
1. [ ] Refactor `src/services/analytics.ts` to use API layer
2. [ ] Deprecate `src/services/database.ts`
3. [ ] Create missing API functions as needed

### Phase 3: Complete Cleanup (1 week)
1. [ ] Migrate remaining direct access in services
2. [ ] Add ESLint rule to prevent direct Supabase imports outside `src/api/`
3. [ ] Update architecture documentation

## Benefits After Fix

| Aspect | Before | After |
|--------|--------|-------|
| Cache Consistency | ❌ Multiple sources of truth | ✅ Single React Query cache |
| Error Handling | ❌ Inconsistent | ✅ Centralized in API layer |
| Testing | ❌ Hard to mock Supabase | ✅ Easy to mock API functions |
| Logging | ❌ Scattered | ✅ Centralized via apiWrapper |
| Auth Checks | ❌ Manual in each file | ✅ Built-in requireAuth() |

