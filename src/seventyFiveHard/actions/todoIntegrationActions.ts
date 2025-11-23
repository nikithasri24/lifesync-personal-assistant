/**
 * 75 Hard Todo System Integration Actions
 *
 * Handles bidirectional sync between 75 Hard tasks and the todo system
 */

import { startOfDay, isSameDay } from 'date-fns';
import { logger } from '../../services/logger';
import type { Task, SeventyFiveHardChallenge, DailyCheckIn, TaskCompletion } from '../../types/seventyFiveHard';
import type { Task as FocusTask } from '../../types/focusEnhanced';
import { getStore } from '../utils/storeHelpers';
import { measurePerformance } from '../utils/performanceHelpers';
import { toggleSFHTask } from './checkInActions';

// Type augmentation for store methods that aren't in RealAppState interface
// These methods exist at runtime but aren't typed in the interface
interface TodoStoreMethods {
  todos: FocusTask[];
  addTodo: (todo: Partial<FocusTask>) => Promise<FocusTask>;
  updateTodo: (id: string, updates: Partial<FocusTask>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

/**
 * Tag constants for identifying 75 Hard todos
 */
const TODO_TAGS = {
  MARKER: '75hard',
  challenge: (challengeId: string) => `75hard:challenge-${challengeId}`,
  day: (dayNumber: number) => `75hard:day-${dayNumber}`,
  task: (taskId: string) => `75hard:task-${taskId}`,
} as const;

/**
 * Parse tags from a todo to extract 75 Hard metadata
 */
function parseSFHTodoTags(tags: string[]): {
  isSFHTodo: boolean;
  challengeId?: string;
  dayNumber?: number;
  taskId?: string;
} {
  const isSFHTodo = tags.includes(TODO_TAGS.MARKER);
  if (!isSFHTodo) return { isSFHTodo: false };

  const challengeTag = tags.find(t => t.startsWith('75hard:challenge-'));
  const dayTag = tags.find(t => t.startsWith('75hard:day-'));
  const taskTag = tags.find(t => t.startsWith('75hard:task-'));

  return {
    isSFHTodo: true,
    challengeId: challengeTag?.split('-')[1],
    dayNumber: dayTag ? parseInt(dayTag.split('-')[1], 10) : undefined,
    taskId: taskTag?.split('-')[1],
  };
}

// Track ensureSFHTodosForToday execution to prevent race conditions
let ensuringTodosPromise: Promise<void> | null = null;
let lastEnsureTime = 0;
const ENSURE_DEBOUNCE_MS = 2000; // Minimum 2 seconds between executions (increased from 1 second)
let ensureCallCount = 0; // Track how many times we've been called

// CRITICAL: In-memory cache to track created/updated todos
// This prevents duplicate creation when store state hasn't updated yet
interface TodoCacheEntry {
  challengeId: string;
  dayNumber: number;
  taskId: string;
  todoId: string;
  timestamp: number;
}
const todoCreationCache = new Map<string, TodoCacheEntry>();
const CACHE_TTL_MS = 5000; // Cache entries expire after 5 seconds

// Helper to create cache key
function getTodoCacheKey(challengeId: string, dayNumber: number, taskId: string): string {
  return `${challengeId}:${dayNumber}:${taskId}`;
}

// Helper to clean expired cache entries
function cleanExpiredCacheEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  todoCreationCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach(key => todoCreationCache.delete(key));

  if (expiredKeys.length > 0) {
    logger.info('75Hard→Todo', `🧹 Cleaned ${expiredKeys.length} expired cache entries`);
  }
}

/**
 * Create or update a todo from a 75 Hard task
 * Returns the todo ID
 *
 * IMPORTANT: This function implements idempotent deduplication.
 * It checks for existing todos by challengeId + dayNumber + taskId before creating.
 * The parent function (ensure75HardTodosForToday) has execution guards to prevent concurrent calls.
 */
async function createOrUpdateTodoFromSFHTask(
  challengeId: string,
  task: Task,
  dayNumber: number,
  completed: boolean
): Promise<string | null> {
  try {
    const today = startOfDay(new Date());
    const cacheKey = getTodoCacheKey(challengeId, dayNumber, task.id);

    logger.info('75Hard→Todo', `Processing task: "${task.title}" (day ${dayNumber})`);

    // GUARD 1: Check in-memory cache FIRST (fastest, most reliable)
    const cachedEntry = todoCreationCache.get(cacheKey);
    if (cachedEntry) {
      logger.info('75Hard→Todo', `💾 Found in cache (id: ${cachedEntry.todoId.slice(0, 8)}) - skipping duplicate creation`);
      // Update completion status if needed
      const updateStore = getStore() as typeof getStore & TodoStoreMethods;
      const existingInStore = updateStore.todos.find(t => t.id === cachedEntry.todoId);
      if (existingInStore?.completedAt !== undefined && existingInStore.status !== (completed ? 'completed' : 'todo')) {
        await updateStore.updateTodo(cachedEntry.todoId, { status: completed ? 'completed' : 'todo' });
        logger.info('75Hard→Todo', `✅ Updated completion status for "${task.title}"`);
      }
      return cachedEntry.todoId;
    }

    // GUARD 2: Check store state (in case cache was cleared but todo exists)
    const freshStore = getStore() as ReturnType<typeof getStore> & TodoStoreMethods;
    const existingTodo = freshStore.todos.find(t => {
      // Note: FocusTask doesn't have a 'deleted' property, checking status instead
      if (t.status === 'cancelled') return false;

      const meta = parseSFHTodoTags(t.tags);
      const matches = meta.isSFHTodo &&
        meta.challengeId === challengeId &&
        meta.dayNumber === dayNumber &&
        meta.taskId === task.id;

      return matches;
    });

    if (existingTodo) {
      logger.info('75Hard→Todo', `✓ Found existing todo (id: ${existingTodo.id.slice(0, 8)})`);
    } else {
      logger.info('75Hard→Todo', `✗ No existing todo found`);
    }

    const todoData: Partial<FocusTask> = {
      title: `🔥 ${task.title}`,
      description: task.description ?? `75 Hard - Day ${dayNumber}`,
      status: (completed ? 'completed' : 'todo') as const,
      priority: 'high' as const,
      tags: [
        TODO_TAGS.MARKER,         // '75hard' - main marker
        TODO_TAGS.challenge(challengeId),  // '75hard:challenge-{id}'
        TODO_TAGS.day(dayNumber),          // '75hard:day-{number}'
        TODO_TAGS.task(task.id),           // '75hard:task-{id}'
      ],
      dueDate: today,
      completedAt: completed ? new Date() : undefined,
    };

    if (existingTodo) {
      // Found in store - update and add to cache
      logger.info('75Hard→Todo', `✓ Found in store (id: ${existingTodo.id.slice(0, 8)})`);

      const updateStore = getStore() as ReturnType<typeof getStore> & TodoStoreMethods;
      await updateStore.updateTodo(existingTodo.id, {
        ...todoData,
        completedAt: completed ? (existingTodo.completedAt ?? new Date()) : undefined,
      });

      // Add to cache to prevent future duplicates
      todoCreationCache.set(cacheKey, {
        challengeId,
        dayNumber,
        taskId: task.id,
        todoId: existingTodo.id,
        timestamp: Date.now()
      });

      logger.info('75Hard→Todo', `✅ Updated "${task.title}" + cached`);
      return existingTodo.id;
    } else {
      // Create new todo and immediately add to cache
      logger.info('75Hard→Todo', `✗ Not found - creating new todo`);

      const createStore = getStore() as ReturnType<typeof getStore> & TodoStoreMethods;
      const newTodo = await createStore.addTodo(todoData);

      // CRITICAL: Add to cache IMMEDIATELY to prevent duplicate creation
      todoCreationCache.set(cacheKey, {
        challengeId,
        dayNumber,
        taskId: task.id,
        todoId: newTodo.id,
        timestamp: Date.now()
      });

      logger.info('75Hard→Todo', `✅ Created "${task.title}" (id: ${newTodo.id.slice(0, 8)}) + cached`);
      return newTodo.id;
    }
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard→Todo] ❌ Error creating/updating todo:', error);
    return null;
  }
}

