# Pre-Coding Checklist for New Features

**MANDATORY: Complete this checklist BEFORE writing any code for a new feature.**

## 1. Standards Review (5 min)

- [ ] Read `/CLAUDE.md` - Coding standards for this project
- [ ] Review logging requirements (use `logger`, never `console.*`)
- [ ] Review error handling (use typed error classes from `@/lib/errors`)
- [ ] Review accessibility requirements (ARIA labels, keyboard navigation)
- [ ] Review hook patterns (size limits, naming conventions)

## 2. Pattern Research (10 min)

**Find a similar existing feature and study its implementation:**

- [ ] Identify 1-2 similar features already in the codebase
- [ ] Review their file structure:
  - `src/[feature]/api/` - API layer pattern
  - `src/[feature]/hooks/` - React Query hooks
  - `src/[feature]/components/` - UI components
  - `src/[feature]/types.ts` - Type definitions

**Example Reference Table:**

| New Feature | Similar Feature | Reference Files |
|-------------|----------------|-----------------|
| Together | Habits, Goals | `src/habits/`, `src/goals/` |
| Shopping List | Meal Planning | `src/mealPlanning/` |
| Travel Planning | Finance | `src/finance/` |

- [ ] Check if similar feature has:
  - Error boundary wrapper? (`<FeatureErrorBoundary>`)
  - Merged mode support? (`useMerged*Connection`)
  - Real-time subscriptions? (`useRealtimeSubscriptions`)
  - Dedicated API layer? (`src/*/api/`)

## 3. Database Schema Verification (5 min)

**⚠️ CRITICAL: Always verify schema before writing code!**

- [ ] Check `supabase/migrations/` for table definitions
- [ ] Verify exact column names (snake_case in DB)
- [ ] Verify column types (date vs timestamp, nullable vs required)
- [ ] Check for RLS policies that might affect queries
- [ ] **Create a field reference table** - List ALL fields you'll use:

```typescript
// ALWAYS verify field names before coding!
// Example reference table:
// Table: achievement_rewards
// - id (uuid, primary key)
// - target_value (integer)  ✅ CORRECT - NOT "target_count"
// - current_progress (integer)
// - creator_id (uuid)        ✅ CORRECT - NOT "user_id"
// - recipient_id (uuid)

// Common mistakes to avoid:
// ❌ Using target_count when DB has target_value
// ❌ Using user_id when DB has creator_id/sender_id
// ❌ Using scheduled_for when DB has reveal_date
```

- [ ] **Verify RLS policies before writing migrations**:
  - Check that column names in WHERE clauses exist in table
  - Test policies with `SELECT column_name FROM information_schema.columns WHERE table_name = 'your_table'`
  - Verify foreign key relationships (connection_id, partner_id, etc.)

### Database Verification Commands

```bash
# Find table definition
grep -A 30 "CREATE TABLE.*your_table" supabase/migrations/*.sql

# Extract column names only
awk '/CREATE TABLE.*your_table/,/\);/' supabase/migrations/*.sql | grep -E "^\s+\w+\s+" | awk '{print $1}'

# Verify specific field exists
grep "target_value\|target_count" supabase/migrations/*.sql
```

## 4. Required Patterns Checklist

### 🔴 CRITICAL (Must Have)

- [ ] **Logger Service** - All logging via `logger` from `@/services/logger`
  - `logger.debug()` for development
  - `logger.info()` for important events
  - `logger.warn()` for warnings
  - `logger.error()` for errors
  - Domain: Use feature name (e.g., 'Together', 'Finance')

- [ ] **Typed Errors** - Use error classes from `@/lib/errors`
  - `AuthenticationError` - Not authenticated
  - `NotFoundError` - Resource not found
  - `ValidationError` - Invalid input
  - Parse unknown errors with `parseToLifeSyncError()`

- [ ] **Error Boundaries** - Wrap page components
  ```tsx
  <FeatureErrorBoundary feature="FeatureName">
    <FeatureContent />
  </FeatureErrorBoundary>
  ```

