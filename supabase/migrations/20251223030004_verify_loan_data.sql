-- Verify loan data is accessible

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== VERIFYING LOAN DATA ===';
  
  FOR r IN SELECT * FROM finance_loans ORDER BY loan_name LOOP
    RAISE NOTICE 'Loan: %', r.loan_name;
    RAISE NOTICE '  ID: %', r.id;
    RAISE NOTICE '  Type: %', r.loan_type;
    RAISE NOTICE '  Status: %', r.status;
    RAISE NOTICE '  Principal: %', r.principal_amount;
    RAISE NOTICE '  Current Balance: %', r.current_balance;
    RAISE NOTICE '  Interest Rate: %', r.interest_rate;
    RAISE NOTICE '  Monthly Payment: %', r.monthly_payment;
    RAISE NOTICE '  Extra Payment: %', r.extra_payment;
    RAISE NOTICE '  Start Date: %', r.start_date;
    RAISE NOTICE '  First Payment Date: %', r.first_payment_date;
    RAISE NOTICE '  Target Payoff Date: %', r.target_payoff_date;
    RAISE NOTICE '  Term Months: %', r.term_months;
    RAISE NOTICE '  Lender: %', r.lender;
    RAISE NOTICE '  ---';
  END LOOP;
  
  RAISE NOTICE '✅ Loan data verification complete';
  
END $$;

