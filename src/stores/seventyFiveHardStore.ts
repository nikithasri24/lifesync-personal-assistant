/**
 * 75 Hard Store - Simplified Implementation
 *
 * Clean, simple store methods for the new architecture:
 * - ONE challenge per user
 * - Direct Supabase queries (no service layer)
 * - Auto-reset on missed day
 * - Self-contained check-ins (not in Todos)
 *
 * This replaces the old complex implementation with 8 simple methods.
 */

import type { StateCreator } from 'zustand';
import { startOfDay, addDays, differenceInDays, isSameDay } from 'date-fns';
import { ensureSupabase } from '../lib/supabase';
import type {
  SeventyFiveHardChallenge,
  DailyCheckIn,
  Task,
  TaskCompletion,
  ChallengeRow,
  CheckInRow,
} from '../types/seventyFiveHard';
import {
  mapRowToChallenge,
  mapRowToCheckIn,
  mapChallengeToInsert,
  mapCheckInToInsert,
  generateId,
  createInitialTaskCompletions,
  validateTasks,
  CHALLENGE_CONSTANTS,
} from '../types/seventyFiveHard';

// ==================== State Interface ====================

export interface SeventyFiveHardState {
  // Data (simplified - singular challenge, array of check-ins)
  challenge: SeventyFiveHardChallenge | null;
  checkIns: DailyCheckIn[];

  // UI State
  showFailurePrompt: boolean;
  failureDate: Date | null;
  showDayCompleteMessage: boolean;
  showCelebration: boolean;

  // Actions (8 core methods)
  startChallenge: (tasks: Omit<Task, 'id'>[]) => Promise<{ success: boolean; error?: string }>;
  loadChallenge: () => Promise<void>;
  checkForMissedDay: () => Promise<void>;
  handleFailureResponse: (completed: boolean) => Promise<void>;
  ensureTodayCheckIn: () => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  uploadPhoto: (file: File) => Promise<{ success: boolean; error?: string }>;
  updateCheckInNotes: (notes: string) => Promise<void>;
  updateCheckInWeight: (weight: number) => Promise<void>;
  resetChallenge: () => Promise<void>;
  completeChallenge: () => Promise<void>;
}

// ==================== Store Implementation ====================

// Track tasks currently being toggled to prevent race conditions
const togglingTasks = new Set<string>();

export const createSeventyFiveHardStore: StateCreator<
  SeventyFiveHardState,
  [],
  [],
  SeventyFiveHardState
