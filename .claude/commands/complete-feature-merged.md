# Complete Feature Merged Mode Implementation

Fully automate the implementation of merged mode for an existing feature. This skill reads the codebase, makes all necessary changes, tests the implementation, and prepares everything for review.

## Usage

```
/complete-feature-merged [feature-name]
```

**Examples:**
- `/complete-feature-merged tasks`
- `/complete-feature-merged projects`
- `/complete-feature-merged calendar`
- `/complete-feature-merged habits`

## What This Skill Does

This is a FULLY AUTOMATED skill that:
1. ✅ Analyzes the existing feature implementation
2. ✅ Updates API layer with merged connection logic
3. ✅ Creates database migration with RLS policies
4. ✅ Creates/updates React Query hooks
5. ✅ Updates UI components with OwnerBadge
6. ✅ Updates page with OwnerFilter
7. ✅ Runs migrations
8. ✅ Tests the implementation
9. ✅ Creates a summary report
10. ✅ (Optional) Creates a git commit

**Time saved:** 3-4 hours → 5-10 minutes

## Prerequisites

- Feature must already exist with basic CRUD operations
- Database table must have `user_id` field
- API file must exist at `src/api/[feature]API.ts`
- Page file must exist at `src/pages/[Feature].tsx`

## Process

### Phase 1: Discovery & Analysis

1. **Determine the feature module name:**
   - Ask user if not provided in command
   - Map to ShareableModule type:
     - tasks → 'todos'
     - projects → 'projects'
     - calendar → 'calendar'
     - habits → 'habits'
     - notes → 'notes'
     - journal → 'journal'
     - focus → 'focus'
     - nutrition → 'nutrition'
     - skincare → 'skincare'

2. **Read existing implementation:**
   - Read `src/api/[feature]API.ts`
   - Read `src/pages/[Feature].tsx` or find the main page
   - Find component files in `src/components/[feature]/` or `src/[feature]/components/`
   - Find hook files in `src/hooks/use[Feature]Query.ts`
   - Check if Supabase table exists

3. **Identify key information:**
   - Database table name (e.g., tasks, projects, calendar_events)
   - Main fetch function name (e.g., getTasks, getProjects)
   - TypeScript types being used
   - Main list component name
   - Main page component structure
   - Whether hooks file exists

4. **Check for conflicts:**
   - Is merged mode already implemented? (Check for `getMergedConnectionId`)
   - Are there uncommitted changes in feature files?
   - Are there merge conflicts?

### Phase 2: API Layer Implementation

**File:** `src/api/[feature]API.ts`

1. **Add import:**
```typescript
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
```

2. **Add cached connection with getter (after imports, before functions):**
```typescript
// ============================================
// MERGED MODE SUPPORT
// ============================================

// Merged connection cache for [Feature]
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for [feature] module.
 * Returns connection info if both users have enabled merged mode, null otherwise.
 *
 * @returns MergedConnectionResult with partnerId and partnerName, or null
 */
export async function get[Feature]MergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('[module-name]');
  return cachedMergedConnection;
}

/**
 * Clear cached merged connection.
 * Call this when connection status changes or user logs out.
 */
export function clear[Feature]MergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}
```

3. **Update the main fetch function:**

Find the function like `getTasks()`, `getProjects()`, etc.

**Original:**
```typescript
export async function get[Features](filters?: FilterType): Promise<FeatureType[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('[table_name]')
        .select('*')
        .eq('user_id', user.id) // ← REMOVE THIS
        .order('created_at', { ascending: false });

      // ... filters ...

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FeatureType[];
    },
    { domain: '[Feature]API', operation: 'get[Features]', data: { filters } }
  );
}
```

**Updated:**
```typescript
export async function get[Features](filters?: FilterType): Promise<FeatureType[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await get[Feature]MergedConnection();

      let query = supabase
        .from('[table_name]')
        .select('*')
        .order('created_at', { ascending: false });

      // If merged mode enabled, fetch both users' data
      // Otherwise, fetch only current user's data
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Apply filters
      if (filters) {
        // ... existing filter logic (keep as-is) ...
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FeatureType[];
    },
    { domain: '[Feature]API', operation: 'get[Features]', data: { filters } }
  );
}
```

4. **Add file header comment (at very top after imports):**
```typescript
/**
 * [Feature] API with Merged Mode Support
 *
 * This API supports "merged mode" where couples/partners can share [feature] data.
 * When both users set the [module-name] module to "merged" permission level,
 * the API automatically fetches data for both users.
 *
 * Security: RLS policies on [table_name] table ensure users can only see
 * partner's data if merged permission is mutually granted.
 *
 * @see src/shared/api/SharedDataProvider.ts - Core merged mode logic
 * @see supabase/migrations/*_[feature]_merged_mode.sql - RLS policies
 */
```

