/**
 * 75 Hard Store Actions - Standalone Functions
 *
 * These are standalone functions that can be called from components
 * They manage the 75 Hard state in the main useRealAppStore
 */

import { startOfDay, addDays, differenceInDays, isSameDay, format } from 'date-fns';
import { ensureSupabase } from '../lib/supabase';
import {
  mapRowToChallenge as mapRow,
  mapRowToCheckIn as mapCheckIn,
  generateId as genId,
  createInitialTaskCompletions as createTasks,
  validateTasks as validate,
  CHALLENGE_CONSTANTS as constants,
} from '../types/seventyFiveHard';
import type {
  Task,
  TaskCompletion,
  ChallengeRow,
  CheckInRow,
} from '../types/seventyFiveHard';
import { useRealAppStore } from './useRealAppStore';

// Helper to get/set store state
const getStore = () => useRealAppStore.getState();
const setStore = (updates: any) => useRealAppStore.setState(updates);

/**
 * Start a new 75 Hard challenge
 */
export async function startSFHChallenge(tasks: Omit<Task, 'id'>[]) {
  try {
    console.log('[75Hard] Starting new challenge...');

    const validationError = validate(tasks);
    if (validationError) {
      console.error('[75Hard] Validation error:', validationError);
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
      console.error('[75Hard] User already has active challenge');
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
      console.error('[75Hard] Error creating challenge:', challengeError);
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
      console.error('[75Hard] Error creating check-in:', checkInError);
      await supabase.from('sfh_challenge').delete().eq('id', newChallenge.id);
      return { success: false, error: 'Failed to create daily check-in' };
    }

    console.log('[75Hard] ✅ Challenge created successfully');

    await loadSFHChallenge();

    return { success: true };
  } catch (error) {
    console.error('[75Hard] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Load active challenge
 */
export async function loadSFHChallenge() {
  try {
    console.log('[75Hard] Loading challenge...');

    const supabase = ensureSupabase();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      console.log('[75Hard] Not authenticated');
      setStore({ sfhChallenge: null, sfhCheckIns: [] });
      return;
    }

    const { data: challengeRow, error: challengeError } = await supabase
      .from('sfh_challenge')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (challengeError) {
      console.error('[75Hard] Error loading challenge:', challengeError);
      return;
    }

    if (!challengeRow) {
      console.log('[75Hard] No active challenge found');
      setStore({ sfhChallenge: null, sfhCheckIns: [] });
      return;
    }

    const challenge = mapRow(challengeRow as ChallengeRow);

    const { data: checkInRows, error: checkInsError } = await supabase
      .from('sfh_daily_checkins')
      .select('*')
      .eq('challenge_id', challenge.id)
      .order('date', { ascending: false });

    if (checkInsError) {
      console.error('[75Hard] Error loading check-ins:', checkInsError);
      return;
    }

    const checkIns = (checkInRows || []).map((row: CheckInRow) => mapCheckIn(row));

    console.log('[75Hard] ✅ Loaded challenge:', challenge.id, 'with', checkIns.length, 'check-ins');

    setStore({ sfhChallenge: challenge, sfhCheckIns: checkIns });

    await checkForMissedSFHDay();

    // Sync to todos (ensure todos exist for today)
    await ensureSFHTodosForToday();
  } catch (error) {
    console.error('[75Hard] Unexpected error loading challenge:', error);
  }
}

/**
 * Check for missed yesterday
 */
export async function checkForMissedSFHDay() {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge || challenge.status !== 'active') return;

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const challengeStartDate = startOfDay(challenge.startDate);

  // Debug logging
  console.log('[75Hard] checkForMissedDay - today:', format(today, 'yyyy-MM-dd'));
  console.log('[75Hard] checkForMissedDay - yesterday:', format(yesterday, 'yyyy-MM-dd'));
  console.log('[75Hard] checkForMissedDay - challenge.startDate:', format(challengeStartDate, 'yyyy-MM-dd'));

  // If yesterday is before the start date, no need to check (challenge started today)
  if (yesterday < challengeStartDate) {
    console.log('[75Hard] Challenge started today, no check needed');
    return;
  }

  const yesterdayCheckIn = checkIns.find(c => isSameDay(c.date, yesterday));

  let failureDetected = false;

  if (!yesterdayCheckIn) {
    console.log('[75Hard] No check-in for yesterday - failure detected');
    failureDetected = true;
  } else {
    const allComplete = yesterdayCheckIn.taskCompletions.every(tc => tc.completed);
    if (!allComplete) {
      console.log('[75Hard] Yesterday incomplete - failure detected');
      failureDetected = true;
    }
  }

  if (failureDetected) {
    console.log('[75Hard] Showing failure prompt');
    setStore({ sfhShowFailurePrompt: true, sfhFailureDate: yesterday });
  } else {
    console.log('[75Hard] Yesterday complete - ensure today check-in');
    await ensureTodaySFHCheckIn();
  }
}

/**
 * Handle failure response
 */
export async function handleSFHFailureResponse(completed: boolean) {
  const { sfhChallenge: challenge, sfhFailureDate: failureDate } = getStore();
  if (!challenge || !failureDate) {
    console.error('[75Hard] handleSFHFailureResponse called without challenge or failure date');
    return;
  }

  // Hide the failure prompt immediately to prevent multiple clicks
  setStore({ sfhShowFailurePrompt: false, sfhFailureDate: null });

  const supabase = ensureSupabase();
  const today = startOfDay(new Date());

  try {
    if (completed) {
      console.log('[75Hard] User confirmed yesterday complete - creating check-in');

      const allTasksComplete = challenge.tasks.map(t => ({
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
        console.error('[75Hard] Failed to create yesterday check-in:', yesterdayError);
        throw yesterdayError;
      }

      console.log('[75Hard] Created yesterday check-in, now ensuring today check-in');

      // Now create today's check-in
      const todayDayNumber = differenceInDays(today, challenge.startDate) + 1;
      const taskCompletions = createTasks(challenge.tasks);

      const { error: todayError } = await supabase
        .from('sfh_daily_checkins')
        .upsert({
          challenge_id: challenge.id,
          date: format(today, 'yyyy-MM-dd'),
          day_number: todayDayNumber,
          task_completions: taskCompletions,
        });

      if (todayError) {
        console.error('[75Hard] Failed to create today check-in:', todayError);
        throw todayError;
      }

      console.log('[75Hard] Created today check-in');
    } else {
      console.log('[75Hard] User confirmed failure - resetting challenge');
      console.log('[75Hard] Resetting to start_date:', format(today, 'yyyy-MM-dd'));

      // Step 1: Delete ALL check-ins first
      const { error: deleteError } = await supabase
        .from('sfh_daily_checkins')
        .delete()
        .eq('challenge_id', challenge.id);

      if (deleteError) {
        console.error('[75Hard] Failed to delete check-ins:', deleteError);
        throw deleteError;
      }

      console.log('[75Hard] Deleted all check-ins');

      // Step 2: Update challenge start_date to today
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
        console.error('[75Hard] Failed to update challenge:', updateError);
        throw updateError;
      }

      if (!updatedChallenge) {
        console.error('[75Hard] Update returned no data - possible RLS issue');
        throw new Error('Failed to verify challenge update');
      }

      console.log('[75Hard] Updated challenge start_date to', format(today, 'yyyy-MM-dd'));
      console.log('[75Hard] Verified updated challenge:', updatedChallenge.start_date, 'current_day:', updatedChallenge.current_day);

      // Step 3: Create today's check-in for the fresh start
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
        console.error('[75Hard] Failed to create today check-in:', insertError);
        throw insertError;
      }

      console.log('[75Hard] Created today check-in for fresh start');
    }

    // Load challenge once at the end
    console.log('[75Hard] Reloading challenge after handling failure response');
    await loadSFHChallenge();
  } catch (error) {
    console.error('[75Hard] Error in handleSFHFailureResponse:', error);
    // Show error to user
    getStore().showGlobalToast?.('Failed to process response. Please try again.', 'error');
    // Reload challenge anyway to get current state
    await loadSFHChallenge();
  }
}

/**
 * Ensure today's check-in exists
 */
export async function ensureTodaySFHCheckIn() {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) return;

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    console.log('[75Hard] Creating today check-in');

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
      console.log('[75Hard] Today check-in created and added to store');

      // Sync to todos (auto-create todos for today's tasks)
      await ensureSFHTodosForToday();
    }
  }
}

