-- Migration: Add shared meal backlog table
-- Description: Creates a shared backlog for meals that partners want to save for later
-- When either partner swaps a meal and chooses "Save for later", the original meal
-- goes into this shared backlog where either partner can use it later.

-- Create the meal_backlog table
CREATE TABLE IF NOT EXISTS meal_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shared ownership - both partners can see and use backlog items
  connection_id UUID NOT NULL REFERENCES profile_connections(id) ON DELETE CASCADE,

  -- What meal was saved
  meal_name TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,

  -- Context
  saved_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_date DATE,                    -- When it was originally planned
  original_meal_type TEXT,               -- breakfast, lunch, dinner, snack
  reason TEXT,                           -- Why it was saved (e.g., "Ate Thai fried rice instead")

  -- Servings info from original meal
  servings INTEGER DEFAULT 2,
  people_count INTEGER DEFAULT 2,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups by connection
CREATE INDEX IF NOT EXISTS idx_meal_backlog_connection_id ON meal_backlog(connection_id);

-- Create index for recipe lookups
CREATE INDEX IF NOT EXISTS idx_meal_backlog_recipe_id ON meal_backlog(recipe_id);

-- Enable RLS
ALTER TABLE meal_backlog ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view backlog items for their connections
CREATE POLICY "Users can view their connection's backlog items"
  ON meal_backlog
  FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert backlog items for their connections
CREATE POLICY "Users can add to their connection's backlog"
  ON meal_backlog
  FOR INSERT
  WITH CHECK (
    saved_by_user_id = auth.uid()
    AND connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- RLS Policy: Users can update backlog items for their connections
CREATE POLICY "Users can update their connection's backlog items"
  ON meal_backlog
  FOR UPDATE
  USING (
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete backlog items for their connections
CREATE POLICY "Users can delete their connection's backlog items"
  ON meal_backlog
  FOR DELETE
  USING (
    connection_id IN (
      SELECT id FROM profile_connections
      WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_meal_backlog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meal_backlog_updated_at
  BEFORE UPDATE ON meal_backlog
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_backlog_updated_at();

-- Add comment for documentation
COMMENT ON TABLE meal_backlog IS 'Shared backlog of meals saved for later. When a user swaps a meal and chooses "Save for later", the original meal is added here. Either partner can then use it by dragging it to a meal slot.';