- [ ] **Accessibility**
  - All icon-only buttons need `aria-label`
  - Modals support Escape key to close
  - Forms have proper labels and error messages

### 🟡 ARCHITECTURAL (Should Have)

- [ ] **API Layer Separation**
  - Create `src/[feature]/api/` directory
  - Separate file for each resource (messagesAPI.ts, challengesAPI.ts, etc.)
  - API functions use `apiCall()` wrapper from `@/api/apiWrapper`
  - API functions use `requireAuth()` for authentication
  - Hooks call API functions (not direct Supabase)
  - Follow established pattern:
    ```typescript
    // src/[feature]/api/resourceAPI.ts
    import { supabase } from '@/lib/supabase';
    import { apiCall, requireAuth } from '@/api/apiWrapper';
    import { parseToLifeSyncError } from '@/lib/errors';
    import { logger } from '@/services/logger';

    // =====================================================
    // QUERIES
    // =====================================================

    export async function getResources(): Promise<Resource[]> {
      return apiCall(
        async () => {
          const user = await requireAuth();

          const { data, error } = await supabase
            .from('resources')
            .select('*');

          if (error) throw parseToLifeSyncError(error);

          return data || [];
        },
        { domain: 'Feature', operation: 'getResources' }
      );
    }

    // =====================================================
    // MUTATIONS
    // =====================================================

    export async function createResource(resource: CreateRequest): Promise<Resource> {
      return apiCall(
        async () => {
          const user = await requireAuth();

          const { data, error } = await supabase
            .from('resources')
            .insert({ ...resource, user_id: user.id })
            .select()
            .single();

          if (error) throw parseToLifeSyncError(error);

          logger.info('Feature', 'Resource created', { id: data.id });
          return data;
        },
        { domain: 'Feature', operation: 'createResource' }
      );
    }
    ```

- [ ] **Barrel Exports for Utilities**
  - Create `src/[feature]/utils/index.ts` barrel export
  - Export all utility modules (validation, dateHelpers, etc.)
  - Provides single import point for all utilities
  - Example:
    ```typescript
    // src/[feature]/utils/index.ts
    export * from './validation';
    export * from './dateHelpers';
    export * from './formatters';

    // Usage - single import:
    import { validateForm, formatDate, sanitizeInput } from '@/feature/utils';

    // Instead of multiple imports:
    import { validateForm } from '@/feature/utils/validation';
    import { formatDate } from '@/feature/utils/dateHelpers';
    import { sanitizeInput } from '@/feature/utils/validation';
    ```

- [ ] **React Query Hooks**
  - Queries in `src/[feature]/hooks/use*Query.ts`
  - Use API functions from `src/[feature]/api/`
  - Proper query keys for caching
  - Invalidation on mutations
  - Example:
    ```typescript
    // src/[feature]/hooks/useResourcesQuery.ts
    import { getResources, createResource } from '../api/resourceAPI';

    export function useResources() {
      return useQuery({
        queryKey: resourceKeys.list(),
        queryFn: getResources, // ✅ Use API function
      });
    }

    export function useCreateResource() {
      return useMutation({
        mutationFn: createResource, // ✅ Use API function
      });
    }
    ```

- [ ] **Hook Size Limits**
  - Max 150 lines per hook file
  - Max 3 custom hook dependencies
  - Split if exceeds limits

### 🟢 FEATURE-SPECIFIC (Nice to Have)

- [ ] **Merged Mode** (if multi-user feature)
  - `useMerged*Connection()` hook
  - API functions check merged mode
  - `.or()` queries for partner data

- [ ] **Real-time Updates** (if collaborative)
  - Supabase channel subscriptions
  - Query invalidation on updates
  - Cleanup on unmount

- [ ] **TypeScript Types**
  - Database types in `types.ts`
  - Form types for inputs
  - API request/response types

### 🔒 SECURITY (Critical for User Input)

