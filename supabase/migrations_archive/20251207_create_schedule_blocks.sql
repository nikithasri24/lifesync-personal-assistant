-- Task Scheduler: Schedule Blocks Table
-- Migration created: 2025-12-07
-- Purpose: Create schedule_blocks table for task scheduling

-- Create schedule_blocks table
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT NOT NULL CHECK (type IN ('task', 'event', 'focus', 'break')),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_user_date ON schedule_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_task ON schedule_blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_type ON schedule_blocks(type);

-- Enable Row Level Security
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own schedule blocks"
  ON schedule_blocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule blocks"
  ON schedule_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule blocks"
  ON schedule_blocks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule blocks"
  ON schedule_blocks FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedule_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_blocks_updated_at
  BEFORE UPDATE ON schedule_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_blocks_updated_at();
