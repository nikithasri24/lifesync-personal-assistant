# Quick Finance Schema Fix

## Option 1: Via Supabase Dashboard (EASIEST - 30 seconds)

1. **Open**: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/sql/new

2. **Copy this SQL** and paste into the editor:

```sql
-- Add missing columns to budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month char(7);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS limit_amount numeric;
UPDATE budgets SET month = '2025-11' WHERE month IS NULL;
UPDATE budgets SET limit_amount = 0 WHERE limit_amount IS NULL;
ALTER TABLE budgets ALTER COLUMN month SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN limit_amount SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budget_user_month ON budgets(user_id, month);

-- Add categorization columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

-- Create categorization tables
CREATE TABLE IF NOT EXISTS categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  merchant_pattern TEXT NOT NULL,
  category_id UUID NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  priority INTEGER DEFAULT 100,
  rule_type TEXT DEFAULT 'user_created',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchant_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_name TEXT UNIQUE NOT NULL,
  default_category_name TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.9
);

ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own rules" ON categorization_rules;
CREATE POLICY "Users view own rules" ON categorization_rules FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "All read merchants" ON merchant_database;
CREATE POLICY "All read merchants" ON merchant_database FOR SELECT USING (auth.role() = 'authenticated');
```

3. **Click "Run"**

4. **Done!** Refresh your app and go to **Finances → Reports**

---

## Option 2: Via Terminal (if you prefer CLI)

The file is ready at: `supabase/migrations/20251117120000_finance_fix.sql`

Just go to Supabase Dashboard and copy-paste the SQL from that file.

---

**After running:** Your Finance Reports page with the beautiful Sankey diagram will work perfectly! 🎉