- [ ] **RLS Policy Validation**
  - Validate foreign key relationships in RLS policies
  - Use EXISTS clauses to verify partner/connection relationships
  - Never trust client-provided IDs without validation
  - Example:
    ```sql
    -- Validate partner_id matches actual partner
    AND (
      milestones.partner_id IS NULL
      OR
      milestones.partner_id = CASE
        WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
        WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
      END
    )
    ```

- [ ] **Input Validation & Sanitization**
  - Create `src/[feature]/utils/validation.ts` file
  - XSS prevention with DOMPurify for HTML content
  - File upload validation (size, type, filename sanitization)
  - URL validation to prevent `javascript:` attacks
  - Form validation functions for all user inputs
  - Example:
    ```typescript
    import { validateMessageForm, sanitizeMessageBody } from './utils/validation';

    const validation = validateMessageForm({ title, message_body });
    if (!validation.valid) {
      toast(validation.error, 'error');
      return;
    }

    const sanitizedBody = sanitizeMessageBody(messageBody);
    ```

- [ ] **Type Guards for Runtime Safety**
  - Create `src/[feature]/types/guards.ts`
  - Object guards: `isMyType(value): value is MyType`
  - Array guards: `isMyTypeArray(value): value is MyType[]`
  - Enum guards: `isMyEnum(value): value is MyEnum`
  - Use before processing unknown data
  - Example:
    ```typescript
    import { isPartnerMessage } from './types/guards';

    const message = messages.find(m => m.id === id);
    if (message && isPartnerMessage(message)) {
      // Safe to use message as PartnerMessage
    }
    ```

### ⚡ PERFORMANCE (Critical for User Experience)

- [ ] **Explicit Cache Configuration**
  - ALL queries MUST have explicit `staleTime` and `gcTime`
  - Never rely on React Query defaults
  - Configure based on data volatility
  - Cache strategy:
    ```typescript
    // List queries - frequently updated
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes

    // Detail queries - rarely change
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 15 * 60 * 1000,    // 15 minutes

    // Realtime data - check frequently
    staleTime: 1 * 60 * 1000,  // 1 minute
    gcTime: 5 * 60 * 1000,     // 5 minutes
    ```
  - Example:
    ```typescript
    export function useResources() {
      return useQuery({
        queryKey: resourceKeys.list(),
        queryFn: getResources,
        staleTime: 2 * 60 * 1000, // ✅ Explicit
        gcTime: 10 * 60 * 1000,   // ✅ Explicit
      });
    }
    ```

- [ ] **Modal State Management**
  - Use `useModalState` hook instead of individual `useState`
  - Reduces boilerplate by ~75%
  - Example:
    ```typescript
    const modals = useModalState({
      addItem: false,
      editingItem: null as string | null,
      confirmDelete: false,
    });

    modals.open('addItem');
    modals.set('editingItem', id);
    modals.batch({ addItem: false, editingItem: null });
    ```

- [ ] **Granular Query Invalidation**
  - Don't invalidate `queryKey: ...Keys.all`
  - Invalidate only affected queries
  - Update cache directly with `setQueryData()` for updates
  - Remove from cache with `removeQueries()` for deletes
  - Example:
    ```typescript
    // CREATE - Invalidate lists only
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    }

    // UPDATE - Update cache + invalidate lists
    onSuccess: (data) => {
      queryClient.setQueryData(itemKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    }

    // DELETE - Remove from cache + invalidate lists
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: itemKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    }
    ```

- [ ] **Optimistic Updates** (for instant UI feedback)
  - Add to mutations users interact with frequently
  - Mark as read, toggle complete, update progress, etc.
  - Example:
    ```typescript
    useMutation({
      mutationFn: updateItem,
      onMutate: async (variables) => {
        // 1. Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: itemKeys.detail(variables.id) });

        // 2. Snapshot previous value
        const previous = queryClient.getQueryData(itemKeys.detail(variables.id));

        // 3. Optimistically update
        queryClient.setQueryData(itemKeys.detail(variables.id), {
          ...previous,
          ...variables.updates,
        });

        return { previous };
      },
      onError: (err, variables, context) => {
        // 4. Rollback on error
        if (context?.previous) {
          queryClient.setQueryData(itemKeys.detail(variables.id), context.previous);
        }
      },
    })
    ```