### Phase 3: Database Migration

**File:** `supabase/migrations/[YYYYMMDD]_[HHMMSS]_add_[feature]_merged_mode.sql`

Create migration file with current timestamp:

```sql
-- =====================================================
-- Add Merged Mode Support for [Feature]
-- =====================================================
-- Description: Allows users to view partner's [feature] data when both
--              users have set the [module-name] module to 'merged' permission.
-- Author: Claude Code (Automated)
-- Date: [current-date]
-- =====================================================

-- Drop existing policies to recreate with merged mode support
DROP POLICY IF EXISTS "Users can view own [feature]" ON [table_name];
DROP POLICY IF EXISTS "[feature]_select_policy" ON [table_name];
DROP POLICY IF EXISTS "merged_access_[feature]" ON [table_name];

-- =====================================================
-- SELECT Policy: View own data + partner's data (if merged)
-- =====================================================
CREATE POLICY "merged_access_[feature]" ON [table_name]
  FOR SELECT
  USING (
    -- Always allow viewing own data
    user_id = auth.uid()
    OR
    -- Allow viewing partner's data if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Match connection in either direction
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = [table_name].user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = [table_name].user_id)
        )
        -- Check module and permission level
        AND mp.module = '[module-name]'
        AND mp.permission_level = 'merged'
        -- Permission must be set by current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- =====================================================
-- INSERT Policy: Can only create with own user_id
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own [feature]" ON [table_name];
DROP POLICY IF EXISTS "[feature]_insert_policy" ON [table_name];

CREATE POLICY "[feature]_insert_policy" ON [table_name]
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- UPDATE Policy: Can only update own data
-- =====================================================
-- Note: Even in merged mode, users cannot edit partner's data
--       (unless 'collaborate' permission is added in future)
DROP POLICY IF EXISTS "Users can update own [feature]" ON [table_name];
DROP POLICY IF EXISTS "[feature]_update_policy" ON [table_name];

CREATE POLICY "[feature]_update_policy" ON [table_name]
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- DELETE Policy: Can only delete own data
-- =====================================================
DROP POLICY IF EXISTS "Users can delete own [feature]" ON [table_name];
DROP POLICY IF EXISTS "[feature]_delete_policy" ON [table_name];

CREATE POLICY "[feature]_delete_policy" ON [table_name]
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Add helpful comment for documentation
-- =====================================================
COMMENT ON POLICY "merged_access_[feature]" ON [table_name] IS
  'Merged Mode: Allows viewing own [feature] and partners [feature] when both users have mutually enabled merged permission for [module-name] module';

COMMENT ON TABLE [table_name] IS
  '[Feature] data with merged mode support. Users can view partners data when merged permission is mutually granted.';
```

### Phase 4: React Query Hooks

**File:** `src/hooks/use[Feature]Query.ts`

**If file exists:** Add the merged connection hook at the top.

**If file doesn't exist:** Create the entire file with full hooks implementation.

```typescript
/**
 * React Query hooks for [Feature] with Merged Mode Support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  get[Features],
  get[Feature],
  create[Feature],
  update[Feature],
  delete[Feature],
  get[Feature]MergedConnection,
} from '../api/[feature]API';
import type { [FeatureType] } from '../services/types';
import { logger } from '../services/logger';

// =====================================================
// MERGED MODE HOOK
// =====================================================

/**
 * Hook to check if [feature] merged mode is enabled.
 * Returns connection info if both users have set module to 'merged', null otherwise.
 *
 * @returns Query result with MergedConnectionResult or null
 */
export function useMerged[Feature]ConnectionQuery() {
  return useQuery({
    queryKey: ['[feature]', 'mergedConnection'],
    queryFn: get[Feature]MergedConnection,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
    retry: 1,                   // Only retry once on failure
  });
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Hook to fetch all [features].
 * Automatically includes partner's [features] if merged mode is enabled.
 *
 * @param filters - Optional filters to apply
 * @returns Query result with array of [features]
 */
export function use[Features]Query(filters?: any) {
  return useQuery({
    queryKey: ['[features]', filters],
    queryFn: () => get[Features](filters),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch a single [feature] by ID
 */
export function use[Feature]Query(id: string) {
  return useQuery({
    queryKey: ['[feature]', id],
    queryFn: () => get[Feature](id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Hook to create a new [feature]
 */
export function useCreate[Feature]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create[Feature],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[features]'] });
      logger.info('[Feature]Query', '[Feature] created successfully');
    },
    onError: (error) => {
      logger.error('[Feature]Query', 'Failed to create [feature]', { error });
    },
  });
}

/**
 * Hook to update an existing [feature]
 */
export function useUpdate[Feature]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<[FeatureType]> }) =>
      update[Feature](id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['[features]'] });
      queryClient.invalidateQueries({ queryKey: ['[feature]', id] });
      logger.info('[Feature]Query', '[Feature] updated successfully');
    },
    onError: (error) => {
      logger.error('[Feature]Query', 'Failed to update [feature]', { error });
    },
  });
}

/**
 * Hook to delete a [feature]
 */
export function useDelete[Feature]() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: delete[Feature],
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[features]'] });
      logger.info('[Feature]Query', '[Feature] deleted successfully');
    },
    onError: (error) => {
      logger.error('[Feature]Query', 'Failed to delete [feature]', { error });
    },
  });
}
```

