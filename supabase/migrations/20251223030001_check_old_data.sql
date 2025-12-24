-- Check what data exists in old tables vs new tables

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Check if old tables exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goals') THEN
    RAISE NOTICE '=== OLD GOALS TABLE ===';
    RAISE NOTICE 'Goals in old table:';
    FOR r IN SELECT name, type, target_amount, current_amount FROM goals ORDER BY name LOOP
      RAISE NOTICE '  - % (type: %, target: %, current: %)', r.name, r.type, r.target_amount, r.current_amount;
    END LOOP;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_goals') THEN
    RAISE NOTICE '=== NEW FINANCE_GOALS TABLE ===';
    RAISE NOTICE 'Goals in new table:';
    FOR r IN SELECT name, type, target_amount, current_amount FROM finance_goals ORDER BY name LOOP
      RAISE NOTICE '  - % (type: %, target: %, current: %)', r.name, r.type, r.target_amount, r.current_amount;
    END LOOP;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    RAISE NOTICE '=== OLD ACCOUNTS TABLE ===';
    RAISE NOTICE 'Accounts in old table:';
    FOR r IN SELECT name, type, balance FROM accounts ORDER BY name LOOP
      RAISE NOTICE '  - % (type: %, balance: %)', r.name, r.type, r.balance;
    END LOOP;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_accounts') THEN
    RAISE NOTICE '=== NEW FINANCE_ACCOUNTS TABLE ===';
    RAISE NOTICE 'Accounts in new table:';
    FOR r IN SELECT name, type, balance FROM finance_accounts ORDER BY name LOOP
      RAISE NOTICE '  - % (type: %, balance: %)', r.name, r.type, r.balance;
    END LOOP;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'institutions') THEN
    RAISE NOTICE '=== OLD INSTITUTIONS TABLE ===';
    RAISE NOTICE 'Institutions in old table:';
    FOR r IN SELECT name FROM institutions ORDER BY name LOOP
      RAISE NOTICE '  - %', r.name;
    END LOOP;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'finance_institutions') THEN
    RAISE NOTICE '=== NEW FINANCE_INSTITUTIONS TABLE ===';
    RAISE NOTICE 'Institutions in new table:';
    FOR r IN SELECT name FROM finance_institutions ORDER BY name LOOP
      RAISE NOTICE '  - %', r.name;
    END LOOP;
  END IF;

END $$;

