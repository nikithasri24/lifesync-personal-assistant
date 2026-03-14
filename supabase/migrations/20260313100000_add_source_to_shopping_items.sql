-- Add source tracking to shopping_items for unified shopping list
ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_name text;

-- source_type values: 'manual' | 'batch_cook' | 'recipe' | 'pantry'
-- source_name: display label e.g. "Next Week Prep - Mar 15" or "Afgani paneer"
COMMENT ON COLUMN shopping_items.source_type IS 'Origin of the item: manual, batch_cook, recipe, or pantry';
COMMENT ON COLUMN shopping_items.source_name IS 'Human-readable source label shown as a badge on the item';
