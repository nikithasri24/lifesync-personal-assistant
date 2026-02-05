# Add Merged Mode to Existing Feature

Add merged mode support to an existing feature that already has basic functionality. This skill implements the complete merged mode pattern: API layer, database RLS, hooks, and UI components.

## Usage

```
/add-merged-mode [feature-name]
```

**Examples:**
- `/add-merged-mode tasks`
- `/add-merged-mode projects`
- `/add-merged-mode calendar`
- `/add-merged-mode habits`

## What This Skill Does

Automatically implements merged mode across all 5 layers:
1. **API Layer** - Add `getMergedConnectionId()` calls and caching
2. **Database Layer** - Create/update RLS policies for merged access
3. **Hooks Layer** - Create merged connection query hooks
4. **UI Layer** - Add OwnerBadge and OwnerFilter components
5. **Page Layer** - Integrate merged data display

## Prerequisites

Before running this skill, ensure:
- Feature already exists with basic CRUD operations
- API file exists: `src/api/[feature]API.ts`
- Database table exists with `user_id` field
- Basic UI components exist
- You have the feature name and module name ready

## Process

### Step 1: Analyze Existing Feature

1. **Identify the feature module name** (for `getMergedConnectionId`)
   - Map feature to ShareableModule type:
     - tasks → 'todos'
     - projects → 'projects'
     - calendar → 'calendar'
     - habits → 'habits'
     - notes → 'notes'
     - journal → 'journal'
     - focus → 'focus'
     - nutrition → 'nutrition'
     - skincare → 'skincare'
     - national-parks → 'travel'

2. **Read existing implementation:**
   - API file: `src/api/[feature]API.ts`
   - Page file: `src/pages/[Feature].tsx`
   - Component files: `src/components/[feature]/` or `src/[feature]/components/`
   - Hook files: `src/hooks/use[Feature]Query.ts`
   - Check what's already there

3. **Identify database table name:**
   - Usually: `[feature]s` or `[feature]_table`
   - Examples: tasks, projects, calendar_events, habits, notes, journal_entries

### Step 2: Update API Layer

**File:** `src/api/[feature]API.ts`

1. **Add imports at top:**
```typescript
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
```

2. **Add cached connection variable and getter function after imports:**
```typescript
// Merged connection cache for [Feature]
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for [feature] module
 * Returns connection info if both users have enabled merged mode, null otherwise
 */
export async function get[Feature]MergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    console.log('[get[Feature]MergedConnection] Returning cached connection:', cachedMergedConnection);
    return cachedMergedConnection;
  }

  console.log('[get[Feature]MergedConnection] Fetching merged connection...');
  cachedMergedConnection = await getMergedConnectionId('[module-name]');
  console.log('[get[Feature]MergedConnection] Cached connection:', cachedMergedConnection);

  return cachedMergedConnection;
}

/**
 * Clear cached merged connection (call when connection status changes)
 */
export function clear[Feature]MergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}
```

3. **Update main fetch function to support merged mode:**

Find the main `get[Features]()` function and update it:

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

      // If merged mode, get both users' data
      // Otherwise, just get current user's data
      if (mergedConnection) {
        console.log('[get[Features]] Merged mode enabled, fetching for both users');
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Apply additional filters
      if (filters) {
        // ... existing filter logic
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log('[get[Features]] Fetched', data?.length ?? 0, 'items', mergedConnection ? '(merged mode)' : '(personal mode)');
      return (data ?? []) as FeatureType[];
    },
    { domain: '[Feature]API', operation: 'get[Features]', data: { filters } }
  );
}
```

4. **Add comment to file explaining RLS:**
Add this comment near the top after imports:
```typescript
/**
 * [Feature] API with Merged Mode Support
 *
 * Merged Mode: When both users in a connection set this module to "merged",
 * the API fetches data for both users. RLS policies ensure proper access control.
 *
 * Implementation:
 * - get[Feature]MergedConnection() checks if merged mode is enabled
 * - Fetch functions include partner's data when merged
 * - RLS policies on [table_name] table handle security
 */
```

### Step 3: Create Database Migration for RLS Policies

**File:** `supabase/migrations/[timestamp]_add_[feature]_merged_mode.sql`

Create a new migration file with current timestamp (format: `YYYYMMDD_HHMMSS`):

```sql
-- Add merged mode support for [feature]
-- Allows users to view partner's [feature] data when both have set module to 'merged'

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own [feature]" ON [table_name];
DROP POLICY IF EXISTS "[feature]_select_policy" ON [table_name];

-- Create new SELECT policy with merged mode support
CREATE POLICY "merged_access_[feature]" ON [table_name]
  FOR SELECT
  USING (
    -- User can always see their own data
    user_id = auth.uid()
    OR
    -- User can see partner's data if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = [table_name].user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = [table_name].user_id)
        )
        -- Module must be set to merged
        AND mp.module = '[module-name]'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- Ensure INSERT policy restricts to own user_id
