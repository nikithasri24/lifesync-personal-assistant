-- Add merged mode support for shopping
-- Allows users to view and share shopping data with partner when both have enabled merged mode

-- =====================================================
-- ADD SHOPPING TO SHAREABLE_MODULE ENUM
-- =====================================================

ALTER TYPE shareable_module ADD VALUE IF NOT EXISTS 'shopping';

-- =====================================================
-- STORES TABLE - Add connection_id column and RLS policies
-- =====================================================

-- Add connection_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN connection_id uuid REFERENCES profile_connections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
DROP POLICY IF EXISTS "stores_select_policy" ON stores;

-- CREATE new SELECT policy with merged mode support
CREATE POLICY "merged_access_stores" ON stores
  FOR SELECT
  USING (
    -- User can always see their own stores
    user_id = auth.uid()
    OR
    -- User can see partner's stores if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = stores.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = stores.user_id)
        )
        -- Module must be set to merged
        AND mp.module = 'shopping'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- INSERT policy: users can only create their own stores
DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
CREATE POLICY "stores_insert_policy" ON stores
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own stores
DROP POLICY IF EXISTS "Users can update own stores" ON stores;
CREATE POLICY "stores_update_policy" ON stores
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own stores
DROP POLICY IF EXISTS "Users can delete own stores" ON stores;
CREATE POLICY "stores_delete_policy" ON stores
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON POLICY "merged_access_stores" ON stores IS
  'Allows viewing own stores and partners stores when merged mode is mutually enabled';

-- =====================================================
-- SHOPPING_LISTS TABLE - Add connection_id column and RLS policies
-- =====================================================

-- Add connection_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopping_lists' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE shopping_lists ADD COLUMN connection_id uuid REFERENCES profile_connections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own shopping lists" ON shopping_lists;
DROP POLICY IF EXISTS "shopping_lists_select_policy" ON shopping_lists;

-- CREATE new SELECT policy with merged mode support
CREATE POLICY "merged_access_shopping_lists" ON shopping_lists
  FOR SELECT
  USING (
    -- User can always see their own lists
    user_id = auth.uid()
    OR
    -- User can see partner's lists if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = shopping_lists.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = shopping_lists.user_id)
        )
        -- Module must be set to merged
        AND mp.module = 'shopping'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- INSERT policy
DROP POLICY IF EXISTS "Users can insert own shopping lists" ON shopping_lists;
CREATE POLICY "shopping_lists_insert_policy" ON shopping_lists
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own lists
DROP POLICY IF EXISTS "Users can update own shopping lists" ON shopping_lists;
CREATE POLICY "shopping_lists_update_policy" ON shopping_lists
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own lists
DROP POLICY IF EXISTS "Users can delete own shopping lists" ON shopping_lists;
CREATE POLICY "shopping_lists_delete_policy" ON shopping_lists
  FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON POLICY "merged_access_shopping_lists" ON shopping_lists IS
  'Allows viewing own lists and partners lists when merged mode is mutually enabled';

-- =====================================================
-- SHOPPING_ITEMS TABLE - Add connection_id column and RLS policies
-- =====================================================

-- Add connection_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopping_items' AND column_name = 'connection_id'
  ) THEN
    ALTER TABLE shopping_items ADD COLUMN connection_id uuid REFERENCES profile_connections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view shopping items" ON shopping_items;
DROP POLICY IF EXISTS "shopping_items_select_policy" ON shopping_items;

-- SELECT policy: users can see items for lists they have access to
CREATE POLICY "merged_access_shopping_items" ON shopping_items
  FOR SELECT
  USING (
    -- User can see items for any list they have access to (via shopping_lists RLS)
    EXISTS (
      SELECT 1
      FROM shopping_lists sl
      WHERE sl.id = shopping_items.shopping_list_id
      -- This will use the shopping_lists table RLS policy
    )
  );

-- INSERT policy
DROP POLICY IF EXISTS "Users can insert shopping items" ON shopping_items;
CREATE POLICY "shopping_items_insert_policy" ON shopping_items
  FOR INSERT
  WITH CHECK (
    -- User can insert items for lists they have access to
    EXISTS (
      SELECT 1
      FROM shopping_lists sl
      WHERE sl.id = shopping_list_id
      AND sl.user_id = auth.uid()
    )
  );

-- UPDATE policy: users can update items in lists they own
DROP POLICY IF EXISTS "Users can update shopping items" ON shopping_items;
CREATE POLICY "shopping_items_update_policy" ON shopping_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM shopping_lists sl
      WHERE sl.id = shopping_list_id
      AND sl.user_id = auth.uid()
    )
  );

-- DELETE policy
DROP POLICY IF EXISTS "Users can delete shopping items" ON shopping_items;
CREATE POLICY "shopping_items_delete_policy" ON shopping_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM shopping_lists sl
      WHERE sl.id = shopping_list_id
      AND sl.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "merged_access_shopping_items" ON shopping_items IS
  'Allows managing shopping items for any list the user can access (including partners lists in merged mode)';

-- =====================================================
-- PANTRY_ITEMS TABLE - RLS policies (if table exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pantry_items') THEN

    -- Add connection_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pantry_items' AND column_name = 'connection_id'
    ) THEN
      ALTER TABLE pantry_items ADD COLUMN connection_id uuid REFERENCES profile_connections(id) ON DELETE SET NULL;
    END IF;

    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own pantry items" ON pantry_items';
    EXECUTE 'DROP POLICY IF EXISTS "pantry_items_select_policy" ON pantry_items';

    -- SELECT policy with merged mode
    EXECUTE 'CREATE POLICY "merged_access_pantry_items" ON pantry_items
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1
          FROM profile_connections pc
          JOIN module_permissions mp ON mp.connection_id = pc.id
          WHERE
            (
              (pc.requester_id = auth.uid() AND pc.receiver_id = pantry_items.user_id) OR
              (pc.receiver_id = auth.uid() AND pc.requester_id = pantry_items.user_id)
            )
            AND mp.module = ''shopping''
            AND mp.permission_level = ''merged''
            AND mp.user_id = auth.uid()
            AND pc.status = ''active''
        )
      )';

    -- INSERT policy
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own pantry items" ON pantry_items';
    EXECUTE 'CREATE POLICY "pantry_items_insert_policy" ON pantry_items
      FOR INSERT
      WITH CHECK (user_id = auth.uid())';

    -- UPDATE policy
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own pantry items" ON pantry_items';
    EXECUTE 'CREATE POLICY "pantry_items_update_policy" ON pantry_items
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid())';

    -- DELETE policy
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own pantry items" ON pantry_items';
    EXECUTE 'CREATE POLICY "pantry_items_delete_policy" ON pantry_items
      FOR DELETE
      USING (user_id = auth.uid())';

    EXECUTE 'COMMENT ON POLICY "merged_access_pantry_items" ON pantry_items IS
      ''Allows viewing own pantry items and partners items when merged mode is mutually enabled''';
  END IF;
END $$;
