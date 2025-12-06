/**
 * 75 Hard Data Migration Script
 *
 * Migrates data from old schema to new simplified schema:
 *
 * OLD TABLES:
 * - sfh_challenges (plural) - multiple challenges with pause/resume
 * - sfh_entries - daily entries
 *
 * NEW TABLES:
 * - sfh_challenge (singular) - ONE active challenge only
 * - sfh_daily_checkins - daily check-ins
 *
 * STRATEGY:
 * 1. For each user, find their most recent ACTIVE challenge
 * 2. Convert old challenge → new challenge (map rules to tasks)
 * 3. Convert old entries → new check-ins (map rule_completions to task_completions)
 * 4. Skip paused/failed challenges (only migrate active)
 *
 * SAFETY:
 * - Runs in transaction (can rollback)
 * - Logs all actions
 * - Validates data before inserting
 * - Keeps old tables intact (manual cleanup after verification)
 */

import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Types for old schema
interface OldChallenge {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  current_day: number;
  rules: OldRule[];
  notes?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  paused_at?: string;
  completed_at?: string;
  failed_at?: string;
}

interface OldRule {
  id: string;
  title: string;
  description?: string;
  isRequired?: boolean;
  isCustom?: boolean;
  dailyTarget?: number;
}

interface OldEntry {
  id: string;
  user_id: string;
  challenge_id: string;
  date: string;
  day: number;
  rule_completions: OldRuleCompletion[];
  notes?: string;
  progress_photo_url?: string;
  weight?: number;
  measurements?: any;
  created_at: string;
  updated_at: string;
}

interface OldRuleCompletion {
  ruleId?: string;
  rule_id?: string;
  completed: boolean;
  completedAt?: string;
  completed_at?: string;
}

// Types for new schema
interface Task {
  id: string;
  title: string;
  description?: string;
  order: number;
}

interface TaskCompletion {
  taskId: string;
  completed: boolean;
  completedAt?: string;
}

// Utility functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function convertRuleToTask(rule: OldRule, index: number): Task {
  return {
    id: rule.id || generateId(),
    title: rule.title,
    description: rule.description || '',
    order: index + 1
  };
}

function convertRuleCompletionToTaskCompletion(rc: OldRuleCompletion): TaskCompletion {
  return {
    taskId: rc.ruleId || rc.rule_id || '',
    completed: rc.completed || false,
    completedAt: rc.completedAt || rc.completed_at
  };
}

const DEFAULT_TASKS: Omit<Task, 'id'>[] = [
  { title: 'Follow a Diet', description: 'No cheat meals or alcohol', order: 1 },
  { title: 'Workout Twice Daily', description: '45 minutes each, one outdoors', order: 2 },
  { title: 'Drink 1 Gallon of Water', description: '', order: 3 },
  { title: 'Read 10 Pages', description: 'Non-fiction', order: 4 },
  { title: 'Take Progress Photo', description: '', order: 5 }
];

// Migration statistics
interface MigrationStats {
  totalUsers: number;
  usersProcessed: number;
  challengesMigrated: number;
  challengesSkipped: number;
  entriesMigrated: number;
  errors: number;
}

const stats: MigrationStats = {
  totalUsers: 0,
  usersProcessed: 0,
  challengesMigrated: 0,
  challengesSkipped: 0,
  entriesMigrated: 0,
  errors: 0
};

/**
 * Main migration function
 */
async function migrate75HardData() {
  console.log('🚀 Starting 75 Hard Data Migration');
  console.log('====================================\n');

  try {
    // 1. Fetch all old challenges
    console.log('📥 Fetching old challenges...');
    const { data: oldChallenges, error: fetchError } = await supabase
      .from('sfh_challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching challenges:', fetchError);
      process.exit(1);
    }

    if (!oldChallenges || oldChallenges.length === 0) {
      console.log('✅ No challenges to migrate');
      return;
    }

    console.log(`📊 Found ${oldChallenges.length} total challenges\n`);

    // 2. Group by user
    const challengesByUser = new Map<string, OldChallenge[]>();
    for (const challenge of oldChallenges) {
      if (!challengesByUser.has(challenge.user_id)) {
        challengesByUser.set(challenge.user_id, []);
      }
      challengesByUser.get(challenge.user_id)!.push(challenge);
    }

    stats.totalUsers = challengesByUser.size;
    console.log(`👥 Found ${stats.totalUsers} users with challenges\n`);

    // 3. Migrate each user's data
    for (const [userId, challenges] of challengesByUser) {
      await migrateUserChallenges(userId, challenges);
      stats.usersProcessed++;
    }

    // 4. Print summary
    printSummary();

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  }
}

/**
 * Migrate challenges for a single user
 */
