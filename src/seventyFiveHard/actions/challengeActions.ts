/**
 * 75 Hard Challenge Lifecycle Management Actions
 *
 * Handles challenge creation, loading, resetting, completion, and deletion
 */

import { startOfDay, addDays, format, subDays } from 'date-fns';
import { logger } from '../../services/logger';
import { ensureSupabase } from '../../lib/supabase';
import {
  mapRowToChallenge as mapRow,
  mapRowToCheckIn as mapCheckIn,
  generateId as genId,
  createInitialTaskCompletions as createTasks,
  validateTasks as validate,
  CHALLENGE_CONSTANTS as constants,
} from '../../types/seventyFiveHard';
import type {
  Task,
  ChallengeRow,
  CheckInRow,
} from '../../types/seventyFiveHard';
import { getStore, setStore } from '../utils/storeHelpers';
import { measurePerformance } from '../utils/performanceHelpers';
import { checkForMissedSFHDay } from './failureActions';

/**
 * Start a new 75 Hard challenge
 */
export async function startSFHChallenge(tasks: Omit<Task, 'id'>[]) {
  try {
    logger.info('SeventyFiveHardActions', '[75Hard] Starting new challenge...');

    const validationError = validate(tasks);
    if (validationError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Validation error:', validationError);
      return { success: false, error: validationError };
    }

    const supabase = ensureSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: existing } = await supabase
      .from('sfh_challenge')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      logger.error('SeventyFiveHardActions', '[75Hard] User already has active challenge');
      return { success: false, error: 'You already have an active challenge' };
    }

    const tasksWithIds: Task[] = tasks.map((t, index) => ({
      ...t,
      id: genId(),
      order: index + 1
    }));

    const today = startOfDay(new Date());

    const challengeData = {
      user_id: user.id,
      start_date: format(today, 'yyyy-MM-dd'),
      current_day: 1,
      status: 'active' as const,
      tasks: tasksWithIds,
    };

    const { data: newChallenge, error: challengeError } = await supabase
      .from('sfh_challenge')
      .insert(challengeData)
      .select()
      .single();

    if (challengeError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Error creating challenge:', challengeError);
      return { success: false, error: 'Failed to create challenge' };
    }

    const taskCompletions = createTasks(tasksWithIds);

    const checkInData = {
      challenge_id: newChallenge.id,
      date: format(today, 'yyyy-MM-dd'),
      day_number: 1,
      task_completions: taskCompletions,
    };

    const { error: checkInError } = await supabase
      .from('sfh_daily_checkins')
      .insert(checkInData);

    if (checkInError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Error creating check-in:', checkInError);
      await supabase.from('sfh_challenge').delete().eq('id', newChallenge.id);
      return { success: false, error: 'Failed to create daily check-in' };
    }

    logger.info('SeventyFiveHardActions', '[75Hard] ✅ Challenge created successfully');

    await loadSFHChallenge();

    return { success: true };
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Load active challenge
 *
 * OPTIMIZATION: Only loads recent 7 days of check-ins for fast startup.
 * Older check-ins can be loaded on-demand via loadSFHCheckInsRange().
 */