- [ ] **Pagination** (for large datasets)
  - Use `useInfiniteQuery` for lists that can grow large
  - Page size: 20 items per page
  - Add query key for infinite queries
  - Invalidate infinite queries in mutations
  - Example:
    ```typescript
    export function useInfiniteItems(filters?: ItemFilters) {
      const PAGE_SIZE = 20;

      return useInfiniteQuery({
        queryKey: itemKeys.infinite(filters),
        queryFn: async ({ pageParam = 0 }) => {
          const { data } = await supabase
            .from('items')
            .select('*')
            .range(pageParam, pageParam + PAGE_SIZE - 1);
          return data || [];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          if (lastPage.length < PAGE_SIZE) return undefined;
          return allPages.length * PAGE_SIZE;
        },
      });
    }
    ```

### 📝 ERROR HANDLING (Standardized UX)

- [ ] **Mutation Error Handling**
  - ALL mutations must have `onSuccess` and `onError`
  - Use `useToast` for user feedback
  - Use `getUserErrorMessage()` for user-friendly errors
  - Log errors with operation context
  - Example:
    ```typescript
    export function useCreateItem() {
      const queryClient = useQueryClient();
      const { showToast } = useToast();

      return useMutation({
        mutationFn: createItem,
        onSuccess: () => {
          showToast('Item created successfully!', 'success');
          void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
        },
        onError: (error) => {
          const message = getUserErrorMessage(error);
          showToast(message, 'error');
          logger.error('Feature', error as Error, { operation: 'createItem' });
        },
      });
    }
    ```

## 5. Implementation Plan

Before writing code, answer these questions:

- [ ] **What existing patterns am I following?**
  - Feature: _______________
  - Reason: _______________

- [ ] **What database tables/fields am I using?**
  - Tables: _______________
  - Critical fields: _______________

- [ ] **What are the key user flows?**
  1. _______________
  2. _______________
  3. _______________

- [ ] **What error cases need handling?**
  - [ ] Not authenticated
  - [ ] Resource not found
  - [ ] Network failure
  - [ ] Validation errors

## 6. Import Verification (CRITICAL - Always Check!)

**⚠️ These mistakes cause runtime errors that won't show in TypeScript!**

### Verify Function Imports BEFORE Using

- [ ] **Check actual export names** in source file:
  ```bash
  # Find exported function names
  grep "^export function" src/[feature]/utils/validation.ts
  grep "^export const" src/hooks/useToast.ts
  ```

- [ ] **Common import mistakes:**

  ❌ **WRONG - Guessing function names:**
  ```typescript
  // Importing without checking actual exports
  import { validateMilestoneForm } from './validation';  // Does this exist?
  import { validatePartnerMessageForm } from './validation';  // Wrong name!
  ```

  ✅ **CORRECT - Verify exports first:**
  ```typescript
  // After checking: grep "^export function" validation.ts
  import { validateMilestone } from './validation';  // ✅ Matches export
  import { validatePartnerMessage } from './validation';  // ✅ Matches export
  ```

### Verify Hook Destructuring

- [ ] **Check hook return type** before destructuring:
  ```bash
  # Check what the hook returns
  grep -A 5 "export.*useToast" src/hooks/useToast.ts
  ```

- [ ] **Common hook mistakes:**

  ❌ **WRONG - Incorrect destructuring:**
  ```typescript
  const { toast } = useToast();  // toast is STATE, not a function!
  toast('Success!', 'success');  // ❌ Runtime error: toast is not a function
  ```

  ✅ **CORRECT - Use function, not state:**
  ```typescript
  const { showToast } = useToast();  // showToast is the function
  showToast('Success!', 'success');  // ✅ Works correctly
  ```

### Import Verification Checklist

Before using any imported function:

