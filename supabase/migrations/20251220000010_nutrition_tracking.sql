-- ============================================================================
-- Nutrition Tracking Schema
-- Calorie/macro tracking, food logging, nutrition goals
-- ============================================================================

-- ============================================================================
-- Food Items (Reference database of foods)
-- ============================================================================
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system foods
  
  -- Food info
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL(10, 2) NOT NULL DEFAULT 1,
  serving_unit TEXT NOT NULL DEFAULT 'serving',
  
  -- Macros per serving
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g DECIMAL(10, 2) DEFAULT 0,
  carbs_g DECIMAL(10, 2) DEFAULT 0,
  fat_g DECIMAL(10, 2) DEFAULT 0,
  fiber_g DECIMAL(10, 2) DEFAULT 0,
  sugar_g DECIMAL(10, 2) DEFAULT 0,
  sodium_mg DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  category TEXT, -- protein, carb, vegetable, fruit, dairy, fat, snack, beverage
  barcode TEXT,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Food Log (User's daily food intake)
-- ============================================================================
CREATE TABLE IF NOT EXISTS food_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Food reference
  food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
  custom_food_name TEXT, -- For quick entries without food_item
  
  -- Quantity
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  
  -- Meal info
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_time TIME,
  
  -- Calculated nutrition (stored for historical accuracy)
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g DECIMAL(10, 2) DEFAULT 0,
  carbs_g DECIMAL(10, 2) DEFAULT 0,
  fat_g DECIMAL(10, 2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Nutrition Goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Daily targets
  calories_target INTEGER DEFAULT 2000,
  protein_target_g INTEGER DEFAULT 50,
  carbs_target_g INTEGER DEFAULT 250,
  fat_target_g INTEGER DEFAULT 65,
  fiber_target_g INTEGER DEFAULT 25,
  
  -- Goal type
  goal_type TEXT DEFAULT 'maintain' CHECK (goal_type IN ('lose', 'maintain', 'gain')),
  
  -- Active period
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, is_active) -- Only one active goal per user
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_food_items_user ON food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_food_log_user_date ON food_log(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_food_log_meal ON food_log(user_id, logged_date, meal_type);

CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user ON nutrition_goals(user_id) WHERE is_active = true;

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Food items: users can see system foods (user_id IS NULL) and their own
CREATE POLICY "Users can view system and own foods" ON food_items
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own foods" ON food_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own foods" ON food_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own foods" ON food_items
  FOR DELETE USING (auth.uid() = user_id);

-- Food log: users can only access their own
CREATE POLICY "Users can view own food log" ON food_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food log" ON food_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food log" ON food_log
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food log" ON food_log
  FOR DELETE USING (auth.uid() = user_id);

-- Nutrition goals: users can only access their own
CREATE POLICY "Users can view own goals" ON nutrition_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON nutrition_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON nutrition_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON nutrition_goals
  FOR DELETE USING (auth.uid() = user_id);

