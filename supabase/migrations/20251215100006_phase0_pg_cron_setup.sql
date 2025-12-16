-- ============================================================================
-- Phase 0: Infrastructure Foundation - pg_cron Setup
-- Purpose: Configure scheduled jobs for background processing
-- IMPORTANT: pg_cron extension must be enabled in Supabase Dashboard first!
-- Go to: Database > Extensions > Search "pg_cron" > Enable
-- Created: December 15, 2025
-- ============================================================================

-- NOTE: This migration will fail if pg_cron is not enabled.
-- Uncomment the lines below after enabling pg_cron in your Supabase Dashboard.

-- ============================================================================
-- ENABLE PG_CRON (requires manual step in Dashboard first)
-- ============================================================================

-- This will fail if not enabled via Dashboard - that's expected
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- HELPER: Function to call Edge Function from pg_cron
-- ============================================================================

-- Note: This uses net extension which is available in Supabase
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- JOB SCHEDULING FUNCTIONS
-- ============================================================================

-- Create a function to invoke the Edge Function
CREATE OR REPLACE FUNCTION invoke_scheduled_job(
  p_job_type TEXT,
  p_params JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_url TEXT;
  v_payload JSONB;
BEGIN
  v_url := current_setting('app.settings.edge_function_url', true) 
    || '/process-scheduled-jobs';
  
  v_payload := jsonb_build_object(
    'job_type', p_job_type,
    'params', COALESCE(p_params, '{}'::jsonb)
  );
  
  -- Use net.http_post to call the Edge Function
  -- Note: This requires the pg_net extension
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', current_setting('app.settings.cron_secret', true)
    ),
    body := v_payload
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULE JOBS (uncomment after enabling pg_cron)
-- ============================================================================

-- Process notification queue every 5 minutes
-- SELECT cron.schedule(
--   'process-notifications',
--   '*/5 * * * *',
--   $$SELECT invoke_scheduled_job('process_notifications')$$
-- );

-- Aggregate daily analytics at midnight
-- SELECT cron.schedule(
--   'daily-analytics',
--   '0 0 * * *',
--   $$SELECT invoke_scheduled_job('daily_analytics')$$
-- );

-- Generate morning briefing at 5 AM (before most users wake up)
-- SELECT cron.schedule(
--   'morning-briefing',
--   '0 5 * * *',
--   $$SELECT invoke_scheduled_job('morning_briefing')$$
-- );

-- Generate weekly report on Sunday at 6 PM
-- SELECT cron.schedule(
--   'weekly-report',
--   '0 18 * * 0',
--   $$SELECT invoke_scheduled_job('weekly_report')$$
-- );

-- Check automation rules every 15 minutes
-- SELECT cron.schedule(
--   'automation-check',
--   '*/15 * * * *',
--   $$SELECT invoke_scheduled_job('automation_check')$$
-- );

-- Cleanup old data weekly on Sunday at 3 AM
-- SELECT cron.schedule(
--   'cleanup',
--   '0 3 * * 0',
--   $$SELECT invoke_scheduled_job('cleanup')$$
-- );

-- ============================================================================
-- MANUAL SCHEDULING INSTRUCTIONS
-- ============================================================================
-- 
-- After enabling pg_cron in Supabase Dashboard:
-- 
-- 1. Go to SQL Editor and run:
--    
--    SELECT cron.schedule(
--      'process-notifications',
--      '*/5 * * * *',
--      $$SELECT invoke_scheduled_job('process_notifications')$$
--    );
--    
-- 2. Verify jobs are scheduled:
--    SELECT * FROM cron.job;
--    
-- 3. Check job history:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- ============================================================================

-- ============================================================================
-- Store configuration in app.settings
-- ============================================================================

-- Note: Set these via Supabase Dashboard > Project Settings > Database > App Config
-- Or via SQL:
-- ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1';
-- ALTER DATABASE postgres SET app.settings.cron_secret = 'your-secret-here';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next Steps:
-- 1. Enable pg_cron extension in Supabase Dashboard
-- 2. Deploy the process-scheduled-jobs Edge Function
-- 3. Set app.settings.edge_function_url and app.settings.cron_secret
-- 4. Run the cron.schedule() commands above
-- ============================================================================

