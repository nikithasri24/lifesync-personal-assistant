# Pre-Coding Checklist - Tasks 5-6 Patterns Added

**Date:** 2026-02-17  
**File Updated:** `.claude/PRE_CODING_CHECKLIST.md`  
**Reason:** Add API layer, barrel export, and cache configuration patterns

---

## 🔴 New Patterns Added to Checklist

### Pattern 1: API Layer Separation (Enhanced)

**Problem:** API logic was previously embedded in React Query hooks, making code hard to reuse and test.

**Prevention Added to Section 4 - ARCHITECTURAL:**

**Enhanced "API Layer Separation" with specific pattern:**
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

**Key Requirements:**
- ✅ Separate file for each resource (messagesAPI.ts, challengesAPI.ts)
- ✅ Use `apiCall()` wrapper
- ✅ Use `requireAuth()` for authentication
- ✅ Use `parseToLifeSyncError()` for error handling
- ✅ Add logging to mutations
- ✅ Section comments for QUERIES and MUTATIONS
- ✅ Hooks call API functions (not direct Supabase)

---

### Pattern 2: Barrel Exports for Utilities (NEW)

**Problem:** Multiple imports from the same feature utilities required verbose import statements.

**Prevention Added to Section 4 - ARCHITECTURAL:**

**New "Barrel Exports for Utilities" pattern:**
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

**Key Requirements:**
- ✅ Create `src/[feature]/utils/index.ts` barrel export
- ✅ Export all utility modules
- ✅ Provides single import point
- ✅ Reduces import verbosity

---

### Pattern 3: Explicit Cache Configuration (NEW)

**Problem:** React Query hooks relied on default cache settings, leading to unpredictable caching behavior.

**Prevention Added to Section 4 - PERFORMANCE:**

**New "Explicit Cache Configuration" pattern:**
```typescript
// ALL queries MUST have explicit staleTime and gcTime

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

**Key Requirements:**
- ✅ NEVER rely on React Query defaults
- ✅ Add explicit `staleTime` and `gcTime` to ALL queries
- ✅ Configure based on data volatility
- ✅ Follow cache strategy guide

---

## 📋 Checklist Sections Updated

### ENHANCED: Section 4 - Required Patterns Checklist (ARCHITECTURAL)

**Before:**
```markdown
- [ ] **API Layer Separation**
  - Create `src/[feature]/api/` directory
  - API functions use `apiCall()` wrapper
  - Hooks call API functions (not direct Supabase)
```

**After:**
```markdown
- [ ] **API Layer Separation**
  - Create `src/[feature]/api/` directory
  - Separate file for each resource (messagesAPI.ts, challengesAPI.ts, etc.)
  - API functions use `apiCall()` wrapper from `@/api/apiWrapper`
  - API functions use `requireAuth()` for authentication
  - Hooks call API functions (not direct Supabase)
  - [Full code example with structure included]

- [ ] **Barrel Exports for Utilities** ← NEW
  - Create `src/[feature]/utils/index.ts` barrel export
  - Export all utility modules (validation, dateHelpers, etc.)
  - Provides single import point for all utilities
  - [Example showing before/after imports]

- [ ] **React Query Hooks**
  - Queries in `src/[feature]/hooks/use*Query.ts`
  - Use API functions from `src/[feature]/api/`
  - [Example showing hook using API function]
```

### ENHANCED: Section 4 - Required Patterns Checklist (PERFORMANCE)

**Added:**
```markdown
- [ ] **Explicit Cache Configuration** ← NEW
  - ALL queries MUST have explicit `staleTime` and `gcTime`
  - Never rely on React Query defaults
  - Configure based on data volatility
  - [Cache strategy guide with examples]