/**
 * Delete todos from previous days to keep the list clean
 */
async function cleanupOldSFHTodos(challengeId: string, currentDay: number): Promise<void> {
  const store = getStore() as ReturnType<typeof getStore> & TodoStoreMethods;
  const today = startOfDay(new Date());

  logger.info('75Hard→Todo', `🧹 Cleanup: current day=${currentDay}, today=${today.toISOString()}`);

  // Filter todos that need deletion first, then delete in parallel
  const todosToDelete = store.todos.filter(todo => {
    // Note: FocusTask uses 'cancelled' status, not a 'deleted' flag
    if (todo.status === 'cancelled') return false;

    const meta = parseSFHTodoTags(todo.tags);
    if (!meta.isSFHTodo || meta.challengeId !== challengeId) return false;

    // Delete if from previous day OR if due date is before today
    const isPreviousDay = meta.dayNumber !== undefined && meta.dayNumber < currentDay;
    const isOldDueDate = todo.dueDate !== undefined && todo.dueDate < today;

    const shouldDelete = isPreviousDay ?? isOldDueDate;

    if (shouldDelete) {
      logger.info('75Hard→Todo', `Will delete: "${todo.title}", day=${meta.dayNumber ?? 'N/A'}, dueDate=${todo.dueDate?.toISOString() ?? 'N/A'}, isPreviousDay=${isPreviousDay}, isOldDueDate=${isOldDueDate}`);
    }

    return shouldDelete;
  });

  logger.info('75Hard→Todo', `Found ${todosToDelete.length} old todos to delete`);

  // Delete all old todos in parallel
  if (todosToDelete.length > 0) {
    await Promise.all(
      todosToDelete.map(todo => {
        const meta = parseSFHTodoTags(todo.tags);
        logger.info('75Hard→Todo', `❌ Deleting old todo for Day ${meta.dayNumber ?? 'N/A'}: "${todo.title}"`);

        // Also remove from cache
        if (meta.challengeId && meta.dayNumber !== undefined && meta.taskId) {
          const cacheKey = getTodoCacheKey(meta.challengeId, meta.dayNumber, meta.taskId);
          if (todoCreationCache.has(cacheKey)) {
            todoCreationCache.delete(cacheKey);
            logger.info('75Hard→Todo', `🗑️  Removed from cache: ${cacheKey}`);
          }
        }

        return store.deleteTodo(todo.id);
      })
    );
  }
}

