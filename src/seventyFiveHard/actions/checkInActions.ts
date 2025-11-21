/**
 * 75 Hard Daily Check-In Management Actions
 *
 * Handles check-in creation, task toggling, photo uploads, notes, and weight tracking
 */

import { startOfDay, differenceInDays, isSameDay, format } from 'date-fns';
import { logger } from '../../services/logger';
import { ensureSupabase } from '../../lib/supabase';
import {
  mapRowToCheckIn as mapCheckIn,
  createInitialTaskCompletions as createTasks,
  CHALLENGE_CONSTANTS as constants,
} from '../../types/seventyFiveHard';
import type { CheckInRow } from '../../types/seventyFiveHard';
import { getStore, setStore } from '../utils/storeHelpers';
import { measurePerformance } from '../utils/performanceHelpers';
import { completeSFHChallenge } from './challengeActions';
import { create75HardJournalEntry } from './journalActions';
import { syncTodoCompletionToSFH } from './todoIntegrationActions';

/**
 * Load check-ins for a specific date range (lazy loading)
 * Used for viewing history, calendar, etc.
 */
export async function loadSFHCheckInsRange(startDate: Date, endDate: Date) {
  return measurePerformance('loadSFHCheckInsRange', async () => {
    const { sfhChallenge: challenge, sfhCheckIns: existingCheckIns, sfhCheckInsLoadedRange } = getStore();
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

    const newCheckIns = (checkInRows || []).map((row: CheckInRow) => mapCheckIn(row));

    // Merge with existing check-ins (avoid duplicates)
    const existingIds = new Set(existingCheckIns.map(c => c.id));
    const uniqueNewCheckIns = newCheckIns.filter(c => !existingIds.has(c.id));

    // Sort merged list by date
    const mergedCheckIns = [...existingCheckIns, ...uniqueNewCheckIns]
      .sort((a, b) => b.date.getTime() - a.date.getTime());

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

/**
 * Ensure today's check-in exists
 *
 * OPTIMIZATION: No longer calls ensureSFHTodosForToday() automatically.
 * Todos are now created lazily when user visits 75 Hard page.
 */
export async function ensureTodaySFHCheckIn() {
  return measurePerformance('ensureTodaySFHCheckIn', async () => {
    const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
    if (!challenge) return;

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

    if (!todayCheckIn) {
      logger.info('SeventyFiveHardActions', '[75Hard] Creating today check-in');

      const supabase = ensureSupabase();
      const taskCompletions = createTasks(challenge.tasks);

      // Calculate day number from date difference (not from current_day)
      const dayNumber = differenceInDays(today, startOfDay(challenge.startDate)) + 1;

      // Use upsert to prevent duplicate check-ins (race condition safe)
      const { data: newCheckIn } = await supabase
        .from('sfh_daily_checkins')
        .upsert({
          challenge_id: challenge.id,
          date: format(today, 'yyyy-MM-dd'),
          day_number: dayNumber,
          task_completions: taskCompletions,
        }, {
          onConflict: 'challenge_id,date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (newCheckIn) {
        // Update current_day to match the day we just created
        await supabase
          .from('sfh_challenge')
          .update({
            current_day: dayNumber,
          })
          .eq('id', challenge.id);

        const mappedCheckIn = mapCheckIn(newCheckIn as CheckInRow);
        setStore({ sfhCheckIns: [...checkIns, mappedCheckIn] });
        logger.info('SeventyFiveHardActions', '[75Hard] Today check-in created and added to store');

        // OPTIMIZATION REMOVED: We no longer call ensureSFHTodosForToday() here
        // Todos will be created lazily when user visits the 75 Hard page
        // This saves ~750ms on app load for users who don't use 75 Hard
        logger.info('SeventyFiveHardActions', '[75Hard] Todos will be created when 75 Hard page loads (lazy loading)');
      }
    }
  });
}

// Track tasks currently being toggled to prevent race conditions
const togglingTasks = new Set<string>();

/**
 * Toggle task completion
 */
export async function toggleSFHTask(taskId: string) {
  // Prevent concurrent toggles of the same task
  if (togglingTasks.has(taskId)) {
    logger.info('SeventyFiveHardActions', '[75Hard] Task toggle already in progress, ignoring duplicate request');
    return;
  }

  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) {
    logger.error('SeventyFiveHardActions', '[75Hard] toggleSFHTask called without challenge');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    logger.error('SeventyFiveHardActions', '[75Hard] No check-in for today');
    getStore().showGlobalToast?.('No check-in found for today. Please refresh the page.', 'error');
    return;
  }

  // Mark task as being toggled
  togglingTasks.add(taskId);

  try {
    const supabase = ensureSupabase();

    const updatedCompletions = todayCheckIn.taskCompletions.map(tc =>
      tc.taskId === taskId
        ? {
            ...tc,
            completed: !tc.completed,
            completedAt: !tc.completed ? new Date() : undefined,
          }
        : tc
    );

    // Optimistic update
    setStore({
      sfhCheckIns: checkIns.map(c =>
        c.id === todayCheckIn.id ? { ...c, taskCompletions: updatedCompletions } : c
      ),
    });

    const { error } = await supabase
      .from('sfh_daily_checkins')
      .update({
        task_completions: updatedCompletions,
      })
      .eq('id', todayCheckIn.id);

    if (error) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to toggle task:', error);
      // Revert optimistic update
      setStore({
        sfhCheckIns: checkIns
      });
      getStore().showGlobalToast?.('Failed to update task. Please try again.', 'error');
      return;
    }

    // Check if all tasks complete (only if no error)
    const allComplete = updatedCompletions.every(tc => tc.completed);

    if (allComplete) {
      logger.info('SeventyFiveHardActions', '[75Hard] ✅ All tasks complete for today!');
      setStore({ sfhShowDayCompleteMessage: true });

      setTimeout(() => {
        setStore({ sfhShowDayCompleteMessage: false });
      }, 3000);

      // Create journal entry for completed day
      await create75HardJournalEntry(challenge.currentDay);

      if (challenge.currentDay === constants.TOTAL_DAYS) {
        logger.info('SeventyFiveHardActions', '[75Hard] 🎉 Challenge complete!');
        await completeSFHChallenge();
      }
      // Note: Don't increment current_day here - it will be updated when tomorrow's check-in is created
    }

    // CRITICAL FIX: Instead of calling ensureSFHTodosForToday() (which can create duplicates),
    // directly update the corresponding todo's completion status
    await syncSingleTodoCompletion(taskId, updatedCompletions.find(tc => tc.taskId === taskId)!.completed);
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Error in toggleSFHTask:', error);
    // Revert optimistic update
    setStore({
      sfhCheckIns: checkIns
    });
    getStore().showGlobalToast?.('Failed to update task. Please try again.', 'error');
  } finally {
    // Always remove from toggling set
    togglingTasks.delete(taskId);
  }
}

/**
 * Sync a single todo's completion status when toggling a 75 Hard task
 * This is much more efficient than calling ensureSFHTodosForToday()
 */
async function syncSingleTodoCompletion(taskId: string, completed: boolean) {
  try {
    const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
    if (!challenge) return;

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));
    if (!todayCheckIn) return;

    const store = getStore();

    // Find the corresponding todo by tags
    const existingTodo = store.todos.find(t => {
      if (t.deleted) return false;

      const meta = parseSFHTodoTags(t.tags);
      return meta.isSFHTodo &&
        meta.challengeId === challenge.id &&
        meta.dayNumber === todayCheckIn.dayNumber &&
        meta.taskId === taskId;
    });

    if (existingTodo) {
      // Update the todo's completion status
      await store.updateTodo(existingTodo.id, {
        completed,
        completedAt: completed ? new Date() : undefined,
        status: completed ? 'done' : 'todo'
      });
      logger.info('75Hard→Todo', `✅ Synced todo completion for task ${taskId}: ${completed}`);
    } else {
      logger.info('75Hard→Todo', `⚠️  No todo found for task ${taskId} - may need to create on next sync`);
    }
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard→Todo] Error syncing single todo:', error);
  }
}

