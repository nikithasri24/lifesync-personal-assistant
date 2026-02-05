# Shopping Merge Implementation Plan

## Overview
This document outlines the complete implementation plan for enabling merged mode in the shopping module, allowing both partners to see and collaborate on shopping lists, pantry items, and stores.

## Implementation Strategy
Following the proven pattern from the finance merge implementation, we'll implement this in 7 phases:

1. **Database Migrations** - Add connection_id fields and RLS policies
2. **Type Definitions** - Update TypeScript interfaces
3. **API Layer** - Update API functions for merged data
4. **React Query Hooks** - Update hooks to handle merged data
5. **UI Components** - Add owner badges and conditional editing
6. **Business Logic** - Update algorithms for merged mode
7. **Testing & Validation** - Verify all functionality

---

## Phase 1: Database Migrations

### Migration File: `20260131_shopping_merge_support.sql`

#### 1.1 Add `connection_id` to `shopping_lists` table
```sql
ALTER TABLE shopping_lists 
ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_shopping_lists_connection_id ON shopping_lists(connection_id);
```

#### 1.2 Add `connection_id` to `pantry_items` table
```sql
ALTER TABLE pantry_items 
ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pantry_items_connection_id ON pantry_items(connection_id);
```

#### 1.3 Update `stores` table for shared household model
```sql
-- Stores should be shared across household
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stores_connection_id ON stores(connection_id);
```

#### 1.4 Create RLS Policies for `shopping_lists`

**SELECT Policy:**
```sql
DROP POLICY IF EXISTS "Users can view own and merged shopping lists" ON shopping_lists;

CREATE POLICY "Users can view own and merged shopping lists" ON shopping_lists
FOR SELECT USING (
  -- Own lists
  (auth.uid() = user_id)
  OR
  -- Shared lists (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

**UPDATE Policy:**
```sql
DROP POLICY IF EXISTS "Users can update own and merged shopping lists" ON shopping_lists;

CREATE POLICY "Users can update own and merged shopping lists" ON shopping_lists
FOR UPDATE USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

**INSERT Policy:**
```sql
CREATE POLICY "Users can insert own shopping lists" ON shopping_lists
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**DELETE Policy:**
```sql
CREATE POLICY "Users can delete own shopping lists" ON shopping_lists
FOR DELETE USING (auth.uid() = user_id);
```

#### 1.5 Create RLS Policies for `shopping_items`

**SELECT Policy:**
```sql
DROP POLICY IF EXISTS "Users can view shopping items" ON shopping_items;

