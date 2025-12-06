-- Fix Budgets Table Schema Properly
-- This migration cleans up the budgets table to match the original design intent
-- Safe to run: handles existing data gracefully

-- 1. Drop the redundant start_date column (it's always derivable from month)
ALTER TABLE budgets DROP COLUMN IF EXISTS start_date;

-- 2. Drop the name column if it exists (denormalized data, should join to categories)
ALTER TABLE budgets DROP COLUMN IF EXISTS name;

-- 3. Ensure we have the correct columns with correct names
-- Add columns if they don't exist (idempotent)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month char(7);  -- YYYY-MM format
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit_amount numeric;

-- 4. Rename 'amount' to 'limit_amount' if it exists (for consistency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'amount'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'limit_amount'
  ) THEN
    ALTER TABLE budgets RENAME COLUMN amount TO limit_amount;
    RAISE NOTICE 'Renamed amount to limit_amount';
  END IF;
END $$;

-- 5. Set default values for any NULL data (before adding NOT NULL constraints)
UPDATE budgets SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
UPDATE budgets SET category_id = '00000000-0000-0000-0000-000000000000' WHERE category_id IS NULL;
UPDATE budgets SET month = TO_CHAR(NOW(), 'YYYY-MM') WHERE month IS NULL;
UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;

-- 6. Add NOT NULL constraints
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;

-- 7. Add primary key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'budgets' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE budgets ADD PRIMARY KEY (id);
    RAISE NOTICE 'Added primary key on id';
  END IF;
END $$;

-- 8. Add foreign key constraint for category_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_category_id_fkey'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint for category_id';
  END IF;
END $$;

-- 9. Remove duplicate budgets (keep the most recent one by id)
DELETE FROM budgets a USING budgets b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.category_id = b.category_id
  AND a.month = b.month;

-- 10. Add unique constraint on (user_id, category_id, month)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_user_category_month_unique'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_user_category_month_unique
    UNIQUE (user_id, category_id, month);
    RAISE NOTICE 'Added unique constraint on (user_id, category_id, month)';
  END IF;
END $$;

-- 11. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_lookup ON budgets(user_id, category_id, month);

-- 12. Verify final schema
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'budgets'
    AND column_name IN ('id', 'user_id', 'category_id', 'month', 'limit_amount');

  IF col_count = 5 THEN
    RAISE NOTICE '✅ Budgets table schema is correct: 5 columns (id, user_id, category_id, month, limit_amount)';
  ELSE
    RAISE WARNING '⚠️ Budgets table has unexpected column count: % (expected 5)', col_count;
  END IF;
END $$;

-- 13. Show final schema for verification
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'budgets'
ORDER BY ordinal_position;
