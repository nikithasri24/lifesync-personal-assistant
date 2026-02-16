# API Layer Consistency Audit
**Date:** February 16, 2026
**Total API Files:** 41
**Status:** ⚠️ **MODERATE INCONSISTENCY - Needs Standardization**

## Executive Summary

The API layer shows **two distinct architectural patterns** with moderate inconsistency. 66% of APIs follow modern best practices, while 34% use legacy patterns. Merged mode support is inconsistent but well-implemented where present.

**Key Findings:**
- ✅ **66% use apiWrapper** (28/41 files) - Good adoption of standardized error handling
- ⚠️ **34% don't use apiWrapper** (13/41 files) - Legacy pattern or special cases
- ⚠️ **24% have merged mode** (10/41 files) - Growing but incomplete coverage
- ❌ **Type assertions common** (28 files) - Should use type guards instead
- ✅ **Explicit return types** - All APIs have typed promises
- ❌ **No API pattern guide** - Developers lack clear standards

---

## Detailed Analysis

### 1. Error Handling Patterns

#### ✅ Modern Pattern (28 files - 66%)

**Uses `apiWrapper.ts` for standardized error handling**

**Example:** `src/api/tasksAPI.ts`
```typescript
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

export async function getTasks(filters?: TaskFilters): Promise<TaskData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      const { data, error } = await query;
      return handleSupabaseResponse({ data, error }, 'Task');
    },
    { domain: 'TasksAPI', operation: 'getTasks', data: filters }
  );
}
```

**Benefits:**
- ✅ Consistent error types (AuthenticationError, NotFoundError, etc.)
- ✅ Automatic logging with context
- ✅ Standardized error transformation
- ✅ User-friendly error messages

**APIs Using This Pattern:**
- `tasksAPI.ts`, `habitsAPI.ts`, `projectsAPI.ts`
- `mealPlanningAPI.ts`, `shoppingAPI.ts`, `calendarAPI.ts`
- `financeAPI.ts`, `billsAPI.ts`, `focusAPI.ts`
- `notesAPI.ts`, `journalAPI.ts`, `schedulerAPI.ts`
- And 16 more...

---

#### ⚠️ Manual Error Handling (13 files - 34%)

**Directly throws Supabase errors or manually wraps them**

**Pattern A: Direct Throw (Worst)**

**Example:** `src/api/inboxAPI.ts`
```typescript
export async function getInboxItems(status?: InboxItemStatus): Promise<InboxItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { data, error } = await query;
  if (error) {
    logger.error('InboxAPI', 'Failed to get inbox items', { error });
    throw error; // ❌ Raw Supabase error, not typed
  }
  return data as InboxItem[]; // ❌ Type assertion
}
```

**Problems:**
- ❌ Raw Supabase errors leak implementation details
- ❌ Inconsistent error types across modules
- ❌ No standard error transformation
- ❌ Missing user-friendly messages

**Pattern B: Class-Based (Finance APIs)**

**Example:** `src/finance/data/accountsAPI.ts`
```typescript
export class AccountsAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async listAccounts(): Promise<Account[]> {
    const { data, error } = await this.client
      .from('finance_accounts')
      .select('*');

    if (error) throw error; // ❌ Direct throw
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      // ... manual mapping
    }));
  }
}
```

**Why Different?**
- Finance module uses class-based API pattern
- Predates apiWrapper standardization
- Still functional but inconsistent with rest of codebase

**APIs Using Manual Pattern:**
- `inboxAPI.ts` - Direct throws
- `connectionsAPI.ts` - Manual error handling
- `passportAPI.ts` - Travel module special case
- `finance/data/*.ts` (10 files) - Class-based pattern

---

### 2. Merged Mode Support

#### ✅ Implemented (10 files - 24%)

**APIs with proper merged mode support:**

| API | Module | Pattern |
|-----|--------|---------|
| `tasksAPI.ts` | todos | ✅ Full support with cache |
| `habitsAPI.ts` | habits | ✅ Full support with cache |
| `mealPlanningAPI.ts` | meals | ✅ Full support |
| `shoppingAPI.ts` | shopping | ✅ Full support |
| `storesAPI.ts` | shopping | ✅ Full support |
| `finance/data/*.ts` | finance | ✅ RLS-based (8 files) |