CREATE POLICY "Users can view shopping items from accessible lists" ON shopping_items
FOR SELECT USING (
  shopping_list_id IN (
    SELECT id FROM shopping_lists
    WHERE (auth.uid() = user_id)
    OR (connection_id IS NOT NULL AND connection_id IN (
      SELECT id FROM profile_connections
      WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
      AND status = 'active'
    ))
  )
);
```

**UPDATE/DELETE Policy:**
```sql
-- Users can only update/delete items from their own lists
CREATE POLICY "Users can modify items from own lists" ON shopping_items
FOR UPDATE USING (
  shopping_list_id IN (
    SELECT id FROM shopping_lists WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items from own lists" ON shopping_items
FOR DELETE USING (
  shopping_list_id IN (
    SELECT id FROM shopping_lists WHERE user_id = auth.uid()
  )
);
```

#### 1.6 Create RLS Policies for `pantry_items`

**SELECT Policy:**
```sql
DROP POLICY IF EXISTS "Users can view own and merged pantry items" ON pantry_items;

CREATE POLICY "Users can view own and merged pantry items" ON pantry_items
FOR SELECT USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

**UPDATE/DELETE Policy:**
```sql
-- Users can only update/delete their own pantry items
CREATE POLICY "Users can update own pantry items" ON pantry_items
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items" ON pantry_items
FOR DELETE USING (auth.uid() = user_id);
```

#### 1.7 Create RLS Policies for `stores`

**SELECT Policy:**
```sql
DROP POLICY IF EXISTS "Users can view own and shared stores" ON stores;

CREATE POLICY "Users can view own and shared stores" ON stores
FOR SELECT USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);
```

**UPDATE/DELETE Policy:**
```sql
-- Users can update/delete their own stores
CREATE POLICY "Users can update own stores" ON stores
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores" ON stores
FOR DELETE USING (auth.uid() = user_id);
```

#### 1.8 Auto-merge Trigger Function

Create trigger to automatically set `connection_id` when both users enable merged mode:

```sql
CREATE OR REPLACE FUNCTION auto_merge_shopping_data()
RETURNS TRIGGER AS $$
DECLARE
  v_connection_id uuid;
  v_partner_id uuid;
  v_partner_has_merged boolean;
BEGIN
  -- Only process when permission_level is 'merged' for shopping module
  IF NEW.module != 'shopping' OR NEW.permission_level != 'merged' THEN
    RETURN NEW;
  END IF;

  v_connection_id := NEW.connection_id;

  -- Find the partner's user_id
  SELECT
    CASE
      WHEN pc.requester_id = NEW.user_id THEN pc.receiver_id
      ELSE pc.requester_id
    END INTO v_partner_id
  FROM profile_connections pc
  WHERE pc.id = v_connection_id;

  -- Check if partner also has merged permission
  SELECT EXISTS (
    SELECT 1 FROM module_permissions
    WHERE connection_id = v_connection_id
    AND module = 'shopping'
    AND permission_level = 'merged'
    AND user_id = v_partner_id
  ) INTO v_partner_has_merged;

  -- If both users have merged permission, update all personal data to be shared
  IF v_partner_has_merged THEN
    -- Update shopping lists
    UPDATE shopping_lists
    SET connection_id = v_connection_id
    WHERE user_id IN (NEW.user_id, v_partner_id)
    AND connection_id IS NULL;

    -- Update pantry items
    UPDATE pantry_items
    SET connection_id = v_connection_id
    WHERE user_id IN (NEW.user_id, v_partner_id)
    AND connection_id IS NULL;

    -- Update stores
    UPDATE stores
    SET connection_id = v_connection_id
    WHERE user_id IN (NEW.user_id, v_partner_id)
    AND connection_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_merge_shopping ON module_permissions;
CREATE TRIGGER trigger_auto_merge_shopping
  AFTER INSERT OR UPDATE ON module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_merge_shopping_data();
```

---

## Phase 2: Type Definitions

### 2.1 Update `src/services/types.ts`

Add `connection_id` to `ShoppingListData`:
```typescript
export interface ShoppingListData {
  id?: string;
  user_id: string;
  connection_id?: string | null;  // ADD THIS
  name: string;
  status?: 'active' | 'archived' | 'completed';
  // ... rest of fields
}
```

Add `connection_id` to `PantryItemData` (already has `user_id`):
```typescript
export interface PantryItemData {
  id?: string;
  user_id?: string | null;
  connection_id?: string | null;  // ADD THIS
  name: string;
  // ... rest of fields
}
```

Add `connection_id` to `StoreData`:
```typescript
export interface StoreData {
  id?: string;
  user_id: string;
  connection_id?: string | null;  // ADD THIS
  name: string;
  // ... rest of fields
}
```

### 2.2 Update `src/schemas/mealPlanning.ts`

Update `PantryItemDataSchema`:
```typescript
export const PantryItemDataSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional().nullable(),
  connection_id: uuid.optional().nullable(),  // ADD THIS
  name: z.string().min(1, 'Item name is required'),
  // ... rest of fields
});
```

### 2.3 Create Owner Information Types

Add to `src/shopping/types.ts`:
```typescript
export interface ShoppingItemWithOwner extends ShoppingItem {
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}

export interface PantryItemWithOwner {
  id: string;
  name: string;
  quantity: number;
  // ... all pantry fields
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}
```

---

## Phase 3: API Layer Updates

### 3.1 Update `src/api/shoppingAPI.ts`

**Update `getShoppingLists()` to fetch merged data:**
```typescript
export async function getShoppingLists(): Promise<ShoppingListData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        // RLS policy handles filtering - no need for .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ShoppingListData[];
    },
    { domain: 'ShoppingAPI', operation: 'getShoppingLists' }
  );
}
```

**Update `createShoppingList()` to set connection_id:**
```typescript
export async function createShoppingList(
  list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>
): Promise<ShoppingListData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Get connection_id if user has merged permission
      const { data: permissions } = await supabase
        .from('module_permissions')
        .select('connection_id')
        .eq('user_id', user.id)
        .eq('module', 'shopping')
        .eq('permission_level', 'merged')
        .single();

      const result = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          connection_id: permissions?.connection_id ?? null,
          ...list,
          status: list.status ?? 'active',
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping List');
      return data as ShoppingListData;
    },
    { domain: 'ShoppingAPI', operation: 'createShoppingList', data: { name: list.name } }
  );
}
```

**Update `getShoppingListItems()` - Remove ownership verification:**
```typescript
export async function getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
  return apiCall(
    async () => {
      await requireAuth();

      // RLS policy on shopping_lists ensures we can only access lists we have permission to view
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('shopping_list_id', listId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ShoppingItemData[];
    },
    { domain: 'ShoppingAPI', operation: 'getShoppingListItems', data: { listId } }
  );
}
```

**Update `updateShoppingItem()` - Keep ownership check:**
```typescript
export async function updateShoppingItem(
  itemId: string,
  updates: Partial<ShoppingItemData>
): Promise<ShoppingItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify the item belongs to a list owned by the current user
      const { data: item, error: itemError } = await supabase
        .from('shopping_items')
        .select('shopping_list_id')
        .eq('id', itemId)
        .single();

      if (itemError || !item?.shopping_list_id) {
        throw new Error('Shopping item not found');
      }

      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('id, user_id')
        .eq('id', item.shopping_list_id)
        .single();

      if (listError || !list) {
        throw new Error('Shopping list not found');
      }

      // Only allow editing items from own lists
      if (list.user_id !== user.id) {
        throw new Error('Cannot edit items from partner\'s list');
      }

      const result = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping Item', itemId);
      return data as ShoppingItemData;
    },
    { domain: 'ShoppingAPI', operation: 'updateShoppingItem', data: { itemId } }
  );
}
```

### 3.2 Update `src/api/storesAPI.ts`

**Update `getStores()` to fetch merged data:**
```typescript
export async function getStores(): Promise<StoreData[]> {
  return apiCall(
    async () => {
      await requireAuth();

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        // RLS policy handles filtering
        .order('favorite', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as StoreData[];
    },
    { domain: 'StoresAPI', operation: 'getStores' }
  );
}
```

**Update `createStore()` to set connection_id:**
```typescript
export async function createStore(
  store: Omit<StoreData, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<StoreData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Get connection_id if user has merged permission
      const { data: permissions } = await supabase
        .from('module_permissions')
        .select('connection_id')
        .eq('user_id', user.id)
        .eq('module', 'shopping')
        .eq('permission_level', 'merged')
        .single();

      const result = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          connection_id: permissions?.connection_id ?? null,
          ...store
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Store');
      return data as StoreData;
    },
    { domain: 'StoresAPI', operation: 'createStore', data: { name: store.name } }
  );
}
```

### 3.3 Update Pantry API (in meal planning API)

**Update `createPantryItem()` to set connection_id:**
```typescript
// In src/api/mealPlanningAPI.ts or wherever pantry items are created
export async function createPantryItem(
  item: Omit<PantryItemData, 'id' | 'created_at' | 'updated_at'>
): Promise<PantryItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Get connection_id if user has merged permission
      const { data: permissions } = await supabase
        .from('module_permissions')
        .select('connection_id')
        .eq('user_id', user.id)
        .eq('module', 'shopping')
        .eq('permission_level', 'merged')
        .single();

      const result = await supabase
        .from('pantry_items')
        .insert({
          user_id: user.id,
          connection_id: permissions?.connection_id ?? null,
          ...item,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Pantry Item');
      return data as PantryItemData;
    },
    { domain: 'MealPlanningAPI', operation: 'createPantryItem' }
  );
}
```

---

## Phase 4: React Query Hooks

### 4.1 Add Helper Function for Owner Information

Create `src/shopping/utils/ownerUtils.ts`:
```typescript
import { supabase } from '@/lib/supabase';

export interface OwnerInfo {
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}

export async function getOwnerInfo(userId: string): Promise<OwnerInfo> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const isOwnedByCurrentUser = userId === user.id;

  if (isOwnedByCurrentUser) {
    return {
      ownerId: userId,
      ownerName: 'Me',
      isOwnedByCurrentUser: true,
    };
  }

  // Get partner's name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  return {
    ownerId: userId,
    ownerName: profile?.full_name || profile?.email || 'Partner',
    isOwnedByCurrentUser: false,
  };
}

export function addOwnerInfo<T extends { user_id: string }>(
  items: T[],
  currentUserId: string,
  partnerName: string = 'Partner'
): (T & OwnerInfo)[] {
  return items.map(item => ({
    ...item,
    ownerId: item.user_id,
    ownerName: item.user_id === currentUserId ? 'Me' : partnerName,
    isOwnedByCurrentUser: item.user_id === currentUserId,
  }));
}
```

### 4.2 Update Shopping Hooks

No major changes needed to `src/hooks/useShoppingQuery.ts` - the hooks will automatically fetch merged data through the updated API functions. The RLS policies handle the filtering.

### 4.3 Update Pantry Hooks

Add owner information to pantry items in `src/hooks/useMealPlanningQuery.ts`:

```typescript
export function usePantryItemsQuery() {
  return useQuery({
    queryKey: ['pantry-items'],
    queryFn: async () => {
      const items = await getPantryItems(); // This will now return merged data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get partner name if exists
      const { data: connections } = await supabase
        .from('profile_connections')
        .select('requester_id, receiver_id, requester_user:profiles!profile_connections_requester_id_fkey(full_name), receiver_user:profiles!profile_connections_receiver_id_fkey(full_name)')
        .eq('status', 'active')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .single();

      let partnerName = 'Partner';
      if (connections) {
        const isRequester = connections.requester_id === user.id;
        const partnerProfile = isRequester ? connections.receiver_user : connections.requester_user;
        partnerName = Array.isArray(partnerProfile) ? partnerProfile[0]?.full_name : partnerProfile?.full_name || 'Partner';
      }

      return addOwnerInfo(items, user.id, partnerName);
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## Phase 5: UI Components

### 5.1 Update `ShoppingHeader` Component

Add combined metrics showing both partners' data:

```typescript
// In src/shopping/components/ShoppingHeader.tsx
const totalItems = shoppingItems.length;
const purchasedItems = shoppingItems.filter(item => item.purchased).length;
const myItems = shoppingItems.filter(item => item.isOwnedByCurrentUser).length;
const partnerItems = totalItems - myItems;

// Display:
// Total: 24 items (You: 15, Partner: 9)
// Purchased: 8 / 24
```

### 5.2 Update `MasterListView` Component

Add owner badges to each item:

```typescript
// In src/shopping/components/views/MasterListView.tsx
{shoppingItems.map(item => (
  <div key={item.id} className="shopping-item">
    <div className="item-header">
      <span className="item-name">{item.name}</span>
      <span className={`owner-badge ${item.isOwnedByCurrentUser ? 'own' : 'partner'}`}>
        [{item.ownerName}]
      </span>
    </div>

    {/* Only show edit/delete for own items */}
    {item.isOwnedByCurrentUser && (
      <div className="item-actions">
        <button onClick={() => handleEdit(item)}>Edit</button>
        <button onClick={() => handleDelete(item.id)}>Delete</button>
      </div>
    )}
  </div>
))}
```

### 5.3 Update `DistributeView` Component

Show owner badges in distributed items:

```typescript
// In src/shopping/components/views/DistributeView.tsx
{distributedItems.map(({ store, items }) => (
  <div key={store.id} className="store-section">
    <h3>{store.name}</h3>
    {items.map(item => (
      <div key={item.id} className="distributed-item">
        <span>{item.name}</span>
        <span className="owner-badge">[{item.ownerName}]</span>
      </div>
    ))}
  </div>
))}
```

### 5.4 Update `StoreListsView` Component

Show owner badges in store-specific lists:

```typescript
// Similar pattern - add owner badges to each item
<span className="owner-badge">[{item.ownerName}]</span>
```

### 5.5 Update `PantryView` Component

Add owner badges and conditional editing:

```typescript
// In src/shopping/components/views/PantryView.tsx
{pantryItems.map(item => (
  <div key={item.id} className="pantry-item">
    <div className="item-info">
      <span className="item-name">{item.name}</span>
      <span className={`owner-badge ${item.isOwnedByCurrentUser ? 'own' : 'partner'}`}>
        [{item.ownerName}]
      </span>
    </div>

    {item.isOwnedByCurrentUser && (
      <div className="item-actions">
        <button onClick={() => handleEdit(item)}>Edit</button>
        <button onClick={() => handleDelete(item.id)}>Delete</button>
      </div>
    )}
  </div>
))}
```

### 5.6 Add Owner Badge Styles

Create `src/shopping/components/styles/ownerBadge.css`:

```css
.owner-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 8px;
}

.owner-badge.own {
  background-color: #e3f2fd;
  color: #1976d2;
}

.owner-badge.partner {
  background-color: #f3e5f5;
  color: #7b1fa2;
}
```

---

## Phase 6: Business Logic Updates

### 6.1 Update Distribution Algorithm

Update `src/shopping/utils/storeUtils.ts` to consider all items (both partners):

```typescript
export function smartRecommendStores(
  items: ShoppingItemWithOwner[],
  stores: Store[],
  strategy: 'price' | 'quality' | 'convenience' | 'mixed' = 'mixed'
): DistributedItems[] {
  // Algorithm already works with all items - no changes needed
  // Just ensure it receives the full merged list
  // ...existing logic
}
```

### 6.2 Update Route Optimization

Ensure route optimization considers all household items:

```typescript
// In route optimization logic
const allItems = shoppingItems; // Already includes both partners' items
const optimizedRoute = calculateOptimalRoute(allItems, stores, userLocation);
```

### 6.3 Update Low Stock Alerts

Update pantry low stock alerts to show combined household inventory:

```typescript
// In src/shopping/utils/pantryUtils.ts
export function getLowStockItems(pantryItems: PantryItemWithOwner[]): PantryItemWithOwner[] {
  return pantryItems.filter(item =>
    item.isLowStock ||
    (item.lowStockThreshold && item.quantity <= item.lowStockThreshold)
  );
}
```

---

## Phase 7: Testing & Validation

### 7.1 Database Testing

```sql
-- Test RLS policies
-- As User 1: Should see own + partner's lists
SELECT * FROM shopping_lists;

-- As User 1: Should see items from both lists
SELECT * FROM shopping_items;

-- As User 1: Should NOT be able to update partner's list
UPDATE shopping_lists SET name = 'Test' WHERE user_id = '<partner_id>';
-- Expected: Permission denied

-- As User 1: Should be able to view partner's pantry items
SELECT * FROM pantry_items;

-- As User 1: Should NOT be able to delete partner's pantry items
DELETE FROM pantry_items WHERE user_id = '<partner_id>';
-- Expected: Permission denied
```

### 7.2 API Testing

Test each API function:
- ✅ `getShoppingLists()` returns both users' lists
- ✅ `createShoppingList()` sets correct `connection_id`
- ✅ `getShoppingListItems()` returns items from accessible lists
- ✅ `updateShoppingItem()` only allows editing own items
- ✅ `deleteShoppingItem()` only allows deleting own items
- ✅ `getStores()` returns shared stores
- ✅ `getPantryItems()` returns merged pantry

### 7.3 UI Testing

- ✅ Owner badges display correctly (`[Me]` vs `[Partner Name]`)
- ✅ Edit/Delete buttons only show for own items
- ✅ Combined metrics show correct totals
- ✅ Distribution algorithm considers all items
- ✅ Pantry low stock alerts show household inventory

### 7.4 Permission Testing

- ✅ Test with merged permission enabled
- ✅ Test with merged permission disabled
- ✅ Test switching between permission levels
- ✅ Test with one user having merged, other not

---

## Implementation Checklist

### Phase 1: Database ✅
- [ ] Create migration file `20260131_shopping_merge_support.sql`
- [ ] Add `connection_id` to `shopping_lists`
- [ ] Add `connection_id` to `pantry_items`
- [ ] Add `connection_id` to `stores`
- [ ] Create RLS policies for `shopping_lists`
- [ ] Create RLS policies for `shopping_items`
- [ ] Create RLS policies for `pantry_items`
- [ ] Create RLS policies for `stores`
- [ ] Create auto-merge trigger function
- [ ] Test migration locally
- [ ] Run migration on production

### Phase 2: Types ✅
- [ ] Update `ShoppingListData` interface
- [ ] Update `PantryItemData` interface
- [ ] Update `StoreData` interface
- [ ] Update `PantryItemDataSchema`
- [ ] Create `ShoppingItemWithOwner` type
- [ ] Create `PantryItemWithOwner` type

### Phase 3: API ✅
- [ ] Update `getShoppingLists()`
- [ ] Update `createShoppingList()`
- [ ] Update `getShoppingListItems()`
- [ ] Update `updateShoppingItem()`
- [ ] Update `deleteShoppingItem()`
- [ ] Update `getStores()`
- [ ] Update `createStore()`
- [ ] Update `createPantryItem()`
- [ ] Update `updatePantryItem()`
- [ ] Update `deletePantryItem()`

### Phase 4: Hooks ✅
- [ ] Create `ownerUtils.ts` helper
- [ ] Update `usePantryItemsQuery()`
- [ ] Test hooks with merged data

### Phase 5: UI ✅
- [ ] Update `ShoppingHeader` with combined metrics
- [ ] Update `MasterListView` with owner badges
- [ ] Update `DistributeView` with owner badges
- [ ] Update `StoreListsView` with owner badges
- [ ] Update `PantryView` with owner badges
- [ ] Add conditional edit/delete buttons
- [ ] Create owner badge styles
- [ ] Test UI with sample data

### Phase 6: Business Logic ✅
- [ ] Verify distribution algorithm works with merged data
- [ ] Verify route optimization works with merged data
- [ ] Update low stock alerts for household inventory

### Phase 7: Testing ✅
- [ ] Test RLS policies
- [ ] Test API functions
- [ ] Test UI components
- [ ] Test permission scenarios
- [ ] Test with real user data
- [ ] Fix any bugs found

---

## Rollout Plan

1. **Development**: Implement all phases on `feature/shopping-integration` branch
2. **Testing**: Thorough testing with test users
3. **Staging**: Deploy to staging environment
4. **Production**: Deploy migration and code to production
5. **Monitoring**: Monitor for errors and user feedback

---

## Notes

- Follow the same pattern as finance merge implementation
- RLS policies handle data filtering automatically
- Owner badges use `[Me]` for current user, partner name for others
- Edit/Delete only allowed for own items
- All new items automatically get `connection_id` when in merged mode
- Stores are shared across household (both can edit)


