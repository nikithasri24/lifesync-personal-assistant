-- Inbox System Migration
-- Quick capture inbox for ideas, thoughts, tasks, and notes
-- Items are triaged later into proper destinations

-- Create inbox_items table
CREATE TABLE IF NOT EXISTS inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  
  -- AI-parsed suggestions (populated by edge function or client)
  suggested_type TEXT DEFAULT NULL CHECK (suggested_type IN (
    'task', 'note', 'event', 'habit', 'goal', 'reminder', 'idea', 'shopping', 'other'
  )),
  suggested_priority TEXT DEFAULT NULL CHECK (suggested_priority IN ('urgent', 'high', 'medium', 'low')),
  suggested_date DATE DEFAULT NULL,
  suggested_tags TEXT[] DEFAULT '{}',
  ai_summary TEXT DEFAULT NULL,
  
  -- Processing state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'dismissed')),
  processed_at TIMESTAMPTZ DEFAULT NULL,
  processed_to_type TEXT DEFAULT NULL, -- What it became: 'task', 'note', 'event', etc.
  processed_to_id UUID DEFAULT NULL, -- ID of the created item
  
  -- Source info
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'manual', 'voice', 'share', 'email', 'widget', 'notification', 'cli'
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS inbox_items_user_status_idx ON inbox_items(user_id, status);
CREATE INDEX IF NOT EXISTS inbox_items_user_created_idx ON inbox_items(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own inbox items"
  ON inbox_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inbox items"
  ON inbox_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inbox items"
  ON inbox_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inbox items"
  ON inbox_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inbox_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inbox_items_updated_at
  BEFORE UPDATE ON inbox_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inbox_items_updated_at();

-- Add comment
COMMENT ON TABLE inbox_items IS 'Universal inbox for quick capture of ideas, thoughts, tasks, and reminders';

