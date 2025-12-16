-- ============================================================================
-- Phase 0: Infrastructure Foundation - Automation Rules Table
-- Purpose: IFTTT-style automation rules for personal workflows
-- Enables: Custom triggers, recurring templates, smart rules
-- Safe to run multiple times (idempotent)
-- Created: December 15, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: Create automation_rules table
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rule metadata
  name TEXT NOT NULL,
  description TEXT DEFAULT NULL,
  
  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'schedule', 'event', 'condition')),
  trigger_config JSONB NOT NULL,
  -- Examples:
  -- Time: {"time": "09:00", "days": [1,2,3,4,5]}
  -- Schedule: {"cron": "0 9 * * MON"}
  -- Event: {"event": "task_completed", "conditions": {"project_id": "..."}}
  -- Condition: {"field": "spending_today", "operator": ">", "value": 100}
  
  -- Action configuration
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"type": "send_notification", "params": {"title": "...", "body": "..."}}]
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  -- Execution tracking
  last_triggered_at TIMESTAMPTZ DEFAULT NULL,
  trigger_count INTEGER DEFAULT 0,
  last_error TEXT DEFAULT NULL,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Auto-disable after failures
  max_consecutive_failures INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 2: Create automation_log table (for debugging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Execution details
  triggered_at TIMESTAMPTZ DEFAULT now(),
  trigger_reason TEXT DEFAULT NULL, -- What caused the trigger
  
  -- Results
  actions_executed JSONB DEFAULT '[]'::jsonb,
  success BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL,
  execution_time_ms INTEGER DEFAULT NULL
);

-- ============================================================================
-- PART 3: Indexes
-- ============================================================================

-- Active rules by user
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_active 
  ON automation_rules(user_id) WHERE enabled = true;

-- Time-based rules (for cron job)
CREATE INDEX IF NOT EXISTS idx_automation_rules_time_triggers 
  ON automation_rules(trigger_type, enabled) 
  WHERE trigger_type IN ('time', 'schedule') AND enabled = true;

-- Event-based rules (for real-time triggers)
CREATE INDEX IF NOT EXISTS idx_automation_rules_event_triggers 
  ON automation_rules(trigger_type, enabled)
  WHERE trigger_type = 'event' AND enabled = true;

-- Automation log by rule
CREATE INDEX IF NOT EXISTS idx_automation_log_rule 
  ON automation_log(rule_id, triggered_at DESC);

-- Automation log by user
CREATE INDEX IF NOT EXISTS idx_automation_log_user 
  ON automation_log(user_id, triggered_at DESC);

-- ============================================================================
-- PART 4: Row Level Security
-- ============================================================================

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_log ENABLE ROW LEVEL SECURITY;

-- Automation rules policies
CREATE POLICY "Users can view own rules" ON automation_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rules" ON automation_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rules" ON automation_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rules" ON automation_rules
  FOR DELETE USING (auth.uid() = user_id);

-- Automation log policies
CREATE POLICY "Users can view own logs" ON automation_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert logs (for background job)
CREATE POLICY "Service can insert logs" ON automation_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 5: Updated_at Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_automation_rules ON automation_rules;
CREATE TRIGGER trigger_update_automation_rules
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_rules_updated_at();

-- ============================================================================
-- PART 6: Helper function to log execution
-- ============================================================================

CREATE OR REPLACE FUNCTION log_automation_execution(
  p_rule_id UUID,
  p_success BOOLEAN,
  p_actions_executed JSONB DEFAULT '[]'::jsonb,
  p_error_message TEXT DEFAULT NULL,
  p_trigger_reason TEXT DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from rule
  SELECT user_id INTO v_user_id FROM automation_rules WHERE id = p_rule_id;
  
  -- Insert log entry
  INSERT INTO automation_log (
    rule_id, user_id, trigger_reason, actions_executed, 
    success, error_message, execution_time_ms
  )
  VALUES (
    p_rule_id, v_user_id, p_trigger_reason, p_actions_executed,
    p_success, p_error_message, p_execution_time_ms
  );
  
  -- Update rule stats
  UPDATE automation_rules
  SET 
    last_triggered_at = now(),
    trigger_count = trigger_count + 1,
    last_error = CASE WHEN p_success THEN NULL ELSE p_error_message END,
    consecutive_failures = CASE WHEN p_success THEN 0 ELSE consecutive_failures + 1 END,
    enabled = CASE 
      WHEN NOT p_success AND consecutive_failures + 1 >= max_consecutive_failures 
      THEN false 
      ELSE enabled 
    END
  WHERE id = p_rule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