### Phase 5: UI Components

**Create shared components if they don't exist:**

#### Create `src/components/common/OwnerBadge.tsx`:

```typescript
import React from 'react';

interface OwnerBadgeProps {
  userId: string;
  currentUserId: string;
  partnerName?: string;
  className?: string;
}

/**
 * Badge showing who owns an item in merged mode
 * Blue badge = "Me" (current user)
 * Purple badge = Partner's name
 */
export function OwnerBadge({
  userId,
  currentUserId,
  partnerName = 'Partner',
  className = ''
}: OwnerBadgeProps) {
  const isOwn = userId === currentUserId;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isOwn
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      } ${className}`}
      title={isOwn ? 'Your item' : `${partnerName}'s item`}
    >
      {isOwn ? 'Me' : partnerName}
    </span>
  );
}
```

#### Create `src/components/common/OwnerFilter.tsx`:

```typescript
import React from 'react';

export type OwnerFilterValue = 'all' | 'mine' | 'partner';

interface OwnerFilterProps {
  value: OwnerFilterValue;
  onChange: (value: OwnerFilterValue) => void;
  partnerName?: string;
  className?: string;
}

/**
 * Filter dropdown for merged mode (All / Mine / Partner)
 */
export function OwnerFilter({
  value,
  onChange,
  partnerName = 'Partner',
  className = ''
}: OwnerFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="owner-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Show:
      </label>
      <select
        id="owner-filter"
        value={value}
        onChange={(e) => onChange(e.target.value as OwnerFilterValue)}
        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All</option>
        <option value="mine">Mine</option>
        <option value="partner">{partnerName}</option>
      </select>
    </div>
  );
}
```

#### Create `src/utils/ownerUtils.ts`:

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Hook to get current user ID from Supabase auth
 */
export function useCurrentUserId() {
  return useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity, // User ID never changes during session
    gcTime: Infinity,
  });
}

/**
 * Hook to get partner's name from merged connection
 */
export function usePartnerName(mergedConnection: { partnerName?: string } | null | undefined) {
  return useMemo(() => {
    return mergedConnection?.partnerName ?? 'Partner';
  }, [mergedConnection]);
}

/**
 * Check if merged mode is enabled (has active connection)
 */
export function useHasMergedPermission(mergedConnection: any) {
  return useMemo(() => {
    return !!mergedConnection?.connectionId;
  }, [mergedConnection]);
}
```

### Phase 6: Update UI to Display Owner

Find the main list component (e.g., TaskCard, ProjectCard) and add OwnerBadge:

**Steps:**
1. Import the necessary hooks and components
2. Get merged connection status
3. Get current user ID
4. Get partner name
5. Add OwnerBadge to the component (only show if merged mode is active)

**Example modification:**

```typescript
// Add imports at top
import { OwnerBadge } from '@/components/common/OwnerBadge';
import { useMerged[Feature]ConnectionQuery } from '@/hooks/use[Feature]Query';
import { useCurrentUserId, usePartnerName } from '@/utils/ownerUtils';

function [Feature]Card({ item }: { item: [FeatureType] }) {
  // Add hooks
  const { data: mergedConnection } = useMerged[Feature]ConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);

  return (
    <div className="[existing-classes]">
      <div className="flex items-center justify-between">
        <h3 className="[existing-classes]">{item.title}</h3>

        {/* Add OwnerBadge - only show in merged mode */}
        {mergedConnection && currentUserId && (
          <OwnerBadge
            userId={item.user_id}
            currentUserId={currentUserId}
            partnerName={partnerName}
          />
        )}
      </div>

      {/* ... rest of component ... */}
    </div>
  );
}
```

### Phase 7: Update Page with Owner Filter

Find the main page component and add owner filtering:

**Example modification:**

