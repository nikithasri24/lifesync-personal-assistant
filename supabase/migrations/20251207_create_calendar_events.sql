-- Calendar Events Table
-- Migration created: 2025-12-07
-- Purpose: Create calendar_events table for event management

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE NOT NULL,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('event', 'meeting', 'reminder', 'birthday', 'holiday')),
  color TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  reminder_minutes INTEGER,
  attendees TEXT[],
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date ON calendar_events(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_task ON calendar_events(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON calendar_events(project_id);

-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();
