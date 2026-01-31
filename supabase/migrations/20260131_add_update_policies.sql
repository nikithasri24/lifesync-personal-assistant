-- Add UPDATE policies for finance tables to allow editing in merged mode
-- This allows users to edit their own accounts AND shared accounts in merged mode

-- ==================== finance_accounts UPDATE policy ====================
DROP POLICY IF EXISTS "Users can update own and merged accounts" ON finance_accounts;

CREATE POLICY "Users can update own and merged accounts" ON finance_accounts
FOR UPDATE USING (
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

-- ==================== finance_transactions UPDATE policy ====================
DROP POLICY IF EXISTS "Users can update own and merged transactions" ON finance_transactions;

CREATE POLICY "Users can update own and merged transactions" ON finance_transactions
FOR UPDATE USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- ==================== finance_goals UPDATE policy ====================
DROP POLICY IF EXISTS "Users can update own and merged goals" ON finance_goals;

CREATE POLICY "Users can update own and merged goals" ON finance_goals
FOR UPDATE USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- ==================== finance_loans UPDATE policy ====================
DROP POLICY IF EXISTS "Users can update own and merged loans" ON finance_loans;

CREATE POLICY "Users can update own and merged loans" ON finance_loans
FOR UPDATE USING (
  (auth.uid() = user_id)
  OR
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