- [ ] Run `grep "^export"` to see actual exports
- [ ] Verify function names match exactly (case-sensitive)
- [ ] Check hook return type structure
- [ ] Test import in IDE (TypeScript will catch wrong names)
- [ ] For validation functions, check return type:
  ```typescript
  // Validation functions return { valid: boolean; errors: Record<string, string> }
  // NOT { valid: boolean; error: string }

  const validation = validateMilestone(data);
  if (!validation.valid) {
    const errorMsg = Object.values(validation.errors)[0];  // ✅ Correct
    // NOT: validation.error  ❌ Wrong property name
  }
  ```

---

## 7. Code Review Self-Check

After writing code, verify:

### Standards Compliance
- [ ] No `console.log`, `console.error`, etc. (use `logger`)
- [ ] No `Error('message')` - use typed classes
- [ ] No missing `aria-label` on icon buttons
- [ ] No direct Supabase calls in hooks (should be in API layer)
- [ ] No TODOs left incomplete
- [ ] Database field names match schema exactly
- [ ] Error boundary wraps page component

### Import & Usage Verification
- [ ] All function imports verified with `grep "^export"` command
- [ ] Hook destructuring matches actual return type
- [ ] Validation functions use `.errors` (not `.error`)
- [ ] Using `showToast` from useToast (not `toast`)
- [ ] Database field names match schema (e.g., `target_value` not `target_count`)
- [ ] RLS policy column names verified against schema

### Security
- [ ] RLS policies validate foreign key relationships
- [ ] All user input validated with validation functions
- [ ] HTML content sanitized with `sanitizeMessageBody()`
- [ ] File uploads validated (size, type, filename)
- [ ] URLs validated to prevent `javascript:` attacks
- [ ] Type guards used for runtime validation

### Performance
- [ ] Modal state uses `useModalState` (not individual `useState`)
- [ ] Query invalidation is granular (not `...Keys.all`)
- [ ] Optimistic updates for frequent user actions
- [ ] Pagination with `useInfiniteQuery` for large lists
- [ ] Cache updates with `setQueryData()` on mutations

### Error Handling
- [ ] ALL mutations have `onSuccess` and `onError`
- [ ] Success/error toasts with `showToast()`
- [ ] User-friendly errors with `getUserErrorMessage()`
- [ ] Errors logged with operation context

## 7. Testing Checklist

- [ ] Happy path works
- [ ] Error states display properly
- [ ] Loading states show correctly
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Real-time updates (if applicable)
- [ ] Merged mode (if applicable)

---

## Quick Reference Commands

**Check similar features:**
```bash
ls src/habits src/goals src/finance
```

**Find pattern examples:**
```bash
grep -r "FeatureErrorBoundary" src/pages/
grep -r "useMerged" src/hooks/
grep -r "logger.error" src/
```

**Verify database schema:**
```bash
cat supabase/migrations/*_create_[table].sql
```

---

## Anti-Patterns to Avoid

### ❌ Standards Violations
- Use `console.*` for logging → Use `logger.*`
- Create generic `Error()` objects → Use typed error classes
- Skip accessibility attributes → Add ARIA labels and keyboard support
- Embed Supabase calls in hooks → Create dedicated API layer
- Leave TODOs incomplete → Complete or remove them
- Guess database field names → Verify schema before coding
- Forget error boundaries → Wrap features in `<FeatureErrorBoundary>`

### ❌ Import & Usage Errors (Runtime Bugs!)
- Guess function import names → Run `grep "^export"` to verify
- Destructure `{ toast }` from useToast → Use `{ showToast }`
- Use `validation.error` → Use `Object.values(validation.errors)[0]`
- Use `target_count` field → Check schema, use `target_value`
- Write RLS policies without schema verification → Verify all column names exist
- Import `validateMilestoneForm` → Actual export is `validateMilestone`

### ❌ Security Issues
- Trust client-provided IDs → Validate with RLS policies
- Accept unsanitized HTML → Use `sanitizeMessageBody()`
- Skip file upload validation → Validate size, type, filename
- Allow any URL protocol → Validate with `validateURL()`
- Skip form validation → Use validation functions
- Use type assertions → Use type guards for runtime safety

