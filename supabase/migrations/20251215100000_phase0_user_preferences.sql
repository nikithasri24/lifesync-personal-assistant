-- ============================================================================
-- Phase 0: Infrastructure Foundation - User Preferences Table
-- Purpose: Centralized user preferences for energy, scheduling, locations, 
--          notifications, quiet hours, and AI preferences
-- Enables: Energy/Time Blocking, Location Intelligence, Smart Notifications,
--          AI Personalization, Sharing Permissions
-- Safe to run multiple times (idempotent)
-- Created: December 15, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: Create user_preferences table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Chronotype & Energy (for smart scheduling)
  chronotype TEXT DEFAULT 'neutral' CHECK (chronotype IN ('early_bird', 'night_owl', 'neutral')),
  peak_energy_start TIME DEFAULT '09:00',
  peak_energy_end TIME DEFAULT '12:00',
  low_energy_start TIME DEFAULT '14:00',
  low_energy_end TIME DEFAULT '16:00',
  preferred_deep_work_start TIME DEFAULT '09:00',
  preferred_deep_work_end TIME DEFAULT '12:00',
  
  -- Scheduling Rules (JSON for flexibility)
  scheduling_rules JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"rule": "no_meetings_before", "time": "09:00"}, {"rule": "lunch_block", "start": "12:00", "end": "13:00"}]
  
  work_hours_start TIME DEFAULT '09:00',
  work_hours_end TIME DEFAULT '17:00',
  work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Sun, 1=Mon, etc.
  max_tasks_per_day INTEGER DEFAULT 10,
  
  -- Locations (for commute intelligence)
  home_location JSONB DEFAULT NULL,
  -- Example: {"lat": 37.7749, "lng": -122.4194, "address": "123 Main St", "name": "Home"}
  work_location JSONB DEFAULT NULL,
  saved_locations JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"name": "Costco", "lat": 37.78, "lng": -122.42, "tags": ["shopping"]}]
  
  -- Notification Settings
  notifications_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT false,
  
  notification_types JSONB DEFAULT '{
    "habits": true,
    "tasks": true,
    "calendar": true,
    "bills": true,
    "ai_suggestions": true,
    "location_reminders": true,
    "morning_briefing": true,
    "weekly_report": true
  }'::jsonb,
  
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  quiet_hours_exceptions JSONB DEFAULT '[]'::jsonb, -- e.g., ["urgent_tasks", "calendar_alerts"]
  
  -- AI Preferences
  ai_proactive_suggestions BOOLEAN DEFAULT true,
  ai_learning_enabled BOOLEAN DEFAULT true,
  ai_coaching_style TEXT DEFAULT 'supportive' CHECK (ai_coaching_style IN ('supportive', 'challenging', 'balanced', 'minimal')),
  ai_communication_style TEXT DEFAULT 'friendly' CHECK (ai_communication_style IN ('formal', 'friendly', 'brief', 'detailed')),
  
  -- Module Sharing Defaults (for new connections)
  default_sharing_permissions JSONB DEFAULT '{
    "journal": "private",
    "meals": "collaborate",
    "shopping": "collaborate",
    "tasks": "view",
    "habits": "private",
    "finances": "private",
    "goals": "view",
    "travel": "collaborate",
    "notes": "private"
  }'::jsonb,
  
  -- Misc preferences
  timezone TEXT DEFAULT 'America/Los_Angeles',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  week_starts_on INTEGER DEFAULT 0, -- 0=Sunday, 1=Monday
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT user_preferences_user_unique UNIQUE(user_id)
);

-- ============================================================================
-- PART 2: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_timezone ON user_preferences(timezone);

-- ============================================================================
-- PART 3: Row Level Security
-- ============================================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only view their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 4: Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- PART 5: Helper function to get or create preferences
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS user_preferences AS $$
DECLARE
  v_prefs user_preferences;
BEGIN
  SELECT * INTO v_prefs FROM user_preferences WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

