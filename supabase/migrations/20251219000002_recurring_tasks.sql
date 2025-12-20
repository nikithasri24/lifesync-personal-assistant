-- Add recurrence fields to tasks table for recurring tasks feature

-- Recurrence pattern: none, daily, weekly, monthly, yearly, custom
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT DEFAULT 'none' 
  CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'));

-- Interval: every N days/weeks/months (e.g., every 2 weeks)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;

-- Days for recurrence:
-- For weekly: array of days [0-6] where 0=Sunday, 1=Monday, etc.
-- For monthly: array of day numbers [1-31]
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[];

-- When recurrence should stop (optional)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMPTZ;

-- Max number of occurrences (alternative to end_date)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;

-- Link to the original recurring task template (for generated instances)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_id UUID REFERENCES tasks(id);

-- Create index for finding recurring tasks efficiently
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence_pattern) WHERE recurrence_pattern != 'none';

-- Create index for finding child tasks of a recurring template
CREATE INDEX IF NOT EXISTS idx_tasks_parent_recurring ON tasks(parent_recurring_id) WHERE parent_recurring_id IS NOT NULL;