### ❌ Architecture Issues
- API logic embedded in hooks → Extract to `src/[feature]/api/` files
- Direct Supabase calls in hooks → Use `apiCall()` wrapper in API files
- Skip `requireAuth()` in API → Always validate authentication
- Multiple imports from utils → Use barrel export `src/[feature]/utils/index.ts`
- No cache configuration → Add explicit `staleTime` and `gcTime` to ALL queries

### ❌ Performance Problems
- Individual `useState` for modals → Use `useModalState`
- Invalidate `...Keys.all` → Invalidate only affected queries
- No optimistic updates → Add for frequent actions
- Load all data at once → Use pagination with `useInfiniteQuery`
- Re-fetch after mutations → Update cache with `setQueryData()`
- Rely on React Query defaults → Set explicit `staleTime` and `gcTime`

### ❌ Error Handling Gaps
- Mutations without error handlers → Add `onSuccess` and `onError`
- Technical error messages → Use `getUserErrorMessage()`
- Silent failures → Show toast notifications
- No error logging → Log with operation context

### ✅ Correct Patterns to Follow

**Standards:**
- ✅ Use `logger.*` for all logging
- ✅ Use typed error classes
- ✅ Add ARIA labels and keyboard support
- ✅ Create dedicated API layer
- ✅ Complete all TODOs or remove them
- ✅ Verify schema before coding
- ✅ Wrap features in error boundaries

**Imports & Usage:**
- ✅ Verify exports: `grep "^export function" src/path/file.ts`
- ✅ Use `showToast` from useToast hook
- ✅ Extract validation errors: `Object.values(validation.errors)[0]`
- ✅ Match database field names exactly (check migrations)
- ✅ Verify RLS policy columns against schema
- ✅ Test imports in IDE before running code

**Security:**
- ✅ Validate foreign keys in RLS policies
- ✅ Sanitize all HTML content
- ✅ Validate file uploads
- ✅ Validate URLs
- ✅ Use validation functions
- ✅ Use type guards

**Architecture:**
- ✅ Extract API logic to `src/[feature]/api/` files (messagesAPI.ts, challengesAPI.ts, etc.)
- ✅ Use `apiCall()` wrapper in all API functions
- ✅ Use `requireAuth()` for authentication in API functions
- ✅ Create barrel export `src/[feature]/utils/index.ts` for utilities
- ✅ Hooks use API functions, not direct Supabase calls

**Performance:**
- ✅ Use `useModalState` for modal management
- ✅ Granular query invalidation
- ✅ Optimistic updates for UX
- ✅ Pagination for large datasets
- ✅ Cache updates on mutations
- ✅ Explicit `staleTime` and `gcTime` on ALL queries

**Error Handling:**
- ✅ All mutations have success/error handlers
- ✅ User-friendly error messages
- ✅ Toast notifications
- ✅ Contextual error logging

---

## Quick Copy-Paste Patterns

### Import Verification: Always Check First!

```bash
# BEFORE importing any function, verify the actual export name:

# Check validation function exports
grep "^export function" src/together/utils/validation.ts
# Output: export function validateMilestone(...)
#         export function validatePartnerMessage(...)
#         export function validateChallenge(...)

# Check hook exports
grep -A 3 "export.*useToast" src/hooks/useToast.ts
# Output: export const useToast = (): {
#           showToast: (message: string, type?: ToastKind) => void;
#           ...
#         }

# Verify database field names
grep "target_value\|target_count" supabase/migrations/*.sql
# Output: target_value integer  (NOT target_count!)

# Extract all columns from a table
awk '/CREATE TABLE.*milestones/,/\);/' supabase/migrations/*.sql | grep -E "^\s+\w+\s+"
```

### Correct Import Patterns