**Implementation Pattern:**
```typescript
// Cache merged connection
let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function getTasksMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('todos');
  return cachedMergedConnection;
}

// Use in queries
export async function getTasks(): Promise<TaskData[]> {
  const user = await requireAuth();
  const mergedConnection = await getTasksMergedConnection();

  let query = supabase.from('tasks').select('*');

  if (mergedConnection) {
    // Fetch both users' data
    query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
  } else {
    // Fetch only current user
    query = query.eq('user_id', user.id);
  }

  return handleSupabaseResponse({ data, error }, 'Task');
}
```

**Consistency:**
- ✅ All implemented APIs use consistent pattern
- ✅ Cache cleared on logout/connection change
- ✅ RLS policies enforce security
- ✅ Partner data clearly identified

---

#### ⏳ Not Implemented (31 files - 76%)

**APIs without merged mode:**
- `notesAPI.ts`, `journalAPI.ts`, `focusAPI.ts`
- `notificationAPI.ts`, `analyticsAPI.ts`
- `skincareAPI.ts`, `personalCareAPI.ts`
- `nutritionAPI.ts`, `lifeGoalsAPI.ts`
- And 22 more...

**Why Not Implemented?**
1. **Personal data** - Journal, focus sessions not typically shared
2. **Not requested yet** - Feature scope prioritization
3. **Technical complexity** - Some modules need additional work
4. **Notifications** - System-level, user-specific

**Which Should Have It?**
High Priority:
- ✅ Tasks, Habits, Shopping, Meals - **DONE**
- ⏳ Finance - **RLS-based, partially done**
- ⏳ Calendar - Should support shared events
- ⏳ Life Goals - Couples often share goals
- ⏳ Important Dates - Birthdays, anniversaries

Low Priority:
- Journal, Notes - Usually personal
- Focus sessions - Individual productivity
- Skincare, Personal Care - Individual routines

---

### 3. Response Type Safety

#### ⚠️ Type Assertions Common (28 files)

**Problem: Unsafe type casting**

```typescript
// ❌ BAD - No runtime validation
const { data, error } = await query;
if (error) throw error;
return data as TaskData[]; // Trust me bro
```

**Solution: Use type guards**

```typescript
// ✅ GOOD - Runtime validation
import { isArrayOf, isTaskData } from '@/types/guards';

const { data, error } = await query;
if (error) throw error;
if (!data || !isArrayOf(data, isTaskData)) {
  throw new ValidationError('Invalid task data received');
}
return data; // TypeScript knows it's TaskData[]
```

**Current State:**
- ✅ **1 file** uses type guards (`habitsAPI.ts`)
- ⚠️ **28 files** use type assertions
- ⚠️ **12 files** return without validation

**Recommendation:**
- Create type guards for all data types
- Mandate type guards in PR reviews
- Add ESLint rule to warn on `as` casts in API files

---

### 4. Response Consistency

#### ✅ All APIs Have Explicit Return Types

```typescript
// All follow this pattern
export async function getTask(id: string): Promise<TaskData>
export async function getTasks(filters?: TaskFilters): Promise<TaskData[]>
export async function createTask(task: CreateTaskInput): Promise<TaskData>
export async function updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData>
export async function deleteTask(id: string): Promise<void>
```

**Pagination Patterns:**

**Pattern 1: Simple Array**
```typescript
export async function getTasks(): Promise<TaskData[]>
```

**Pattern 2: Paginated Result (Finance)**
```typescript
export interface Paginated<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
  total?: number;
}

export async function getTransactions(query: TxnQuery): Promise<Paginated<Transaction>>
```

**Consistency:** ✅ Good - Patterns are clear and documented

---

## Pattern Comparison

### Modern Pattern (apiWrapper-based)

**File:** `src/api/tasksAPI.ts` (478 lines)

**Structure:**
```typescript
// 1. Imports
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { getMergedConnectionId } from '../shared/api/SharedDataProvider';

// 2. Merged mode support
let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function getTasksMergedConnection() { ... }
export function clearTasksMergedConnectionCache() { ... }

// 3. CRUD operations (all wrapped in apiCall)
export async function getTasks(filters?: TaskFilters): Promise<TaskData[]> {
  return apiCall(async () => { ... }, context);
}

export async function createTask(task: CreateTaskInput): Promise<TaskData> {
  return apiCall(async () => { ... }, context);
}
```

**Pros:**
- ✅ Consistent error handling
- ✅ Automatic logging
- ✅ Standardized error types
- ✅ Easy to maintain
- ✅ Best practices

