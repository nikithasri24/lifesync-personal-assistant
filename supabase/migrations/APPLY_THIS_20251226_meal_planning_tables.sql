-- ============================================================================
-- MEAL PLANNING TABLES - COMBINED MIGRATION
-- Created: 2025-12-26
-- Purpose: Create all meal planning tables and RLS policies
-- 
-- HOW TO APPLY:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run"
-- ============================================================================

-- ==================== RECIPES ====================

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
  calories INTEGER, -- total calories for recipe
  
  -- Content
  instructions TEXT,
  ingredients JSONB, -- Array of ingredient objects
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  dietary_restrictions TEXT[] DEFAULT '{}',
  nutrition_info JSONB,
  
  -- Source
  source_type TEXT CHECK (source_type IN ('manual', 'url', 'youtube', 'imported')),
  source_url TEXT,
  author_name TEXT,
  video_thumbnail TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recipes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- ==================== RECIPE INGREDIENTS ====================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Ingredient details
  name TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit TEXT,
  category TEXT,
  optional BOOLEAN DEFAULT false,
  
  -- Order
  order_index INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_category ON recipe_ingredients(category);

-- ==================== MEAL PLANS ====================

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan details
  name TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  
  -- Configuration
  meal_columns JSONB, -- Array of meal column configurations
  
  -- Shopping
  shopping_list_generated BOOLEAN DEFAULT false,
  total_estimated_cost DECIMAL(10, 2),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, week_start_date)
);

-- Indexes for meal_plans
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start_date ON meal_plans(week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_week ON meal_plans(user_id, week_start_date);

-- ==================== PLANNED MEALS ====================

CREATE TABLE IF NOT EXISTS planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  
  -- Meal reference
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal TEXT, -- For quick entries without a recipe
  
  -- Scheduling
  date DATE NOT NULL,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  
  -- Servings
  servings INTEGER DEFAULT 4,
  people_count INTEGER DEFAULT 4,
  
  -- Status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'prepped', 'cooked', 'eaten')),
  
  -- Notes
  notes TEXT,
  
  -- Tracking
  prepared_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for planned_meals
CREATE INDEX IF NOT EXISTS idx_planned_meals_meal_plan_id ON planned_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_recipe_id ON planned_meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_status ON planned_meals(status);
CREATE INDEX IF NOT EXISTS idx_planned_meals_meal_type ON planned_meals(meal_type);

-- ============================================================================
-- RLS POLICIES
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
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own recipe ingredients"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own recipe ingredients"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own recipe ingredients"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own planned meals"
  ON planned_meals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own planned meals"
  ON planned_meals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own planned meals"
  ON planned_meals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = planned_meals.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

