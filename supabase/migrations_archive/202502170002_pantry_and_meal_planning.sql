-- Migration: Pantry inventory and meal planning enhancements
-- Adds pantry_items table and extends meal/recipe tables for richer metadata

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== Pantry ====================
CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0,
    unit TEXT,
    category TEXT,
    subcategory TEXT,
    location TEXT,
    expiration_date DATE,
    notes TEXT,
    is_low_stock BOOLEAN DEFAULT false,
    low_stock_threshold NUMERIC,
    auto_restock BOOLEAN DEFAULT false,
    restock_quantity NUMERIC,
    last_purchased_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiration ON pantry_items(expiration_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pantry_items_user_name ON pantry_items(user_id, lower(name));

-- ==================== Recipes ====================
ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS nutrition_info JSONB;

ALTER TABLE recipe_ingredients
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS optional BOOLEAN DEFAULT false;

-- ==================== Meal Planning ====================
ALTER TABLE meal_plans
    ADD COLUMN IF NOT EXISTS meal_columns JSONB,
    ADD COLUMN IF NOT EXISTS shopping_list_generated BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS total_estimated_cost DECIMAL(10,2);

ALTER TABLE planned_meals
    ADD COLUMN IF NOT EXISTS custom_meal TEXT,
    ADD COLUMN IF NOT EXISTS people_count INTEGER,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'planned',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_planned_meals_plan_id ON planned_meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_status ON planned_meals(status);
