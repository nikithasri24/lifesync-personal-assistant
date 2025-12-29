-- Add scheduled_start/scheduled_end columns for precise task scheduling

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;

COMMENT ON COLUMN tasks.scheduled_start IS 'Timestamp for scheduled task start';
COMMENT ON COLUMN tasks.scheduled_end IS 'Timestamp for scheduled task end';

CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_start
  ON tasks(scheduled_start)
  WHERE scheduled_start IS NOT NULL;

-- Backfill scheduled_start from due_date + scheduled_time when available
UPDATE tasks
SET scheduled_start = (due_date::date + scheduled_time::time)::timestamptz
WHERE scheduled_start IS NULL
  AND due_date IS NOT NULL
  AND scheduled_time IS NOT NULL;

-- Backfill scheduled_end using estimated_time (default 30 minutes)
UPDATE tasks
SET scheduled_end = scheduled_start + make_interval(mins => COALESCE(estimated_time, 30))
WHERE scheduled_end IS NULL
  AND scheduled_start IS NOT NULL;
