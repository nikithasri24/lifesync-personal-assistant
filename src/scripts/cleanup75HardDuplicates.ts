/**
 * Cleanup Script: Remove Duplicate 75 Hard Tasks
 *
 * Run this once to clean up duplicate 75 Hard todos that were created
 * due to the race condition bug.
 */

import { ensureSupabase } from '../lib/supabase';

async function cleanup() {
  console.log('🧹 Starting cleanup of duplicate 75 Hard tasks...');

  const supabase = ensureSupabase();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No user found');
    return;
  }

  console.log(`👤 User: ${user.id}`);

  // Get all todos with 75hard tag
  const { data: todos, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .contains('tags', ['75hard'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching todos:', error);
    return;
  }

  if (!todos || todos.length === 0) {
    console.log('✅ No 75 Hard tasks found');
    return;
  }

  console.log(`📊 Found ${todos.length} total 75 Hard todos`);

  // Group by unique combination of challenge + day + task
  const uniqueMap = new Map<string, any>();
  const duplicates: string[] = [];

  for (const todo of todos) {
    const tags = Array.isArray(todo.tags) ? todo.tags : [];

    const challengeTag = tags.find((t: string) => t.startsWith('75hard:challenge-'));
    const dayTag = tags.find((t: string) => t.startsWith('75hard:day-'));
    const taskTag = tags.find((t: string) => t.startsWith('75hard:task-'));

    if (!challengeTag || !dayTag || !taskTag) {
      console.warn(`⚠️  Todo ${todo.id} has incomplete tags, skipping`);
      continue;
    }

    const uniqueKey = `${challengeTag}-${dayTag}-${taskTag}`;

    if (uniqueMap.has(uniqueKey)) {
      // This is a duplicate - mark for deletion
      duplicates.push(todo.id);
      console.log(`🗑️  Duplicate found: "${todo.title}" (id: ${todo.id.slice(0, 8)}...)`);
    } else {
      // This is the first occurrence - keep it
      uniqueMap.set(uniqueKey, todo);
      console.log(`✅ Keeping: "${todo.title}" (id: ${todo.id.slice(0, 8)}...)`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total todos: ${todos.length}`);
  console.log(`   Unique todos: ${uniqueMap.size}`);
  console.log(`   Duplicates: ${duplicates.length}`);

  if (duplicates.length === 0) {
    console.log('\n✅ No duplicates to clean up!');
    return;
  }

  // Delete duplicates
  console.log(`\n🗑️  Deleting ${duplicates.length} duplicate todos...`);

  const { error: deleteError } = await supabase
    .from('todos')
    .delete()
    .in('id', duplicates);

  if (deleteError) {
    console.error('❌ Error deleting duplicates:', deleteError);
    return;
  }

  console.log('\n✅ Cleanup complete!');
  console.log(`   Deleted ${duplicates.length} duplicate todos`);
  console.log(`   Kept ${uniqueMap.size} unique todos`);
}

cleanup()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
