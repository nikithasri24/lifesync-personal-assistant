-- Migration: Fix Finance Merge RLS Policies
-- Description: Ensure RLS policies correctly allow viewing partner's personal data in merged mode
-- Date: 2026-01-31

-- ==================== FIX finance_accounts RLS Policy ====================

DROP POLICY IF EXISTS "Users can view own accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can view own and merged accounts" ON finance_accounts;

CREATE POLICY "Users can view own and merged accounts" ON finance_accounts
FOR SELECT USING (
  -- Part 1: Own accounts (personal or shared)
  (auth.uid() = user_id)
  OR
  -- Part 2: Shared accounts (connection_id is set)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Part 3: Partner's personal accounts in merged mode
  (connection_id IS NULL AND user_id IN (
    SELECT
      CASE
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id
      AND mp1.module = 'finances'
      AND mp1.user_id = auth.uid()
      AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id
      AND mp2.module = 'finances'
      AND mp2.user_id = (
        CASE
          WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
          ELSE pc.requester_id
        END
      )
      AND mp2.permission_level = 'merged'
    )
  ))
);

-- ==================== FIX finance_transactions RLS Policy ====================

DROP POLICY IF EXISTS "Users can view own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can view own and merged transactions" ON finance_transactions;

CREATE POLICY "Users can view own and merged transactions" ON finance_transactions
FOR SELECT USING (
  -- Part 1: Own transactions
  (auth.uid() = user_id)
  OR
  -- Part 2: Shared transactions
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Part 3: Partner's personal transactions in merged mode
  (connection_id IS NULL AND user_id IN (
    SELECT
      CASE
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id
      AND mp1.module = 'finances'
      AND mp1.user_id = auth.uid()
      AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id
      AND mp2.module = 'finances'
      AND mp2.user_id = (
        CASE
          WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
          ELSE pc.requester_id
        END
      )
      AND mp2.permission_level = 'merged'
    )
  ))
);

-- ==================== FIX finance_goals RLS Policy ====================

DROP POLICY IF EXISTS "Users can view own goals" ON finance_goals;
DROP POLICY IF EXISTS "Users can view own and merged goals" ON finance_goals;

CREATE POLICY "Users can view own and merged goals" ON finance_goals
FOR SELECT USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  (connection_id IS NULL AND user_id IN (
    SELECT
      CASE
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id AND mp1.module = 'finances'
      AND mp1.user_id = auth.uid() AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id AND mp2.module = 'finances'
      AND mp2.user_id = (CASE WHEN pc.requester_id = auth.uid() THEN pc.receiver_id ELSE pc.requester_id END)
      AND mp2.permission_level = 'merged'
    )
  ))
);

-- ==================== FIX finance_loans RLS Policy ====================

DROP POLICY IF EXISTS "Users can view own loans" ON finance_loans;
DROP POLICY IF EXISTS "Users can view own and merged loans" ON finance_loans;

CREATE POLICY "Users can view own and merged loans" ON finance_loans
FOR SELECT USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  (connection_id IS NULL AND user_id IN (
    SELECT
      CASE
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id AND mp1.module = 'finances'
      AND mp1.user_id = auth.uid() AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id AND mp2.module = 'finances'
      AND mp2.user_id = (CASE WHEN pc.requester_id = auth.uid() THEN pc.receiver_id ELSE pc.requester_id END)
      AND mp2.permission_level = 'merged'
    )
  ))
);

-- ==================== VERIFICATION ====================

-- Test query - Run this as either user to verify merged mode works:
-- SELECT id, name, user_id, connection_id FROM finance_accounts ORDER BY user_id;
