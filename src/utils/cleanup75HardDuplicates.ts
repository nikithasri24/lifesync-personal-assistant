/**
 * Browser Cleanup Function for 75 Hard Duplicates
 *
 * Call this from browser console:
 * import('./utils/cleanup75HardDuplicates').then(m => m.cleanup75HardDuplicates())
 */

import { useAppStore } from '../stores/useAppStore';

export async function cleanup75HardDuplicates() {
  console.log('🧹 Starting cleanup of duplicate 75 Hard tasks...');

  const store = useAppStore.getState();
  const todos = store.todos;

  // Filter for 75 Hard todos only
  const sfhTodos = todos.filter(todo => {
    const tags = Array.isArray(todo.tags) ? todo.tags : [];
    return tags.includes('75hard');
  });

  if (sfhTodos.length === 0) {
    console.log('✅ No 75 Hard tasks found');
    return;
  }

  console.log(`📊 Found ${sfhTodos.length} total 75 Hard todos`);

  // Group by unique combination
  const uniqueMap = new Map<string, any>();
  const duplicates: string[] = [];

  for (const todo of sfhTodos) {
    const tags = Array.isArray(todo.tags) ? todo.tags : [];

    const challengeTag = tags.find((t: string) => t.startsWith('75hard:challenge-'));
    const dayTag = tags.find((t: string) => t.startsWith('75hard:day-'));
    const taskTag = tags.find((t: string) => t.startsWith('75hard:task-'));

    if (!challengeTag || !dayTag || !taskTag) {
      continue;
    }

    const uniqueKey = `${challengeTag}-${dayTag}-${taskTag}`;

    if (uniqueMap.has(uniqueKey)) {
      duplicates.push(todo.id);
      console.log(`🗑️  Duplicate: "${todo.title}"`);
    } else {
      uniqueMap.set(uniqueKey, todo);
      console.log(`✅ Keeping: "${todo.title}"`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${sfhTodos.length}`);
  console.log(`   Unique: ${uniqueMap.size}`);
  console.log(`   Duplicates: ${duplicates.length}`);

  if (duplicates.length === 0) {
    console.log('\n✅ No duplicates to clean up!');
    return;
  }

  // Delete duplicates
  console.log(`\n🗑️  Deleting ${duplicates.length} duplicates...`);

  for (const id of duplicates) {
    await store.deleteTodo(id);
  }

  console.log('\n✅ Cleanup complete!');
  console.log(`   Deleted ${duplicates.length} duplicate todos`);
  console.log(`   Kept ${uniqueMap.size} unique todos`);
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).cleanup75HardDuplicates = cleanup75HardDuplicates;
}
