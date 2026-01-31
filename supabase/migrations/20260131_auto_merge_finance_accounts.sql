-- Migration: Auto-merge finance accounts when both users enable merged mode
-- Description: Automatically set connection_id on personal accounts when both users have merged permission
-- Date: 2026-01-31

-- ==================== TRIGGER FUNCTION: Auto-merge accounts ====================

CREATE OR REPLACE FUNCTION auto_merge_finance_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_connection_id uuid;
  v_partner_id uuid;
  v_partner_has_merged boolean;
BEGIN
  -- Only process when permission_level is 'merged' for finances module
  IF NEW.module != 'finances' OR NEW.permission_level != 'merged' THEN
    RETURN NEW;
  END IF;

  -- Get the connection_id
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
    AND module = 'finances'
    AND permission_level = 'merged'
    AND user_id = v_partner_id
  ) INTO v_partner_has_merged;

  -- If both users have merged permission, update all personal accounts to be shared
  IF v_partner_has_merged THEN
    -- Update current user's personal accounts
    UPDATE finance_accounts
    SET connection_id = v_connection_id
    WHERE user_id = NEW.user_id
    AND connection_id IS NULL;

    -- Update partner's personal accounts
    UPDATE finance_accounts
    SET connection_id = v_connection_id
    WHERE user_id = v_partner_id
    AND connection_id IS NULL;

    -- Do the same for transactions
    UPDATE finance_transactions
    SET connection_id = v_connection_id
    WHERE user_id = NEW.user_id
    AND connection_id IS NULL;

    UPDATE finance_transactions
    SET connection_id = v_connection_id
    WHERE user_id = v_partner_id
    AND connection_id IS NULL;

    -- Do the same for goals
    UPDATE finance_goals
    SET connection_id = v_connection_id
    WHERE user_id = NEW.user_id
    AND connection_id IS NULL;

    UPDATE finance_goals
    SET connection_id = v_connection_id
    WHERE user_id = v_partner_id
    AND connection_id IS NULL;

    -- Do the same for loans
    UPDATE finance_loans
    SET connection_id = v_connection_id
    WHERE user_id = NEW.user_id
    AND connection_id IS NULL;

    UPDATE finance_loans
    SET connection_id = v_connection_id
    WHERE user_id = v_partner_id
    AND connection_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER FUNCTION: Auto-unmerge accounts ====================

CREATE OR REPLACE FUNCTION auto_unmerge_finance_accounts()
RETURNS TRIGGER AS $$
DECLARE
  v_connection_id uuid;
  v_partner_id uuid;
