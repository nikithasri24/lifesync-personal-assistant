/**
 * 75 Hard Failure Detection and Handling Actions
 *
 * Handles missed day detection and failure recovery workflows
 */

import { startOfDay, addDays, differenceInDays, isSameDay, format } from 'date-fns';
import { logger } from '../../services/logger';
import { ensureSupabase } from '../../lib/supabase';
import { createInitialTaskCompletions as createTasks, type TaskCompletion, type ChallengeRow, type DailyCheckIn, type SeventyFiveHardChallenge } from '../../types/seventyFiveHard';
import { getStore, setStore } from '../utils/storeHelpers';
import { loadSFHChallenge } from './challengeActions';

/**
 * Check for missed yesterday
 */
export async function checkForMissedSFHDay(): Promise<void> {
  const { sfhChallenge, sfhCheckIns } = getStore();
  const challenge: SeventyFiveHardChallenge | null = sfhChallenge;
  const checkIns: readonly DailyCheckIn[] = sfhCheckIns;

  if (!challenge || challenge.status !== 'active') return;

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const challengeStartDate = startOfDay(challenge.startDate);

  // Debug logging
  logger.info('SeventyFiveHardActions', '[75Hard] checkForMissedDay - today:', format(today, 'yyyy-MM-dd'));
  logger.info('SeventyFiveHardActions', '[75Hard] checkForMissedDay - yesterday:', format(yesterday, 'yyyy-MM-dd'));
  logger.info('SeventyFiveHardActions', '[75Hard] checkForMissedDay - challenge.startDate:', format(challengeStartDate, 'yyyy-MM-dd'));

  // If yesterday is before the start date, no need to check (challenge started today)
  if (yesterday < challengeStartDate) {
    logger.info('SeventyFiveHardActions', '[75Hard] Challenge started today, no check needed');
    return;
  }

  const yesterdayCheckIn: DailyCheckIn | undefined = checkIns.find((c) => isSameDay(c.date, yesterday));

  let failureDetected = false;

  if (!yesterdayCheckIn) {
    logger.info('SeventyFiveHardActions', '[75Hard] No check-in for yesterday - failure detected');
    failureDetected = true;
  } else {
    const allComplete: boolean = yesterdayCheckIn.taskCompletions.every((tc) => tc.completed);
    if (!allComplete) {
      logger.info('SeventyFiveHardActions', '[75Hard] Yesterday incomplete - failure detected');
      failureDetected = true;
    }
  }

  if (failureDetected) {
    logger.info('SeventyFiveHardActions', '[75Hard] Showing failure prompt');
    setStore({ sfhShowFailurePrompt: true, sfhFailureDate: yesterday });
  } else {
    logger.info('SeventyFiveHardActions', '[75Hard] Yesterday complete - reloading challenge');
    await loadSFHChallenge();
  }
}

/**
 * Handle failure response
 */
