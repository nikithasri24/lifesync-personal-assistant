// Supabase Edge Function: Process Scheduled Jobs
// This is the main dispatcher for all scheduled background jobs.
// Called by pg_cron at regular intervals.
// Deploy with: supabase functions deploy process-scheduled-jobs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Job types that can be dispatched
type JobType = 
  | 'process_notifications'
  | 'daily_analytics'
  | 'morning_briefing'
  | 'weekly_report'
  | 'automation_check'
  | 'cleanup';

interface JobRequest {
  job_type: JobType;
  params?: Record<string, unknown>;
}

// Create admin client for database operations
function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );
}

// Process pending notifications from the queue
async function processNotifications(supabase: ReturnType<typeof createAdminClient>) {
  const { data: notifications, error } = await supabase
    .rpc('get_pending_notifications', { p_limit: 100 });
  
  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);
  
  let processed = 0;
  let sent = 0;
  
  for (const notification of notifications || []) {
    processed++;
    
    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', notification.user_id)
      .eq('is_active', true);
    
    if (!subscriptions?.length) {
      // No active subscriptions, mark as sent (no-op)
      await supabase.rpc('mark_notification_sent', { p_notification_id: notification.id });
      continue;
    }
    
    // TODO: Actually send push notification using Web Push
    // For now, just mark as sent
    await supabase.rpc('mark_notification_sent', { p_notification_id: notification.id });
    sent++;
  }
  
  return { processed, sent };
}

// Aggregate daily analytics for all users
async function aggregateDailyAnalytics(supabase: ReturnType<typeof createAdminClient>) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get all active users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw new Error(`Failed to list users: ${usersError.message}`);
  
  let processed = 0;
  
  for (const user of users.users || []) {
    try {
      // Get task counts
      const { count: tasksCreated } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);
      
      // Get habit counts
      const { count: habitsCompleted } = await supabase
        .from('habit_entries')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .in('habit_id', 
          supabase.from('habits').select('id').eq('user_id', user.id)
        );
      
      // Get focus minutes
      const { data: focusSessions } = await supabase
        .from('focus_sessions')
        .select('duration')
        .eq('user_id', user.id)
        .gte('started_at', `${today}T00:00:00`)
        .lt('started_at', `${today}T23:59:59`);
      
      const focusMinutes = (focusSessions || []).reduce((sum, s) => sum + (s.duration || 0), 0);
      
      // Calculate productivity score (simple formula)
      const productivityScore = Math.min(100, Math.round(
        (tasksCompleted || 0) * 10 +
        (habitsCompleted || 0) * 15 +
        Math.min(focusMinutes / 2, 30)
      ));
      
      // Upsert analytics
      await supabase
        .from('analytics_daily')
        .upsert({
          user_id: user.id,
          date: today,
          tasks_created: tasksCreated || 0,
          tasks_completed: tasksCompleted || 0,
          habits_completed: habitsCompleted || 0,
          focus_sessions: (focusSessions || []).length,
          focus_minutes: focusMinutes,
          productivity_score: productivityScore,
        }, { onConflict: 'user_id,date' });
      
      processed++;
    } catch (err) {
      console.error(`Failed to aggregate for user ${user.id}:`, err);
    }
  }
  
  return { processed };
}

// Main handler
serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // Verify service role key for cron jobs
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // For cron jobs, use a simple shared secret
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('X-Cron-Secret');
  
  if (providedSecret !== cronSecret && !authHeader?.includes(serviceKey || '')) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const { job_type, params }: JobRequest = await req.json();
    const supabase = createAdminClient();

    // Start job logging
    const { data: jobLog } = await supabase
      .rpc('start_cron_job', {
        p_job_name: job_type,
        p_job_type: 'scheduled'
      });

    const jobId = jobLog;
    let result: Record<string, unknown> = {};

    try {
      // Dispatch to appropriate handler
      switch (job_type) {
        case 'process_notifications':
          result = await processNotifications(supabase);
          break;

        case 'daily_analytics':
          result = await aggregateDailyAnalytics(supabase);
          break;

        case 'morning_briefing':
          // TODO: Implement morning briefing generator
          result = { message: 'Morning briefing not yet implemented' };
          break;

        case 'weekly_report':
          // TODO: Implement weekly report generator
          result = { message: 'Weekly report not yet implemented' };
          break;

        case 'automation_check':
          // TODO: Implement automation rule checker
          result = { message: 'Automation check not yet implemented' };
          break;

        case 'cleanup':
          // Clean up old notifications and logs
          const { count: deletedNotifications } = await supabase
            .from('notification_queue')
            .delete({ count: 'exact' })
            .eq('status', 'sent')
            .lt('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

          const { count: deletedLogs } = await supabase
            .from('cron_job_log')
            .delete({ count: 'exact' })
            .lt('started_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

          result = { deletedNotifications, deletedLogs };
          break;

        default:
          throw new Error(`Unknown job type: ${job_type}`);
      }

      // Complete job successfully
      if (jobId) {
        await supabase.rpc('complete_cron_job', {
          p_job_id: jobId,
          p_records_processed: result.processed || 0,
          p_records_affected: result.sent || result.deletedNotifications || 0,
          p_metadata: result
        });
      }

      return new Response(JSON.stringify({
        success: true,
        job_type,
        result
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (jobError) {
      // Log job failure
      if (jobId) {
        await supabase.rpc('fail_cron_job', {
          p_job_id: jobId,
          p_error_message: jobError.message
        });
      }
      throw jobError;
    }

  } catch (error) {
    console.error('Error in process-scheduled-jobs:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

