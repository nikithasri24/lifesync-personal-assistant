# Fix: Missing scheduled_start Column in Tasks Table

## Problem
The error shows that the `scheduled_start` column doesn't exist in your Supabase tasks table:
```
column tasks.scheduled_start does not exist
```

## Solution
You need to apply the migration that adds this column to your database.

## Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the following SQL:

```sql
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
```

6. Click **Run** to execute the migration
7. Refresh your app - the error should be gone!

## Option 2: Apply via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

## Verification

After applying the migration, verify it worked:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `tasks` table
3. Check that `scheduled_start` and `scheduled_end` columns now exist

## What This Migration Does

- Adds `scheduled_start` column (TIMESTAMPTZ) - when a task is scheduled to start
- Adds `scheduled_end` column (TIMESTAMPTZ) - when a task is scheduled to end
- Creates an index on `scheduled_start` for better query performance
- Backfills existing tasks with scheduled times from `due_date` + `scheduled_time`
- Calculates `scheduled_end` based on `estimated_time` (defaults to 30 minutes)

## After Fixing

Once the migration is applied, your app will be able to:
- Query scheduled tasks properly
- Display tasks in the calendar view
- Show upcoming scheduled tasks
- Use the task scheduler feature

