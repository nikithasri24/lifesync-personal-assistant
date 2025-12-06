/**
 * Debug script to check 75 Hard data in database
 */

import { ensureSupabase } from '../lib/supabase';

async function debug75Hard() {
  const supabase = ensureSupabase();

  // Get user
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  console.log('User ID:', userId);

  // Get challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('sfh_challenge')
    .select('*')
    .eq('user_id', userId)
    .single();

  console.log('\n=== CHALLENGE DATA ===');
  console.log('ID:', challenge?.id);
  console.log('Start Date:', challenge?.start_date);
  console.log('Current Day:', challenge?.current_day);
  console.log('Status:', challenge?.status);
  console.log('Created At:', challenge?.created_at);
  console.log('Updated At:', challenge?.updated_at);
  console.log('Error:', challengeError);

  // Get check-ins
  const { data: checkIns, error: checkInsError } = await supabase
    .from('sfh_daily_checkins')
    .select('*')
    .eq('challenge_id', challenge?.id)
    .order('date', { ascending: true });

  console.log('\n=== CHECK-INS ===');
  console.log('Total check-ins:', checkIns?.length);
  checkIns?.forEach((ci, index) => {
    console.log(`\nCheck-in ${index + 1}:`);
    console.log('  ID:', ci.id);
    console.log('  Date:', ci.date);
    console.log('  Day Number:', ci.day_number);
    console.log('  Task Completions:', JSON.stringify(ci.task_completions));
  });
  console.log('Error:', checkInsError);
}

debug75Hard().then(() => {
  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}).catch(err => {
  console.error('Debug failed:', err);
  process.exit(1);
});
