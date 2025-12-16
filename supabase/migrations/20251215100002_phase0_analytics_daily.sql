-- ============================================================================
-- Phase 0: Infrastructure Foundation - Analytics Daily Table
-- Purpose: Pre-computed daily metrics for fast retrieval and pattern analysis
-- Enables: Weekly Reports, Pattern Learning, Productivity Insights, Trends
-- Safe to run multiple times (idempotent)
-- Created: December 15, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: Create analytics_daily table
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Task metrics
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  
  -- Habit metrics
  habits_due INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  habit_completion_rate NUMERIC(5,2) DEFAULT 0, -- 0-100
  streaks_at_risk INTEGER DEFAULT 0,
  
  -- Focus metrics
  focus_sessions INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  avg_session_length NUMERIC(5,1) DEFAULT 0,
  
  -- Wellness metrics
  mood_avg NUMERIC(3,1) DEFAULT NULL, -- 1-5 scale
  energy_avg NUMERIC(3,1) DEFAULT NULL, -- 1-5 scale
  journal_entries INTEGER DEFAULT 0,
  
  -- Finance metrics
  spending_total NUMERIC(12,2) DEFAULT 0,
  income_total NUMERIC(12,2) DEFAULT 0,
  
  -- Computed scores (0-100)
  productivity_score INTEGER DEFAULT 0,
  
  -- Raw data for pattern analysis (JSON for flexibility)
  hourly_activity JSONB DEFAULT NULL,
  -- Example: {"09": {"tasks": 2, "focus": 45}, "10": {"tasks": 1, "focus": 30}}
  
  category_breakdown JSONB DEFAULT NULL,
  -- Example: {"work": 60, "personal": 30, "health": 10}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one row per user per day
  CONSTRAINT analytics_daily_user_date_unique UNIQUE(user_id, date)
);

-- ============================================================================
-- PART 2: Indexes
-- ============================================================================

-- Primary lookup: user's analytics for date range
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_date 
  ON analytics_daily(user_id, date DESC);

-- Date-only for aggregations
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date 
  ON analytics_daily(date);

-- For finding low productivity days
CREATE INDEX IF NOT EXISTS idx_analytics_daily_productivity 
  ON analytics_daily(user_id, productivity_score);

-- ============================================================================
-- PART 3: Row Level Security
-- ============================================================================

ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON analytics_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON analytics_daily
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON analytics_daily
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 4: Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_analytics_daily_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_analytics_daily ON analytics_daily;
CREATE TRIGGER trigger_update_analytics_daily
  BEFORE UPDATE ON analytics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_daily_updated_at();

-- ============================================================================
-- PART 5: Helper functions for aggregation
-- ============================================================================

-- Get weekly summary
CREATE OR REPLACE FUNCTION get_weekly_analytics(
  p_user_id UUID,
  p_week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE
)
RETURNS TABLE(
  total_tasks_completed INTEGER,
  total_habits_completed INTEGER,
  total_focus_minutes INTEGER,
  avg_productivity_score NUMERIC,
  avg_mood NUMERIC,
  best_day DATE,
  worst_day DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(a.tasks_completed), 0)::INTEGER as total_tasks_completed,
    COALESCE(SUM(a.habits_completed), 0)::INTEGER as total_habits_completed,
    COALESCE(SUM(a.focus_minutes), 0)::INTEGER as total_focus_minutes,
    ROUND(AVG(a.productivity_score), 1) as avg_productivity_score,
    ROUND(AVG(a.mood_avg), 1) as avg_mood,
    (SELECT date FROM analytics_daily 
     WHERE user_id = p_user_id AND date >= p_week_start AND date < p_week_start + 7
     ORDER BY productivity_score DESC LIMIT 1) as best_day,
    (SELECT date FROM analytics_daily 
     WHERE user_id = p_user_id AND date >= p_week_start AND date < p_week_start + 7
     ORDER BY productivity_score ASC LIMIT 1) as worst_day
  FROM analytics_daily a
  WHERE a.user_id = p_user_id
    AND a.date >= p_week_start
    AND a.date < p_week_start + 7;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================