// Track tasks currently being toggled to prevent race conditions
const togglingTasks = new Set<string>();

/**
 * Toggle task completion
 */
export async function toggleSFHTask(taskId: string) {
  // Prevent concurrent toggles of the same task
  if (togglingTasks.has(taskId)) {
    console.log('[75Hard] Task toggle already in progress, ignoring duplicate request');
    return;
  }

  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) {
    console.error('[75Hard] toggleSFHTask called without challenge');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    console.error('[75Hard] No check-in for today');
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
      console.error('[75Hard] Failed to toggle task:', error);
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
      console.log('[75Hard] ✅ All tasks complete for today!');
      setStore({ sfhShowDayCompleteMessage: true });

      setTimeout(() => {
        setStore({ sfhShowDayCompleteMessage: false });
      }, 3000);

      // Create journal entry for completed day
      await create75HardJournalEntry(challenge.currentDay);

      if (challenge.currentDay === constants.TOTAL_DAYS) {
        console.log('[75Hard] 🎉 Challenge complete!');
        await completeSFHChallenge();
      }
      // Note: Don't increment current_day here - it will be updated when tomorrow's check-in is created
    }

    // Sync to todos (update todo completion status)
    await ensureSFHTodosForToday();
  } catch (error) {
    console.error('[75Hard] Error in toggleSFHTask:', error);
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

    console.log('[75Hard] Uploading photo...');

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
      console.error('[75Hard] Error uploading photo:', error);

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
      console.error('[75Hard] Failed to update photo URL in database:', updateError);
      return { success: false, error: 'Failed to save photo' };
    }

    setStore({
      sfhCheckIns: checkIns.map(c =>
        c.id === todayCheckIn.id ? { ...c, photo: photoUrl } : c
      ),
    });

    console.log('[75Hard] ✅ Photo uploaded successfully');
    return { success: true };
  } catch (error) {
    console.error('[75Hard] Unexpected error uploading photo:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update check-in notes
 */
export async function updateSFHCheckInNotes(notes: string) {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) {
    console.error('[75Hard] updateSFHCheckInNotes called without challenge');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    console.error('[75Hard] No check-in for today');
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
      console.error('[75Hard] Failed to update notes:', error);
      // Revert optimistic update
      setStore({ sfhCheckIns: checkIns });
    }
  } catch (error) {
    console.error('[75Hard] Error in updateSFHCheckInNotes:', error);
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
    console.error('[75Hard] updateSFHCheckInWeight called without challenge');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    console.error('[75Hard] No check-in for today');
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
      console.error('[75Hard] Failed to update weight:', error);
      // Revert optimistic update
      setStore({ sfhCheckIns: checkIns });
    }
  } catch (error) {
    console.error('[75Hard] Error in updateSFHCheckInWeight:', error);
    // Revert optimistic update
    setStore({ sfhCheckIns: checkIns });
  }
}

