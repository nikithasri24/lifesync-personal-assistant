-- Remove legacy scheduled_time column now that scheduled_start/scheduled_end are canonical

ALTER TABLE tasks
DROP COLUMN IF EXISTS scheduled_time;
