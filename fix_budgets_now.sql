-- Emergency fix for budgets table schema drift
-- Run this directly: cat fix_budgets_now.sql | npx supabase db execute

-- 1. Drop 'name' column if it exists (causing INSERT errors)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'name'
  ) THEN
    ALTER TABLE budgets DROP COLUMN name CASCADE;
    RAISE NOTICE 'Dropped name column from budgets table';
  ELSE
    RAISE NOTICE 'name column does not exist (good)';
  END IF;
END $$;

-- 2. Ensure correct columns exist
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month char(7);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit_amount numeric;

-- 3. Clean up invalid data
DELETE FROM budgets WHERE user_id IS NULL;
DELETE FROM budgets WHERE category_id IS NULL;
UPDATE budgets SET month = TO_CHAR(NOW(), 'YYYY-MM') WHERE month IS NULL;
UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;

-- 4. Set NOT NULL constraints
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;

-- 5. Remove duplicates (keep highest id)
DELETE FROM budgets a USING budgets b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.category_id = b.category_id
  AND a.month = b.month;

-- 6. Add unique constraint (critical for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'budgets_user_category_month_unique'
  ) THEN
    ALTER TABLE budgets
    ADD CONSTRAINT budgets_user_category_month_unique
    UNIQUE (user_id, category_id, month);
    RAISE NOTICE 'Added unique constraint';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- 7. Add indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- 8. Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'budgets'
ORDER BY ordinal_position;