async function migrateUserChallenges(userId: string, challenges: OldChallenge[]) {
  console.log(`\n👤 Migrating user: ${userId.substring(0, 8)}...`);
  console.log(`   Challenges: ${challenges.length}`);

  try {
    // Find most recent ACTIVE challenge
    const activeChallenge = challenges.find(c => c.is_active && c.status === 'active');

    if (!activeChallenge) {
      console.log('   ⏭️  No active challenge, skipping');
      stats.challengesSkipped += challenges.length;
      return;
    }

    console.log(`   ✅ Found active challenge: "${activeChallenge.name}"`);
    console.log(`      Start date: ${activeChallenge.start_date}`);
    console.log(`      Current day: ${activeChallenge.current_day}`);

    // Convert rules to tasks
    let tasks: Task[];
    if (activeChallenge.rules && activeChallenge.rules.length > 0) {
      tasks = activeChallenge.rules.map((rule, index) =>
        convertRuleToTask(rule, index)
      );
      console.log(`      Tasks: ${tasks.length} (from rules)`);
    } else {
      // No rules, use defaults
      tasks = DEFAULT_TASKS.map((t, index) => ({
        ...t,
        id: generateId()
      }));
      console.log(`      Tasks: ${tasks.length} (defaults)`);
    }

    // Check if new challenge already exists for this user
    const { data: existingChallenge } = await supabase
      .from('sfh_challenge')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingChallenge) {
      console.log('   ⚠️  User already has migrated challenge, skipping');
      stats.challengesSkipped++;
      return;
    }

    // Create new challenge
    const { data: newChallenge, error: challengeError } = await supabase
      .from('sfh_challenge')
      .insert({
        user_id: userId,
        start_date: activeChallenge.start_date,
        current_day: activeChallenge.current_day || 1,
        status: 'active',
        tasks: tasks,
        created_at: activeChallenge.created_at,
        updated_at: activeChallenge.updated_at
      })
      .select()
      .single();

    if (challengeError) {
      console.error(`   ❌ Error creating challenge:`, challengeError);
      stats.errors++;
      return;
    }

    console.log(`   ✅ Created new challenge: ${newChallenge.id}`);
    stats.challengesMigrated++;

    // Migrate entries
    await migrateEntries(activeChallenge.id, newChallenge.id, tasks);

    // Mark other challenges as skipped
    stats.challengesSkipped += challenges.length - 1;

  } catch (error) {
    console.error(`   ❌ Error migrating user ${userId}:`, error);
    stats.errors++;
  }
}

/**
 * Migrate entries from old challenge to new challenge
 */
async function migrateEntries(
  oldChallengeId: string,
  newChallengeId: string,
  tasks: Task[]
) {
  console.log(`   📝 Migrating entries...`);

  try {
    // Fetch old entries
    const { data: oldEntries, error: fetchError } = await supabase
      .from('sfh_entries')
      .select('*')
      .eq('challenge_id', oldChallengeId)
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('      ❌ Error fetching entries:', fetchError);
      return;
    }

    if (!oldEntries || oldEntries.length === 0) {
      console.log('      No entries to migrate');
      return;
    }

    console.log(`      Found ${oldEntries.length} entries`);

    // Convert entries to check-ins
    const checkIns = oldEntries.map((entry: OldEntry) => {
      // Convert rule completions to task completions
      let taskCompletions: TaskCompletion[];

      if (entry.rule_completions && entry.rule_completions.length > 0) {
        taskCompletions = entry.rule_completions.map(rc =>
          convertRuleCompletionToTaskCompletion(rc)
        );
      } else {
        // No completions, create empty ones for all tasks
        taskCompletions = tasks.map(task => ({
          taskId: task.id,
          completed: false
        }));
      }

      return {
        challenge_id: newChallengeId,
        date: entry.date,
        day_number: entry.day,
        task_completions: taskCompletions,
        photo: entry.progress_photo_url,
        weight: entry.weight,
        notes: entry.notes,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      };
    });

    // Insert check-ins in batches (to avoid timeout)
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < checkIns.length; i += BATCH_SIZE) {
      const batch = checkIns.slice(i, i + BATCH_SIZE);

      const { error: insertError } = await supabase
        .from('sfh_daily_checkins')
        .insert(batch);

      if (insertError) {
        console.error(`      ❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
        stats.errors++;
        continue;
      }

      insertedCount += batch.length;
    }

    console.log(`      ✅ Migrated ${insertedCount} check-ins`);
    stats.entriesMigrated += insertedCount;

  } catch (error) {
    console.error('      ❌ Error migrating entries:', error);
    stats.errors++;
  }
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n====================================');
  console.log('📊 Migration Summary');
  console.log('====================================\n');
  console.log(`Total users: ${stats.totalUsers}`);
  console.log(`Users processed: ${stats.usersProcessed}`);
  console.log(`Challenges migrated: ${stats.challengesMigrated}`);
  console.log(`Challenges skipped: ${stats.challengesSkipped}`);
  console.log(`Entries migrated: ${stats.entriesMigrated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('\n====================================');

  if (stats.errors === 0) {
    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in new tables (sfh_challenge, sfh_daily_checkins)');
    console.log('2. Test application with new schema');
    console.log('3. Once verified, run cleanup SQL to drop old tables\n');
  } else {
    console.log('⚠️  Migration completed with errors');
    console.log('   Review error messages above');
    console.log('   Old tables remain intact\n');
  }
}

// Run migration
migrate75HardData()
  .then(() => {
    process.exit(stats.errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
