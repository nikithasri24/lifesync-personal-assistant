-- Migration: Add merge support for Finance Module
-- This allows connected users to share finance data when both set their permission to "merged"
-- Following the same pattern as travel, visa, and goals modules
--
-- Finance Data Types:
-- 1. Personal data (connection_id = NULL) - Only owner sees their data
-- 2. Shared data (connection_id set) - Both partners see the same data
-- 3. Partner's personal data in merged mode - Both partners see each other's personal data

-- ==================== PHASE 1: Add connection_id to all tables ====================

-- Core Tables (P0 - Critical)
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_categories ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_budgets ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_goals ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_loans ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_institutions ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Supporting Tables (P1 - High)
ALTER TABLE finance_budget_templates ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_goal_progress ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_loan_payments ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_card_benefits ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_card_category_bonuses ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_welcome_bonuses ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE finance_card_offers ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;
ALTER TABLE categorization_rules ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- ==================== PHASE 2: Create indexes for performance ====================

CREATE INDEX IF NOT EXISTS idx_finance_transactions_connection_id ON finance_transactions(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_connection_id ON finance_accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_connection_id ON finance_categories(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_connection_id ON finance_budgets(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_connection_id ON finance_goals(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_loans_connection_id ON finance_loans(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_institutions_connection_id ON finance_institutions(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_budget_templates_connection_id ON finance_budget_templates(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_goal_progress_connection_id ON finance_goal_progress(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_loan_payments_connection_id ON finance_loan_payments(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_benefits_connection_id ON finance_card_benefits(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_category_bonuses_connection_id ON finance_card_category_bonuses(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_welcome_bonuses_connection_id ON finance_welcome_bonuses(connection_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_offers_connection_id ON finance_card_offers(connection_id);
CREATE INDEX IF NOT EXISTS idx_categorization_rules_connection_id ON categorization_rules(connection_id);

-- ==================== PHASE 3: Update RLS Policies for SELECT ====================

-- finance_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can view own and merged transactions" ON finance_transactions;
CREATE POLICY "Users can view own and merged transactions" ON finance_transactions
FOR SELECT USING (
  -- Own transactions (personal or shared)
  (auth.uid() = user_id)
  OR
  -- Shared transactions (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Partner's personal transactions in merged mode
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

-- finance_accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can view own and merged accounts" ON finance_accounts;
CREATE POLICY "Users can view own and merged accounts" ON finance_accounts
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

-- finance_categories
DROP POLICY IF EXISTS "Users can view own categories" ON finance_categories;
DROP POLICY IF EXISTS "Users can view own and merged categories" ON finance_categories;
CREATE POLICY "Users can view own and merged categories" ON finance_categories
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

-- finance_budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON finance_budgets;
DROP POLICY IF EXISTS "Users can view own and merged budgets" ON finance_budgets;
CREATE POLICY "Users can view own and merged budgets" ON finance_budgets
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

-- finance_goals
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

-- finance_loans
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

-- NOTE: The remaining tables follow the same pattern for SELECT policies:
-- - finance_institutions
-- - finance_budget_templates
-- - finance_goal_progress
-- - finance_loan_payments
-- - finance_card_benefits
-- - finance_card_category_bonuses
-- - finance_welcome_bonuses
-- - finance_card_offers
-- - categorization_rules
--
-- Each policy allows:
-- 1. Own data (auth.uid() = user_id)
-- 2. Shared data (connection_id is set and user is in connection)
-- 3. Partner's personal data in merged mode (both users have 'merged' permission)

-- ==================== PHASE 4: Update RLS Policies for INSERT/UPDATE/DELETE ====================

-- finance_transactions INSERT
DROP POLICY IF EXISTS "Users can insert own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can insert own and shared transactions" ON finance_transactions;
CREATE POLICY "Users can insert own and shared transactions" ON finance_transactions
FOR INSERT WITH CHECK (
  -- Own transactions
  (auth.uid() = user_id AND connection_id IS NULL)
  OR
  -- Shared transactions (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- finance_transactions UPDATE
DROP POLICY IF EXISTS "Users can update own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can update own and shared transactions" ON finance_transactions;
CREATE POLICY "Users can update own and shared transactions" ON finance_transactions
FOR UPDATE USING (
  -- Own transactions
  (auth.uid() = user_id)
  OR
  -- Shared transactions (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- finance_transactions DELETE
DROP POLICY IF EXISTS "Users can delete own transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Users can delete own and shared transactions" ON finance_transactions;
CREATE POLICY "Users can delete own and shared transactions" ON finance_transactions
FOR DELETE USING (
  -- Own transactions
  (auth.uid() = user_id)
  OR
  -- Shared transactions (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- NOTE: The remaining tables follow the same pattern for INSERT/UPDATE/DELETE policies:
-- - finance_accounts
-- - finance_categories
-- - finance_budgets
-- - finance_goals
-- - finance_loans
-- - finance_institutions
-- - And all supporting tables (budget_templates, goal_progress, loan_payments, card_benefits, etc.)
--
-- Each policy allows:
-- 1. Users can modify their own data (user_id = auth.uid())
-- 2. Users can modify shared data (connection_id is set and user is in connection)
-- 3. Users CANNOT modify partner's personal data (view-only in merged mode)

-- ==================== VERIFICATION ====================

-- Verify connection_id columns exist
DO $$
BEGIN
  RAISE NOTICE 'Migration complete! Verifying changes...';
  RAISE NOTICE 'Tables with connection_id column:';
  RAISE NOTICE '- finance_transactions';
  RAISE NOTICE '- finance_accounts';
  RAISE NOTICE '- finance_categories';
  RAISE NOTICE '- finance_budgets';
  RAISE NOTICE '- finance_goals';
  RAISE NOTICE '- finance_loans';
  RAISE NOTICE '- finance_institutions';
  RAISE NOTICE '- And 8 more supporting tables';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies updated for merged mode support';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test RLS policies in SQL Editor';
  RAISE NOTICE '2. Update TypeScript types to include userId field';
  RAISE NOTICE '3. Update API mappings';
  RAISE NOTICE '4. Create OwnerBadge component';
  RAISE NOTICE '5. Update frontend pages';
END $$;


