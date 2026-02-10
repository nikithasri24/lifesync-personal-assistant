-- Create goal_progress_tracking table for personal progress in merged mode
CREATE TABLE IF NOT EXISTS goal_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES life_goals(id) ON DELETE CASCADE,
  personal_progress INTEGER NOT NULL DEFAULT 0 CHECK (personal_progress >= 0 AND personal_progress <= 100),
  personal_current_value DECIMAL,
  notes TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, goal_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_goal_progress_tracking_user_id ON goal_progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_tracking_goal_id ON goal_progress_tracking(goal_id);

-- Enable RLS
ALTER TABLE goal_progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own progress tracking
CREATE POLICY "Users can view own progress tracking"
  ON goal_progress_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress tracking
CREATE POLICY "Users can insert own progress tracking"
  ON goal_progress_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress tracking
CREATE POLICY "Users can update own progress tracking"
  ON goal_progress_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own progress tracking
CREATE POLICY "Users can delete own progress tracking"
  ON goal_progress_tracking
  FOR DELETE
  USING (auth.uid() = user_id);

-- Users can view partner's progress if they have a merged connection for the goal
CREATE POLICY "Users can view partner progress in merged goals"
  ON goal_progress_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM life_goals g
      INNER JOIN profile_connections pc ON g.connection_id = pc.id
      WHERE g.id = goal_id
      AND g.tracking_mode = 'combined'
      AND pc.status = 'active'
      AND (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    )
  );
