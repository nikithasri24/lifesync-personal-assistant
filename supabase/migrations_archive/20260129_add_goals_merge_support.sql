-- Migration: Add merge support for Goals and Dreams
-- This allows connected users to share goals and dreams when both set their permission to "merged"
-- Following the same pattern as meal_plans and recipes
--
-- Goal Types:
-- 1. Personal goals (connection_id = NULL) - Only owner sees and tracks
-- 2. Shared goals with combined tracking (connection_id set, tracking_mode = 'combined')
--    - Both partners see the same progress (e.g., "Save $50k for house")
-- 3. Shared goals with individual tracking (connection_id set, tracking_mode = 'individual')
--    - Each partner tracks their own progress (e.g., "Exercise 3x/week")

-- ==================== Add connection_id and tracking_mode to life_goals ====================

ALTER TABLE life_goals ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Tracking mode: 'combined' = one shared progress, 'individual' = each person tracks separately
-- Only relevant when connection_id is set (shared goals)
ALTER TABLE life_goals ADD COLUMN IF NOT EXISTS tracking_mode TEXT DEFAULT 'combined' CHECK (tracking_mode IN ('combined', 'individual'));

-- Create index for efficient lookups by connection
CREATE INDEX IF NOT EXISTS idx_life_goals_connection_id ON life_goals(connection_id);

-- Update RLS policy for life_goals to allow shared access
-- Drop both old and new policy names to handle re-runs
DROP POLICY IF EXISTS "Users can view their own goals" ON life_goals;
DROP POLICY IF EXISTS "Users can view their own or shared goals" ON life_goals;
CREATE POLICY "Users can view their own or shared goals"
  ON life_goals FOR SELECT
  USING (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own goals" ON life_goals;
DROP POLICY IF EXISTS "Users can insert their own or shared goals" ON life_goals;
CREATE POLICY "Users can insert their own or shared goals"
  ON life_goals FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own goals" ON life_goals;
DROP POLICY IF EXISTS "Users can update their own or shared goals" ON life_goals;
CREATE POLICY "Users can update their own or shared goals"
  ON life_goals FOR UPDATE
  USING (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own goals" ON life_goals;
DROP POLICY IF EXISTS "Users can delete their own or shared goals" ON life_goals;
CREATE POLICY "Users can delete their own or shared goals"
  ON life_goals FOR DELETE
  USING (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- ==================== Add connection_id and tracking_mode to life_dreams ====================

ALTER TABLE life_dreams ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Tracking mode: 'combined' = one shared progress, 'individual' = each person tracks separately
-- Only relevant when connection_id is set (shared dreams)
ALTER TABLE life_dreams ADD COLUMN IF NOT EXISTS tracking_mode TEXT DEFAULT 'combined' CHECK (tracking_mode IN ('combined', 'individual'));

-- Create index for efficient lookups by connection
CREATE INDEX IF NOT EXISTS idx_life_dreams_connection_id ON life_dreams(connection_id);

-- Update RLS policy for life_dreams to allow shared access
-- Drop both old and new policy names to handle re-runs
DROP POLICY IF EXISTS "Users can view their own dreams" ON life_dreams;
DROP POLICY IF EXISTS "Users can view their own or shared dreams" ON life_dreams;
CREATE POLICY "Users can view their own or shared dreams"
  ON life_dreams FOR SELECT
  USING (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own dreams" ON life_dreams;
DROP POLICY IF EXISTS "Users can insert their own or shared dreams" ON life_dreams;
CREATE POLICY "Users can insert their own or shared dreams"
  ON life_dreams FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own dreams" ON life_dreams;
DROP POLICY IF EXISTS "Users can update their own or shared dreams" ON life_dreams;
CREATE POLICY "Users can update their own or shared dreams"
  ON life_dreams FOR UPDATE
  USING (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own dreams" ON life_dreams;
DROP POLICY IF EXISTS "Users can delete their own or shared dreams" ON life_dreams;
CREATE POLICY "Users can delete their own or shared dreams"
  ON life_dreams FOR DELETE
  USING (
    user_id = auth.uid() OR
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- ==================== Individual Progress Tracking for Shared Goals ====================
-- Used ONLY for shared goals with tracking_mode = 'individual'
-- Example: "Exercise 3x/week" - each partner tracks their own exercise separately
-- For tracking_mode = 'combined', progress is tracked on the life_goals table directly

CREATE TABLE IF NOT EXISTS goal_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal tracking - each user has their own progress for individual-mode shared goals
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,

  -- Personal progress (separate from partner's progress)
  personal_progress INTEGER DEFAULT 0 CHECK (personal_progress >= 0 AND personal_progress <= 100),
  personal_current_value NUMERIC,

  -- Personal notes and reflections
  notes TEXT,

  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one tracking record per goal
  UNIQUE(user_id, goal_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_goal_progress_tracking_user_id ON goal_progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_tracking_goal_id ON goal_progress_tracking(goal_id);

-- Enable RLS
ALTER TABLE goal_progress_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to handle re-runs
DROP POLICY IF EXISTS "Users can view their own goal tracking" ON goal_progress_tracking;
DROP POLICY IF EXISTS "Users can insert their own goal tracking" ON goal_progress_tracking;
DROP POLICY IF EXISTS "Users can update their own goal tracking" ON goal_progress_tracking;
DROP POLICY IF EXISTS "Users can delete their own goal tracking" ON goal_progress_tracking;
DROP POLICY IF EXISTS "Users can view partner's goal tracking for shared goals" ON goal_progress_tracking;

-- RLS Policy: Users can only view their own tracking
CREATE POLICY "Users can view their own goal tracking"
  ON goal_progress_tracking FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can insert their own tracking
CREATE POLICY "Users can insert their own goal tracking"
  ON goal_progress_tracking FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own tracking
CREATE POLICY "Users can update their own goal tracking"
  ON goal_progress_tracking FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policy: Users can delete their own tracking
CREATE POLICY "Users can delete their own goal tracking"
  ON goal_progress_tracking FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policy: Users can view partner's tracking for shared goals
CREATE POLICY "Users can view partner's goal tracking for shared goals"
  ON goal_progress_tracking FOR SELECT
  USING (
    goal_id IN (
      SELECT g.id FROM life_goals g
      WHERE g.connection_id IN (
        SELECT id FROM profile_connections
        WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
      )
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_goal_progress_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to handle re-runs
DROP TRIGGER IF EXISTS trigger_goal_progress_tracking_updated_at ON goal_progress_tracking;

CREATE TRIGGER trigger_goal_progress_tracking_updated_at
  BEFORE UPDATE ON goal_progress_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress_tracking_updated_at();

-- Add comments for documentation
COMMENT ON TABLE goal_progress_tracking IS 'Individual progress tracking for shared goals with tracking_mode=individual. Each user tracks their own progress separately.';
COMMENT ON COLUMN life_goals.connection_id IS 'If set, this goal is shared between connected users. NULL = personal goal.';
COMMENT ON COLUMN life_goals.tracking_mode IS 'For shared goals: combined = one shared progress, individual = each person tracks separately.';
COMMENT ON COLUMN life_dreams.connection_id IS 'If set, this dream is shared between connected users. NULL = personal dream.';
COMMENT ON COLUMN life_dreams.tracking_mode IS 'For shared dreams: combined = one shared progress, individual = each person tracks separately.';
