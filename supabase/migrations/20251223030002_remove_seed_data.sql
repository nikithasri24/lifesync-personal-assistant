-- =====================================================
-- REMOVE ALL SEED DATA
-- =====================================================
-- This migration removes the seed data that was added in migration 20251223020004
-- Keeps only the real user data that was migrated from old tables

DO $$
DECLARE
  v_seed_checking_id UUID;
  v_seed_savings_id UUID;
  v_seed_credit_id UUID;
  v_seed_brokerage_id UUID;
  v_seed_emergency_fund_id UUID;
  v_seed_debt_goal_id UUID;
BEGIN
  RAISE NOTICE 'Removing seed data...';
  
  -- Find seed account IDs by name (these are the ones from the seed migration)
  SELECT id INTO v_seed_checking_id FROM finance_accounts WHERE name = 'Everyday Checking' AND balance = 3250.45;
  SELECT id INTO v_seed_savings_id FROM finance_accounts WHERE name = 'High Yield Savings' AND balance = 8200.10;
  SELECT id INTO v_seed_credit_id FROM finance_accounts WHERE name = 'Freedom Credit' AND balance = 450.32;
  SELECT id INTO v_seed_brokerage_id FROM finance_accounts WHERE name = 'Brokerage' AND balance = 12050.00;
  
  -- Find seed goal IDs (the ones with smaller target amounts - these are from seed data)
  SELECT id INTO v_seed_emergency_fund_id FROM finance_goals WHERE name = 'Emergency Fund' AND target_amount = 10000.00;
  SELECT id INTO v_seed_debt_goal_id FROM finance_goals WHERE name = 'Pay Off Credit Card';
  
  -- Delete transactions associated with seed accounts
  IF v_seed_checking_id IS NOT NULL THEN
    DELETE FROM finance_transactions WHERE account_id = v_seed_checking_id;
    RAISE NOTICE 'Deleted transactions for seed Everyday Checking account';
  END IF;
  
  IF v_seed_savings_id IS NOT NULL THEN
    DELETE FROM finance_transactions WHERE account_id = v_seed_savings_id;
    RAISE NOTICE 'Deleted transactions for seed High Yield Savings account';
  END IF;
  
  IF v_seed_credit_id IS NOT NULL THEN
    DELETE FROM finance_transactions WHERE account_id = v_seed_credit_id;
    RAISE NOTICE 'Deleted transactions for seed Freedom Credit account';
  END IF;
  
  IF v_seed_brokerage_id IS NOT NULL THEN
    DELETE FROM finance_transactions WHERE account_id = v_seed_brokerage_id;
    RAISE NOTICE 'Deleted transactions for seed Brokerage account';
  END IF;
  
  -- Delete seed accounts
  DELETE FROM finance_accounts WHERE id IN (v_seed_checking_id, v_seed_savings_id, v_seed_credit_id, v_seed_brokerage_id);
  RAISE NOTICE 'Deleted seed accounts';
  
  -- Delete seed goals
  DELETE FROM finance_goals WHERE id IN (v_seed_emergency_fund_id, v_seed_debt_goal_id);
  RAISE NOTICE 'Deleted seed goals';
  
  -- Delete seed budgets (June 2024 budgets from seed data)
  DELETE FROM finance_budgets WHERE month = '2024-06';
  RAISE NOTICE 'Deleted seed budgets';
  
  -- Delete seed categories (the 8 basic categories from seed data)
  -- We'll keep categories since they might be referenced by real transactions
  -- DELETE FROM finance_categories WHERE name IN ('Income', 'Rent', 'Groceries', 'Dining', 'Transport', 'Utilities', 'Entertainment', 'Investing');
  
  -- Delete seed institutions (Chase and Robinhood from seed data)
  DELETE FROM finance_institutions WHERE name IN ('Chase', 'Robinhood');
  RAISE NOTICE 'Deleted seed institutions';
  
  RAISE NOTICE '✅ Seed data removed successfully!';
  
END $$;

