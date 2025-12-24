-- Migrate loan data from old tables to new tables

DO $$
DECLARE
  v_loans_count INTEGER := 0;
  v_payments_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting loan data migration...';

  -- Migrate loans from old table to new table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loans') THEN
    INSERT INTO finance_loans (
      id, user_id, account_id, loan_name, loan_type, status,
      principal_amount, current_balance, interest_rate, monthly_payment,
      extra_payment, target_payoff_date, start_date, first_payment_date,
      lender, loan_number, term_months, notes, created_at, updated_at
    )
    SELECT
      id,
      user_id,
      account_id,
      loan_name,
      loan_type::finance_loan_type,
      status::finance_loan_status,
      principal_amount,
      current_balance,
      interest_rate,
      monthly_payment,
      COALESCE(extra_payment, 0),
      target_payoff_date,
      start_date,
      first_payment_date,
      lender,
      loan_number,
      term_months,
      notes,
      NOW(),
      NOW()
    FROM loans
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_loans_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % loans', v_loans_count;
  ELSE
    RAISE NOTICE 'Old loans table does not exist';
  END IF;

  -- Migrate loan payments from old table to new table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loan_payments') THEN
    INSERT INTO finance_loan_payments (
      id, user_id, loan_id, payment_date, amount,
      principal_amount, interest_amount, extra_amount,
      balance_after, transaction_id, notes, created_at
    )
    SELECT
      id,
      user_id,
      loan_id,
      payment_date,
      amount,
      principal_amount,
      interest_amount,
      COALESCE(extra_amount, 0),
      balance_after,
      transaction_id,
      notes,
      NOW()
    FROM loan_payments
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_payments_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % loan payments', v_payments_count;
  ELSE
    RAISE NOTICE 'Old loan_payments table does not exist';
  END IF;

  RAISE NOTICE '✅ Loan data migration complete! Migrated % loans and % payments', v_loans_count, v_payments_count;

END $$;

