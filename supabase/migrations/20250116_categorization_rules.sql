-- Migration: Add smart categorization support
-- Description: Adds categorization_rules table and updates transactions for confidence tracking
-- Author: CTO Planning
-- Date: 2025-01-16

-- ============================================================================
-- 1. Categorization Rules Table
-- ============================================================================
-- Stores user-learned categorization patterns and merchant mappings

CREATE TABLE IF NOT EXISTS categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern matching
  merchant_pattern TEXT NOT NULL,
  description_keywords TEXT[], -- Array of keywords to match in description
  amount_min DECIMAL(10,2),
  amount_max DECIMAL(10,2),

  -- Target category
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

  -- Rule metadata
  confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  priority INTEGER NOT NULL DEFAULT 100, -- Higher priority checked first
  rule_type TEXT CHECK (rule_type IN ('user_created','system','learned')) NOT NULL DEFAULT 'user_created',

  -- Learning metrics
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, merchant_pattern, category_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_categorization_rules_user_priority
  ON categorization_rules(user_id, priority DESC, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_categorization_rules_merchant
  ON categorization_rules(user_id, merchant_pattern);

-- ============================================================================
-- 2. Update Transactions Table
-- ============================================================================
-- Add columns for AI/ML categorization support

-- Add confidence score column (NULL means manually categorized)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2)
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

-- Add AI suggested category (can differ from actual category)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS suggested_category_id UUID REFERENCES categories(id);

-- Add merchant name extraction (normalized from description)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS merchant_name TEXT;

-- Add rule that was used for categorization
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS categorization_rule_id UUID REFERENCES categorization_rules(id) ON DELETE SET NULL;

-- Index for finding uncategorized transactions
CREATE INDEX IF NOT EXISTS idx_transactions_uncategorized
  ON transactions(user_id, date DESC)
  WHERE category_id IS NULL;

-- Index for finding low-confidence transactions
CREATE INDEX IF NOT EXISTS idx_transactions_low_confidence
  ON transactions(user_id, confidence_score)
  WHERE confidence_score IS NOT NULL AND confidence_score < 0.8;

-- Index for merchant lookups
CREATE INDEX IF NOT EXISTS idx_transactions_merchant
  ON transactions(user_id, merchant_name)
  WHERE merchant_name IS NOT NULL;

-- ============================================================================
-- 3. Merchant Database Table (System-wide)
-- ============================================================================
-- Pre-populated database of common merchants with default categories

CREATE TABLE IF NOT EXISTS merchant_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Merchant info
  merchant_name TEXT NOT NULL UNIQUE,
  aliases TEXT[], -- Alternative names/spellings

  -- Default categorization
  default_category_name TEXT NOT NULL, -- 'Food & Dining', 'Transportation', etc.
  default_subcategory TEXT,

  -- Metadata
  merchant_type TEXT, -- 'restaurant', 'gas_station', 'online_retailer', etc.
  logo_url TEXT,
  website TEXT,

  -- Quality metrics
  match_count INTEGER NOT NULL DEFAULT 0,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.9,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_merchant_database_name
  ON merchant_database(LOWER(merchant_name) text_pattern_ops);

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

-- Categorization rules - user can only see their own
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own categorization rules"
  ON categorization_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own categorization rules"
  ON categorization_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own categorization rules"
  ON categorization_rules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own categorization rules"
  ON categorization_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Merchant database - read-only for all authenticated users
ALTER TABLE merchant_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can read merchant database"
  ON merchant_database FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to automatically update success rate when rule is used
CREATE OR REPLACE FUNCTION update_categorization_rule_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If a transaction is categorized using a rule, update the rule's stats
  IF NEW.categorization_rule_id IS NOT NULL THEN
    UPDATE categorization_rules
    SET
      usage_count = usage_count + 1,
      last_used_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.categorization_rule_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rule usage when transaction is inserted/updated
