-- =====================================================
-- MIGRATE DATA FROM OLD FINANCE TABLES TO NEW ONES
-- =====================================================
-- This migration copies data from the old table names (accounts, transactions, etc.)
-- to the new table names (finance_accounts, finance_transactions, etc.)

DO $$
DECLARE
  v_old_tables_exist BOOLEAN;
  v_institutions_count INTEGER := 0;
  v_categories_count INTEGER := 0;
  v_accounts_count INTEGER := 0;
  v_transactions_count INTEGER := 0;
  v_budgets_count INTEGER := 0;
  v_goals_count INTEGER := 0;
BEGIN
  -- Check if old tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts'
  ) INTO v_old_tables_exist;
  
  IF NOT v_old_tables_exist THEN
    RAISE NOTICE 'Old finance tables do not exist. Skipping migration.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found old finance tables. Starting data migration...';
  
  -- Migrate institutions
  INSERT INTO finance_institutions (id, user_id, name, logo_url, created_at, updated_at)
  SELECT
    id,
    user_id,
    name,
    logo_url,
    NOW(),
    NOW()
  FROM institutions
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS v_institutions_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % institutions', v_institutions_count;

  -- Migrate categories
  INSERT INTO finance_categories (id, user_id, name, parent_id, icon, color, created_at, updated_at)
  SELECT
    id,
    user_id,
    name,
    parent_id,
    icon,
    color,
    NOW(),
    NOW()
  FROM categories
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS v_categories_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % categories', v_categories_count;
  
  -- Migrate accounts
  INSERT INTO finance_accounts (
    id, user_id, institution_id, name, type, balance, liability,
    credit_limit, apr, payment_due_day, minimum_payment, statement_balance, statement_date,
    annual_fee, annual_fee_due_date, rewards_balance, rewards_type, base_rewards_rate,
    last_updated_at, created_at, updated_at
  )
  SELECT
    id,
    user_id,
    institution_id,
    name,
    type::finance_account_type,
    balance,
    COALESCE(liability, FALSE),
    credit_limit,
    apr,
    payment_due_day,
    minimum_payment,
    statement_balance,
    statement_date,
    annual_fee,
    annual_fee_due_date,
    rewards_balance,
    rewards_type::finance_rewards_type,
    base_rewards_rate,
    COALESCE(last_updated, NOW()),
    NOW(),
    NOW()
  FROM accounts
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS v_accounts_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % accounts', v_accounts_count;
  
  -- Migrate transactions
  INSERT INTO finance_transactions (
    id, user_id, account_id, date, description, category_id, amount, type, notes,
    merchant_name, confidence_score, suggested_category_id, categorization_rule_id,
    created_at, updated_at
  )
  SELECT
    id,
    user_id,
    account_id,
    date,
    description,
    category_id,
    amount,
    type::finance_txn_type,
    notes,
    merchant_name,
    confidence_score,
    suggested_category_id,
    categorization_rule_id,
    NOW(),
    NOW()
  FROM transactions
  ON CONFLICT (id) DO NOTHING;

  GET DIAGNOSTICS v_transactions_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % transactions', v_transactions_count;

  -- Migrate budgets
  INSERT INTO finance_budgets (id, user_id, category_id, month, limit_amount, created_at, updated_at)
  SELECT
    id,
    user_id,
    category_id,
    month,
    limit_amount,
    NOW(),
    NOW()
  FROM budgets
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS v_budgets_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % budgets', v_budgets_count;
  
  -- Migrate goals
  INSERT INTO finance_goals (
    id, user_id, name, target_amount, current_amount, due_date, type,
    linked_category_id, linked_account_id, starting_amount, track_networth,
    created_at, updated_at
  )
  SELECT
    id,
    user_id,
    name,
    target_amount,
    current_amount,
    due_date,
    type::finance_goal_type,
    linked_category_id,
    linked_account_id,
    starting_amount,
    COALESCE(track_networth, FALSE),
    NOW(),
    NOW()
  FROM goals
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS v_goals_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % goals', v_goals_count;
  
  RAISE NOTICE '✅ Finance data migration complete!';
  RAISE NOTICE 'Summary: % institutions, % categories, % accounts, % transactions, % budgets, % goals',
    v_institutions_count, v_categories_count, v_accounts_count, v_transactions_count, v_budgets_count, v_goals_count;
    
END $$;