```typescript
// ✅ CORRECT: Verify exports first, then import
import { validateMilestone } from './utils/validation';  // NOT validateMilestoneForm
import { validatePartnerMessage } from './utils/validation';  // NOT validatePartnerMessageForm
import { validateChallenge } from './utils/validation';  // NOT validateChallengeForm

// ✅ CORRECT: Hook destructuring
const { showToast } = useToast();  // NOT { toast }

// ✅ CORRECT: Using validation results
const validation = validateMilestone(data);
if (!validation.valid) {
  const errorMsg = Object.values(validation.errors)[0];  // NOT validation.error
  showToast(errorMsg, 'error');
}

// ✅ CORRECT: Database field names (check schema first!)
const progress = challenge.target_value;  // NOT target_count
const creator = message.sender_id;  // NOT user_id (check your table!)
```

### Database Field Verification Pattern

```typescript
// BEFORE writing code, create a field reference from schema:

// Table: achievement_rewards (from migrations)
interface AchievementReward {
  id: string;
  connection_id: string;
  creator_id: string;        // ✅ Verified in schema
  recipient_id: string;      // ✅ Verified in schema
  target_value: number;      // ✅ Verified (NOT target_count!)
  current_progress: number;  // ✅ Verified in schema
  status: ChallengeStatus;
  // ... other fields
}

// This prevents using wrong field names like:
// - target_count (doesn't exist)
// - user_id (should be creator_id)
// - scheduled_for (should be reveal_date)
```

### Security: Validation Function Template

```typescript
// src/[feature]/utils/validation.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeMessageBody(content: string): string {
  const config = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
  };
  return DOMPurify.sanitize(content, config);
}

export function validateItemForm(data: Partial<CreateItemRequest>): ValidationResult {
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (data.title.length > 100) {
    return { valid: false, error: 'Title must be less than 100 characters' };
  }

  return { valid: true };
}
```

### Performance: Modal State Pattern

```typescript
// Component with modals
import { useModalState } from '@/hooks/useModalState';

export const MyComponent = () => {
  const modals = useModalState({
    addItem: false,
    editingItem: null as string | null,
    confirmDelete: false,
  });

  return (
    <>
      <button onClick={() => modals.open('addItem')}>Add</button>

      {modals.state.addItem && (
        <AddItemModal onClose={() => modals.close('addItem')} />
      )}

      {modals.state.editingItem && (
        <EditItemModal
          itemId={modals.state.editingItem}
          onClose={() => modals.set('editingItem', null)}
        />
      )}
    </>
  );
};
```

### Performance: Granular Invalidation Pattern

```typescript
// Query keys
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters?: Filters) => [...itemKeys.lists(), filters] as const,
  infinite: (filters?: Filters) => [...itemKeys.all, 'infinite', filters] as const,
  detail: (id: string) => [...itemKeys.all, id] as const,
};

// CREATE mutation
export function useCreateItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      showToast('Item created!', 'success');
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: [...itemKeys.all, 'infinite'] });
    },
    onError: (error) => {
      showToast(getUserErrorMessage(error), 'error');
      logger.error('Feature', error as Error, { operation: 'createItem' });
    },
  });
}

// UPDATE mutation
export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: updateItem,
    onSuccess: (data) => {
      showToast('Item updated!', 'success');
      queryClient.setQueryData(itemKeys.detail(data.id), data);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
    onError: (error) => {
      showToast(getUserErrorMessage(error), 'error');
      logger.error('Feature', error as Error, { operation: 'updateItem' });
    },
  });
}

// DELETE mutation
export function useDeleteItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, id) => {
      showToast('Item deleted', 'success');
      queryClient.removeQueries({ queryKey: itemKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
    onError: (error) => {
      showToast(getUserErrorMessage(error), 'error');
      logger.error('Feature', error as Error, { operation: 'deleteItem' });
    },
  });
}
```

### Performance: Pagination Pattern

```typescript
export function useInfiniteItems(filters?: ItemFilters) {
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: itemKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }): Promise<Item[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new AuthenticationError('Not authenticated');

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) throw parseToLifeSyncError(error);
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Usage in component
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteItems();
const allItems = data?.pages.flatMap(page => page) || [];

return (
  <>
    {allItems.map(item => <ItemCard key={item.id} item={item} />)}
    {hasNextPage && (
      <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    )}
  </>
);
```

### Architecture: API Layer Pattern

