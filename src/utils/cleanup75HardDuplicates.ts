/**
 * Browser Cleanup Function for 75 Hard Duplicates
 *
 * Call this from browser console:
 * import('./utils/cleanup75HardDuplicates').then(m => m.cleanup75HardDuplicates())
 */

import { useAppStore } from '../stores/useAppStore';
import { logger } from '../services/logger';

export async function cleanup75HardDuplicates() {
  logger.debug('Utils', '🧹 Starting cleanup of duplicate 75 Hard tasks...');

  const store = useAppStore.getState();
  const todos = store.todos;

  // Filter for 75 Hard todos only
  const sfhTodos = todos.filter(todo => {
    const tags = Array.isArray(todo.tags) ? todo.tags : [];
    return tags.includes('75hard');
  });

  if (sfhTodos.length === 0) {
    logger.debug('Utils', '✅ No 75 Hard tasks found');
    return;
  }

  logger.debug('Utils', `📊 Found ${sfhTodos.length} total 75 Hard todos`);

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
      logger.debug('Utils', `🗑️  Duplicate: "${todo.title}"`);
    } else {
      uniqueMap.set(uniqueKey, todo);
      logger.debug('Utils', `✅ Keeping: "${todo.title}"`);
    }
  }

  logger.debug('Utils', `\n📊 Summary:`);
  logger.debug('Utils', `   Total: ${sfhTodos.length}`);
  logger.debug('Utils', `   Unique: ${uniqueMap.size}`);
  logger.debug('Utils', `   Duplicates: ${duplicates.length}`);

  if (duplicates.length === 0) {
    logger.debug('Utils', '\n✅ No duplicates to clean up!');
    return;
  }

  // Delete duplicates
  logger.debug('Utils', `\n🗑️  Deleting ${duplicates.length} duplicates...`);

  for (const id of duplicates) {
    await store.deleteTodo(id);
  }

  logger.debug('Utils', '\n✅ Cleanup complete!');
  logger.debug('Utils', `   Deleted ${duplicates.length} duplicate todos`);
  logger.debug('Utils', `   Kept ${uniqueMap.size} unique todos`);
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.cleanup75HardDuplicates = cleanup75HardDuplicates;
}
