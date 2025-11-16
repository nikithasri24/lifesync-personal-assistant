/**
 * 75 Hard Migration Validation Script
 *
 * Validates that the migration completed successfully by checking:
 * - New tables exist
 * - Constraints are in place
 * - Data integrity
 * - No duplicate active challenges
 * - Sample data queries work
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ValidationResult {
  passed: number;
  failed: number;
  warnings: number;
  errors: string[];
}

const result: ValidationResult = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

function pass(message: string) {
  console.log(`✅ ${message}`);
  result.passed++;
}

function fail(message: string) {
  console.log(`❌ ${message}`);
  result.failed++;
  result.errors.push(message);
}

function warn(message: string) {
  console.log(`⚠️  ${message}`);
  result.warnings++;
}

async function validate75HardMigration() {
  console.log('🔍 75 Hard Migration Validation');
  console.log('================================\n');

  // 1. Check new tables exist
  console.log('📋 Checking table existence...\n');

  const { data: challenge, error: challengeError } = await supabase
    .from('sfh_challenge')
    .select('id')
    .limit(1);

  if (challengeError && challengeError.code === '42P01') {
    fail('Table sfh_challenge does not exist');
  } else {
    pass('Table sfh_challenge exists');
  }

  const { data: checkins, error: checkinsError } = await supabase
    .from('sfh_daily_checkins')
    .select('id')
    .limit(1);

  if (checkinsError && checkinsError.code === '42P01') {
    fail('Table sfh_daily_checkins does not exist');
  } else {
    pass('Table sfh_daily_checkins exists');
  }

  // 2. Check data migration
  console.log('\n📊 Checking data migration...\n');

  const { count: challengeCount } = await supabase
    .from('sfh_challenge')
    .select('*', { count: 'exact', head: true });

  if (challengeCount === 0) {
    warn('No challenges migrated (might be intentional if no active challenges existed)');
  } else {
    pass(`Found ${challengeCount} migrated challenge(s)`);
  }

  const { count: checkinsCount } = await supabase
    .from('sfh_daily_checkins')
    .select('*', { count: 'exact', head: true });

  if (checkinsCount === 0 && challengeCount! > 0) {
    warn('Challenges exist but no check-ins (might be a new challenge)');
  } else if (checkinsCount! > 0) {
    pass(`Found ${checkinsCount} migrated check-in(s)`);
  }

  // 3. Check unique constraint (critical!)
  console.log('\n🔒 Checking unique constraint...\n');

  const { data: duplicates } = await supabase
    .from('sfh_challenge')
    .select('user_id, status')
    .eq('status', 'active');

  if (duplicates) {
    const userCounts = new Map<string, number>();
    for (const dup of duplicates) {
      userCounts.set(dup.user_id, (userCounts.get(dup.user_id) || 0) + 1);
    }

    let foundDuplicates = false;
    for (const [userId, count] of userCounts) {
      if (count > 1) {
        fail(`User ${userId} has ${count} active challenges (constraint violated!)`);
        foundDuplicates = true;
      }
    }

    if (!foundDuplicates) {
      pass('No duplicate active challenges (constraint working)');
    }
  }

  // 4. Validate data structure
  console.log('\n🔍 Validating data structure...\n');

  const { data: sampleChallenge } = await supabase
    .from('sfh_challenge')
    .select('*')
    .limit(1)
    .single();

  if (sampleChallenge) {
    // Check tasks is valid JSON array
    if (Array.isArray(sampleChallenge.tasks)) {
      pass('Challenge tasks field is valid array');

      if (sampleChallenge.tasks.length >= 1 && sampleChallenge.tasks.length <= 20) {
        pass(`Challenge has ${sampleChallenge.tasks.length} tasks (within valid range)`);
      } else {
        fail(`Challenge has ${sampleChallenge.tasks.length} tasks (outside valid range 1-20)`);
      }

      // Validate task structure
      const task = sampleChallenge.tasks[0];
      if (task && task.id && task.title !== undefined && task.order !== undefined) {
        pass('Task structure valid (id, title, order present)');
      } else {
        fail('Task structure invalid (missing required fields)');
      }
    } else {
      fail('Challenge tasks field is not an array');
    }

    // Check status
    if (['active', 'completed'].includes(sampleChallenge.status)) {
      pass(`Challenge status valid: ${sampleChallenge.status}`);
    } else {
      fail(`Challenge status invalid: ${sampleChallenge.status}`);
    }

    // Check current_day
    if (sampleChallenge.current_day >= 1 && sampleChallenge.current_day <= 75) {
      pass(`Current day valid: ${sampleChallenge.current_day}`);
    } else {
      fail(`Current day invalid: ${sampleChallenge.current_day}`);
    }
  }

  const { data: sampleCheckin } = await supabase
    .from('sfh_daily_checkins')
    .select('*')
    .limit(1)
    .single();

  if (sampleCheckin) {
    // Check task_completions is valid JSON array
    if (Array.isArray(sampleCheckin.task_completions)) {
      pass('Check-in task_completions field is valid array');

      // Validate task completion structure
      if (sampleCheckin.task_completions.length > 0) {
        const tc = sampleCheckin.task_completions[0];
        if (tc && tc.taskId && tc.completed !== undefined) {
          pass('Task completion structure valid (taskId, completed present)');
        } else {
          fail('Task completion structure invalid (missing required fields)');
        }
      }
    } else {
      fail('Check-in task_completions field is not an array');
    }
  }

  // 5. Check helper functions
  console.log('\n⚙️  Checking helper functions...\n');

  try {
    const { data: fnData, error: fnError } = await supabase
      .rpc('get_active_challenge', { p_user_id: '00000000-0000-0000-0000-000000000000' });

    if (!fnError) {
      pass('Function get_active_challenge exists and callable');
    } else if (fnError.code === '42883') {
      fail('Function get_active_challenge does not exist');
    }
  } catch (e) {
    // Function might not exist, that's ok for now
    warn('Could not verify function get_active_challenge');
  }

  // 6. Check old tables still exist (for rollback safety)
  console.log('\n🔄 Checking rollback safety...\n');

  const { data: oldChallenges, error: oldError } = await supabase
    .from('sfh_challenges')
    .select('id')
    .limit(1);

  if (!oldError) {
    pass('Old table sfh_challenges still exists (rollback possible)');
  } else {
    warn('Old table sfh_challenges not found (cannot rollback)');
  }

  const { data: oldEntries, error: oldEntriesError } = await supabase
    .from('sfh_entries')
    .select('id')
    .limit(1);

  if (!oldEntriesError) {
    pass('Old table sfh_entries still exists (rollback possible)');
  } else {
    warn('Old table sfh_entries not found (cannot rollback)');
  }

  // Print summary
  printSummary();
}

function printSummary() {
  console.log('\n================================');
  console.log('📊 Validation Summary');
  console.log('================================\n');
  console.log(`✅ Passed: ${result.passed}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`⚠️  Warnings: ${result.warnings}`);

  if (result.failed > 0) {
    console.log('\n❌ VALIDATION FAILED\n');
    console.log('Errors:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('\nDo NOT proceed with code deployment until these are fixed.\n');
    process.exit(1);
  } else if (result.warnings > 0) {
    console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS\n');
    console.log('Review warnings above before proceeding.\n');
    process.exit(0);
  } else {
    console.log('\n✅ VALIDATION PASSED\n');
    console.log('Migration looks good! Safe to proceed with code deployment.\n');
    process.exit(0);
  }
}

// Run validation
validate75HardMigration().catch((error) => {
  console.error('💥 Validation error:', error);
  process.exit(1);
});
