-- Enhance Skincare Tracking with Streak Calculation and Reminders
-- Part of the Weekly Skincare Routine Implementation

-- Add reminder columns to skincare_routines
ALTER TABLE skincare_routines
  ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time TIME;

-- Create accurate streak calculation function
CREATE OR REPLACE FUNCTION calculate_skincare_streak(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  best_streak INTEGER,
  last_completion_date DATE
) AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_best_streak INTEGER := 0;
  v_temp_streak INTEGER := 0;
  v_last_date DATE := NULL;
  v_prev_date DATE := NULL;
  v_current_date DATE := CURRENT_DATE;
  v_date_record RECORD;
BEGIN
  -- Get all dates where at least one routine was completed
  -- Process in reverse chronological order
  FOR v_date_record IN (
    SELECT DISTINCT date
    FROM skincare_logs
    WHERE user_id = p_user_id
      AND completed = true
    ORDER BY date DESC
  ) LOOP
    IF v_last_date IS NULL THEN
      -- First iteration - this is the most recent completion
      v_temp_streak := 1;
      v_last_date := v_date_record.date;
      v_prev_date := v_date_record.date;

      -- Only count as current streak if within 1 day of today
      -- (allows for completing "today's" routine until midnight + 1 day grace)
      IF v_date_record.date >= v_current_date - INTERVAL '1 day' THEN
        v_current_streak := 1;
      END IF;
    ELSE
      -- Check if this date is consecutive with previous date
      IF v_prev_date - v_date_record.date = INTERVAL '1 day' THEN
        -- Consecutive day - increment streak
        v_temp_streak := v_temp_streak + 1;

        -- Update current streak if we're still within the current streak period
        IF v_date_record.date >= v_current_date - v_temp_streak * INTERVAL '1 day' THEN
          v_current_streak := v_temp_streak;
        END IF;

        v_prev_date := v_date_record.date;
      ELSE
        -- Streak broken - record best streak and reset
        v_best_streak := GREATEST(v_best_streak, v_temp_streak);
        v_temp_streak := 1;
        v_prev_date := v_date_record.date;
      END IF;
    END IF;
  END LOOP;

  -- Final check for best streak
  v_best_streak := GREATEST(v_best_streak, v_temp_streak);

  -- If no completions found, return zeros
  IF v_last_date IS NULL THEN
    v_current_streak := 0;
    v_best_streak := 0;
  END IF;

  RETURN QUERY SELECT v_current_streak, v_best_streak, v_last_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to get completion stats for a date range
CREATE OR REPLACE FUNCTION get_skincare_completion_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_days INTEGER,
  completed_days INTEGER,
  completion_rate NUMERIC,
  am_completions INTEGER,
  pm_completions INTEGER
) AS $$
DECLARE
  v_total_days INTEGER;
  v_unique_completed_dates INTEGER;
  v_am_completions INTEGER;
  v_pm_completions INTEGER;
  v_completion_rate NUMERIC;
BEGIN
  -- Calculate total days in range
  v_total_days := (p_end_date - p_start_date + 1);

  -- Count unique dates with at least one completed routine
  SELECT COUNT(DISTINCT date) INTO v_unique_completed_dates
  FROM skincare_logs
  WHERE user_id = p_user_id
    AND date >= p_start_date
    AND date <= p_end_date
    AND completed = true;

  -- Count AM completions
  SELECT COUNT(*) INTO v_am_completions
  FROM skincare_logs
  WHERE user_id = p_user_id
    AND date >= p_start_date
    AND date <= p_end_date
    AND routine_type = 'AM'
    AND completed = true;

  -- Count PM completions
  SELECT COUNT(*) INTO v_pm_completions
  FROM skincare_logs
  WHERE user_id = p_user_id
    AND date >= p_start_date
    AND date <= p_end_date
    AND routine_type = 'PM'
    AND completed = true;

  -- Calculate completion rate
  IF v_total_days > 0 THEN
    v_completion_rate := ROUND((v_unique_completed_dates::NUMERIC / v_total_days) * 100, 2);
  ELSE
    v_completion_rate := 0;
  END IF;

  RETURN QUERY SELECT
    v_total_days,
    v_unique_completed_dates,
    v_completion_rate,
    v_am_completions,
    v_pm_completions;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get routines for a specific day and time
CREATE OR REPLACE FUNCTION get_routines_for_day_and_time(
  p_user_id UUID,
  p_day_of_week INTEGER,
  p_time_slot TEXT
)
RETURNS SETOF skincare_routines AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM skincare_routines
  WHERE user_id = p_user_id
    AND is_active = true
    AND routine_type = p_time_slot
    AND (
      days_of_week IS NULL
      OR days_of_week = '{}'
      OR p_day_of_week = ANY(days_of_week)
    )
  ORDER BY created_at;
END;
$$ LANGUAGE plpgsql;

-- Update the skincare_streaks view to use the new function
DROP VIEW IF EXISTS skincare_streaks;
CREATE OR REPLACE VIEW skincare_streaks AS
SELECT
  u.id as user_id,
  COALESCE(s.current_streak, 0) as current_streak,
  COALESCE(s.best_streak, 0) as best_streak,
  s.last_completion_date
FROM auth.users u
LEFT JOIN LATERAL (
  SELECT * FROM calculate_skincare_streak(u.id)
) s ON true;

-- Add comment documentation
COMMENT ON FUNCTION calculate_skincare_streak IS
  'Calculates the current and best skincare completion streaks for a user.
   Current streak counts consecutive days with at least one completed routine.
   Allows 1-day grace period for current streak.';

COMMENT ON FUNCTION get_skincare_completion_stats IS
  'Returns completion statistics for a user within a date range.
   Includes total days, completed days, completion rate, and AM/PM breakdown.';

COMMENT ON FUNCTION get_routines_for_day_and_time IS
  'Gets active routines for a specific day of week (0=Sun, 1=Mon, etc) and time slot (AM/PM).
   Handles routines with specific days_of_week or no restriction (all days).';

COMMENT ON COLUMN skincare_routines.reminder_enabled IS
  'Whether to send reminders for this routine';

COMMENT ON COLUMN skincare_routines.reminder_time IS
  'Time to send reminder (e.g., 08:00 for 8 AM, 20:00 for 8 PM)';
