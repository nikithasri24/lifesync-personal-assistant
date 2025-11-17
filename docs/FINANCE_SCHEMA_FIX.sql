-- =====================================================================
-- Finance Schema Fix - Run this in Supabase SQL Editor
-- =====================================================================
-- This script fixes missing columns in the budgets table and adds
-- categorization support to the Finance module.
-- Safe to run multiple times (uses IF NOT EXISTS checks).
-- =====================================================================

-- Fix budgets table
DO $$
BEGIN
  -- Add month column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'month'
  ) THEN
    ALTER TABLE budgets ADD COLUMN month char(7);
    UPDATE budgets SET month = '2025-11' WHERE month IS NULL;
    ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
  END IF;

  -- Add category_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE budgets ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE CASCADE;
  END IF;

  -- Add limit_amount column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'limit_amount'
  ) THEN
    ALTER TABLE budgets ADD COLUMN limit_amount numeric;
    UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;
    ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_budget_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_networth_user_month ON networth(user_id, month);

-- Add categorization columns to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE transactions ADD COLUMN confidence_score DECIMAL(3,2)
      CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'suggested_category_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN suggested_category_id UUID REFERENCES categories(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'merchant_name'
  ) THEN
    ALTER TABLE transactions ADD COLUMN merchant_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'categorization_rule_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN categorization_rule_id UUID;
  END IF;
END $$;

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
  merchant_name TEXT NOT NULL UNIQUE,
  aliases TEXT[],
  default_category_name TEXT NOT NULL,
  default_subcategory TEXT,
  merchant_type TEXT,
  match_count INTEGER NOT NULL DEFAULT 0,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_database ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categorization_rules
DROP POLICY IF EXISTS "Users can view own categorization rules" ON categorization_rules;
CREATE POLICY "Users can view own categorization rules"
  ON categorization_rules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own categorization rules" ON categorization_rules;
CREATE POLICY "Users can insert own categorization rules"
  ON categorization_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own categorization rules" ON categorization_rules;
CREATE POLICY "Users can update own categorization rules"
  ON categorization_rules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own categorization rules" ON categorization_rules;
CREATE POLICY "Users can delete own categorization rules"
  ON categorization_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for merchant_database
DROP POLICY IF EXISTS "Authenticated users can read merchant database" ON merchant_database;
CREATE POLICY "Authenticated users can read merchant database"
  ON merchant_database FOR SELECT
  USING (auth.role() = 'authenticated');

-- Transaction indexes for categorization
CREATE INDEX IF NOT EXISTS idx_transactions_uncategorized
  ON transactions(user_id, date DESC)
  WHERE category_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_merchant
  ON transactions(user_id, merchant_name)
  WHERE merchant_name IS NOT NULL;

-- Categorization rules indexes
CREATE INDEX IF NOT EXISTS idx_categorization_rules_user
  ON categorization_rules(user_id, priority DESC, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_merchant_database_name
  ON merchant_database(LOWER(merchant_name) text_pattern_ops);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Finance schema fix applied successfully!';
  RAISE NOTICE 'Tables: budgets, transactions, categorization_rules, merchant_database';
  RAISE NOTICE 'You can now use the Finance Reports page.';
END $$;
