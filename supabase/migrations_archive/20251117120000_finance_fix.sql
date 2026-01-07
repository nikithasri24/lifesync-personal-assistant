-- Finance Schema Fix
-- Safe to run multiple times

-- Fix budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month char(7);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit_amount numeric;

-- Update existing budgets
UPDATE budgets SET month = '2025-11' WHERE month IS NULL;
UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;

-- Add constraints after data is set
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'budgets' AND column_name = 'month'
             AND is_nullable = 'YES') THEN
    ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'budgets' AND column_name = 'limit_amount'
             AND is_nullable = 'YES') THEN
    ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;
  END IF;

  -- Add foreign key if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'budgets_category_id_fkey') THEN
    ALTER TABLE budgets ADD CONSTRAINT budgets_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_budget_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_networth_user_month ON networth(user_id, month);

-- Add categorization columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS suggested_category_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS categorization_rule_id UUID;

-- Create categorization_rules table
CREATE TABLE IF NOT EXISTS categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  merchant_pattern TEXT NOT NULL,
  description_keywords TEXT[],
  amount_min DECIMAL(10,2),
  amount_max DECIMAL(10,2),
  category_id UUID NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  priority INTEGER NOT NULL DEFAULT 100,
  rule_type TEXT NOT NULL DEFAULT 'user_created',
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create merchant_database table
CREATE TABLE IF NOT EXISTS merchant_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_name TEXT NOT NULL,
  aliases TEXT[],
  default_category_name TEXT NOT NULL,
  default_subcategory TEXT,
  merchant_type TEXT,
  match_count INTEGER NOT NULL DEFAULT 0,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint on merchant_name if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_database_merchant_name_key') THEN
    ALTER TABLE merchant_database ADD CONSTRAINT merchant_database_merchant_name_key UNIQUE (merchant_name);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_database ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own categorization rules" ON categorization_rules;
CREATE POLICY "Users can view own categorization rules"
  ON categorization_rules FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own categorization rules" ON categorization_rules;
CREATE POLICY "Users can insert own categorization rules"
  ON categorization_rules FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own categorization rules" ON categorization_rules;
CREATE POLICY "Users can update own categorization rules"
  ON categorization_rules FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own categorization rules" ON categorization_rules;
CREATE POLICY "Users can delete own categorization rules"
  ON categorization_rules FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can read merchant database" ON merchant_database;
CREATE POLICY "Authenticated users can read merchant database"
  ON merchant_database FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_uncategorized ON transactions(user_id, date DESC) WHERE category_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(user_id, merchant_name) WHERE merchant_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categorization_rules_user ON categorization_rules(user_id, priority DESC, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_database_name ON merchant_database(LOWER(merchant_name) text_pattern_ops);
