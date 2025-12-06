-- Clear all transactions for the current user
-- This removes demo/test data to start fresh

DO $$
DECLARE
  v_user_id uuid;
  deleted_count int;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO v_user_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Delete all transactions for this user
  DELETE FROM transactions
  WHERE user_id = v_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % transactions for user %', deleted_count, v_user_id;
END $$;
