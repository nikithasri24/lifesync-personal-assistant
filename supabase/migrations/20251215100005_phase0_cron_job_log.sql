-- ============================================================================
-- Phase 0: Infrastructure Foundation - Cron Job Log Table
-- Purpose: Track background job executions for monitoring and debugging
-- Enables: Job monitoring, debugging, performance tracking
-- Safe to run multiple times (idempotent)
-- Created: December 15, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: Create cron_job_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cron_job_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job identification
  job_name TEXT NOT NULL,
  job_type TEXT DEFAULT 'scheduled' CHECK (job_type IN ('scheduled', 'manual', 'triggered')),
  
  -- Execution timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  duration_ms INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL 
      THEN EXTRACT(MILLISECONDS FROM (completed_at - started_at))::INTEGER
      ELSE NULL
    END
  ) STORED,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Results
  records_processed INTEGER DEFAULT 0,
  records_affected INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT DEFAULT NULL,
  error_stack TEXT DEFAULT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT NULL,
  -- Example: {"users_processed": 150, "notifications_sent": 45, "batch_id": "..."}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PART 2: Indexes
-- ============================================================================

-- Recent jobs by name
CREATE INDEX IF NOT EXISTS idx_cron_job_log_name_recent 
  ON cron_job_log(job_name, started_at DESC);

-- Failed jobs for alerting
CREATE INDEX IF NOT EXISTS idx_cron_job_log_failed 
  ON cron_job_log(started_at DESC) WHERE status = 'failed';

-- Running jobs (for detecting stuck jobs)
CREATE INDEX IF NOT EXISTS idx_cron_job_log_running 
  ON cron_job_log(started_at) WHERE status = 'running';

-- ============================================================================
-- PART 3: Row Level Security (admin only)
-- ============================================================================

ALTER TABLE cron_job_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access cron logs
CREATE POLICY "Service role full access" ON cron_job_log
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 4: Helper functions
-- ============================================================================

-- Start a job execution
CREATE OR REPLACE FUNCTION start_cron_job(
  p_job_name TEXT,
  p_job_type TEXT DEFAULT 'scheduled',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO cron_job_log (job_name, job_type, metadata)
  VALUES (p_job_name, p_job_type, p_metadata)
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a job successfully
CREATE OR REPLACE FUNCTION complete_cron_job(
  p_job_id UUID,
  p_records_processed INTEGER DEFAULT 0,
  p_records_affected INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE cron_job_log
  SET 
    status = 'completed',
    completed_at = now(),
    records_processed = p_records_processed,
    records_affected = p_records_affected,
    metadata = COALESCE(p_metadata, metadata)
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fail a job
CREATE OR REPLACE FUNCTION fail_cron_job(
  p_job_id UUID,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE cron_job_log
  SET 
    status = 'failed',
    completed_at = now(),
    error_message = p_error_message,
    error_stack = p_error_stack
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get job stats for monitoring dashboard
CREATE OR REPLACE FUNCTION get_cron_job_stats(p_days INTEGER DEFAULT 7)
RETURNS TABLE(
  job_name TEXT,
  total_runs BIGINT,
  successful_runs BIGINT,
  failed_runs BIGINT,
  avg_duration_ms NUMERIC,
  last_run TIMESTAMPTZ,
  last_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.job_name,
    COUNT(*)::BIGINT as total_runs,
    COUNT(*) FILTER (WHERE c.status = 'completed')::BIGINT as successful_runs,
    COUNT(*) FILTER (WHERE c.status = 'failed')::BIGINT as failed_runs,
    ROUND(AVG(c.duration_ms) FILTER (WHERE c.status = 'completed'), 1) as avg_duration_ms,
    MAX(c.started_at) as last_run,
    (SELECT status FROM cron_job_log WHERE job_name = c.job_name ORDER BY started_at DESC LIMIT 1) as last_status
  FROM cron_job_log c
  WHERE c.started_at >= now() - (p_days || ' days')::interval
  GROUP BY c.job_name
  ORDER BY last_run DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete
-- ============================================================================

