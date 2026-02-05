-- =====================================================
-- STEP 2: Create RLS Policies for Finance Merged Mode
-- =====================================================
-- Description: Allows users to create accounts and transactions for
--              their partner when finance module is in merged mode.
--              This enables proper household finance management.
-- Author: Claude Code (Bug Fix)
-- Date: 2026-02-04
-- =====================================================

-- =====================================================
-- FINANCE_ACCOUNTS Table
-- =====================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "finance_accounts_insert_policy" ON finance_accounts;

-- Create new INSERT policy that allows inserting with partner's user_id in merged mode
CREATE POLICY "finance_accounts_insert_policy" ON finance_accounts
  FOR INSERT
  WITH CHECK (
    -- Can insert with own user_id
    user_id = auth.uid()
    OR
    -- Can insert with partner's user_id if merged mode enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Match connection where partner is the user_id
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = finance_accounts.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = finance_accounts.user_id)
        )
        -- Check module and permission level
        AND mp.module = 'finance'
        AND mp.permission_level = 'merged'
        -- Permission must be set by current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- =====================================================
-- FINANCE_TRANSACTIONS Table
-- =====================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "finance_transactions_insert_policy" ON finance_transactions;

-- Create new INSERT policy that allows inserting with partner's user_id in merged mode
CREATE POLICY "finance_transactions_insert_policy" ON finance_transactions
  FOR INSERT
  WITH CHECK (
    -- Can insert with own user_id
    user_id = auth.uid()
    OR
    -- Can insert with partner's user_id if merged mode enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Match connection where partner is the user_id
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = finance_transactions.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = finance_transactions.user_id)
        )
        -- Check module and permission level
        AND mp.module = 'finance'
        AND mp.permission_level = 'merged'
        -- Permission must be set by current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- =====================================================
-- FINANCE_BUDGETS Table
-- =====================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "finance_budgets_insert_policy" ON finance_budgets;

-- Create new INSERT policy that allows inserting with partner's user_id in merged mode
CREATE POLICY "finance_budgets_insert_policy" ON finance_budgets
  FOR INSERT
  WITH CHECK (
    -- Can insert with own user_id
    user_id = auth.uid()
    OR
    -- Can insert with partner's user_id if merged mode enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Match connection where partner is the user_id
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = finance_budgets.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = finance_budgets.user_id)
        )
        -- Check module and permission level
        AND mp.module = 'finance'
        AND mp.permission_level = 'merged'
        -- Permission must be set by current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- =====================================================
-- FINANCE_GOALS Table
-- =====================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "finance_goals_insert_policy" ON finance_goals;

-- Create new INSERT policy that allows inserting with partner's user_id in merged mode
CREATE POLICY "finance_goals_insert_policy" ON finance_goals
  FOR INSERT
  WITH CHECK (
    -- Can insert with own user_id
    user_id = auth.uid()
    OR
    -- Can insert with partner's user_id if merged mode enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Match connection where partner is the user_id
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = finance_goals.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = finance_goals.user_id)
        )
        -- Check module and permission level
        AND mp.module = 'finance'
        AND mp.permission_level = 'merged'
        -- Permission must be set by current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- =====================================================
-- Add helpful comments for documentation
-- =====================================================
COMMENT ON POLICY "finance_accounts_insert_policy" ON finance_accounts IS
  'Merged Mode: Allows creating accounts for partner when merged permission is enabled for finance module';

COMMENT ON POLICY "finance_transactions_insert_policy" ON finance_transactions IS
  'Merged Mode: Allows creating transactions for partner when merged permission is enabled for finance module';

COMMENT ON POLICY "finance_budgets_insert_policy" ON finance_budgets IS
  'Merged Mode: Allows creating budgets for partner when merged permission is enabled for finance module';

COMMENT ON POLICY "finance_goals_insert_policy" ON finance_goals IS
  'Merged Mode: Allows creating goals for partner when merged permission is enabled for finance module';