DROP POLICY IF EXISTS "Users can insert own [feature]" ON [table_name];
CREATE POLICY "[feature]_insert_policy" ON [table_name]
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own data
DROP POLICY IF EXISTS "Users can update own [feature]" ON [table_name];
CREATE POLICY "[feature]_update_policy" ON [table_name]
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own data
DROP POLICY IF EXISTS "Users can delete own [feature]" ON [table_name];
CREATE POLICY "[feature]_delete_policy" ON [table_name]
  FOR DELETE
  USING (user_id = auth.uid());

-- Add helpful comment
COMMENT ON POLICY "merged_access_[feature]" ON [table_name] IS
  'Allows viewing own [feature] data and partners [feature] data when merged mode is mutually enabled';
```

**Important:** Replace all placeholders:
- `[table_name]` - actual database table name
- `[feature]` - feature name in lowercase
- `[module-name]` - ShareableModule name from Step 1
- `[timestamp]` - current timestamp in format YYYYMMDD_HHMMSS

### Step 4: Create Hooks Layer

**File:** `src/hooks/use[Feature]Query.ts` (or update existing)

1. **Add merged connection query hook:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { get[Feature]MergedConnection } from '../api/[feature]API';

/**
 * Hook to check if [feature] merged mode is enabled
 * Returns connection info if both users have merged mode enabled
 */
export function useMerged[Feature]ConnectionQuery() {
  return useQuery({
    queryKey: ['[feature]', 'mergedConnection'],
    queryFn: get[Feature]MergedConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
}
```

2. **If the file doesn't exist, create it with full implementation:**

```typescript
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

/**
 * Hook to check if [feature] merged mode is enabled
 */
export function useMerged[Feature]ConnectionQuery() {
  return useQuery({
    queryKey: ['[feature]', 'mergedConnection'],
    queryFn: get[Feature]MergedConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });
}

/**
 * Hook to fetch all [features] (supports merged mode)
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
      logger.error('[Feature]Query', error as Error);
    },
  });
}

/**
 * Hook to update a [feature]
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
      logger.error('[Feature]Query', error as Error);
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
      logger.error('[Feature]Query', error as Error);
    },
  });
}
```

### Step 5: Add UI Components

#### 5a. Create or Use Shared OwnerBadge Component

**Check if exists:** `src/components/common/OwnerBadge.tsx`

If it doesn't exist, create it:

```typescript
import React from 'react';

interface OwnerBadgeProps {
  userId: string;
  currentUserId: string;
  partnerName?: string;
  className?: string;
}

/**
 * Displays a badge indicating who owns an item (Me vs Partner)
 * Used in merged mode to distinguish between users' data
 */
export function OwnerBadge({ userId, currentUserId, partnerName = 'Partner', className = '' }: OwnerBadgeProps) {
  const isOwn = userId === currentUserId;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isOwn
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      } ${className}`}
    >
      {isOwn ? 'Me' : partnerName}
    </span>
  );
}
```

#### 5b. Create or Use Shared OwnerFilter Component

**Check if exists:** `src/components/common/OwnerFilter.tsx`

If it doesn't exist, create it:

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
 * Dropdown filter for merged mode to show All/Mine/Partner items
 */
export function OwnerFilter({ value, onChange, partnerName = 'Partner', className = '' }: OwnerFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OwnerFilterValue)}
      className={`rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="all">All</option>
      <option value="mine">Mine</option>
      <option value="partner">{partnerName}</option>
    </select>
  );
}
```

#### 5c. Add owner utilities if needed

**File:** `src/utils/ownerUtils.ts` (create if doesn't exist)

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Get current user ID from Supabase auth
 */
export function useCurrentUserId() {
  return useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity,
  });
}

/**
 * Get partner's name from merged connection
 */
export function usePartnerName(mergedConnection: { partnerName?: string } | null | undefined) {
  return useMemo(() => {
    return mergedConnection?.partnerName ?? 'Partner';
  }, [mergedConnection]);
}

/**
 * Check if user has merged permission for a module
 */
export function useHasMergedPermission(mergedConnection: any) {
  return useMemo(() => {
    return !!mergedConnection?.connectionId;
  }, [mergedConnection]);
}
```

### Step 6: Update UI Components to Show Owner

Find the main component that displays list items and add OwnerBadge:

**Example - Task Card Component:**

```typescript
import { OwnerBadge } from '../components/common/OwnerBadge';
import { useMerged[Feature]ConnectionQuery } from '../hooks/use[Feature]Query';
import { useCurrentUserId, usePartnerName } from '../utils/ownerUtils';

function [Feature]Card({ item }: { item: [FeatureType] }) {
  const { data: mergedConnection } = useMerged[Feature]ConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);

  return (
    <div className="...">
      {/* Existing card content */}
      <div className="...">
        <h3>{item.title}</h3>

        {/* Add OwnerBadge if merged mode is enabled */}
        {mergedConnection && currentUserId && (
          <OwnerBadge
            userId={item.user_id}
            currentUserId={currentUserId}
            partnerName={partnerName}
          />
        )}
      </div>
      {/* ... rest of card */}
    </div>
  );
}
```