DROP TRIGGER IF EXISTS trg_update_categorization_rule_usage ON transactions;
CREATE TRIGGER trg_update_categorization_rule_usage
  AFTER INSERT OR UPDATE OF categorization_rule_id
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_categorization_rule_usage();

-- Function to update rule success/failure when user corrects category
CREATE OR REPLACE FUNCTION track_categorization_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- If category changed and there was a rule involved
  IF OLD.category_id IS DISTINCT FROM NEW.category_id AND OLD.categorization_rule_id IS NOT NULL THEN
    -- Check if the change matches what the rule suggested
    IF NEW.category_id = OLD.suggested_category_id THEN
      -- User accepted the suggestion (success)
      UPDATE categorization_rules
      SET
        success_count = success_count + 1,
        confidence = LEAST(1.0, confidence + 0.05),
        updated_at = NOW()
      WHERE id = OLD.categorization_rule_id;
    ELSE
      -- User rejected the suggestion (failure)
      UPDATE categorization_rules
      SET
        failure_count = failure_count + 1,
        confidence = GREATEST(0.1, confidence - 0.1),
        updated_at = NOW()
      WHERE id = OLD.categorization_rule_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track categorization feedback
DROP TRIGGER IF EXISTS trg_track_categorization_feedback ON transactions;
CREATE TRIGGER trg_track_categorization_feedback
  AFTER UPDATE OF category_id
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION track_categorization_feedback();

