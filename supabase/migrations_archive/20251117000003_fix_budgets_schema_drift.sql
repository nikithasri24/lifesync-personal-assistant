-- Fix Budgets Table Schema Drift
-- This migration ensures the budgets table matches our intended schema
-- Safe to run multiple times (idempotent)

-- Drop columns that shouldn't exist (schema drift from manual changes)
DO $$
BEGIN
  -- Drop 'name' column if it exists (not in original schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'name'
  ) THEN
    ALTER TABLE budgets DROP COLUMN name;
    RAISE NOTICE 'Dropped name column from budgets table';
  END IF;

  -- Drop any other unexpected columns here if needed
END $$;

-- Ensure correct schema exists
-- Note: Using IF NOT EXISTS to make this idempotent

-- Ensure primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'budgets' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE budgets ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure user_id column
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;

-- Ensure category_id column
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id uuid;

-- Ensure month column
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month char(7);

-- Ensure limit_amount column
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit_amount numeric;

-- Set NOT NULL constraints after ensuring data exists
DO $$
BEGIN
  -- Make category_id NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'category_id' AND is_nullable = 'YES'
  ) THEN
    -- First, delete any rows with NULL category_id (invalid data)
    DELETE FROM budgets WHERE category_id IS NULL;
    ALTER TABLE budgets ALTER COLUMN category_id SET NOT NULL;
  END IF;

  -- Make month NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'month' AND is_nullable = 'YES'
  ) THEN
    -- Update NULL months to current month
    UPDATE budgets SET month = TO_CHAR(NOW(), 'YYYY-MM') WHERE month IS NULL;
    ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
  END IF;

  -- Make limit_amount NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'limit_amount' AND is_nullable = 'YES'
  ) THEN
    -- Update NULL limits to 0
    UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;
    ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;
  END IF;
END $$;

-- Add foreign key constraint for category_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_category_id_fkey' AND table_name = 'budgets'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint for (user_id, category_id, month)
-- This allows upsert operations to work correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_user_category_month_unique'
  ) THEN
    -- First, remove any duplicate rows (keep the one with highest id)
    DELETE FROM budgets a USING budgets b
    WHERE a.id < b.id
      AND a.user_id = b.user_id
      AND a.category_id = b.category_id
      AND a.month = b.month;

    -- Now add the unique constraint
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_user_category_month_unique
    UNIQUE (user_id, category_id, month);

    RAISE NOTICE 'Added unique constraint on (user_id, category_id, month)';
  END IF;
END $$;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_lookup ON budgets(user_id, category_id, month);

-- Verify final schema
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
    RAISE NOTICE 'Budgets table schema is correct: 5 expected columns found';
  ELSE
    RAISE WARNING 'Budgets table has unexpected column count: % (expected 5)', col_count;
  END IF;
END $$;

-- Display final schema for verification
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'budgets'
ORDER BY ordinal_position;
