# API Pattern Guide
**Version:** 1.0
**Last Updated:** February 16, 2026
**Status:** Official Standard

## Overview

This guide defines the **mandatory patterns** for all API layer code in the LifeSync project. Following these patterns ensures consistency, proper error handling, type safety, and maintainability.

**Gold Standard Reference:** `src/api/tasksAPI.ts`

---

## Table of Contents

1. [Quick Start Template](#quick-start-template)
2. [Core Principles](#core-principles)
3. [File Structure](#file-structure)
4. [Authentication Pattern](#authentication-pattern)
5. [Error Handling Pattern](#error-handling-pattern)
6. [Type Safety Pattern](#type-safety-pattern)
7. [Merged Mode Pattern](#merged-mode-pattern)
8. [CRUD Operations](#crud-operations)
9. [Testing Guidelines](#testing-guidelines)
10. [Migration Checklist](#migration-checklist)
11. [Common Pitfalls](#common-pitfalls)

---

## Quick Start Template

Copy this template for new API files:

```typescript
/**
 * [Feature] API
 * CRUD operations for [feature] with merged mode support (if applicable)
 */

import { supabase } from '@/lib/supabase';
import type { [Feature]Data } from '@/services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from '@/api/apiWrapper';
import { getMergedConnectionId, type MergedConnectionResult } from '@/shared/api/SharedDataProvider';
import { is[Feature]Data, isArrayOf } from '@/types/guards';

// =====================================================
// MERGED MODE SUPPORT (if data is shareable)
// =====================================================

let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function get[Feature]MergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('[module_name]');
  return cachedMergedConnection;
}

export function clear[Feature]MergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all [features] for the current user
 * In merged mode, includes partner's [features]
 */
export async function get[Features](filters?: {
  status?: string;
  category?: string;
}): Promise<[Feature]Data[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await get[Feature]MergedConnection();

      let query = supabase
        .from('[features]')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply merged mode
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Apply filters
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.category) query = query.eq('category', filters.category);

      const { data, error } = await query;

      // Validate with type guard
      const validatedData = handleSupabaseResponse({ data, error }, '[Feature]');
      if (!isArrayOf(validatedData, is[Feature]Data)) {
        throw new ValidationError('Invalid [feature] data received');
      }

      return validatedData;
    },
    { domain: '[Feature]API', operation: 'get[Features]', data: filters }
  );
}

/**
 * Get a single [feature] by ID
 */
export async function get[Feature](id: string): Promise<[Feature]Data> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('[features]')
        .select('*')
        .eq('id', id)
        .single();

      const validatedData = handleSupabaseResponse({ data, error }, '[Feature]', id);
      if (!is[Feature]Data(validatedData)) {
        throw new ValidationError('Invalid [feature] data received');
      }

      return validatedData;
    },
    { domain: '[Feature]API', operation: 'get[Feature]', data: { id } }
  );
}

/**
 * Create a new [feature]
 */
export async function create[Feature](input: Create[Feature]Input): Promise<[Feature]Data> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('[features]')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();

      const validatedData = handleSupabaseResponse({ data, error }, '[Feature]');
      if (!is[Feature]Data(validatedData)) {
        throw new ValidationError('Invalid [feature] data received');
      }

      return validatedData;
    },
    { domain: '[Feature]API', operation: 'create[Feature]', data: input }
  );
}

/**
 * Update a [feature]
 */
export async function update[Feature](
  id: string,
  updates: Partial<[Feature]Data>
): Promise<[Feature]Data> {
  return apiCall(
    async () => {
      await requireAuth();

      const { data, error } = await supabase
        .from('[features]')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      const validatedData = handleSupabaseResponse({ data, error }, '[Feature]', id);
      if (!is[Feature]Data(validatedData)) {
        throw new ValidationError('Invalid [feature] data received');
      }

      return validatedData;
    },
    { domain: '[Feature]API', operation: 'update[Feature]', data: { id, updates } }
  );
}

/**
 * Delete a [feature]
 */
export async function delete[Feature](id: string): Promise<void> {
  return apiCall(
    async () => {
      await requireAuth();

      const { error } = await supabase
        .from('[features]')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    { domain: '[Feature]API', operation: 'delete[Feature]', data: { id } }
  );
}
```

---

## Core Principles

### 1. **Single Responsibility**
Each API file handles one domain (Tasks, Habits, Finance, etc.)

### 2. **Standardized Error Handling**
All errors go through `apiWrapper.ts` for consistent transformation

### 3. **Type Safety**
Use type guards for runtime validation, not type assertions

### 4. **Clear Separation**
- API layer = Data access only
- Business logic = Services layer
- UI logic = Components/Hooks

### 5. **Testability**
Functions should be pure and easy to test in isolation

---

## File Structure

```typescript
// 1. IMPORTS
import { supabase } from '@/lib/supabase';
import type { FeatureData } from '@/services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from '@/api/apiWrapper';
import { getMergedConnectionId } from '@/shared/api/SharedDataProvider';
import { isFeatureData, isArrayOf } from '@/types/guards';

// 2. MERGED MODE SUPPORT (if applicable)
let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function getFeatureMergedConnection() { ... }
export function clearFeatureMergedConnectionCache() { ... }

// 3. CRUD OPERATIONS
export async function getFeatures() { ... }
export async function getFeature(id: string) { ... }
export async function createFeature(input: CreateInput) { ... }
export async function updateFeature(id: string, updates: Partial<Data>) { ... }
export async function deleteFeature(id: string) { ... }

// 4. SPECIALIZED OPERATIONS (if needed)
export async function bulkUpdateFeatures() { ... }
export async function searchFeatures() { ... }
```

---

## Authentication Pattern

### ✅ ALWAYS Use `requireAuth()`

```typescript
import { requireAuth } from '@/api/apiWrapper';

export async function getItems(): Promise<ItemData[]> {
  return apiCall(
    async () => {
      // ✅ Use requireAuth helper
      const user = await requireAuth();

      // Now you have typed User object
      const query = supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id);

      // ...
    },
    context
  );
}
```

### ❌ DON'T: Manual auth checks

```typescript
// ❌ WRONG - Manual auth check
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Not authenticated');

// ❌ WRONG - Generic error
if (!user) throw new AuthenticationError('Not authenticated');

// ✅ CORRECT - Use helper
const user = await requireAuth();
```

**Why?**
- Consistent error types
- Proper error context
- Cleaner code
- Easy to test

---

## Error Handling Pattern

### ✅ Use `apiCall` Wrapper

**All API operations MUST be wrapped in `apiCall()`:**

```typescript
export async function getTask(id: string): Promise<TaskData> {
  return apiCall(
    async () => {
      // Your logic here
      const user = await requireAuth();
      const { data, error } = await supabase.from('tasks').select().eq('id', id).single();
      return handleSupabaseResponse({ data, error }, 'Task', id);
    },
    {
      domain: 'TasksAPI',
      operation: 'getTask',
      data: { id }
    }
  );
}
```

**What `apiCall` provides:**
- ✅ Automatic logging (debug start/end, error on failure)
- ✅ Error transformation to typed LifeSyncError
- ✅ Context enrichment for debugging
- ✅ Consistent error structure

### ✅ Use `handleSupabaseResponse` for Queries

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('id', id)
  .single();

// ✅ Use helper - throws typed errors
return handleSupabaseResponse({ data, error }, 'Task', id);
```

**What it handles:**
- ✅ Duplicate key violations (23505) → ConflictError
- ✅ Foreign key violations (23503) → ValidationError
- ✅ RLS policy violations → AuthorizationError
- ✅ Not found → NotFoundError
- ✅ Generic DB errors → DatabaseError

### ❌ DON'T: Throw raw errors

```typescript
// ❌ WRONG
const { data, error } = await query;
if (error) throw error; // Raw Supabase error

// ❌ WRONG
if (error) {
  logger.error('API', 'Failed', { error });
  throw error;
}

// ✅ CORRECT
return handleSupabaseResponse({ data, error }, 'Task', id);
```

---

## Type Safety Pattern

### ✅ Use Type Guards, Not Assertions

**Type guards provide runtime validation:**

```typescript
import { isTaskData, isArrayOf } from '@/types/guards';

export async function getTasks(): Promise<TaskData[]> {
  return apiCall(
    async () => {
      const { data, error } = await query;

      // Validate with type guard
      const validated = handleSupabaseResponse({ data, error }, 'Task');

      if (!isArrayOf(validated, isTaskData)) {
        throw new ValidationError('Invalid task data received');
      }

      return validated; // TypeScript knows it's TaskData[]
    },
    context
  );
}
```

### ❌ DON'T: Use type assertions

```typescript
// ❌ WRONG - No validation
const { data, error } = await query;
if (error) throw error;
return data as TaskData[]; // Trust me bro

// ❌ WRONG - Empty check isn't enough
if (!data) throw new NotFoundError('Task');
return data as TaskData; // Could be wrong shape

// ✅ CORRECT - Validated
const validated = handleSupabaseResponse({ data, error }, 'Task');
if (!isTaskData(validated)) {
  throw new ValidationError('Invalid task data');
}
return validated;
```

**Why type guards?**
- ✅ Runtime validation catches bad data
- ✅ Protects against DB schema changes
- ✅ Clear error messages
- ✅ Type narrowing for TypeScript

---

## Merged Mode Pattern

### When to Add Merged Mode

**Add merged mode if:**
- ✅ Data can be shared between partners (tasks, habits, shopping, calendar, goals)
- ✅ Couples benefit from seeing combined data
- ✅ Individual ownership still tracked (user_id)

**Don't add merged mode if:**
- ❌ Purely personal data (journal, focus sessions)
- ❌ System-level data (notifications, settings)
- ❌ Individual metrics only

### Implementation Steps

**Step 1: Add cache and helper functions**

```typescript
let cachedMergedConnection: MergedConnectionResult | null | undefined;

export async function getTasksMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('todos'); // module name
  return cachedMergedConnection;
}

export function clearTasksMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}
```

**Step 2: Update query functions**

```typescript
export async function getTasks(): Promise<TaskData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check merged mode
      const mergedConnection = await getTasksMergedConnection();

      let query = supabase.from('tasks').select('*');

      // Apply merged mode filter
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Rest of query...
    },
    context
  );
}
```

**Step 3: Don't filter by user_id in mutations**

```typescript
export async function updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
  return apiCall(
    async () => {
      await requireAuth();

      // Don't filter by user_id - let RLS handle it
      // This allows updating partner's tasks in merged mode
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id) // Only filter by ID
        .select()
        .single();

      return handleSupabaseResponse({ data, error }, 'Task', id);
    },
    context
  );
}
```

**Step 4: Add clear cache calls**

Call `clearTasksMergedConnectionCache()` when:
- User logs out
- Connection status changes
- Permissions updated

---

## CRUD Operations

### Standard CRUD Pattern

**1. GET All (List)**

```typescript
export async function getItems(filters?: {
  status?: string;
  category?: string;
}): Promise<ItemData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.category) query = query.eq('category', filters.category);

      const { data, error } = await query;
      const validated = handleSupabaseResponse({ data, error }, 'Item');

      if (!isArrayOf(validated, isItemData)) {
        throw new ValidationError('Invalid item data');
      }

      return validated;
    },
    { domain: 'ItemsAPI', operation: 'getItems', data: filters }
  );
}
```

**2. GET One (Single)**

```typescript
export async function getItem(id: string): Promise<ItemData> {
  return apiCall(
    async () => {
      await requireAuth();

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      const validated = handleSupabaseResponse({ data, error }, 'Item', id);

      if (!isItemData(validated)) {
        throw new ValidationError('Invalid item data');
      }

      return validated;
    },
    { domain: 'ItemsAPI', operation: 'getItem', data: { id } }
  );
}
```

**3. CREATE**

```typescript
export async function createItem(input: CreateItemInput): Promise<ItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          ...input,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      const validated = handleSupabaseResponse({ data, error }, 'Item');

      if (!isItemData(validated)) {
        throw new ValidationError('Invalid item data');
      }

      return validated;
    },
    { domain: 'ItemsAPI', operation: 'createItem', data: input }
  );
}
```

**4. UPDATE**

```typescript
export async function updateItem(
  id: string,
  updates: Partial<ItemData>
): Promise<ItemData> {
  return apiCall(
    async () => {
      await requireAuth();

      const { data, error } = await supabase
        .from('items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      const validated = handleSupabaseResponse({ data, error }, 'Item', id);

      if (!isItemData(validated)) {
        throw new ValidationError('Invalid item data');
      }

      return validated;
    },
    { domain: 'ItemsAPI', operation: 'updateItem', data: { id, updates } }
  );
}
```

**5. DELETE**

```typescript
export async function deleteItem(id: string): Promise<void> {
  return apiCall(
    async () => {
      await requireAuth();

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    { domain: 'ItemsAPI', operation: 'deleteItem', data: { id } }
  );
}
```

---

## Testing Guidelines

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getItems, createItem } from './itemsAPI';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase');

describe('itemsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getItems', () => {
    it('should fetch items successfully', async () => {
      const mockItems = [
        { id: '1', user_id: 'user1', title: 'Item 1' },
        { id: '2', user_id: 'user1', title: 'Item 2' },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockItems,
          error: null,
        }),
      } as any);

      const result = await getItems();

      expect(result).toEqual(mockItems);
    });

    it('should handle authentication errors', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getItems()).rejects.toThrow('Not authenticated');
    });

    it('should handle database errors', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      } as any);

      await expect(getItems()).rejects.toThrow();
    });
  });
});
```

---

## Migration Checklist

Use this checklist when migrating legacy APIs to modern pattern:

### Pre-Migration
- [ ] Read existing implementation thoroughly
- [ ] Identify all exported functions
- [ ] Check if merged mode is needed
- [ ] Review existing tests
- [ ] Create type guards if missing

### Migration Steps
- [ ] Add imports: `apiCall`, `requireAuth`, `handleSupabaseResponse`
- [ ] Add type guards import
- [ ] Add merged mode support (if applicable)
- [ ] Wrap each function in `apiCall()`
- [ ] Replace manual auth with `requireAuth()`
- [ ] Replace error handling with `handleSupabaseResponse()`
- [ ] Replace `as` casts with type guard validation
- [ ] Add proper logging context
- [ ] Update function documentation

### Post-Migration
- [ ] Run type check: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Manual testing in dev environment
- [ ] Update any calling code if needed
- [ ] Commit with descriptive message

### Example Migration

**Before:**
```typescript
export async function getInboxItems(status?: InboxItemStatus): Promise<InboxItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  let query = supabase
    .from('inbox_items')
    .select('*')
    .eq('user_id', user.id);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    logger.error('InboxAPI', 'Failed to get inbox items', { error });
    throw error;
  }
  return data as InboxItem[];
}
```

**After:**
```typescript
export async function getInboxItems(status?: InboxItemStatus): Promise<InboxItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user.id);

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      const validated = handleSupabaseResponse({ data, error }, 'InboxItem');

      if (!isArrayOf(validated, isInboxItem)) {
        throw new ValidationError('Invalid inbox item data');
      }

      return validated;
    },
    { domain: 'InboxAPI', operation: 'getInboxItems', data: { status } }
  );
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting apiCall Wrapper

```typescript
// ❌ WRONG
export async function getItems(): Promise<ItemData[]> {
  const user = await requireAuth();
  // ... query logic
}

// ✅ CORRECT
export async function getItems(): Promise<ItemData[]> {
  return apiCall(async () => {
    const user = await requireAuth();
    // ... query logic
  }, context);
}
```

### ❌ Pitfall 2: Filtering by user_id in Updates

```typescript
// ❌ WRONG - Prevents merged mode updates
.update(updates)
.eq('user_id', user.id) // ❌ Don't do this
.eq('id', id)

// ✅ CORRECT - Let RLS handle access control
.update(updates)
.eq('id', id) // Only filter by ID
```

### ❌ Pitfall 3: Type Assertions Without Validation

```typescript
// ❌ WRONG
return data as ItemData[];

// ✅ CORRECT
if (!isArrayOf(data, isItemData)) {
  throw new ValidationError('Invalid data');
}
return data;
```

### ❌ Pitfall 4: Missing Error Context

```typescript
// ❌ WRONG - No context
return apiCall(async () => { ... }, {});

// ✅ CORRECT - Full context
return apiCall(
  async () => { ... },
  { domain: 'ItemsAPI', operation: 'getItems', data: filters }
);
```

### ❌ Pitfall 5: Not Handling Null Data

```typescript
// ❌ WRONG - Could crash
const { data, error } = await query;
if (error) throw error;
return data; // data could be null!

// ✅ CORRECT
return handleSupabaseResponse({ data, error }, 'Item'); // Throws NotFoundError if null
```

---

## Reference Examples

**Best Examples in Codebase:**
1. `src/api/tasksAPI.ts` - Full modern pattern with merged mode
2. `src/api/habitsAPI.ts` - Good merged mode implementation
3. `src/api/mealPlanningAPI.ts` - Complex API with proper structure
4. `src/api/calendarAPI.ts` - Clean CRUD operations

**Legacy Examples (Don't Copy):**
1. `src/api/inboxAPI.ts` - Manual error handling (needs migration)
2. `src/shared/api/connectionsAPI.ts` - No apiWrapper (needs migration)
3. `src/finance/data/*.ts` - Class-based pattern (different approach)

---

## Quick Reference

### Must Use
- ✅ `apiCall()` wrapper
- ✅ `requireAuth()` helper
- ✅ `handleSupabaseResponse()`
- ✅ Type guards
- ✅ Explicit return types

### Must Not Use
- ❌ `throw error` (raw Supabase errors)
- ❌ `as` type assertions
- ❌ Manual `supabase.auth.getUser()`
- ❌ Manual logging in operations

### When Adding Merged Mode
- ✅ Cache connection result
- ✅ Clear cache helper
- ✅ `or()` query for both user IDs
- ✅ Don't filter updates by user_id

---

## Questions?

**Stuck?** Reference these files:
- Pattern: `src/api/tasksAPI.ts`
- Wrapper: `src/api/apiWrapper.ts`
- Guards: `src/types/guards.ts`
- Audit: `API_LAYER_CONSISTENCY_AUDIT_2026-02-16.md`

**Need help?** Check the audit document for examples and explanations.

---

**This is the official standard. All new APIs must follow this pattern. All legacy APIs should be migrated during feature work.**