BEGIN
  -- Only process when switching AWAY from merged for finances module
  IF OLD.module != 'finances' OR OLD.permission_level != 'merged' THEN
    RETURN NEW;
  END IF;

  -- If still merged, do nothing
  IF NEW.permission_level = 'merged' THEN
    RETURN NEW;
  END IF;

  -- Get the connection_id
  v_connection_id := OLD.connection_id;

  -- Find the partner's user_id
  SELECT 
    CASE 
      WHEN pc.requester_id = OLD.user_id THEN pc.receiver_id
      ELSE pc.requester_id
    END INTO v_partner_id
  FROM profile_connections pc
  WHERE pc.id = v_connection_id;

  -- Unmerge: set connection_id back to NULL for both users' accounts
  UPDATE finance_accounts
  SET connection_id = NULL
  WHERE connection_id = v_connection_id
  AND user_id IN (OLD.user_id, v_partner_id);

  UPDATE finance_transactions
  SET connection_id = NULL
  WHERE connection_id = v_connection_id
  AND user_id IN (OLD.user_id, v_partner_id);

  UPDATE finance_goals
  SET connection_id = NULL
  WHERE connection_id = v_connection_id
  AND user_id IN (OLD.user_id, v_partner_id);

  UPDATE finance_loans
  SET connection_id = NULL
  WHERE connection_id = v_connection_id
  AND user_id IN (OLD.user_id, v_partner_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== CREATE TRIGGERS ====================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_merge_finance_accounts ON module_permissions;
DROP TRIGGER IF EXISTS trigger_auto_unmerge_finance_accounts ON module_permissions;

-- Trigger to auto-merge when permission is set to 'merged'
CREATE TRIGGER trigger_auto_merge_finance_accounts
  AFTER INSERT OR UPDATE ON module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_merge_finance_accounts();

-- Trigger to auto-unmerge when permission is changed from 'merged'
CREATE TRIGGER trigger_auto_unmerge_finance_accounts
  AFTER UPDATE ON module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_unmerge_finance_accounts();

-- ==================== ONE-TIME MIGRATION ====================
-- Update existing accounts for users who already have merged permissions

-- Update finance_accounts
UPDATE finance_accounts fa
SET connection_id = mp.connection_id
FROM module_permissions mp
WHERE fa.user_id = mp.user_id
AND fa.connection_id IS NULL
AND mp.module = 'finances'
AND mp.permission_level = 'merged'
AND EXISTS (
  SELECT 1 FROM module_permissions mp2
  WHERE mp2.connection_id = mp.connection_id
  AND mp2.module = 'finances'
  AND mp2.permission_level = 'merged'
  AND mp2.user_id != mp.user_id
);

-- Update finance_transactions
UPDATE finance_transactions ft
SET connection_id = mp.connection_id
FROM module_permissions mp
WHERE ft.user_id = mp.user_id
AND ft.connection_id IS NULL
AND mp.module = 'finances'
AND mp.permission_level = 'merged'
AND EXISTS (
  SELECT 1 FROM module_permissions mp2
  WHERE mp2.connection_id = mp.connection_id
  AND mp2.module = 'finances'
  AND mp2.permission_level = 'merged'
  AND mp2.user_id != mp.user_id
);

-- Update finance_goals
UPDATE finance_goals fg
SET connection_id = mp.connection_id
FROM module_permissions mp
WHERE fg.user_id = mp.user_id
AND fg.connection_id IS NULL
AND mp.module = 'finances'
AND mp.permission_level = 'merged'
AND EXISTS (
  SELECT 1 FROM module_permissions mp2
  WHERE mp2.connection_id = mp.connection_id
  AND mp2.module = 'finances'
  AND mp2.permission_level = 'merged'
  AND mp2.user_id != mp.user_id
);

-- Update finance_loans
UPDATE finance_loans fl
SET connection_id = mp.connection_id
FROM module_permissions mp
WHERE fl.user_id = mp.user_id
AND fl.connection_id IS NULL
AND mp.module = 'finances'
AND mp.permission_level = 'merged'
AND EXISTS (
  SELECT 1 FROM module_permissions mp2
  WHERE mp2.connection_id = mp.connection_id
  AND mp2.module = 'finances'
  AND mp2.permission_level = 'merged'
  AND mp2.user_id != mp.user_id
);

-- ==================== SIMPLIFIED RLS POLICIES ====================

-- finance_accounts: Simplified policy (no more complex Part 3)
DROP POLICY IF EXISTS "Users can view own accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can view own and merged accounts" ON finance_accounts;

CREATE POLICY "Users can view own and merged accounts" ON finance_accounts
FOR SELECT USING (
  -- Own accounts
  (auth.uid() = user_id)
  OR
  -- Shared accounts (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- finance_transactions: Simplified policy
DROP POLICY IF EXISTS "Users can view own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can view own and merged transactions" ON finance_transactions;

CREATE POLICY "Users can view own and merged transactions" ON finance_transactions
FOR SELECT USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- finance_goals: Simplified policy
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
);

-- finance_loans: Simplified policy
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
);

-- ==================== VERIFICATION ====================

-- Test query - Check that accounts now have connection_id set:
-- SELECT id, name, user_id, connection_id FROM finance_accounts ORDER BY user_id;

