-- ============================================================================
-- Meal Substitution and Backlog Feature
-- Migration created: 2025-12-27
-- Purpose: Add ability to swap meals, track what was actually eaten, and maintain a backlog
-- ============================================================================

-- ==================== UPDATE PLANNED MEALS TABLE ====================

-- Add new fields for substitution tracking
ALTER TABLE planned_meals 
  ADD COLUMN IF NOT EXISTS actual_food_log_id UUID REFERENCES food_log(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS substituted_with TEXT,
  ADD COLUMN IF NOT EXISTS is_postponed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS postponed_reason TEXT,
  ADD COLUMN IF NOT EXISTS original_date DATE;

-- Update status enum to include 'substituted' and 'postponed'
ALTER TABLE planned_meals 
  DROP CONSTRAINT IF EXISTS planned_meals_status_check;
  
ALTER TABLE planned_meals 
  ADD CONSTRAINT planned_meals_status_check 
  CHECK (status IN ('planned', 'prepped', 'cooked', 'eaten', 'substituted', 'postponed'));

-- Add index for postponed meals queries
CREATE INDEX IF NOT EXISTS idx_planned_meals_is_postponed ON planned_meals(is_postponed) WHERE is_postponed = true;
CREATE INDEX IF NOT EXISTS idx_planned_meals_actual_food_log_id ON planned_meals(actual_food_log_id);

-- ==================== UPDATE FOOD LOG TABLE ====================

-- Add backlink from food_log to planned_meals
ALTER TABLE food_log 
  ADD COLUMN IF NOT EXISTS planned_meal_id UUID REFERENCES planned_meals(id) ON DELETE SET NULL;

-- Add index for planned meal lookups
CREATE INDEX IF NOT EXISTS idx_food_log_planned_meal_id ON food_log(planned_meal_id);

-- ==================== COMMENTS FOR DOCUMENTATION ====================

COMMENT ON COLUMN planned_meals.actual_food_log_id IS 'Link to food_log entry for what was actually eaten (if substituted)';
COMMENT ON COLUMN planned_meals.substituted_with IS 'Quick note of what was eaten instead of the planned meal';
COMMENT ON COLUMN planned_meals.is_postponed IS 'Whether this meal was postponed to the backlog';
COMMENT ON COLUMN planned_meals.postponed_reason IS 'Reason for postponing (e.g., "ate out", "no time to cook")';
COMMENT ON COLUMN planned_meals.original_date IS 'Original scheduled date before postponing';
COMMENT ON COLUMN food_log.planned_meal_id IS 'Link back to the planned meal this food log entry replaced';

-- ==================== VERIFICATION ====================

-- Verify new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'planned_meals' 
  AND column_name IN ('actual_food_log_id', 'substituted_with', 'is_postponed', 'postponed_reason', 'original_date')
ORDER BY column_name;

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'food_log' 
  AND column_name = 'planned_meal_id';

-- This should return 6 rows total (5 from planned_meals + 1 from food_log)

