-- ============================================================================
-- Meal Planning Complete Migration
-- Migration created: 2026-01-06
-- Purpose: Create all meal planning tables with RLS policies (combined script)
-- Run this in Supabase SQL Editor to set up meal planning feature
-- ============================================================================

-- ==================== RECIPES TABLE ====================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Time
  prep_time INTEGER, -- minutes
  cook_time INTEGER, -- minutes
  total_time INTEGER GENERATED ALWAYS AS (COALESCE(prep_time, 0) + COALESCE(cook_time, 0)) STORED,

  -- Servings & Nutrition
  servings INTEGER DEFAULT 4,
  calories INTEGER,

  -- Content
  instructions TEXT,
  ingredients JSONB,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  dietary_restrictions TEXT[] DEFAULT '{}',
  nutrition_info JSONB,

  -- Source
  source_type TEXT CHECK (source_type IN ('manual', 'url', 'youtube', 'imported', 'ai')),
  source_url TEXT,
  author_name TEXT,
  video_thumbnail TEXT,
  image TEXT,
  rating INTEGER,
  notes TEXT,
  flow_chart JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recipes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- ==================== RECIPE INGREDIENTS TABLE ====================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,
  optional BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- ==================== MEAL PLANS TABLE ====================

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  meal_columns JSONB,
  shopping_list_generated BOOLEAN DEFAULT false,
  total_estimated_cost DECIMAL(10, 2),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start_date ON meal_plans(week_start_date DESC);

-- ==================== PLANNED MEALS TABLE ====================

CREATE TABLE IF NOT EXISTS planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal TEXT,

  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  servings INTEGER DEFAULT 4,
  people_count INTEGER DEFAULT 4,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'prepped', 'cooked', 'eaten', 'substituted', 'postponed')),
  notes TEXT,

  -- Substitution tracking
  actual_food_log_id UUID,
  substituted_with TEXT,
  is_postponed BOOLEAN DEFAULT false,
  postponed_reason TEXT,
  original_date DATE,

  prepared_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planned_meals_meal_plan_id ON planned_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_recipe_id ON planned_meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);

-- ==================== PANTRY ITEMS TABLE ====================

CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit TEXT,
  category TEXT DEFAULT 'other' CHECK (category IN ('produce', 'dairy', 'meat', 'pantry', 'bakery', 'frozen', 'beverages', 'other')),
  location TEXT,
  expiration_date DATE,
  notes TEXT,
  is_low_stock BOOLEAN DEFAULT false,
  low_stock_threshold DECIMAL(10, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date) WHERE expiration_date IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ==================== RECIPES RLS ====================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== RECIPE INGREDIENTS RLS ====================

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can insert own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can update own recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete own recipe ingredients" ON recipe_ingredients;

CREATE POLICY "Users can view own recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));

CREATE POLICY "Users can insert own recipe ingredients"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));

CREATE POLICY "Users can update own recipe ingredients"
  ON recipe_ingredients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));

CREATE POLICY "Users can delete own recipe ingredients"
  ON recipe_ingredients FOR DELETE
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));

-- ==================== MEAL PLANS RLS ====================

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can insert own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can update own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can delete own meal plans" ON meal_plans;

CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== PLANNED MEALS RLS ====================

ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own planned meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can insert own planned meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can update own planned meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can delete own planned meals" ON planned_meals;

CREATE POLICY "Users can view own planned meals"
  ON planned_meals FOR SELECT
  USING (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = planned_meals.meal_plan_id AND meal_plans.user_id = auth.uid()));

CREATE POLICY "Users can insert own planned meals"
  ON planned_meals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = planned_meals.meal_plan_id AND meal_plans.user_id = auth.uid()));

CREATE POLICY "Users can update own planned meals"
  ON planned_meals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = planned_meals.meal_plan_id AND meal_plans.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = planned_meals.meal_plan_id AND meal_plans.user_id = auth.uid()));

CREATE POLICY "Users can delete own planned meals"
  ON planned_meals FOR DELETE
  USING (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = planned_meals.meal_plan_id AND meal_plans.user_id = auth.uid()));

-- ==================== PANTRY ITEMS RLS ====================

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pantry items" ON pantry_items;
DROP POLICY IF EXISTS "Users can insert own pantry items" ON pantry_items;
DROP POLICY IF EXISTS "Users can update own pantry items" ON pantry_items;
DROP POLICY IF EXISTS "Users can delete own pantry items" ON pantry_items;

CREATE POLICY "Users can view own pantry items"
  ON pantry_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pantry items"
  ON pantry_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pantry items"
  ON pantry_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pantry items"
  ON pantry_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_planned_meals_updated_at ON planned_meals;
CREATE TRIGGER update_planned_meals_updated_at BEFORE UPDATE ON planned_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pantry_items_updated_at ON pantry_items;
CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify setup)
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals', 'pantry_items');
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('recipes', 'recipe_ingredients', 'meal_plans', 'planned_meals', 'pantry_items');