/**
 * Parse tags from a todo to extract 75 Hard metadata
 */
function parseSFHTodoTags(tags: string[]): {
  isSFHTodo: boolean;
  challengeId?: string;
  dayNumber?: number;
  taskId?: string;
} {
  const TODO_TAGS = {
    MARKER: '75hard',
  };

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

/**
 * Upload progress photo
 */
export async function uploadSFHPhoto(file: File) {
  try {
    const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
    if (!challenge) return { success: false, error: 'No active challenge' };

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

    if (!todayCheckIn) {
      return { success: false, error: 'No check-in for today' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
      };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`
      };
    }

    // Validate it's actually an image by checking dimensions
    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 1 || img.height < 1) {
            reject(new Error('Invalid image dimensions'));
          }
          resolve(true);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    } catch (imgError) {
      return {
        success: false,
        error: 'Invalid image file. Please upload a valid image.'
      };
    }

    logger.info('SeventyFiveHardActions', '[75Hard] Uploading photo...');

    const supabase = ensureSupabase();

    const fileExt = file.name.split('.').pop();
    const fileName = `${challenge.id}/${todayCheckIn.dayNumber}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('75hard-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      logger.error('SeventyFiveHardActions', '[75Hard] Error uploading photo:', error);

      // Check if bucket doesn't exist
      if (error.message?.includes('Bucket not found')) {
        return {
          success: false,
          error: 'Photo storage not configured. Please contact support to enable photo uploads.'
        };
      }

      return { success: false, error: 'Failed to upload photo' };
    }

    const { data: urlData } = supabase.storage
      .from('75hard-photos')
      .getPublicUrl(fileName);

    const photoUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('sfh_daily_checkins')
      .update({
        photo: photoUrl,
      })
      .eq('id', todayCheckIn.id);

    if (updateError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to update photo URL in database:', updateError);
      return { success: false, error: 'Failed to save photo' };
    }

    setStore({
      sfhCheckIns: checkIns.map(c =>
        c.id === todayCheckIn.id ? { ...c, photo: photoUrl } : c
      ),
    });

    logger.info('SeventyFiveHardActions', '[75Hard] ✅ Photo uploaded successfully');
    return { success: true };
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Unexpected error uploading photo:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update check-in notes
 */
export async function updateSFHCheckInNotes(notes: string) {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) {
    logger.error('SeventyFiveHardActions', '[75Hard] updateSFHCheckInNotes called without challenge');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    logger.error('SeventyFiveHardActions', '[75Hard] No check-in for today');
    return;
  }

  // Optimistic update
  setStore({
    sfhCheckIns: checkIns.map(c =>
      c.id === todayCheckIn.id ? { ...c, notes } : c
    ),
  });

  try {
    const supabase = ensureSupabase();
    const { error } = await supabase
      .from('sfh_daily_checkins')
      .update({
        notes,
      })
      .eq('id', todayCheckIn.id);

    if (error) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to update notes:', error);
      // Revert optimistic update
      setStore({ sfhCheckIns: checkIns });
    }
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Error in updateSFHCheckInNotes:', error);
    // Revert optimistic update
    setStore({ sfhCheckIns: checkIns });
  }
}

/**
 * Update check-in weight
 */
export async function updateSFHCheckInWeight(weight: number) {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) {
    logger.error('SeventyFiveHardActions', '[75Hard] updateSFHCheckInWeight called without challenge');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    logger.error('SeventyFiveHardActions', '[75Hard] No check-in for today');
    return;
  }

  // Optimistic update
  setStore({
    sfhCheckIns: checkIns.map(c =>
      c.id === todayCheckIn.id ? { ...c, weight } : c
    ),
  });

  try {
    const supabase = ensureSupabase();
    const { error } = await supabase
      .from('sfh_daily_checkins')
      .update({
        weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', todayCheckIn.id);

    if (error) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to update weight:', error);
      // Revert optimistic update
      setStore({ sfhCheckIns: checkIns });
    }
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Error in updateSFHCheckInWeight:', error);
    // Revert optimistic update
    setStore({ sfhCheckIns: checkIns });
  }
}
