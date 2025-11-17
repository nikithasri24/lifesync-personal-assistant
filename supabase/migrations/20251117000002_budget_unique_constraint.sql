-- Add unique constraint to budgets table for upsert support
-- This allows budget creation/editing to work properly

-- Drop existing constraint if it exists (with different name)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'budgets_user_id_category_id_month_key'
    ) THEN
        ALTER TABLE budgets DROP CONSTRAINT budgets_user_id_category_id_month_key;
    END IF;
END $$;

-- Add the unique constraint
ALTER TABLE budgets
ADD CONSTRAINT budgets_user_id_category_id_month_key
UNIQUE (user_id, category_id, month);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