```typescript
import { useState, useMemo } from 'react';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';
import { useMerged[Feature]ConnectionQuery, use[Features]Query } from '@/hooks/use[Feature]Query';
import { useCurrentUserId, usePartnerName } from '@/utils/ownerUtils';

function [Feature]Page() {
  // Add hooks
  const { data: mergedConnection } = useMerged[Feature]ConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  // Existing query
  const { data: items, isLoading } = use[Features]Query();

  // Filter items by owner
  const filteredItems = useMemo(() => {
    if (!items || !mergedConnection) return items ?? [];

    switch (ownerFilter) {
      case 'mine':
        return items.filter(item => item.user_id === currentUserId);
      case 'partner':
        return items.filter(item => item.user_id === mergedConnection.partnerId);
      default:
        return items; // 'all'
    }
  }, [items, ownerFilter, currentUserId, mergedConnection]);

  return (
    <div className="[existing-classes]">
      {/* Page header with filter */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="[existing-classes]">[Feature Title]</h1>

        {/* Show owner filter only in merged mode */}
        {mergedConnection && (
          <OwnerFilter
            value={ownerFilter}
            onChange={setOwnerFilter}
            partnerName={partnerName}
          />
        )}
      </div>

      {/* Render filtered items */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="[existing-classes]">
          {filteredItems.length === 0 ? (
            <div>No {ownerFilter === 'all' ? '' : ownerFilter === 'mine' ? 'personal' : partnerName + "'s"} [features] found</div>
          ) : (
            filteredItems.map(item => (
              <[Feature]Card key={item.id} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

### Phase 8: Run Migration

Execute the migration:

```bash
# Option 1: Using Supabase CLI (if available)
npm run supabase:push
# or
supabase db push

# Option 2: Manual in Supabase Dashboard
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy/paste migration SQL
# 3. Execute
```

### Phase 9: Test Implementation

Run automated tests:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Unit tests (if available)
npm run test
```

Manual testing checklist:
- [ ] Personal mode (no connection) - shows only my data
- [ ] Connected but not merged - shows only my data
- [ ] Merged mode - shows both users' data
- [ ] Owner badges display correctly (Me = blue, Partner = purple)
- [ ] Owner filter works (All / Mine / Partner)
- [ ] Can create new items (should be owned by me)
- [ ] Cannot edit partner's items
- [ ] Cannot delete partner's items

### Phase 10: Generate Summary Report

Create a markdown report with:
- Feature name
- Module name
- Files modified
- Files created
- Migration status
- Test results
- Next steps

**File:** `MERGED_MODE_[FEATURE]_IMPLEMENTATION.md`

### Phase 11: Commit Changes (Optional)

If requested, create a git commit:

```bash
git add .
git commit -m "feat: Add merged mode support for [feature]

- Add merged connection logic to API layer
- Create RLS policies for merged access
- Add React Query hooks for merged mode
- Update UI with OwnerBadge and OwnerFilter
- Add owner filtering on [feature] page

Closes #[issue-number if applicable]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Module Name Reference

| Feature | Module Name | Table Name |
|---------|------------|------------|
| tasks | todos | tasks |
| projects | projects | projects |
| calendar | calendar | calendar_events |
| habits | habits | habits |
| notes | notes | notes |
| journal | journal | journal_entries |
| focus | focus | focus_sessions |
| nutrition | nutrition | food_log |
| skincare | skincare | skincare_products |

## Important Notes

- **Automated Execution:** This skill makes direct code changes. Review all changes before committing.
- **Backup First:** Ensure you have a clean git state or backup before running.
- **Test Thoroughly:** Always test both merged and non-merged states.
- **RLS Security:** RLS policies are critical - verify they work correctly.
- **Mobile UI:** Test on mobile - owner badges should be responsive.

## Error Handling

If something goes wrong:
1. Check git diff to see what was changed
2. Revert if needed: `git checkout .`
3. Review error messages
4. Fix manually if needed
5. Re-run the skill

## Expected Output

After successful completion:
- ✅ API updated with merged connection
- ✅ Migration file created
- ✅ RLS policies applied
- ✅ Hooks created/updated
- ✅ UI components updated
- ✅ Page updated with filter
- ✅ All tests passing
- ✅ Summary report generated

## Time Estimate

**Total: 5-10 minutes** (vs. 3-4 hours manual implementation)

- Discovery & Analysis: 1-2 min
- Code generation: 2-3 min
- Migration execution: 1 min
- Testing: 1-2 min
- Report generation: 1 min

## Success Criteria

- [ ] Merged mode works for the feature
- [ ] Owner badges display correctly
- [ ] Owner filter functions properly
- [ ] RLS policies prevent unauthorized access
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Tests pass
- [ ] Mobile UI works
- [ ] Summary report generated