-- Function to extract merchant name from transaction description
CREATE OR REPLACE FUNCTION extract_merchant_name(description TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Basic merchant name extraction (can be enhanced)
  -- Remove common prefixes and normalize
  RETURN TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(description, '^(DEBIT|CREDIT|PURCHASE|POS|CARD)\s+', '', 'i'),
      '\s+\d+$', -- Remove trailing numbers
      '', 'i'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. Seed Initial Merchant Database
-- ============================================================================
-- Common merchants to bootstrap the system

INSERT INTO merchant_database (merchant_name, aliases, default_category_name, default_subcategory, merchant_type, confidence) VALUES
  -- Food & Dining
  ('Starbucks', ARRAY['STARBUCKS', 'SBUX'], 'Food & Dining', 'Coffee Shops', 'restaurant', 0.95),
  ('McDonald''s', ARRAY['MCDONALDS', 'MCD'], 'Food & Dining', 'Fast Food', 'restaurant', 0.95),
  ('Chipotle', ARRAY['CHIPOTLE'], 'Food & Dining', 'Restaurants', 'restaurant', 0.95),
  ('Subway', ARRAY['SUBWAY'], 'Food & Dining', 'Fast Food', 'restaurant', 0.95),
  ('Panera Bread', ARRAY['PANERA'], 'Food & Dining', 'Restaurants', 'restaurant', 0.90),
  ('Dunkin''', ARRAY['DUNKIN DONUTS', 'DUNKIN'], 'Food & Dining', 'Coffee Shops', 'restaurant', 0.95),

  -- Groceries
  ('Whole Foods', ARRAY['WHOLE FOODS', 'WFM'], 'Groceries', 'Supermarkets', 'grocery', 0.95),
  ('Trader Joe''s', ARRAY['TRADER JOES', 'TJS'], 'Groceries', 'Supermarkets', 'grocery', 0.95),
  ('Safeway', ARRAY['SAFEWAY'], 'Groceries', 'Supermarkets', 'grocery', 0.95),
  ('Walmart', ARRAY['WALMART', 'WAL-MART'], 'Groceries', 'Supermarkets', 'grocery', 0.90),
  ('Target', ARRAY['TARGET'], 'Shopping', 'Retail', 'retail', 0.85),
  ('Costco', ARRAY['COSTCO'], 'Groceries', 'Warehouse Clubs', 'grocery', 0.95),

  -- Transportation
  ('Uber', ARRAY['UBER'], 'Transportation', 'Rideshare', 'transportation', 0.95),
  ('Lyft', ARRAY['LYFT'], 'Transportation', 'Rideshare', 'transportation', 0.95),
  ('Shell', ARRAY['SHELL'], 'Transportation', 'Gas', 'gas_station', 0.90),
  ('Chevron', ARRAY['CHEVRON'], 'Transportation', 'Gas', 'gas_station', 0.90),
  ('76', ARRAY['76 GAS'], 'Transportation', 'Gas', 'gas_station', 0.90),

  -- Entertainment
  ('Netflix', ARRAY['NETFLIX'], 'Entertainment', 'Streaming', 'subscription', 0.95),
  ('Spotify', ARRAY['SPOTIFY'], 'Entertainment', 'Music', 'subscription', 0.95),
  ('Hulu', ARRAY['HULU'], 'Entertainment', 'Streaming', 'subscription', 0.95),
  ('Disney+', ARRAY['DISNEY PLUS', 'DISNEYPLUS'], 'Entertainment', 'Streaming', 'subscription', 0.95),
  ('HBO Max', ARRAY['HBO MAX', 'HBOMAX'], 'Entertainment', 'Streaming', 'subscription', 0.95),
  ('Amazon Prime', ARRAY['PRIME VIDEO', 'AMAZON PRIME'], 'Entertainment', 'Streaming', 'subscription', 0.90),

  -- Shopping
  ('Amazon', ARRAY['AMAZON', 'AMZN'], 'Shopping', 'Online', 'online_retailer', 0.90),
  ('eBay', ARRAY['EBAY'], 'Shopping', 'Online', 'online_retailer', 0.90),
  ('Apple', ARRAY['APPLE.COM', 'APPLE STORE'], 'Shopping', 'Electronics', 'retail', 0.85),
  ('Best Buy', ARRAY['BESTBUY', 'BEST BUY'], 'Shopping', 'Electronics', 'retail', 0.90),

  -- Utilities & Bills
  ('PG&E', ARRAY['PGE', 'PACIFIC GAS'], 'Bills & Utilities', 'Electric', 'utility', 0.95),
  ('AT&T', ARRAY['ATT', 'AT&T'], 'Bills & Utilities', 'Phone', 'utility', 0.95),
  ('Verizon', ARRAY['VERIZON'], 'Bills & Utilities', 'Phone', 'utility', 0.95),
  ('Comcast', ARRAY['COMCAST', 'XFINITY'], 'Bills & Utilities', 'Internet', 'utility', 0.95),

  -- Health & Fitness
  ('CVS', ARRAY['CVS PHARMACY'], 'Health & Fitness', 'Pharmacy', 'pharmacy', 0.90),
  ('Walgreens', ARRAY['WALGREENS'], 'Health & Fitness', 'Pharmacy', 'pharmacy', 0.90),
  ('Planet Fitness', ARRAY['PLANET FITNESS'], 'Health & Fitness', 'Gym', 'gym', 0.95),
  ('24 Hour Fitness', ARRAY['24 HOUR FITNESS'], 'Health & Fitness', 'Gym', 'gym', 0.95)
ON CONFLICT (merchant_name) DO NOTHING;

-- ============================================================================
-- 7. Comments
-- ============================================================================

COMMENT ON TABLE categorization_rules IS 'User-specific rules for automatic transaction categorization with learning capabilities';
COMMENT ON TABLE merchant_database IS 'System-wide database of known merchants with default categorization';
COMMENT ON COLUMN transactions.confidence_score IS 'Confidence of auto-categorization (0-1). NULL means manually categorized';
COMMENT ON COLUMN transactions.suggested_category_id IS 'AI/ML suggested category (may differ from actual category_id)';
COMMENT ON COLUMN transactions.merchant_name IS 'Normalized merchant name extracted from description';
COMMENT ON COLUMN categorization_rules.priority IS 'Higher priority rules are checked first (user rules = 100, system = 50)';
COMMENT ON COLUMN categorization_rules.confidence IS 'Rule confidence (0-1) adjusted based on success/failure rate';