**Cons:**
- ⚠️ Extra wrapper layer
- ⚠️ Slight learning curve

---

### Legacy Pattern (Manual handling)

**File:** `src/api/inboxAPI.ts` (152 lines)

**Structure:**
```typescript
// 1. Direct imports
import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

// 2. Type definitions
export interface InboxItem { ... }

// 3. CRUD operations (manual error handling)
export async function getInboxItems(status?: InboxItemStatus): Promise<InboxItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { data, error } = await query;
  if (error) {
    logger.error('InboxAPI', 'Failed', { error });
    throw error; // Raw Supabase error
  }
  return data as InboxItem[];
}
```

**Pros:**
- ✅ Simpler for small APIs
- ✅ No abstraction overhead
- ✅ Direct control

**Cons:**
- ❌ Inconsistent error handling
- ❌ Manual logging required
- ❌ Easy to forget error cases
- ❌ Hard to maintain consistency

---

### Class-Based Pattern (Finance)

**File:** `src/finance/data/accountsAPI.ts` (523 lines)

**Structure:**
```typescript
export class AccountsAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getUserId(): Promise<string> { ... }

  async listAccounts(): Promise<Account[]> { ... }
  async updateAccount(id: string, updates: Partial<Account>): Promise<void> { ... }
}
```

**Pros:**
- ✅ Encapsulation
- ✅ Dependency injection
- ✅ Testability
- ✅ OOP patterns

**Cons:**
- ❌ Different from rest of codebase
- ❌ No apiWrapper integration
- ❌ Inconsistent with other modules

---

## Recommendations

### Priority 1: Critical (Do First)

#### 1. Create API Pattern Guide
**File:** `docs/API_PATTERN_GUIDE.md`

**Content:**
```markdown
# API Pattern Guide

## MUST FOLLOW: Modern Pattern

All new APIs MUST use this pattern:

```typescript
import { apiCall, requireAuth, handleSupabaseResponse } from '@/api/apiWrapper';

export async function getItems(filters?: ItemFilters): Promise<ItemData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);

      return handleSupabaseResponse({ data, error }, 'Item');
    },
    { domain: 'ItemsAPI', operation: 'getItems', data: filters }
  );
}
```

### DO:
- ✅ Use apiCall wrapper
- ✅ Use requireAuth() for authentication
- ✅ Use handleSupabaseResponse() for errors
- ✅ Add merged mode if shareable
- ✅ Explicit return types
- ✅ Type guards for validation

### DON'T:
- ❌ Throw raw Supabase errors
- ❌ Use type assertions without validation
- ❌ Manual error logging (apiCall does it)
- ❌ Forget domain/operation context
```

**Estimated Time:** 2-3 hours to write comprehensive guide

---

#### 2. Migrate High-Priority APIs to Modern Pattern

**Target APIs (13 files):**
- `inboxAPI.ts` - High usage
- `connectionsAPI.ts` - Critical for merged mode
- `finance/data/*.ts` (10 files) - Large module

**Migration Steps per API:**
1. Wrap operations in `apiCall()`
2. Replace `throw error` with `handleSupabaseResponse()`
3. Use `requireAuth()` instead of manual auth
4. Add type guards instead of `as` casts
5. Test thoroughly

**Estimated Time:**
- Simple API (inbox): 1-2 hours
- Complex API (connections): 3-4 hours
- Finance module (10 files): 10-15 hours
- **Total:** 15-20 hours

---

### Priority 2: Important (Do Soon)

#### 3. Add Type Guards for All Data Types

**Current state:** Only `habitsAPI.ts` uses type guards

**Create guards for:**
- `isTaskData`, `isHabitData`, `isShoppingItem`
- `isCalendarEvent`, `isFinanceTransaction`
- `isNote`, `isInboxItem`, `isNotification`

**File:** `src/types/guards.ts` (expand existing)

**Estimated Time:** 5-8 hours

---

#### 4. Add Merged Mode to Calendar & Goals

**APIs to update:**
- `calendarAPI.ts` - Shared events
- `lifeGoalsAPI.ts` - Couples' shared goals

**Pattern:** Copy from `tasksAPI.ts` merged mode implementation

**Estimated Time:** 4-6 hours

---

### Priority 3: Nice to Have (Future)

#### 5. Create API Code Generator

**Tool:** Script to generate boilerplate API files