### Step 7: Update Page to Show Owner Filter

**Example - Feature Page:**

```typescript
import { useState } from 'react';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { useMerged[Feature]ConnectionQuery, use[Features]Query } from '../hooks/use[Feature]Query';
import { useCurrentUserId, usePartnerName } from '../utils/ownerUtils';

function [Feature]Page() {
  const { data: mergedConnection } = useMerged[Feature]ConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  const { data: items, isLoading } = use[Features]Query();

  // Filter items by owner
  const filteredItems = useMemo(() => {
    if (!items || !mergedConnection) return items ?? [];

    if (ownerFilter === 'mine') {
      return items.filter(item => item.user_id === currentUserId);
    } else if (ownerFilter === 'partner') {
      return items.filter(item => item.user_id === mergedConnection.partnerId);
    }

    return items; // 'all'
  }, [items, ownerFilter, currentUserId, mergedConnection]);

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-center mb-4">
        <h1>[Feature]</h1>

        {/* Show owner filter only if merged mode is enabled */}
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
        <div>
          {filteredItems.map(item => (
            <[Feature]Card key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 8: Run Migration

After creating the migration file, apply it to Supabase:

```bash
# If using Supabase CLI locally
supabase db push

# Or manually run the SQL in Supabase dashboard
# Go to: https://app.supabase.com → SQL Editor → Run the migration SQL
```

### Step 9: Test Implementation

1. **Test in personal mode (no connection):**
   - Should only show your data
   - No owner badges visible
   - No owner filter visible

2. **Test with connection but no merged permission:**
   - Should only show your data
   - No owner badges visible

3. **Test with merged mode enabled:**
   - Should show both users' data
   - Owner badges visible (Me = blue, Partner = purple)
   - Owner filter visible and functional
   - Verify correct data displays for each filter option

4. **Test RLS policies manually in Supabase:**
   - Go to Supabase → Table Editor → [table_name]
   - Verify you can see partner's data
   - Try to update partner's data (should fail unless collaborate mode)
   - Try to delete partner's data (should fail)

### Step 10: Clean Up

1. **Remove console.logs if not needed** (optional)
2. **Update TypeScript types** if needed
3. **Format code:**
   ```bash
   npm run lint:fix
   ```
4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: Add merged mode support for [feature]"
   ```

## Important Rules

- ✅ DO preserve all existing functionality
- ✅ DO test both merged and non-merged states
- ✅ DO handle null merged connection gracefully
- ✅ DO add owner information only when merged mode is active
- ✅ DO use consistent styling (blue=me, purple=partner)
- ✅ DO cache merged connection to avoid repeated DB calls
- ✅ DO add proper RLS policies (SELECT, INSERT, UPDATE, DELETE)
- ❌ DO NOT break existing UI
- ❌ DO NOT show owner badges when not in merged mode
- ❌ DO NOT allow editing/deleting partner's data (unless collaborate mode)
- ❌ DO NOT forget to test on mobile UI

## Module Name Mapping

| Feature Name | ShareableModule | Table Name |
|--------------|----------------|------------|
| tasks | 'todos' | tasks |
| projects | 'projects' | projects |
| calendar | 'calendar' | calendar_events |
| habits | 'habits' | habits |
| notes | 'notes' | notes |
| journal | 'journal' | journal_entries |
| focus | 'focus' | focus_sessions |
| nutrition | 'nutrition' | food_log |
| skincare | 'skincare' | skincare_products |
| national-parks | 'travel' | visited_locations |

## Definition of Done

- [ ] API layer updated with merged connection
- [ ] Cached connection getter function added
- [ ] Main fetch function supports merged mode
- [ ] Database migration created and applied
- [ ] RLS policies added (SELECT, INSERT, UPDATE, DELETE)
- [ ] Merged connection hook created
- [ ] OwnerBadge component added to UI
- [ ] OwnerFilter component added to page
- [ ] Owner filtering logic implemented
- [ ] Tested in personal mode
- [ ] Tested in merged mode
- [ ] RLS policies tested manually
- [ ] No TypeScript errors
- [ ] Code formatted and linted
- [ ] Changes committed to git

## Expected Time

**Total: 15-30 minutes** (vs. 2-3 hours manual implementation)

- Step 1-2 (API): 5-10 min
- Step 3 (Migration): 3-5 min
- Step 4 (Hooks): 2-3 min
- Step 5-7 (UI): 5-10 min
- Step 8-10 (Test & Clean): 5 min