```typescript
// src/[feature]/api/resourceAPI.ts
import { supabase } from '@/lib/supabase';
import { apiCall, requireAuth } from '@/api/apiWrapper';
import { parseToLifeSyncError } from '@/lib/errors';
import { logger } from '@/services/logger';
import type { Resource, CreateResourceRequest } from '../types';

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all resources with optional filters
 */
export async function getResources(filters?: ResourceFilters): Promise<Resource[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw parseToLifeSyncError(error);

      return data || [];
    },
    { domain: 'Feature', operation: 'getResources' }
  );
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new resource
 */
export async function createResource(
  resource: CreateResourceRequest
): Promise<Resource> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('resources')
        .insert({
          ...resource,
          user_id: user.id, // Auto-set user
        })
        .select()
        .single();

      if (error) {
        logger.error('Feature', 'Failed to create resource', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Feature', 'Resource created', { id: data.id });
      return data;
    },
    { domain: 'Feature', operation: 'createResource' }
  );
}

// Usage in hooks:
// src/[feature]/hooks/useResourcesQuery.ts
import { getResources, createResource } from '../api/resourceAPI';

export function useResources(filters?: ResourceFilters) {
  return useQuery({
    queryKey: resourceKeys.list(filters),
    queryFn: () => getResources(filters), // ✅ Use API function
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: createResource, // ✅ Use API function
    onSuccess: () => {
      showToast('Resource created!', 'success');
      void queryClient.invalidateQueries({ queryKey: resourceKeys.lists() });
    },
  });
}
```

### Architecture: Barrel Export Pattern

```typescript
// src/[feature]/utils/index.ts
/**
 * Feature Utilities - Barrel Export
 */

export * from './validation';
export * from './dateHelpers';
export * from './formatters';

// Now use single import instead of multiple:
// ✅ GOOD:
import { validateForm, formatDate, sanitizeInput } from '@/feature/utils';

// ❌ BAD (multiple imports):
import { validateForm } from '@/feature/utils/validation';
import { formatDate } from '@/feature/utils/dateHelpers';
import { sanitizeInput } from '@/feature/utils/validation';
```

### Performance: Explicit Cache Configuration

```typescript
// ✅ ALWAYS add explicit staleTime and gcTime to ALL queries

export function useResources() {
  return useQuery({
    queryKey: resourceKeys.list(),
    queryFn: getResources,
    staleTime: 2 * 60 * 1000, // ✅ 2 minutes
    gcTime: 10 * 60 * 1000,   // ✅ 10 minutes
  });
}

export function useResource(id: string) {
  return useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: () => getResource(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // ✅ 5 minutes (detail queries)
    gcTime: 15 * 60 * 1000,   // ✅ 15 minutes
  });
}

export function usePendingReveals() {
  return useQuery({
    queryKey: resourceKeys.pending(),
    queryFn: getPendingReveals,
    staleTime: 1 * 60 * 1000, // ✅ 1 minute (check frequently)
    gcTime: 5 * 60 * 1000,    // ✅ 5 minutes
  });
}

// Cache Strategy Guide:
// - List queries: staleTime: 2min, gcTime: 10min
// - Detail queries: staleTime: 5min, gcTime: 15min
// - Realtime/pending: staleTime: 1min, gcTime: 5min
```

### Security: RLS Policy Pattern

```sql
-- Validate foreign key relationships
CREATE POLICY "Users can view their items and partner's items" ON items
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profile_connections pc
      WHERE pc.id = items.connection_id
        AND pc.status = 'active'
        AND auth.uid() IN (pc.requester_id, pc.receiver_id)
        -- Validate partner_id matches actual partner
        AND (
          items.partner_id IS NULL
          OR
          items.partner_id = CASE
            WHEN auth.uid() = pc.requester_id THEN pc.receiver_id
            WHEN auth.uid() = pc.receiver_id THEN pc.requester_id
          END
        )
    )
  );
```

---

**Time Investment:** 20 minutes of planning saves hours of refactoring!

**Phase 2 Complete:** All Together feature patterns now included ✅
