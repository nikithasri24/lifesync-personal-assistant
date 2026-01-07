-- Migration: Add grocery ingredient status tracking
-- This enables users to mark ingredients as "at home" or "in cart"

-- Add grocery_ingredients table to track ingredient status across meal plans
CREATE TABLE IF NOT EXISTS grocery_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  ingredient_amount TEXT,
  ingredient_unit TEXT,
  recipe_names TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'needed' CHECK (status IN ('needed', 'at_home', 'in_cart', 'purchased')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_grocery_ingredients_user_id ON grocery_ingredients(user_id);
CREATE INDEX idx_grocery_ingredients_meal_plan_id ON grocery_ingredients(meal_plan_id);
CREATE INDEX idx_grocery_ingredients_status ON grocery_ingredients(status);

-- Enable RLS
ALTER TABLE grocery_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own grocery ingredients"
  ON grocery_ingredients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own grocery ingredients"
  ON grocery_ingredients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery ingredients"
  ON grocery_ingredients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery ingredients"
  ON grocery_ingredients FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_grocery_ingredients_updated_at
  BEFORE UPDATE ON grocery_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