```bash
$ npm run generate:api -- --name Shopping --merged-mode

Generated:
✓ src/api/shoppingAPI.ts
✓ src/types/guards/shopping.ts
✓ Tests: src/api/__tests__/shoppingAPI.test.ts
```

**Benefits:**
- Ensures consistency
- Reduces boilerplate
- Faster development

**Estimated Time:** 10-15 hours

---

#### 6. Add ESLint Rules for API Pattern Enforcement

**Rules:**
```javascript
// eslint.config.js
{
  files: ['src/api/**/*.ts', 'src/**/api/**/*.ts'],
  rules: {
    // Prevent direct Supabase error throws
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ThrowStatement:has(Identifier[name="error"]):not(:has(NewExpression))',
        message: 'Use handleSupabaseResponse() instead of throwing raw errors'
      }
    ],
    // Prevent type assertions without guards
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'TSAsExpression',
        message: 'Prefer type guards over type assertions in API files'
      }
    ]
  }
}
```

**Estimated Time:** 2-3 hours

---

## Current Compliance Score

| Criterion | Score | Details |
|-----------|-------|---------|
| **Uses apiWrapper** | 66% | 28/41 files |
| **Has Merged Mode** (where applicable) | 80% | 10/13 shareable modules |
| **Type Safety** | 40% | Only 1 file uses guards |
| **Explicit Return Types** | 100% | All APIs ✅ |
| **Error Handling** | 70% | Good where apiWrapper used |
| **Documentation** | 30% | Some comments, no guide |
| **Overall** | **64%** | **Moderate** |

---

## Comparison: Before vs After Standardization

### Before (Current State)

```typescript
// API 1: Modern pattern
export async function getTasks() {
  return apiCall(async () => { ... }, context);
}

// API 2: Legacy pattern
export async function getInbox() {
  const { data, error } = await query;
  if (error) throw error;
  return data as InboxItem[];
}

// API 3: Class-based
export class FinanceAPI {
  async getAccounts() {
    const { data, error } = await this.client.from('accounts').select();
    if (error) throw error;
    return data.map(...);
  }
}
```

**Problems:**
- ❌ 3 different patterns
- ❌ Inconsistent error types
- ❌ Some have type assertions, some don't
- ❌ Developers confused which to use

---

### After Standardization (Goal)

```typescript
// All APIs use modern pattern
export async function getTasks() {
  return apiCall(async () => { ... }, context);
}

export async function getInbox() {
  return apiCall(async () => { ... }, context);
}

export async function getAccounts() {
  return apiCall(async () => { ... }, context);
}
```

**Benefits:**
- ✅ Single consistent pattern
- ✅ Predictable error types
- ✅ Type-safe responses
- ✅ Easy to learn and maintain

---

## Summary

### Current State: ⚠️ Moderate Inconsistency

**Strengths:**
- ✅ 66% use modern apiWrapper pattern
- ✅ Merged mode well-implemented where present
- ✅ All APIs have explicit types
- ✅ Finance module has clean class-based architecture

**Weaknesses:**
- ⚠️ 34% still use legacy patterns
- ⚠️ Type assertions used instead of guards
- ❌ No API pattern guide for developers
- ⚠️ Merged mode coverage incomplete (24%)

**Risk Level:** **MEDIUM**
- Not critical, but will accumulate tech debt
- Pattern drift will worsen over time
- New developers may perpetuate inconsistency

---

## Action Plan

### Week 1-2 (High Priority)
1. ✅ Write API Pattern Guide (3 hours)
2. ⏳ Migrate `inboxAPI.ts` to modern pattern (2 hours)
3. ⏳ Migrate `connectionsAPI.ts` (4 hours)

### Week 3-4 (Important)
4. ⏳ Create type guards for all data types (8 hours)
5. ⏳ Add merged mode to Calendar & Goals (6 hours)

### Week 5-6 (Nice to Have)
6. ⏳ Migrate Finance APIs (15 hours)
7. ⏳ Add ESLint enforcement rules (3 hours)

### Future
8. ⏳ Create API code generator (15 hours)

**Total Estimated Work:** 56 hours over 6 weeks

---

**Recommendation:** Start with API Pattern Guide (Week 1), then incrementally migrate APIs during normal feature work. Not urgent, but should be addressed within 2-3 months.

---

**Last Updated:** February 16, 2026
**Next Review:** May 2026 (3 months)
