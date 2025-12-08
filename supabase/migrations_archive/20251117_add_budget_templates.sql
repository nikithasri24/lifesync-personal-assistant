-- Budget Templates Migration
-- This enables users to set up budget templates once that auto-apply to new months

-- 1. Create budget_templates table
CREATE TABLE IF NOT EXISTS budget_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  default_amount numeric NOT NULL CHECK (default_amount >= 0),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT budget_templates_user_category_unique UNIQUE (user_id, category_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_templates_user ON budget_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_templates_category ON budget_templates(category_id);

-- 3. Add RLS (Row Level Security) policies
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own templates
CREATE POLICY budget_templates_select_policy ON budget_templates
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own templates
CREATE POLICY budget_templates_insert_policy ON budget_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own templates
CREATE POLICY budget_templates_update_policy ON budget_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own templates
CREATE POLICY budget_templates_delete_policy ON budget_templates
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_budget_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_templates_updated_at_trigger
  BEFORE UPDATE ON budget_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_templates_updated_at();

-- 5. Create a function to auto-initialize budgets from templates for a given month
CREATE OR REPLACE FUNCTION initialize_budgets_from_templates(
  p_user_id uuid,
  p_month char(7)
) RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Insert budgets from templates for this month if they don't already exist
  INSERT INTO budgets (user_id, category_id, month, limit_amount)
  SELECT
    t.user_id,
    t.category_id,
    p_month,
    t.default_amount
  FROM budget_templates t
  WHERE t.user_id = p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.user_id = t.user_id
    AND b.category_id = t.category_id
    AND b.month = p_month
  );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Optionally migrate existing budgets to templates
-- This creates templates based on the most recent budget for each category
INSERT INTO budget_templates (user_id, category_id, default_amount)
SELECT DISTINCT ON (user_id, category_id)
  user_id,
  category_id,
  limit_amount
FROM budgets
WHERE limit_amount > 0
ORDER BY user_id, category_id, month DESC
ON CONFLICT (user_id, category_id) DO NOTHING;

-- 7. Show summary
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count FROM budget_templates;
  RAISE NOTICE '✅ Budget templates table created successfully';
  RAISE NOTICE '📊 Migrated % budget templates from existing budgets', template_count;
END $$;