> = (set, get) => ({
  // Initial state
  challenge: null,
  checkIns: [],
  showFailurePrompt: false,
  failureDate: null,
  showDayCompleteMessage: false,
  showCelebration: false,

  // ==================== Core Methods ====================

  /**
   * Start a new 75 Hard challenge
   * - Validates tasks (1-20, non-empty titles)
   * - Checks for existing active challenge
   * - Creates challenge and today's check-in
   */
  startChallenge: async (tasks: Omit<Task, 'id'>[]) => {
    try {
      console.log('[75Hard] Starting new challenge...');

      // Validate tasks
      const validationError = validateTasks(tasks);
      if (validationError) {
        console.error('[75Hard] Validation error:', validationError);
        return { success: false, error: validationError };
      }

      const supabase = ensureSupabase();
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Check for existing active challenge
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

      // Create tasks with IDs
      const tasksWithIds: Task[] = tasks.map((t, index) => ({
        ...t,
        id: generateId(),
        order: index + 1
      }));

      const today = startOfDay(new Date());

      // Create challenge
      const challengeData = {
        user_id: user.id,
        start_date: today.toISOString().split('T')[0],
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

      // Create today's check-in
      const taskCompletions = createInitialTaskCompletions(tasksWithIds);

      const checkInData = {
        challenge_id: newChallenge.id,
        date: today.toISOString().split('T')[0],
        day_number: 1,
        task_completions: taskCompletions,
      };

      const { error: checkInError } = await supabase
        .from('sfh_daily_checkins')
        .insert(checkInData);

      if (checkInError) {
        console.error('[75Hard] Error creating check-in:', checkInError);
        // Rollback: delete challenge
        await supabase.from('sfh_challenge').delete().eq('id', newChallenge.id);
        return { success: false, error: 'Failed to create daily check-in' };
      }

      console.log('[75Hard] ✅ Challenge created successfully');

      // Reload challenge
      await get().loadChallenge();

      return { success: true };
    } catch (error) {
      console.error('[75Hard] Unexpected error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Load challenge from database
   * - Fetches active challenge for current user
   * - Loads all check-ins
   * - Runs failure detection
   */
  loadChallenge: async () => {
    try {
      console.log('[75Hard] Loading challenge...');

      const supabase = ensureSupabase();
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.log('[75Hard] Not authenticated');
        set({ challenge: null, checkIns: [] });
        return;
      }

      // Load active challenge
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
        set({ challenge: null, checkIns: [] });
        return;
      }

      // Map database row to type
      const challenge = mapRowToChallenge(challengeRow as ChallengeRow);

      // Load all check-ins
      const { data: checkInRows, error: checkInsError } = await supabase
        .from('sfh_daily_checkins')
        .select('*')
        .eq('challenge_id', challenge.id)
        .order('date', { ascending: false });

      if (checkInsError) {
        console.error('[75Hard] Error loading check-ins:', checkInsError);
        return;
      }

      const checkIns = (checkInRows || []).map((row: CheckInRow) => mapRowToCheckIn(row));

      console.log('[75Hard] ✅ Loaded challenge:', challenge.id, 'with', checkIns.length, 'check-ins');

      set({ challenge, checkIns });

      // Run failure detection
      await get().checkForMissedDay();
    } catch (error) {
      console.error('[75Hard] Unexpected error loading challenge:', error);
    }
  },

  /**
   * Check if user missed yesterday's tasks
   * - Compares yesterday's check-in to expected
   * - Shows prompt if tasks incomplete
   */
  checkForMissedDay: async () => {
    const { challenge, checkIns } = get();
    if (!challenge || challenge.status !== 'active') return;

    const today = startOfDay(new Date());
    const yesterday = addDays(today, -1);

    // Was yesterday before challenge started?
    if (yesterday < startOfDay(challenge.startDate)) {
      console.log('[75Hard] Challenge started today, no check needed');
      return;
    }

    // Find yesterday's check-in
    const yesterdayCheckIn = checkIns.find(c => isSameDay(c.date, yesterday));

    let failureDetected = false;

    // No check-in for yesterday?
    if (!yesterdayCheckIn) {
      console.log('[75Hard] No check-in for yesterday - failure detected');
      failureDetected = true;
    }
    // Check-in exists but tasks incomplete?
    else {
      const allComplete = yesterdayCheckIn.taskCompletions.every(tc => tc.completed);
      if (!allComplete) {
        console.log('[75Hard] Yesterday incomplete - failure detected');
        failureDetected = true;
      }
    }

    if (failureDetected) {
      console.log('[75Hard] Showing failure prompt');
      set({ showFailurePrompt: true, failureDate: yesterday });
    } else {
      console.log('[75Hard] Yesterday complete - ensure today check-in');
      await get().ensureTodayCheckIn();
    }
  },

  /**
   * Handle user response to failure prompt
   * - YES: Mark yesterday complete
   * - NO: Reset challenge to day 1
   */
  handleFailureResponse: async (completed: boolean) => {
    const { challenge, failureDate } = get();
    if (!challenge || !failureDate) return;

    const supabase = ensureSupabase();

    if (completed) {
      console.log('[75Hard] User confirmed yesterday complete - creating check-in');

      // Mark all tasks as complete
      const allTasksComplete = challenge.tasks.map(t => ({
        taskId: t.id,
        completed: true,
        completedAt: failureDate.toISOString(),
      }));

      const dayNumber = differenceInDays(failureDate, challenge.startDate) + 1;

      // Upsert check-in (in case it already exists but incomplete)
      await supabase
        .from('sfh_daily_checkins')
        .upsert({
          challenge_id: challenge.id,
          date: failureDate.toISOString().split('T')[0],
          day_number: dayNumber,
          task_completions: allTasksComplete,
        });

      // Reload and continue
      await get().loadChallenge();
    } else {
      console.log('[75Hard] User confirmed failure - resetting challenge');
      await get().resetChallenge();
    }

    set({ showFailurePrompt: false, failureDate: null });
  },

  /**
   * Ensure today's check-in exists
   * - Creates if not present
   */
  ensureTodayCheckIn: async () => {
    const { challenge, checkIns } = get();
    if (!challenge) return;

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

    if (!todayCheckIn) {
      console.log('[75Hard] Creating today check-in');

      const supabase = ensureSupabase();
      const taskCompletions = createInitialTaskCompletions(challenge.tasks);

      // Calculate day number from date difference (not from current_day)
      const dayNumber = differenceInDays(today, startOfDay(challenge.startDate)) + 1;

      await supabase
        .from('sfh_daily_checkins')
        .insert({
          challenge_id: challenge.id,
          date: today.toISOString().split('T')[0],
          day_number: dayNumber,
          task_completions: taskCompletions,
        });

      // Update current_day to match the day we just created
      await supabase
        .from('sfh_challenge')
        .update({
          current_day: dayNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', challenge.id);

      await get().loadChallenge();
    }
  },

  /**
   * Toggle task completion
   * - Optimistic UI update
   * - Persists to database
   * - Checks if day complete / challenge complete
   */
  toggleTask: async (taskId: string) => {
    // Prevent concurrent toggles of the same task
    if (togglingTasks.has(taskId)) {
      console.log('[75Hard] Task toggle already in progress, ignoring duplicate request');
      return;
    }

    const { challenge, checkIns } = get();
    if (!challenge) return;

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

    if (!todayCheckIn) {
      console.error('[75Hard] No check-in for today');
      return;
    }

    // Mark task as being toggled
    togglingTasks.add(taskId);

    try {
      // Toggle completion
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
      set({
        checkIns: checkIns.map(c =>
          c.id === todayCheckIn.id ? { ...c, taskCompletions: updatedCompletions } : c
        ),
      });

      // Persist to database
      const supabase = ensureSupabase();
      const { error } = await supabase
        .from('sfh_daily_checkins')
        .update({
          task_completions: updatedCompletions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todayCheckIn.id);

      if (error) {
        console.error('[75Hard] Failed to toggle task:', error);
        // Revert optimistic update
        set({ checkIns });
        return;
      }

      // Check if all tasks complete (only if no error)
      const allComplete = updatedCompletions.every(tc => tc.completed);

      if (allComplete) {
        console.log('[75Hard] ✅ All tasks complete for today!');
        set({ showDayCompleteMessage: true });

        // Auto-hide after 3 seconds
        setTimeout(() => {
          set({ showDayCompleteMessage: false });
        }, 3000);

        // Check if this completes the challenge (day 75)
        if (challenge.currentDay === CHALLENGE_CONSTANTS.TOTAL_DAYS) {
          console.log('[75Hard] 🎉 Challenge complete!');
          await get().completeChallenge();
        }
        // Note: Don't increment current_day here - it will be updated when tomorrow's check-in is created
      }
    } catch (error) {
      console.error('[75Hard] Error in toggleTask:', error);
      // Revert optimistic update
      set({ checkIns });
    } finally {
      // Always remove from toggling set
      togglingTasks.delete(taskId);
    }
  },

  /**
   * Upload progress photo
   * - Compresses image
   * - Uploads to Supabase Storage
   * - Updates today's check-in
   */
  uploadPhoto: async (file: File) => {
    try {
      const { challenge, checkIns } = get();
      if (!challenge) return { success: false, error: 'No active challenge' };

      const today = startOfDay(new Date());
      const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

      if (!todayCheckIn) {
        return { success: false, error: 'No check-in for today' };
      }

      console.log('[75Hard] Uploading photo...');

      const supabase = ensureSupabase();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${challenge.id}/${todayCheckIn.dayNumber}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('75hard-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[75Hard] Error uploading photo:', error);
        return { success: false, error: 'Failed to upload photo' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('75hard-photos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Update check-in
      await supabase
        .from('sfh_daily_checkins')
        .update({
          photo: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todayCheckIn.id);

      // Optimistic update
      set({
        checkIns: checkIns.map(c =>
          c.id === todayCheckIn.id ? { ...c, photo: photoUrl } : c
        ),
      });

      console.log('[75Hard] ✅ Photo uploaded successfully');
      return { success: true };
    } catch (error) {
      console.error('[75Hard] Unexpected error uploading photo:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Update today's notes
   */
  updateCheckInNotes: async (notes: string) => {
    const { challenge, checkIns } = get();
    if (!challenge) return;

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

    if (!todayCheckIn) return;

    // Optimistic update
    set({
      checkIns: checkIns.map(c =>
        c.id === todayCheckIn.id ? { ...c, notes } : c
      ),
    });

    // Persist
    const supabase = ensureSupabase();
    await supabase
      .from('sfh_daily_checkins')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', todayCheckIn.id);
  },

  /**
   * Update today's weight
   */
  updateCheckInWeight: async (weight: number) => {
    const { challenge, checkIns } = get();
    if (!challenge) return;

    const today = startOfDay(new Date());
    const todayCheckIn = checkIns.find(c => isSameDay(c.date, today));

    if (!todayCheckIn) return;

    // Optimistic update
    set({
      checkIns: checkIns.map(c =>
        c.id === todayCheckIn.id ? { ...c, weight } : c
      ),
    });

    // Persist
    const supabase = ensureSupabase();
    await supabase
      .from('sfh_daily_checkins')
      .update({
        weight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', todayCheckIn.id);
  },

  /**
   * Reset challenge to day 1
   * - Updates start date to today
   * - Resets current day to 1
   * - Deletes all incomplete check-ins
   */
  resetChallenge: async () => {
    const { challenge } = get();
    if (!challenge) return;

    console.log('[75Hard] Resetting challenge...');

    const today = startOfDay(new Date());
    const supabase = ensureSupabase();

    // Update challenge
    await supabase
      .from('sfh_challenge')
      .update({
        start_date: today.toISOString().split('T')[0],
        current_day: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challenge.id);

    // Delete all incomplete check-ins
    const { data: allCheckIns } = await supabase
      .from('sfh_daily_checkins')
      .select('id, task_completions')
      .eq('challenge_id', challenge.id);

    if (allCheckIns) {
      const incompleteIds = allCheckIns
        .filter(c => {
          const completions = c.task_completions as TaskCompletion[];
          return !completions.every(tc => tc.completed);
        })
        .map(c => c.id);

      if (incompleteIds.length > 0) {
        await supabase
          .from('sfh_daily_checkins')
          .delete()
          .in('id', incompleteIds);
      }
    }

    console.log('[75Hard] ✅ Challenge reset');

    // Reload challenge
    await get().loadChallenge();
  },

  /**
   * Mark challenge as complete
   * - Sets status to 'completed'
   * - Sets completedAt timestamp
   * - Shows celebration
   */
  completeChallenge: async () => {
    const { challenge } = get();
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

    set({ showCelebration: true });

    await get().loadChallenge();

    console.log('[75Hard] ✅ Challenge completed!');
  },
});