export async function loadSFHChallenge() {
  return measurePerformance('loadSFHChallenge', async () => {
    try {
      logger.info('SeventyFiveHardActions', '[75Hard] Loading challenge...');

      const supabase = ensureSupabase();
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        logger.info('SeventyFiveHardActions', '[75Hard] Not authenticated');
        setStore({ sfhChallenge: null, sfhCheckIns: [] });
        return;
      }

      // Load challenge
      const { data: challengeRow, error: challengeError } = await supabase
        .from('sfh_challenge')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (challengeError) {
        logger.error('SeventyFiveHardActions', '[75Hard] Error loading challenge:', challengeError);
        return;
      }

      if (!challengeRow) {
        logger.info('SeventyFiveHardActions', '[75Hard] No active challenge found');
        setStore({ sfhChallenge: null, sfhCheckIns: [] });
        return;
      }

      const challenge = mapRow(challengeRow as ChallengeRow);

      // OPTIMIZATION: Only load recent 7 days of check-ins (not all 75!)
      // This reduces initial load from ~500ms to ~100ms
      const sevenDaysAgo = subDays(startOfDay(new Date()), 7);
      const today = startOfDay(new Date());

      const { data: checkInRows, error: checkInsError } = await supabase
        .from('sfh_daily_checkins')
        .select('id, challenge_id, date, day_number, task_completions, photo, weight, notes')
        .eq('challenge_id', challenge.id)
        .gte('date', format(sevenDaysAgo, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (checkInsError) {
        logger.error('SeventyFiveHardActions', '[75Hard] Error loading check-ins:', checkInsError);
        return;
      }

      const checkIns = (checkInRows || []).map((row: CheckInRow) => mapCheckIn(row));

      logger.info('SeventyFiveHardActions', '[75Hard] ✅ Loaded challenge:', challenge.id, 'with', checkIns.length, 'recent check-ins (7-day window)');

      setStore({
        sfhChallenge: challenge,
        sfhCheckIns: checkIns,
        sfhCheckInsLoadedRange: {
          from: sevenDaysAgo,
          to: today,
        }
      });

      // Check for missed day
      // Note: This NO LONGER calls ensureSFHTodosForToday() on app load
      // Todos are now created lazily when user visits 75 Hard page
      await checkForMissedSFHDay();
    } catch (error) {
      logger.error('SeventyFiveHardActions', '[75Hard] Unexpected error loading challenge:', error);
    }
  });
}

/**
 * Reset challenge to day 1
 */
export async function resetSFHChallenge() {
  const { sfhChallenge: challenge } = getStore();
  if (!challenge) {
    logger.error('SeventyFiveHardActions', '[75Hard] resetSFHChallenge called without challenge');
    return;
  }

  logger.info('SeventyFiveHardActions', '[75Hard] Resetting challenge...');

  const today = startOfDay(new Date());
  const supabase = ensureSupabase();

  try {
    // Step 1: Delete ALL check-ins first
    const { error: deleteError } = await supabase
      .from('sfh_daily_checkins')
      .delete()
      .eq('challenge_id', challenge.id);

    if (deleteError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to delete check-ins during reset:', deleteError);
      throw deleteError;
    }

    logger.info('SeventyFiveHardActions', '[75Hard] Deleted all check-ins for fresh start');

    // Step 2: Update challenge
    const { data: updatedChallenge, error: updateError } = await supabase
      .from('sfh_challenge')
      .update({
        start_date: format(today, 'yyyy-MM-dd'),
        current_day: 1,
      })
      .eq('id', challenge.id)
      .select()
      .single();

    if (updateError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to update challenge during reset:', updateError);
      throw updateError;
    }

    if (!updatedChallenge) {
      logger.error('SeventyFiveHardActions', '[75Hard] Update returned no data during reset - possible RLS issue');
      throw new Error('Failed to verify challenge update during reset');
    }

    logger.info('SeventyFiveHardActions', '[75Hard] Updated challenge to start today');
    logger.info('SeventyFiveHardActions', '[75Hard] Verified: start_date =', updatedChallenge.start_date, 'current_day =', updatedChallenge.current_day);

    // Step 3: Create today's check-in
    const taskCompletions = createTasks(challenge.tasks);
    const { error: insertError } = await supabase
      .from('sfh_daily_checkins')
      .insert({
        challenge_id: challenge.id,
        date: format(today, 'yyyy-MM-dd'),
        day_number: 1,
        task_completions: taskCompletions,
      });

    if (insertError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to create today check-in during reset:', insertError);
      throw insertError;
    }

    logger.info('SeventyFiveHardActions', '[75Hard] ✅ Challenge reset complete');

    await loadSFHChallenge();
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Error in resetSFHChallenge:', error);
    getStore().showGlobalToast?.('Failed to reset challenge. Please try again.', 'error');
    await loadSFHChallenge();
  }
}

/**
 * Mark challenge as complete
 */
export async function completeSFHChallenge() {
  const { sfhChallenge: challenge } = getStore();
  if (!challenge) return;

  logger.info('SeventyFiveHardActions', '[75Hard] 🎉 Completing challenge...');

  const completedAt = new Date();
  const supabase = ensureSupabase();

  await supabase
    .from('sfh_challenge')
    .update({
      status: 'completed',
      completed_at: completedAt.toISOString(),
      updated_at: completedAt.toISOString(),
    })
    .eq('id', challenge.id);

  setStore({ sfhShowCelebration: true });

  await loadSFHChallenge();

  logger.info('SeventyFiveHardActions', '[75Hard] ✅ Challenge completed!');
}

/**
 * Delete challenge completely
 * Removes the challenge and all associated check-ins from the database
 */
export async function deleteSFHChallenge() {
  const { sfhChallenge: challenge } = getStore();
  if (!challenge) {
    logger.error('SeventyFiveHardActions', '[75Hard] deleteSFHChallenge called without challenge');
    return { success: false, error: 'No active challenge to delete' };
  }

  logger.info('SeventyFiveHardActions', '[75Hard] Deleting challenge...');

  const supabase = ensureSupabase();

  try {
    // Step 1: Delete all check-ins first (foreign key constraint)
    const { error: deleteCheckInsError } = await supabase
      .from('sfh_daily_checkins')
      .delete()
      .eq('challenge_id', challenge.id);

    if (deleteCheckInsError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to delete check-ins:', deleteCheckInsError);
      throw deleteCheckInsError;
    }

    logger.info('SeventyFiveHardActions', '[75Hard] Deleted all check-ins');

    // Step 2: Delete the challenge
    const { error: deleteChallengeError } = await supabase
      .from('sfh_challenge')
      .delete()
      .eq('id', challenge.id);

    if (deleteChallengeError) {
      logger.error('SeventyFiveHardActions', '[75Hard] Failed to delete challenge:', deleteChallengeError);
      throw deleteChallengeError;
    }

    logger.info('SeventyFiveHardActions', '[75Hard] Deleted challenge');

    // Step 3: Clear from store
    setStore({
      sfhChallenge: null,
      sfhCheckIns: [],
      sfhShowFailurePrompt: false,
      sfhFailureDate: null,
      sfhShowDayCompleteMessage: false,
      sfhShowCelebration: false
    });

    logger.info('SeventyFiveHardActions', '[75Hard] ✅ Challenge deleted successfully');
    return { success: true };
  } catch (error) {
    logger.error('SeventyFiveHardActions', '[75Hard] Error in deleteSFHChallenge:', error);
    return { success: false, error: 'Failed to delete challenge. Please try again.' };
  }
}