/**
 * Reset challenge to day 1
 */
export async function resetSFHChallenge() {
  const { sfhChallenge: challenge } = getStore();
  if (!challenge) {
    console.error('[75Hard] resetSFHChallenge called without challenge');
    return;
  }

  console.log('[75Hard] Resetting challenge...');

  const today = startOfDay(new Date());
  const supabase = ensureSupabase();

  try {
    // Step 1: Delete ALL check-ins first
    const { error: deleteError } = await supabase
      .from('sfh_daily_checkins')
      .delete()
      .eq('challenge_id', challenge.id);

    if (deleteError) {
      console.error('[75Hard] Failed to delete check-ins during reset:', deleteError);
      throw deleteError;
    }

    console.log('[75Hard] Deleted all check-ins for fresh start');

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
      console.error('[75Hard] Failed to update challenge during reset:', updateError);
      throw updateError;
    }

    if (!updatedChallenge) {
      console.error('[75Hard] Update returned no data during reset - possible RLS issue');
      throw new Error('Failed to verify challenge update during reset');
    }

    console.log('[75Hard] Updated challenge to start today');
    console.log('[75Hard] Verified: start_date =', updatedChallenge.start_date, 'current_day =', updatedChallenge.current_day);

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
      console.error('[75Hard] Failed to create today check-in during reset:', insertError);
      throw insertError;
    }

    console.log('[75Hard] ✅ Challenge reset complete');

    await loadSFHChallenge();
  } catch (error) {
    console.error('[75Hard] Error in resetSFHChallenge:', error);
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

  console.log('[75Hard] 🎉 Completing challenge...');

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

  console.log('[75Hard] ✅ Challenge completed!');
}

/**
 * Delete challenge completely
 * Removes the challenge and all associated check-ins from the database
 */
