# Type System Analysis: TodoItem → Task Migration

## Current Status: ~85% COMPLETE (Better than initial estimate!)

---

## Type Definitions Overview

### 1. TodoItem (LEGACY - src/types/index.ts)
**Status:** ❌ TO BE REMOVED
**Usage:** 16 occurrences

```typescript
export interface TodoItem {
  id: string
  title: string
  dueDate?: Date          // ❌ Date object
  completedAt?: Date      // ❌ Date object
  createdAt: Date         // ❌ Date object
  updatedAt?: Date        // ❌ Date object
  completed: boolean      // ❌ Redundant with status
  status: TaskStatus      // camelCase
  priority: TaskPriority  // camelCase
  // ... other camelCase fields
}
```

**Problems:**
- Uses Date objects (not serializable)
- camelCase naming (doesn't match DB)
- Redundant `completed` boolean
- Legacy type, being phased out

---

### 2. TaskData (DATABASE LAYER - src/services/types.ts)
**Status:** ✅ CANONICAL FOR DATABASE
**Usage:** 132 occurrences

```typescript
export interface TaskData {
  id?: string;
  user_id?: string;
  title: string;
  due_date?: string | null;      // ✅ ISO string
  completed_at?: string | null;  // ✅ ISO string
  created_at?: string;            // ✅ ISO string
  updated_at?: string;            // ✅ ISO string
  status?: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'important';
  // ... other snake_case fields
}
```

**Characteristics:**
- snake_case naming (matches PostgreSQL/Supabase)
- ISO string dates (serializable)
- Nullable fields with `| null`
- All fields optional except `title`
- Aligns with database schema

---

### 3. Task (UI LAYER - src/tasks/hooks/useTasksQuery.ts)
**Status:** ✅ CANONICAL FOR UI
**Usage:** Actively used in React Query hooks

```typescript
export interface Task {
  id: string;
  title: string;
  dueDate?: Date;          // ✅ Date object (for UI)
  completedAt?: Date;      // ✅ Date object (for UI)
  createdAt: Date;         // ✅ Date object (for UI)
  updatedAt?: Date;        // ✅ Date object (for UI)
  status: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  // ... other camelCase fields
  starred: boolean;        // Required, not nullable
  archived: boolean;       // Required, not nullable
  deleted: boolean;        // Required, not nullable
  tags: string[];          // Required, not nullable
}
```

**Characteristics:**
- camelCase naming (TypeScript convention)
- Date objects (easier for UI manipulation)
- Required booleans with defaults
- Non-nullable arrays
- Optimized for React components

---

### 4. Task (TODOS LAYER - src/todos/types.ts)
**Status:** ⚠️ DUPLICATE / SIMPLIFIED VERSION
**Usage:** Used in Todos page

```typescript
export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'done';  // ⚠️ Only 2 statuses vs 5
  // ... simplified fields
}
```

**Problem:** Duplicate definition with reduced feature set

---

## Migration Strategy

### ✅ What's Already Done

1. **TaskData is dominant** (132 usages vs 16 TodoItem)
2. **Mapper functions exist** in `src/tasks/hooks/useTasksQuery.ts`:
   - `mapTaskDataToTask()` - converts DB → UI
   - Handles snake_case → camelCase
   - Converts ISO strings → Date objects
   - Sets proper defaults

3. **React Query hooks use modern pattern**:
   - Fetch TaskData from API
   - Map to Task for UI consumption
   - Components work with Task type

### ❌ What Needs to Be Done

#### 1. Eliminate TodoItem (16 usages)

**Files using TodoItem:**
```
src/projects/services/projectHelpers.ts
src/components/focus/tasks/utils/taskTransformers.ts
src/components/focus/tasks/utils/statusMappers.ts
src/components/focus/tasks/TaskFocusIntegration.tsx
src/components/focus/tasks/types.ts
src/pages/ProjectTracking.tsx
```

**Migration steps:**
- Replace `TodoItem` → `Task` imports
- Update function signatures
- Ensure proper date handling
- Test affected components

#### 2. Consolidate Duplicate Task Types

**Problem:** Two `Task` type definitions:
- `src/tasks/hooks/useTasksQuery.ts` (full-featured)
- `src/todos/types.ts` (simplified)

**Solution:** 
- Extract single canonical `Task` type to `src/types/task.ts`
- Both modules import from there
- Ensure full feature set is available

#### 3. Verify Type Safety

**Potential issues:**
- Components might have `any` types
- Missing null checks
- Incorrect date handling
- Status/priority mismatches

---

## Impact Assessment

### TypeScript Errors
Current: **0 errors** ✅ (Already fixed!)
The "~100 TypeScript errors" mentioned in the original assessment were already resolved.

### Files Affected (Estimated)
- **Direct changes:** ~16 files (TodoItem → Task)
- **Type consolidation:** 2 files
- **Testing:** ~10-15 test files

### Risk Level
**LOW** - Most infrastructure is already in place:
- Mappers working
- TaskData widely adopted
- Type system mostly consistent

---

## Recommended Action Plan

### Phase 1: Cleanup (1-2 hours)
1. Create canonical `Task` type in `src/types/task.ts`
2. Update imports in both locations
3. Remove duplicate from `src/todos/types.ts`

### Phase 2: TodoItem Migration (2-3 hours)
1. Replace TodoItem in focus components
2. Update ProjectTracking page
3. Update helper functions
4. Test affected features

### Phase 3: Verification (1 hour)
1. Run TypeScript check
2. Search for any remaining TodoItem references
3. Verify all components use Task or TaskData appropriately
4. Update tests

---

## Benefits of Completing Migration

### Type Safety
- Single source of truth for task types
- No confusion between TodoItem/Task
- Proper null safety

### Maintainability
- Clear data flow: TaskData (DB) → Task (UI)
- Easy to find type definitions
- Consistent naming conventions

### Performance
- Proper serialization (TaskData)
- Date objects only in UI (Task)
- No unnecessary conversions

### Developer Experience
- IntelliSense works correctly
- Type errors caught early
- Clear documentation through types

---

## Conclusion

**Status: ~85% Complete** (Much better than 40%!)

**Why 85%?**
- ✅ Core infrastructure (mappers, TaskData) complete
- ✅ Zero TypeScript errors
- ✅ TaskData widely adopted (132 vs 16 usages)
- ❌ TodoItem still exists in 16 places
- ❌ Duplicate Task definitions need consolidation

**Remaining Work:** ~4-6 hours to reach 100%

**Next Step:** Execute the 3-phase plan above to complete the migration.

