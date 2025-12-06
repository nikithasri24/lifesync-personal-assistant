-- Migration: Add ingredients JSONB column to recipes table
-- This allows storing structured ingredient data (name, amount, unit) directly with each recipe

-- Add ingredients column to recipes table as JSONB
ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;

-- Create index for faster ingredient queries (e.g., searching by ingredient name)
CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING gin(ingredients);

-- Add comment documenting the expected structure
COMMENT ON COLUMN recipes.ingredients IS 'Array of ingredient objects with structure: [{"name": "flour", "amount": "2", "unit": "cups"}]';