export async function deleteSFHChallenge() {
  const { sfhChallenge: challenge } = getStore();
  if (!challenge) {
    console.error('[75Hard] deleteSFHChallenge called without challenge');
    return { success: false, error: 'No active challenge to delete' };
  }

  console.log('[75Hard] Deleting challenge...');

  const supabase = ensureSupabase();

  try {
    // Step 1: Delete all check-ins first (foreign key constraint)
    const { error: deleteCheckInsError } = await supabase
      .from('sfh_daily_checkins')
      .delete()
      .eq('challenge_id', challenge.id);

    if (deleteCheckInsError) {
      console.error('[75Hard] Failed to delete check-ins:', deleteCheckInsError);
      throw deleteCheckInsError;
    }

    console.log('[75Hard] Deleted all check-ins');

    // Step 2: Delete the challenge
    const { error: deleteChallengeError } = await supabase
      .from('sfh_challenge')
      .delete()
      .eq('id', challenge.id);

    if (deleteChallengeError) {
      console.error('[75Hard] Failed to delete challenge:', deleteChallengeError);
      throw deleteChallengeError;
    }

    console.log('[75Hard] Deleted challenge');

    // Step 3: Clear from store
    setStore({
      sfhChallenge: null,
      sfhCheckIns: [],
      sfhShowFailurePrompt: false,
      sfhFailureDate: null,
      sfhShowDayCompleteMessage: false,
      sfhShowCelebration: false
    });

    console.log('[75Hard] ✅ Challenge deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[75Hard] Error in deleteSFHChallenge:', error);
    return { success: false, error: 'Failed to delete challenge. Please try again.' };
  }
}

// ==================== Cross-Feature Integration: 75 Hard ↔ Todos ====================

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

/**
 * Create or update a todo from a 75 Hard task
 * Returns the todo ID
 */
async function createOrUpdateTodoFromSFHTask(
  challengeId: string,
  task: Task,
  dayNumber: number,
  completed: boolean
): Promise<string | null> {
  try {
    const store = getStore();
    const today = startOfDay(new Date());

    // Check if todo already exists
    const existingTodo = store.todos.find(t => {
      const meta = parseSFHTodoTags(t.tags);
      return meta.isSFHTodo &&
        meta.challengeId === challengeId &&
        meta.dayNumber === dayNumber &&
        meta.taskId === task.id &&
        !t.deleted;
    });

    const todoData = {
      title: `🔥 ${task.name}`,
      description: task.details || `75 Hard - Day ${dayNumber}`,
      status: (completed ? 'done' : 'todo') as 'done' | 'todo',
      priority: 'high' as const,
      categoryId: 'health' as const,
      tags: [
        TODO_TAGS.MARKER,
        TODO_TAGS.challenge(challengeId),
        TODO_TAGS.day(dayNumber),
        TODO_TAGS.task(task.id),
      ],
      dueDate: today,
      completed,
      completedAt: completed ? new Date() : undefined,
      notes: `Part of 75 Hard Challenge (Day ${dayNumber}/75)`,
    };

    if (existingTodo) {
      // Update existing todo
      await store.updateTodo(existingTodo.id, {
        ...todoData,
        completedAt: completed ? (existingTodo.completedAt || new Date()) : undefined,
      });
      console.log(`[75Hard→Todo] ✅ Updated todo for task: ${task.name}`);
      return existingTodo.id;
    } else {
      // Create new todo
      const newTodo = await store.addTodo(todoData);
      console.log(`[75Hard→Todo] ✅ Created todo for task: ${task.name}`);
      return newTodo.id;
    }
  } catch (error) {
    console.error('[75Hard→Todo] Error creating/updating todo:', error);
    return null;
  }
}

/**
 * Ensure todos exist for today's 75 Hard tasks
 * Called after check-in is created or when loading challenge
 */
export async function ensureSFHTodosForToday() {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge || challenge.status !== 'active') {
    console.log('[75Hard→Todo] No active challenge, skipping todo sync');
    return;
  }

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    console.log('[75Hard→Todo] No check-in for today, skipping todo sync');
    return;
  }

  console.log('[75Hard→Todo] Syncing todos for Day', todayCheckIn.dayNumber);

  // Create/update todos for each task
  for (const task of challenge.tasks) {
    const completion = todayCheckIn.taskCompletions.find(tc => tc.taskId === task.id);
    const isCompleted = completion?.completed || false;

    await createOrUpdateTodoFromSFHTask(
      challenge.id,
      task,
      todayCheckIn.dayNumber,
      isCompleted
    );
  }

  // Cleanup: Delete todos for previous days
  await cleanupOldSFHTodos(challenge.id, todayCheckIn.dayNumber);
}

