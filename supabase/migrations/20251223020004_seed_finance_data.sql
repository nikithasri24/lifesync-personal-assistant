-- =====================================================
-- FINANCE MODULE - SEED DATA
-- =====================================================
-- This migration seeds initial finance data for existing users

DO $$
DECLARE
  v_user_id UUID;
  v_inst_chase UUID;
  v_inst_robinhood UUID;
  v_acct_checking UUID;
  v_acct_savings UUID;
  v_acct_credit UUID;
  v_acct_brokerage UUID;
  v_cat_income UUID;
  v_cat_rent UUID;
  v_cat_groceries UUID;
  v_cat_dining UUID;
  v_cat_transport UUID;
  v_cat_utils UUID;
  v_cat_entertain UUID;
  v_cat_investing UUID;
BEGIN
  -- Get the first user (you can modify this to target specific users)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found, skipping seed data';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Seeding finance data for user: %', v_user_id;
  
  -- =====================================================
  -- INSTITUTIONS
  -- =====================================================

  INSERT INTO finance_institutions (user_id, name, logo_url)
  VALUES
    (v_user_id, 'Chase', 'https://logo.clearbit.com/chase.com'),
    (v_user_id, 'Robinhood', 'https://logo.clearbit.com/robinhood.com');

  SELECT id INTO v_inst_chase FROM finance_institutions WHERE user_id = v_user_id AND name = 'Chase';
  SELECT id INTO v_inst_robinhood FROM finance_institutions WHERE user_id = v_user_id AND name = 'Robinhood';
  
  -- =====================================================
  -- CATEGORIES
  -- =====================================================

  INSERT INTO finance_categories (user_id, name)
  VALUES
    (v_user_id, 'Income'),
    (v_user_id, 'Rent'),
    (v_user_id, 'Groceries'),
    (v_user_id, 'Dining'),
    (v_user_id, 'Transport'),
    (v_user_id, 'Utilities'),
    (v_user_id, 'Entertainment'),
    (v_user_id, 'Investing');
  
  SELECT id INTO v_cat_income FROM finance_categories WHERE user_id = v_user_id AND name = 'Income';
  SELECT id INTO v_cat_rent FROM finance_categories WHERE user_id = v_user_id AND name = 'Rent';
  SELECT id INTO v_cat_groceries FROM finance_categories WHERE user_id = v_user_id AND name = 'Groceries';
  SELECT id INTO v_cat_dining FROM finance_categories WHERE user_id = v_user_id AND name = 'Dining';
  SELECT id INTO v_cat_transport FROM finance_categories WHERE user_id = v_user_id AND name = 'Transport';
  SELECT id INTO v_cat_utils FROM finance_categories WHERE user_id = v_user_id AND name = 'Utilities';
  SELECT id INTO v_cat_entertain FROM finance_categories WHERE user_id = v_user_id AND name = 'Entertainment';
  SELECT id INTO v_cat_investing FROM finance_categories WHERE user_id = v_user_id AND name = 'Investing';
  
  -- =====================================================
  -- ACCOUNTS
  -- =====================================================

  INSERT INTO finance_accounts (user_id, institution_id, name, type, balance, last_updated_at)
  VALUES
    (v_user_id, v_inst_chase, 'Everyday Checking', 'checking', 3250.45, '2024-06-30T12:00:00Z'),
    (v_user_id, v_inst_chase, 'High Yield Savings', 'savings', 8200.10, '2024-06-30T12:00:00Z'),
    (v_user_id, v_inst_chase, 'Freedom Credit', 'credit', 450.32, '2024-06-30T12:00:00Z'),
    (v_user_id, v_inst_robinhood, 'Brokerage', 'brokerage', 12050.00, '2024-06-30T12:00:00Z');
  
  -- Update credit card to be a liability
  UPDATE finance_accounts SET liability = TRUE WHERE user_id = v_user_id AND name = 'Freedom Credit';
  
  SELECT id INTO v_acct_checking FROM finance_accounts WHERE user_id = v_user_id AND name = 'Everyday Checking';
  SELECT id INTO v_acct_savings FROM finance_accounts WHERE user_id = v_user_id AND name = 'High Yield Savings';
  SELECT id INTO v_acct_credit FROM finance_accounts WHERE user_id = v_user_id AND name = 'Freedom Credit';
  SELECT id INTO v_acct_brokerage FROM finance_accounts WHERE user_id = v_user_id AND name = 'Brokerage';
  
  -- =====================================================
  -- TRANSACTIONS (Sample data for 2024)
  -- =====================================================
  
  -- January 2024
  INSERT INTO finance_transactions (user_id, account_id, date, description, category_id, amount, type)
  VALUES
    (v_user_id, v_acct_checking, '2024-01-31T12:00:00Z', 'Employer Payroll', v_cat_income, 4200, 'credit'),
    (v_user_id, v_acct_checking, '2024-01-03T12:00:00Z', 'January Rent', v_cat_rent, 1600, 'debit'),
    (v_user_id, v_acct_checking, '2024-01-10T12:00:00Z', 'Whole Foods', v_cat_groceries, 120.50, 'debit'),
    (v_user_id, v_acct_checking, '2024-01-20T12:00:00Z', 'Trader Joe''s', v_cat_groceries, 95.30, 'debit'),
    (v_user_id, v_acct_credit, '2024-01-15T12:00:00Z', 'Chipotle', v_cat_dining, 18.50, 'debit'),
    (v_user_id, v_acct_checking, '2024-01-18T12:00:00Z', 'Electric Utility', v_cat_utils, 70.20, 'debit');
  
  -- February 2024
  INSERT INTO finance_transactions (user_id, account_id, date, description, category_id, amount, type)
  VALUES
    (v_user_id, v_acct_checking, '2024-02-29T12:00:00Z', 'Employer Payroll', v_cat_income, 4200, 'credit'),
    (v_user_id, v_acct_checking, '2024-02-03T12:00:00Z', 'February Rent', v_cat_rent, 1600, 'debit'),
    (v_user_id, v_acct_checking, '2024-02-09T12:00:00Z', 'Costco', v_cat_groceries, 210.05, 'debit'),
    (v_user_id, v_acct_credit, '2024-02-12T12:00:00Z', 'Pizza Place', v_cat_dining, 24.75, 'debit'),
    (v_user_id, v_acct_checking, '2024-02-22T12:00:00Z', 'Gas Station', v_cat_transport, 52.90, 'debit');
  
  -- March 2024
  INSERT INTO finance_transactions (user_id, account_id, date, description, category_id, amount, type)
  VALUES
    (v_user_id, v_acct_checking, '2024-03-31T12:00:00Z', 'Employer Payroll', v_cat_income, 4200, 'credit'),
    (v_user_id, v_acct_checking, '2024-03-03T12:00:00Z', 'March Rent', v_cat_rent, 1600, 'debit'),
    (v_user_id, v_acct_checking, '2024-03-12T12:00:00Z', 'Safeway', v_cat_groceries, 132.80, 'debit'),
    (v_user_id, v_acct_credit, '2024-03-16T12:00:00Z', 'Sushi Bar', v_cat_dining, 42.30, 'debit'),
    (v_user_id, v_acct_checking, '2024-03-19T12:00:00Z', 'Water Utility', v_cat_utils, 40.10, 'debit');
  
  -- April 2024
  INSERT INTO finance_transactions (user_id, account_id, date, description, category_id, amount, type)
  VALUES
    (v_user_id, v_acct_checking, '2024-04-30T12:00:00Z', 'Employer Payroll', v_cat_income, 4200, 'credit'),
    (v_user_id, v_acct_checking, '2024-04-03T12:00:00Z', 'April Rent', v_cat_rent, 1600, 'debit'),
    (v_user_id, v_acct_checking, '2024-04-07T12:00:00Z', 'Trader Joe''s', v_cat_groceries, 98.70, 'debit'),
    (v_user_id, v_acct_credit, '2024-04-21T12:00:00Z', 'Cafe', v_cat_dining, 14.20, 'debit'),
    (v_user_id, v_acct_checking, '2024-04-25T12:00:00Z', 'Uber', v_cat_transport, 23.50, 'debit');
  
  -- May 2024
  INSERT INTO finance_transactions (user_id, account_id, date, description, category_id, amount, type)
  VALUES
    (v_user_id, v_acct_checking, '2024-05-31T12:00:00Z', 'Employer Payroll', v_cat_income, 4200, 'credit'),
    (v_user_id, v_acct_checking, '2024-05-03T12:00:00Z', 'May Rent', v_cat_rent, 1600, 'debit'),
    (v_user_id, v_acct_checking, '2024-05-12T12:00:00Z', 'Whole Foods', v_cat_groceries, 140.00, 'debit'),
    (v_user_id, v_acct_credit, '2024-05-14T12:00:00Z', 'Burger Place', v_cat_dining, 19.85, 'debit'),
    (v_user_id, v_acct_checking, '2024-05-28T12:00:00Z', 'Internet Bill', v_cat_utils, 65.00, 'debit');

  -- June 2024
  INSERT INTO finance_transactions (user_id, account_id, date, description, category_id, amount, type)
  VALUES
    (v_user_id, v_acct_checking, '2024-06-30T12:00:00Z', 'Employer Payroll', v_cat_income, 4200, 'credit'),
    (v_user_id, v_acct_checking, '2024-06-03T12:00:00Z', 'June Rent', v_cat_rent, 1600, 'debit'),
    (v_user_id, v_acct_checking, '2024-06-08T12:00:00Z', 'Costco', v_cat_groceries, 185.40, 'debit'),
    (v_user_id, v_acct_credit, '2024-06-11T12:00:00Z', 'Thai Restaurant', v_cat_dining, 35.60, 'debit'),
    (v_user_id, v_acct_checking, '2024-06-15T12:00:00Z', 'Gas Station', v_cat_transport, 48.20, 'debit'),
    (v_user_id, v_acct_checking, '2024-06-20T12:00:00Z', 'Electric Utility', v_cat_utils, 72.50, 'debit'),
    (v_user_id, v_acct_credit, '2024-06-22T12:00:00Z', 'Movie Theater', v_cat_entertain, 28.00, 'debit'),
    (v_user_id, v_acct_brokerage, '2024-06-25T12:00:00Z', 'Stock Purchase', v_cat_investing, 500.00, 'debit');

  -- =====================================================
  -- BUDGETS (June 2024)
  -- =====================================================

  INSERT INTO finance_budgets (user_id, category_id, month, limit_amount)
  VALUES
    (v_user_id, v_cat_rent, '2024-06', 1600),
    (v_user_id, v_cat_groceries, '2024-06', 400),
    (v_user_id, v_cat_dining, '2024-06', 200),
    (v_user_id, v_cat_transport, '2024-06', 150),
    (v_user_id, v_cat_utils, '2024-06', 200),
    (v_user_id, v_cat_entertain, '2024-06', 100);

  -- =====================================================
  -- GOALS
  -- =====================================================

  INSERT INTO finance_goals (user_id, name, target_amount, current_amount, starting_amount, due_date, type, linked_account_id)
  VALUES
    (v_user_id, 'Emergency Fund', 10000, 8200.10, 5000, '2024-12-31T23:59:59Z', 'savings', v_acct_savings),
    (v_user_id, 'Pay Off Credit Card', 0, 450.32, 1200, '2024-09-30T23:59:59Z', 'debt', v_acct_credit);

  RAISE NOTICE 'Finance seed data created successfully!';

END $$;

