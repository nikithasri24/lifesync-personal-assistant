-- Add scheduled_time column to tasks table for precise calendar scheduling
-- This allows tasks to be scheduled at a specific time (HH:MM format)

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS scheduled_time TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tasks.scheduled_time IS 'Time of day for scheduled task in HH:MM format (e.g., 09:30)';

-- Create index for faster queries on scheduled tasks
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_time ON tasks(scheduled_time) WHERE scheduled_time IS NOT NULL;

