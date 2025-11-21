/**
 * Cleanup Script: Remove Duplicate 75 Hard Tasks
 *
 * Run this once to clean up duplicate 75 Hard todos that were created
 * due to the race condition bug.
 */

import { ensureSupabase } from '../lib/supabase';
import { logger } from '../services/logger';


async function cleanup() {
  logger.info('Cleanup75HardDuplicates', '🧹 Starting cleanup of duplicate 75 Hard tasks...');

  const supabase = ensureSupabase();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    logger.error('Cleanup75HardDuplicates', '❌ No user found');
    return;
  }

  logger.debug('Cleanup75HardDuplicates', `👤 User: ${user.id}`);

  // Get all todos with 75hard tag
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .contains('tags', ['75hard'])
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Cleanup75HardDuplicates', '❌ Error fetching todos:', error);
    return;
  }

  if (!todos || todos.length === 0) {
    logger.info('Cleanup75HardDuplicates', '✅ No 75 Hard tasks found');
    return;
  }

  logger.debug('Cleanup75HardDuplicates', `📊 Found ${todos.length} total 75 Hard todos`);

  // Group by unique combination of challenge + day + task
  const uniqueMap = new Map<string, any>();
  const duplicates: string[] = [];

  for (const todo of todos) {
    const tags = Array.isArray(todo.tags) ? todo.tags : [];

    const challengeTag = tags.find((t: string) => t.startsWith('75hard:challenge-'));
    const dayTag = tags.find((t: string) => t.startsWith('75hard:day-'));
    const taskTag = tags.find((t: string) => t.startsWith('75hard:task-'));

    if (!challengeTag || !dayTag || !taskTag) {
      logger.warn('Cleanup75HardDuplicates', `⚠️  Todo ${todo.id} has incomplete tags, skipping`);
      continue;
    }

    const uniqueKey = `${challengeTag}-${dayTag}-${taskTag}`;

    if (uniqueMap.has(uniqueKey)) {
      // This is a duplicate - mark for deletion
      duplicates.push(todo.id);
      logger.debug('Cleanup75HardDuplicates', `🗑️  Duplicate found: "${todo.title}" (id: ${todo.id.slice(0, 8)}...)`);
    } else {
      // This is the first occurrence - keep it
      uniqueMap.set(uniqueKey, todo);
      logger.debug('Cleanup75HardDuplicates', `✅ Keeping: "${todo.title}" (id: ${todo.id.slice(0, 8)}...)`);
    }
  }

  logger.debug('Cleanup75HardDuplicates', `\n📊 Summary:`);
  logger.debug('Cleanup75HardDuplicates', `   Total todos: ${todos.length}`);
  logger.debug('Cleanup75HardDuplicates', `   Unique todos: ${uniqueMap.size}`);
  logger.debug('Cleanup75HardDuplicates', `   Duplicates: ${duplicates.length}`);

  if (duplicates.length === 0) {
    logger.info('Cleanup75HardDuplicates', '\n✅ No duplicates to clean up!');
    return;
  }

  // Delete duplicates
  logger.debug('Cleanup75HardDuplicates', `\n🗑️  Deleting ${duplicates.length} duplicate todos...`);

  const { error: deleteError } = await supabase
    .from('todos')
    .delete()
    .in('id', duplicates);

  if (deleteError) {
    logger.error('Cleanup75HardDuplicates', '❌ Error deleting duplicates:', deleteError);
    return;
  }

  logger.info('Cleanup75HardDuplicates', '\n✅ Cleanup complete!');
  logger.debug('Cleanup75HardDuplicates', `   Deleted ${duplicates.length} duplicate todos`);
  logger.debug('Cleanup75HardDuplicates', `   Kept ${uniqueMap.size} unique todos`);
}

cleanup()
  .then(() => {
    logger.info('Cleanup75HardDuplicates', '\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Cleanup75HardDuplicates', '\n❌ Cleanup failed:', error);
    process.exit(1);
  });
