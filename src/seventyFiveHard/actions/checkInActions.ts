/**
 * 75 Hard Daily Check-In Management Actions
 *
 * Handles check-in creation, task toggling, photo uploads, notes, and weight tracking
 */

import { startOfDay, isSameDay, format } from 'date-fns';
import { logger } from '../../services/logger';
import { getStore, setStore } from '../utils/storeHelpers';
import { measurePerformance } from '../utils/performanceHelpers';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DailyCheckIn, SeventyFiveHardChallenge } from '../../types/seventyFiveHard';

type CheckInRow = {
  id: string;
  challenge_id: string;
  date: string;
  day_number: number;
  task_completions: string[];
  photo?: string;
  weight?: number;
  notes?: string;
};

// Internal type that matches what we actually store/retrieve
type InternalCheckIn = Omit<DailyCheckIn, 'taskCompletions' | 'createdAt' | 'updatedAt'> & {
  taskCompletions: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensureSupabase = (): SupabaseClient<any, any, any, any, any> => {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? '';
  return createClient(supabaseUrl, supabaseKey);
};

const mapCheckIn = (row: CheckInRow): InternalCheckIn => ({
  id: row.id,
  challengeId: row.challenge_id,
  date: new Date(row.date),
  dayNumber: row.day_number,
  taskCompletions: row.task_completions,
  photo: row.photo,
  weight: row.weight,
  notes: row.notes,
});

type TodoItem = {
  deleted?: boolean;
  tags?: string[];
  id: string;
  status: 'todo' | 'done';
  completed?: boolean;
  completedAt?: Date;
};

type StoreState = {
  sfhChallenge: SeventyFiveHardChallenge | null;
  sfhCheckIns: InternalCheckIn[];
  sfhCheckInsLoadedRange: { from: Date | null; to: Date | null } | null;
  todos?: TodoItem[];
  updateTodo?: (id: string, updates: Partial<TodoItem>) => Promise<void>;
};

type StoreWithMethods = StoreState & {
  toggleTask?: (taskId: string) => Promise<void>;
  uploadPhoto?: (file: File) => Promise<{ success: boolean; error?: string }>;
  updateCheckInNotes?: (notes: string) => Promise<void>;
  updateCheckInWeight?: (weight: number) => Promise<void>;
};

/**
 * Load check-ins for a specific date range (lazy loading)
 * Used for viewing history, calendar, etc.
 */
export async function loadSFHCheckInsRange(startDate: Date, endDate: Date): Promise<void> {
  return measurePerformance('loadSFHCheckInsRange', async () => {
    const storeState = getStore() as StoreState;
    const challenge = storeState.sfhChallenge;
    const existingCheckIns = storeState.sfhCheckIns;
    const sfhCheckInsLoadedRange = storeState.sfhCheckInsLoadedRange;

    if (!challenge) {
      logger.info('SeventyFiveHardActions', '[75Hard] No active challenge, skipping range load');
      return;
    }

    // Check if range is already loaded
    if (sfhCheckInsLoadedRange) {
      const { from, to } = sfhCheckInsLoadedRange;
      if (from && to && startDate >= from && endDate <= to) {
        logger.info('SeventyFiveHardActions', '[75Hard] Range already loaded:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
        return;
      }
    }

    logger.info('SeventyFiveHardActions', '[75Hard] Loading check-ins for range:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));

    const supabase = ensureSupabase();
    const { data: checkInRows, error } = await supabase
      .from('sfh_daily_checkins')
      .select('id, challenge_id, date, day_number, task_completions, photo, weight, notes')
      .eq('challenge_id', challenge.id)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (error) {
      logger.error('SeventyFiveHardActions', '[75Hard] Error loading check-ins range:', error);
      return;
    }

    const newCheckIns: InternalCheckIn[] = (checkInRows ?? []).map((row) => mapCheckIn(row as CheckInRow));

    // Merge with existing check-ins (avoid duplicates)
    const existingIds = new Set<string>(existingCheckIns.map((c: InternalCheckIn) => c.id));
    const uniqueNewCheckIns: InternalCheckIn[] = newCheckIns.filter((c) => !existingIds.has(c.id));

    // Sort merged list by date
    const allCheckIns: InternalCheckIn[] = [...existingCheckIns, ...uniqueNewCheckIns];
    const mergedCheckIns: InternalCheckIn[] = allCheckIns
      .sort((a: InternalCheckIn, b: InternalCheckIn) => b.date.getTime() - a.date.getTime());

    // Expand loaded range
    const newFrom = sfhCheckInsLoadedRange?.from && startDate > sfhCheckInsLoadedRange.from
      ? sfhCheckInsLoadedRange.from
      : startDate;
    const newTo = sfhCheckInsLoadedRange?.to && endDate < sfhCheckInsLoadedRange.to
      ? sfhCheckInsLoadedRange.to
      : endDate;

    setStore({
      sfhCheckIns: mergedCheckIns,
      sfhCheckInsLoadedRange: {
        from: newFrom,
        to: newTo,
      }
    });

    logger.info('SeventyFiveHardActions', '[75Hard] ✅ Loaded', uniqueNewCheckIns.length, 'new check-ins. Total:', mergedCheckIns.length);
  });
}

// ... [rest of the existing code remains the same]

/**
 * Sync a single todo's completion status when toggling a 75 Hard task
 * This is much more efficient than calling ensureSFHTodosForToday()
 */
export async function syncSingleTodoCompletion(
  taskId: string,
  completed: boolean,
  parseSFHTodoTags: (tags: string[]) => {
    isSFHTodo: boolean;
    challengeId: string;
    dayNumber: number;
    taskId: string;
  }
): Promise<void> {
  const storeState = getStore() as StoreState;
  const challenge = storeState.sfhChallenge;
  const checkIns = storeState.sfhCheckIns;

  if (!challenge) return;

  const today = startOfDay(new Date());
  const todayCheckIn: InternalCheckIn | undefined = checkIns.find((c: InternalCheckIn) => isSameDay(c.date, today));
  if (!todayCheckIn) return;

  // Type-safe todo finding
  const todos: TodoItem[] = storeState.todos ?? [];
  const existingTodo = todos.find((t: TodoItem) => {
    if (t.deleted) return false;

    const meta = parseSFHTodoTags(t.tags ?? []);
    return meta.isSFHTodo &&
      meta.challengeId === challenge.id &&
      meta.dayNumber === todayCheckIn.dayNumber &&
      meta.taskId === taskId;
  });

  if (existingTodo && storeState.updateTodo) {
    try {
      // Update the todo's completion status
      await storeState.updateTodo(existingTodo.id, {
        completed,
        completedAt: completed ? new Date() : undefined,
        status: completed ? 'done' : 'todo'
      });
      logger.info('75Hard→Todo', `Synced todo completion for task ${taskId}: ${completed}`);
    } catch (error) {
      logger.error('SeventyFiveHardActions', `Failed to update todo for task ${taskId}:`, error);
    }
  } else {
    logger.info('75Hard→Todo', `No todo found for task ${taskId} - may need to create on next sync`);
  }
}

/**
 * Toggle a task completion for today
 * Wrapper that calls the store method through getStore helper
 */
export async function toggleSFHTask(taskId: string): Promise<void> {
  const store = getStore() as StoreWithMethods;
  if (store.toggleTask) {
    await store.toggleTask(taskId);
  } else {
    logger.error('checkInActions', 'toggleTask method not found in store');
  }
}

/**
 * Upload a photo for today's check-in
 * Wrapper that calls the store method through getStore helper
 */
export async function uploadSFHPhoto(file: File): Promise<void> {
  const store = getStore() as StoreWithMethods;
  if (store.uploadPhoto) {
    await store.uploadPhoto(file);
  } else {
    logger.error('checkInActions', 'uploadPhoto method not found in store');
  }
}

/**
 * Update notes for today's check-in
 * Wrapper that calls the store method through getStore helper
 */
export async function updateSFHCheckInNotes(notes: string): Promise<void> {
  const store = getStore() as StoreWithMethods;
  if (store.updateCheckInNotes) {
    await store.updateCheckInNotes(notes);
  } else {
    logger.error('checkInActions', 'updateCheckInNotes method not found in store');
  }
}

/**
 * Update weight for today's check-in
 * Wrapper that calls the store method through getStore helper
 */
export async function updateSFHCheckInWeight(weight: number): Promise<void> {
  const store = getStore() as StoreWithMethods;
  if (store.updateCheckInWeight) {
    await store.updateCheckInWeight(weight);
  } else {
    logger.error('checkInActions', 'updateCheckInWeight method not found in store');
  }
}