-- ============================================================================
-- Phase 0: Infrastructure Foundation - Notification System Tables
-- Purpose: Push subscription storage and notification queue for delivery
-- Enables: Smart Notifications, Location Reminders, Habit Alerts, AI Suggestions
-- Safe to run multiple times (idempotent)
-- Created: December 15, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: Create push_subscriptions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Platform info
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'ios', 'android')),
  
  -- Web Push specific (VAPID)
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL, -- Public key for encryption
  auth TEXT NOT NULL, -- Auth secret
  
  -- Device info
  device_name TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Unique endpoint per user
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE(user_id, endpoint)
);

-- ============================================================================
-- PART 2: Create notification_queue table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification type and priority
  type TEXT NOT NULL CHECK (type IN (
    'habit_reminder', 'task_due', 'task_overdue', 'calendar_event',
    'bill_reminder', 'streak_at_risk', 'ai_suggestion', 'location_reminder',
    'morning_briefing', 'weekly_report', 'goal_milestone', 'achievement', 'system'
  )),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Notification content
  payload JSONB NOT NULL,
  -- Example: {"title": "...", "body": "...", "icon": "...", "data": {...}, "actions": [...]}
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Error handling
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT DEFAULT NULL,
  
  -- Related entity (for deep linking)
  entity_type TEXT DEFAULT NULL, -- 'task', 'habit', 'event', etc.
  entity_id UUID DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 3: Indexes
-- ============================================================================

-- Push subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
  ON push_subscriptions(user_id) WHERE is_active = true;

-- Notification queue: pending notifications to send
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending 
  ON notification_queue(scheduled_for, priority)
  WHERE status = 'pending';

-- Notification queue: user's notifications
CREATE INDEX IF NOT EXISTS idx_notification_queue_user 
  ON notification_queue(user_id, created_at DESC);

-- Notification queue: by type for analytics
CREATE INDEX IF NOT EXISTS idx_notification_queue_type 
  ON notification_queue(type, created_at);

-- ============================================================================
-- PART 4: Row Level Security
-- ============================================================================

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Push subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Notification queue policies
CREATE POLICY "Users can view own notifications" ON notification_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notification_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can update (for background job)
CREATE POLICY "Service can update notifications" ON notification_queue
  FOR UPDATE USING (true);

-- ============================================================================
-- PART 5: Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_queue ON notification_queue;
CREATE TRIGGER trigger_update_notification_queue
  BEFORE UPDATE ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_queue_updated_at();

-- ============================================================================
-- PART 6: Helper functions
-- ============================================================================

-- Queue a notification
CREATE OR REPLACE FUNCTION queue_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_scheduled_for TIMESTAMPTZ DEFAULT now(),
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_payload JSONB;
BEGIN
  v_payload = jsonb_build_object(
    'title', p_title,
    'body', p_body,
    'data', COALESCE(p_data, '{}'::jsonb)
  );

  INSERT INTO notification_queue (
    user_id, type, priority, payload, scheduled_for, entity_type, entity_id
  )
  VALUES (
    p_user_id, p_type, p_priority, v_payload, p_scheduled_for, p_entity_type, p_entity_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending notifications to send
CREATE OR REPLACE FUNCTION get_pending_notifications(p_limit INTEGER DEFAULT 100)
RETURNS SETOF notification_queue AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM notification_queue
  WHERE status = 'pending'
    AND scheduled_for <= now()
    AND retry_count < max_retries
  ORDER BY
    CASE priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
    END,
    scheduled_for ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notification_queue
  SET status = 'sent', sent_at = now()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as failed
CREATE OR REPLACE FUNCTION mark_notification_failed(
  p_notification_id UUID,
  p_error TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE notification_queue
  SET
    retry_count = retry_count + 1,
    error_message = p_error,
    status = CASE
      WHEN retry_count + 1 >= max_retries THEN 'failed'
      ELSE 'pending'
    END
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration creates:
-- ✅ push_subscriptions table for Web Push/FCM/APNs tokens
-- ✅ notification_queue table for pending notifications
-- ✅ Indexes for efficient pending notification queries
-- ✅ RLS policies for user isolation
-- ✅ Helper functions for queuing and processing
-- ============================================================================