export async function handleSFHFailureResponse(completed: boolean): Promise<void> {
  const { sfhChallenge, sfhFailureDate } = getStore();
  const challenge: SeventyFiveHardChallenge | null = sfhChallenge;
  const failureDate: Date | null = sfhFailureDate;

  if (!challenge || !failureDate) {
    logger.error('SeventyFiveHardActions', '[75Hard] handleSFHFailureResponse called without challenge or failure date');
    return;
  }

  // Hide the failure prompt immediately to prevent multiple clicks
  setStore({ sfhShowFailurePrompt: false, sfhFailureDate: null });

  const supabase = ensureSupabase();
  const today = startOfDay(new Date());

  try {
    if (completed) {
      logger.info('SeventyFiveHardActions', '[75Hard] User confirmed yesterday complete - creating check-in');

      const allTasksComplete: TaskCompletion[] = (challenge.tasks as readonly { id: string }[]).map((t) => ({
        taskId: t.id,
        completed: true,
        completedAt: failureDate.toISOString(),
      }));

      const dayNumber = differenceInDays(failureDate, challenge.startDate) + 1;

      const { error: yesterdayError } = await supabase
        .from('sfh_daily_checkins')
        .upsert({
          challenge_id: challenge.id,
          date: format(failureDate, 'yyyy-MM-dd'),
          day_number: dayNumber,
          task_completions: allTasksComplete,
        });

      if (yesterdayError) {
        logger.error('SeventyFiveHardActions', '[75Hard] Failed to create yesterday check-in:', yesterdayError);
        throw yesterdayError;
      }

      logger.info('SeventyFiveHardActions', '[75Hard] Created yesterday check-in, now ensuring today check-in');

      // Now create today's check-in
      const todayDayNumber = differenceInDays(today, challenge.startDate) + 1;
      const taskCompletions: TaskCompletion[] = createTasks(challenge.tasks as readonly { id: string; title: string; description?: string; order: number }[]);

      const { error: todayError } = await supabase
        .from('sfh_daily_checkins')
        .upsert({
          challenge_id: challenge.id,
          date: format(today, 'yyyy-MM-dd'),
          day_number: todayDayNumber,
          task_completions: taskCompletions,
        });

      if (todayError) {
        logger.error('SeventyFiveHardActions', '[75Hard] Failed to create today check-in:', todayError);
        throw todayError;
      }

      logger.info('SeventyFiveHardActions', '[75Hard] Created today check-in');
    } else {
      logger.info('SeventyFiveHardActions', '[75Hard] User confirmed failure - resetting challenge');
      logger.info('SeventyFiveHardActions', '[75Hard] Resetting to start_date:', format(today, 'yyyy-MM-dd'));

      // Step 1: Delete ALL check-ins first
      const { error: deleteError } = await supabase
        .from('sfh_daily_checkins')
        .delete()
        .eq('challenge_id', challenge.id);

      if (deleteError) {
        logger.error('SeventyFiveHardActions', '[75Hard] Failed to delete check-ins:', deleteError);
        throw deleteError;
      }

      logger.info('SeventyFiveHardActions', '[75Hard] Deleted all check-ins');

      // Step 2: Update challenge start_date to today
      const updateResult = await supabase
        .from('sfh_challenge')
        .update({
          start_date: format(today, 'yyyy-MM-dd'),
          current_day: 1,
        })
        .eq('id', challenge.id)
        .select()
        .single();

      if (updateResult.error) {
        logger.error('SeventyFiveHardActions', '[75Hard] Failed to update challenge:', updateResult.error);
        throw updateResult.error;
      }

      if (!updateResult.data) {
        logger.error('SeventyFiveHardActions', '[75Hard] Update returned no data - possible RLS issue');
        throw new Error('Failed to verify challenge update');
      }

      const typedUpdatedChallenge = updateResult.data as ChallengeRow;
      logger.info('SeventyFiveHardActions', '[75Hard] Updated challenge start_date to', format(today, 'yyyy-MM-dd'));
      logger.info('SeventyFiveHardActions', '[75Hard] Verified updated challenge:', typedUpdatedChallenge.start_date, 'current_day:', typedUpdatedChallenge.current_day);

      // Step 3: Create today's check-in for the fresh start
      const taskCompletions: TaskCompletion[] = createTasks(challenge.tasks as readonly { id: string; title: string; description?: string; order: number }[]);
      const { error: insertError } = await supabase
        .from('sfh_daily_checkins')
        .insert({
          challenge_id: challenge.id,
          date: format(today, 'yyyy-MM-dd'),
          day_number: 1,
          task_completions: taskCompletions,
        });

      if (insertError) {
        logger.error('SeventyFiveHardActions', '[75Hard] Failed to create today check-in:', insertError);
        throw insertError;
      }

      logger.info('SeventyFiveHardActions', '[75Hard] Created today check-in for fresh start');
    }

    // Load challenge once at the end
    logger.info('SeventyFiveHardActions', '[75Hard] Reloading challenge after handling failure response');
    await loadSFHChallenge();
  } catch (error: unknown) {
    logger.error('SeventyFiveHardActions', '[75Hard] Error in handleSFHFailureResponse:', error);
    // Show error to user
    const toast = getStore().showGlobalToast;
    if (toast) {
      toast('Failed to process response. Please try again.', 'error');
    }
    // Reload challenge anyway to get current state
    await loadSFHChallenge();
  }
}