/**
 * Ensure todos exist for today's 75 Hard tasks
 * Called lazily when 75 Hard page loads (not on app startup)
 *
 * OPTIMIZATION: This function is now called lazily when user visits 75 Hard page,
 * saving ~750ms on app load for users who don't use 75 Hard.
 *
 * CRITICAL: Protected against concurrent execution to prevent duplicate task creation.
 * Uses promise guard + time-based debouncing + in-memory cache.
 */
export async function ensure75HardTodosForToday(): Promise<void> {
  ensureCallCount++;
  logger.info('75Hard→Todo', `🔍 ensure75HardTodosForToday() called (call #${ensureCallCount})`);

  // Clean expired cache entries first
  cleanExpiredCacheEntries();

  // GUARD 1: If already running, return the existing promise
  if (ensuringTodosPromise) {
    logger.info('SeventyFiveHardActions', '[75Hard→Todo] ⏸️  Execution already in progress, waiting for completion...');
    return ensuringTodosPromise;
  }

  // GUARD 2: Debounce - skip if called too recently (within 2 seconds)
  const now = Date.now();
  const timeSinceLastEnsure = now - lastEnsureTime;
  if (lastEnsureTime > 0 && timeSinceLastEnsure < ENSURE_DEBOUNCE_MS) {
    logger.info('75Hard→Todo', `⏭️  SKIPPED - called ${timeSinceLastEnsure}ms ago (debounce: ${ENSURE_DEBOUNCE_MS}ms) - preventing duplicate creation`);
    logger.info('75Hard→Todo', `📊 Cache status: ${todoCreationCache.size} entries cached`);
    return;
  }

  // Mark execution start time
  lastEnsureTime = now;

  // Create promise and store it to prevent concurrent executions
  ensuringTodosPromise = measurePerformance('ensure75HardTodosForToday:execution', async () => {
    try {
      logger.info('SeventyFiveHardActions', '[75Hard→Todo] ▶️  Starting execution...');

      const store = getStore();
      const challenge = store.sfhChallenge;
      const checkIns = store.sfhCheckIns;

      if (!challenge || challenge.status !== 'active') {
        logger.info('SeventyFiveHardActions', '[75Hard→Todo] No active challenge, skipping todo sync');
        return;
      }

      const today = startOfDay(new Date());
      const todayCheckIn = checkIns.find((c: DailyCheckIn) => isSameDay(c.date, today));

      if (!todayCheckIn) {
        logger.info('SeventyFiveHardActions', '[75Hard→Todo] No check-in for today, skipping todo sync');
        return;
      }

      logger.info('SeventyFiveHardActions', '[75Hard→Todo] Processing', challenge.tasks.length, 'tasks for Day', todayCheckIn.dayNumber);

      // Create completion map for O(1) lookups
      const completionMap = new Map<string, boolean>();
      todayCheckIn.taskCompletions.forEach((tc: TaskCompletion) => {
        completionMap.set(tc.taskId, tc.completed);
      });

      // Create/update todos in parallel for better performance
      const todoPromises = challenge.tasks.map((task: Task) => {
        const isCompleted = completionMap.get(task.id) ?? false;
        return createOrUpdateTodoFromSFHTask(
          challenge.id,
          task,
          todayCheckIn.dayNumber,
          isCompleted
        );
      });

      await Promise.all(todoPromises);

      // Cleanup: Delete todos for previous days
      await cleanupOldSFHTodos(challenge.id, todayCheckIn.dayNumber);

      logger.info('SeventyFiveHardActions', '[75Hard→Todo] ✅ Execution complete');
      logger.info('75Hard→Todo', `📊 Cache status: ${todoCreationCache.size} entries cached for future calls`);
    } catch (error) {
      logger.error('SeventyFiveHardActions', '[75Hard→Todo] ❌ Error during execution:', error);
      throw error;
    } finally {
      // Clear the promise to allow future executions
      ensuringTodosPromise = null;
    }
  });

  return ensuringTodosPromise;
}

/**
 * Sync todo completion to 75 Hard task
 * Called when user checks off a 75 Hard todo
 */
export async function syncTodoCompletionToSFH(todoId: string): Promise<void> {
  const store = getStore() as ReturnType<typeof getStore> & TodoStoreMethods;
  const todo = store.todos.find(t => t.id === todoId);
  if (!todo) return;

  const meta = parseSFHTodoTags(todo.tags);
  if (!meta.isSFHTodo) return;

  const { taskId } = meta;
  if (!taskId) return;

  logger.info('SeventyFiveHardActions', '[Todo→75Hard] Syncing completion to 75 Hard task:', taskId);

  // Toggle the 75 Hard task
  await toggleSFHTask(taskId);
}

/**
 * Check if a todo is a 75 Hard todo
 */
export function isSFHTodo(todo: { tags: string[] }): boolean {
  return todo.tags.includes(TODO_TAGS.MARKER);
}