/**
 * Delete todos from previous days to keep the list clean
 */
async function cleanupOldSFHTodos(challengeId: string, currentDay: number) {
  const store = getStore();
  const today = startOfDay(new Date());

  for (const todo of store.todos) {
    const meta = parseSFHTodoTags(todo.tags);
    if (!meta.isSFHTodo || meta.challengeId !== challengeId) continue;
    if (todo.deleted) continue;

    // Delete if from previous day OR if due date is before today
    const isPreviousDay = meta.dayNumber && meta.dayNumber < currentDay;
    const isOldDueDate = todo.dueDate && todo.dueDate < today;

    if (isPreviousDay || isOldDueDate) {
      await store.deleteTodo(todo.id);
      console.log(`[75Hard→Todo] Deleted old todo for Day ${meta.dayNumber}`);
    }
  }
}

/**
 * Sync todo completion to 75 Hard task
 * Called when user checks off a 75 Hard todo
 */
export async function syncTodoCompletionToSFH(todoId: string) {
  const store = getStore();
  const todo = store.todos.find(t => t.id === todoId);
  if (!todo) return;

  const meta = parseSFHTodoTags(todo.tags);
  if (!meta.isSFHTodo || !meta.taskId) return;

  console.log('[Todo→75Hard] Syncing completion to 75 Hard task:', meta.taskId);

  // Toggle the 75 Hard task
  await toggleSFHTask(meta.taskId);
}

/**
 * Check if a todo is a 75 Hard todo
 */
export function isSFHTodo(todo: { tags: string[] }): boolean {
  return todo.tags.includes(TODO_TAGS.MARKER);
}

// ==================== Cross-Feature Integration: 75 Hard → Journal ====================

/**
 * Create a journal entry from a completed 75 Hard day
 * Called when all tasks for a day are completed
 */
export async function create75HardJournalEntry(dayNumber: number) {
  const { sfhChallenge: challenge, sfhCheckIns: checkIns } = getStore();
  if (!challenge) return;

  const today = startOfDay(new Date());
  const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    console.log('[75Hard→Journal] No check-in for today, skipping journal entry');
    return;
  }

  // Only create entry if all tasks are complete
  const allComplete = todayCheckIn.taskCompletions.every(tc => tc.completed);
  if (!allComplete) {
    console.log('[75Hard→Journal] Not all tasks complete, skipping journal entry');
    return;
  }

  try {
    const store = getStore();

    // Check if journal entry already exists for today
    const existingEntry = store.journalEntries.find(entry => {
      return entry.tags.includes('75hard') &&
        entry.tags.includes(`75hard:day-${dayNumber}`) &&
        isSameDay(entry.createdAt, today);
    });

    if (existingEntry) {
      console.log('[75Hard→Journal] Journal entry already exists for today');
      return;
    }

    // Build journal content
    const tasksList = challenge.tasks.map((task, index) => {
      return `${index + 1}. ✅ ${task.name}${task.details ? ` (${task.details})` : ''}`;
    }).join('\n');

    const weightSection = todayCheckIn.weight
      ? `\n**Weight:** ${todayCheckIn.weight.toFixed(1)} kg\n`
      : '';

    const notesSection = todayCheckIn.notes
      ? `\n**Notes:**\n${todayCheckIn.notes}\n`
      : '';

    const content = `# 75 Hard - Day ${dayNumber}

**Date:** ${format(today, 'MMMM d, yyyy')}

## Tasks Completed

${tasksList}
${weightSection}${notesSection}
---

*Keep pushing! ${75 - dayNumber} days to go!* 💪`;

    // Add photo as attachment if exists
    const attachments = todayCheckIn.photo ? [
      {
        id: `75hard-day-${dayNumber}-photo`,
        name: `Day ${dayNumber} Progress Photo`,
        type: 'image' as const,
        url: todayCheckIn.photo,
      }
    ] : [];

    // Create journal entry
    await store.addJournalEntry({
      title: `75 Hard - Day ${dayNumber}`,
      content,
      mood: 'good' as const, // Default to good mood for completing all tasks
      tags: [
        '75hard',
        `75hard:day-${dayNumber}`,
        `75hard:challenge-${challenge.id}`,
        'fitness',
        'challenge'
      ],
      attachments,
    });

    console.log(`[75Hard→Journal] ✅ Created journal entry for Day ${dayNumber}`);
  } catch (error) {
    console.error('[75Hard→Journal] Error creating journal entry:', error);
  }
}