```

### ENHANCED: Anti-Patterns Section

**Added new subsection:**
```markdown
### ❌ Architecture Issues
- API logic embedded in hooks → Extract to `src/[feature]/api/` files
- Direct Supabase calls in hooks → Use `apiCall()` wrapper in API files
- Skip `requireAuth()` in API → Always validate authentication
- Multiple imports from utils → Use barrel export `src/[feature]/utils/index.ts`
- No cache configuration → Add explicit `staleTime` and `gcTime` to ALL queries
```

**Enhanced existing:**
```markdown
### ❌ Performance Problems
- [existing items...]
- Rely on React Query defaults → Set explicit `staleTime` and `gcTime`  ← NEW
```

### ENHANCED: Correct Patterns Section

**Added new subsection:**
```markdown
**Architecture:**
- ✅ Extract API logic to `src/[feature]/api/` files (messagesAPI.ts, challengesAPI.ts, etc.)
- ✅ Use `apiCall()` wrapper in all API functions
- ✅ Use `requireAuth()` for authentication in API functions
- ✅ Create barrel export `src/[feature]/utils/index.ts` for utilities
- ✅ Hooks use API functions, not direct Supabase calls
```

**Enhanced existing:**
```markdown
**Performance:**
- [existing items...]
- ✅ Explicit `staleTime` and `gcTime` on ALL queries  ← NEW
```

### ENHANCED: Quick Copy-Paste Patterns Section

**Added 3 new subsections:**

#### 1. Architecture: API Layer Pattern
- Complete API file template with QUERIES and MUTATIONS sections
- Shows `apiCall()` wrapper usage
- Shows `requireAuth()` usage
- Shows error handling with `parseToLifeSyncError()`
- Shows logging pattern
- Shows how hooks use API functions

#### 2. Architecture: Barrel Export Pattern
- Template for `src/[feature]/utils/index.ts`
- Before/after comparison showing import improvements

#### 3. Performance: Explicit Cache Configuration
- Examples for list queries (2min/10min)
- Examples for detail queries (5min/15min)
- Examples for realtime queries (1min/5min)
- Cache strategy guide

---

## 🎯 Impact

### Before Updates
- ❌ No specific guidance on API file structure
- ❌ No pattern for barrel exports
- ❌ No requirement for explicit cache configuration
- ❌ Developers might embed API logic in hooks
- ❌ Multiple verbose imports from utils
- ❌ Unpredictable caching behavior

### After Updates
- ✅ Clear API layer pattern with complete example
- ✅ Barrel export pattern documented
- ✅ Explicit cache configuration required
- ✅ API logic properly separated from hooks
- ✅ Clean, concise imports
- ✅ Predictable, optimized caching

---

## 📊 Coverage Summary

| Issue Type | Before | After | Prevention |
|------------|--------|-------|------------|
| **API Layer Structure** | Basic mention | ✅ Complete pattern | apiCall + requireAuth template |
| **Barrel Exports** | Not covered | ✅ Section added | utils/index.ts pattern |
| **Cache Configuration** | Not covered | ✅ Section added | Explicit staleTime/gcTime |
| **Hook-API Integration** | Not covered | ✅ Examples added | queryFn: () => getResource() |

---

## 🔍 Real Examples Added

### API Layer Example
```typescript
// ✅ CORRECT: Dedicated API file
export async function getPartnerMessages(filters?: MessageFilters): Promise<PartnerMessage[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('partner_messages')
        .select('*');

      if (error) throw parseToLifeSyncError(error);

      return data || [];
    },
    { domain: 'Together', operation: 'getPartnerMessages' }
  );
}

// Hook uses API function:
export function usePartnerMessages() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: getPartnerMessages, // ✅ Clean
  });
}
```

### Barrel Export Example
```typescript
// ❌ BEFORE (verbose):
import { validatePartnerMessage } from '@/together/utils/validation';
import { sanitizeMessageBody } from '@/together/utils/validation';
import { calculateNextOccurrence } from '@/together/utils/dateHelpers';

// ✅ AFTER (clean):
import { 
  validatePartnerMessage,
  sanitizeMessageBody,
  calculateNextOccurrence 
} from '@/together/utils';
```

### Cache Configuration Example
```typescript
// ❌ WRONG (no cache config):
export function useMessages() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: getMessages,
    // Missing staleTime and gcTime!
  });
}

// ✅ CORRECT (explicit config):
export function useMessages() {
  return useQuery({
    queryKey: messageKeys.list(),
    queryFn: getMessages,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
}
```

---

## ✅ Checklist Updates Summary

1. **Section 4 (ARCHITECTURAL)** - Enhanced API Layer, added Barrel Exports, enhanced React Query Hooks
2. **Section 4 (PERFORMANCE)** - Added Explicit Cache Configuration
3. **Anti-Patterns** - Added Architecture Issues subsection, enhanced Performance
4. **Correct Patterns** - Added Architecture subsection, enhanced Performance
5. **Quick Patterns** - Added 3 new complete code examples

---

## 🎓 Key Lessons

### Always Separate API Logic
```typescript
// BEFORE (inline in hook - 50+ lines):
export function useMessages() {
  return useQuery({
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // ... 50+ lines of logic
    },
  });
}

// AFTER (use API file - clean):
export function useMessages() {
  return useQuery({
    queryFn: getMessages, // ✅ API function
  });
}
```

### Always Use Barrel Exports
```typescript
// BEFORE writing imports:
ls src/together/utils/
# validation.ts, dateHelpers.ts, formatters.ts

// CREATE barrel export:
echo "export * from './validation';" > src/together/utils/index.ts
echo "export * from './dateHelpers';" >> src/together/utils/index.ts
echo "export * from './formatters';" >> src/together/utils/index.ts

// NOW use clean imports:
import { validateForm, formatDate, sanitize } from '@/together/utils';
```

### Always Set Cache Configuration
```typescript
// BEFORE using useQuery:
// 1. Determine data volatility
// 2. Choose staleTime and gcTime from strategy guide
// 3. Add to query

// List queries → 2min/10min
// Detail queries → 5min/15min
// Realtime → 1min/5min

export function useResource(id: string) {
  return useQuery({
    queryKey: resourceKeys.detail(id),
    queryFn: () => getResource(id),
    staleTime: 5 * 60 * 1000, // ✅ Detail query
    gcTime: 15 * 60 * 1000,   // ✅ Detail query
  });
}
```

---

## 🚀 Expected Outcomes

With these updates, future features will:
- ✅ Have properly separated API layer
- ✅ Use barrel exports for clean imports
- ✅ Have explicit cache configuration
- ✅ Follow consistent patterns
- ✅ Be easier to test and maintain
- ✅ Have predictable performance

---

**Time Investment:** +3 minutes of setup saves hours of refactoring and debugging!

**Total Checklist Time:** 23 minutes (was 20 minutes before critical fixes, now 23 with all patterns)

**Patterns Covered:** API Layer ✅ | Barrel Exports ✅ | Cache Config ✅

