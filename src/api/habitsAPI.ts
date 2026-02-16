/**
 * Habits and Habit Entries API with Merged Mode Support
 * CRUD operations for habits and habit tracking with Supabase
 *
 * Merged Mode: When both users in a connection set this module to "merged",
 * the API fetches habits for both users. Each user tracks their own progress
 * on both personal and shared habits. RLS policies ensure proper access control.
 *
 * Implementation:
 * - getHabitsMergedConnection() checks if merged mode is enabled
 * - Fetch functions include partner's habits when merged
 * - Each user maintains individual progress/streaks for all visible habits
 * - RLS policies on habits and habit_entries tables handle security
 */

import { supabase } from '../lib/supabase';
import type { HabitData, HabitEntryData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { AuthenticationError, NotFoundError, ValidationError } from '../lib/errors';
import { isHabitData, isHabitEntryData, isArrayOf } from '../types/guards';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
import { logger } from '../services/logger';

// =====================================================
// MERGED MODE SUPPORT
// =====================================================

// Merged connection cache for Habits
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for habits module
 * Returns connection info if both users have enabled merged mode, null otherwise
 */
export async function getHabitsMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    logger.debug('HabitsAPI', 'Returning cached merged connection', { cached: cachedMergedConnection });
    return cachedMergedConnection;
  }

  logger.debug('HabitsAPI', 'Fetching habits merged connection');
  cachedMergedConnection = await getMergedConnectionId('habits');
  logger.info('HabitsAPI', 'Habits merged connection fetched', {
    hasMergedMode: !!cachedMergedConnection,
    partnerId: cachedMergedConnection?.partnerId
  });

  return cachedMergedConnection;
}

/**
 * Clear cached merged connection (call when connection status changes)
 */
export function clearHabitsMergedConnectionCache(): void {
  logger.debug('HabitsAPI', 'Clearing habits merged connection cache');
  cachedMergedConnection = undefined;
}

// =====================================================
// HABITS CRUD OPERATIONS
// =====================================================

/**
 * Get all habits for the current user (supports merged mode)
 * In merged mode, returns both users' habits so couples can track habits together
 */
export async function getHabits(filters?: {
  category?: string;
  isActive?: boolean;
}): Promise<HabitData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getHabitsMergedConnection();

      let query = supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      // If merged mode, get both users' habits
      // Otherwise, just get current user's habits
      if (mergedConnection) {
        logger.debug('HabitsAPI', 'Merged mode enabled - fetching habits for both users');
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Apply filters
      if (filters) {
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query;

      if (error) throw error;

      logger.info('HabitsAPI', 'Fetched habits', {
        count: data?.length ?? 0,
        mergedMode: !!mergedConnection,
        filters
      });

      return (data ?? []) as HabitData[];
    },
    { domain: 'HabitsAPI', operation: 'getHabits', data: { filters } }
  );
}

/**
 * Get a single habit by ID
 */
export async function getHabit(id: string): Promise<HabitData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Habit', id);

      if (!isHabitData(data)) {
        throw new ValidationError('Invalid habit data received from database');
      }

      return data;
    },
    { domain: 'HabitsAPI', operation: 'getHabit', data: { id } }
  );
}

/**
 * Create a new habit
 */
export async function createHabit(habit: Omit<HabitData, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<HabitData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          ...habit,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Habit');

      if (!isHabitData(data)) {
        throw new ValidationError('Invalid habit data received from database');
      }

      return data;
    },
    { domain: 'HabitsAPI', operation: 'createHabit', data: { name: habit.name } }
  );
}

/**
 * Update an existing habit
 */
export async function updateHabit(id: string, updates: Partial<HabitData>): Promise<HabitData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const result = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new NotFoundError('Habit', id);

  if (!isHabitData(result.data)) {
    throw new ValidationError('Invalid habit data received from database');
  }

  return result.data;
}

/**
 * Delete a habit (hard delete)
 */
export async function deleteHabit(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// =====================================================
// HABIT ENTRIES CRUD OPERATIONS
// =====================================================

/**
 * Get habit entries with optional filters (supports merged mode)
 * In merged mode, returns entries for both users' habits
 * Note: Each user has their own entries even for partner's habits
 */
export async function getHabitEntries(filters?: {
  habitId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<HabitEntryData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  // Check for merged connection
  const mergedConnection = await getHabitsMergedConnection();

  // Get habits for current user (and partner if merged mode)
  let habitsQuery = supabase
    .from('habits')
    .select('id');

  if (mergedConnection) {
    // In merged mode, get all visible habits (mine + partner's)
    habitsQuery = habitsQuery.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
  } else {
    habitsQuery = habitsQuery.eq('user_id', user.id);
  }

  const { data: userHabits, error: habitsError } = await habitsQuery;

  if (habitsError) throw habitsError;
  if (!userHabits || userHabits.length === 0) return [];

  const habitIds = userHabits.map((h: { id: string }) => h.id);

  let query = supabase
    .from('habit_entries')
    .select('*')
    .in('habit_id', habitIds)
    .order('date', { ascending: false });

  // Apply filters
  if (filters) {
    if (filters.habitId) query = query.eq('habit_id', filters.habitId);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) throw new NotFoundError('Habit entries');

  logger.debug('HabitsAPI', 'Fetched habit entries', {
    count: data.length,
    habitIds: habitIds.length,
    mergedMode: !!mergedConnection
  });

  return data as HabitEntryData[];
}

/**
 * Get entries for a specific habit
 */
export async function getHabitEntriesForHabit(habitId: string): Promise<HabitEntryData[]> {
  return getHabitEntries({ habitId });
}

/**
 * Get all habit entries for a specific date
 */
export async function getHabitEntriesForDate(date: string): Promise<HabitEntryData[]> {
  return getHabitEntries({ startDate: date, endDate: date });
}

/**
 * Create a habit entry (log completion)
 */
export async function createHabitEntry(entry: Omit<HabitEntryData, 'id' | 'created_at'>): Promise<HabitEntryData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthenticationError('Not authenticated');

  // Verify the habit belongs to the user
  const habitResult = await supabase
    .from('habits')
    .select('id')
    .eq('id', entry.habit_id)
    .eq('user_id', user.id)
    .single();

  if (habitResult.error) throw habitResult.error;
  if (!habitResult.data) throw new NotFoundError('Habit', entry.habit_id);

  // Use upsert to handle duplicate entries (same habit_id and date)
  const result = await supabase
    .from('habit_entries')
    .upsert(entry, {
      onConflict: 'habit_id,date',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new NotFoundError('Habit Entry');

  if (!isHabitEntryData(result.data)) {
    throw new ValidationError('Invalid habit entry data received from database');
  }

  // Update habit streak and progress
  await updateHabitStreakAndProgress(entry.habit_id);

  return result.data;
}

/**
 * Update a habit entry
 */
export async function updateHabitEntry(id: string, updates: Partial<HabitEntryData>): Promise<HabitEntryData> {
  const result = await supabase
    .from('habit_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new NotFoundError('Habit Entry', id);

  if (!isHabitEntryData(result.data)) {
    throw new ValidationError('Invalid habit entry data received from database');
  }

  return result.data;
}

/**
 * Delete a habit entry
 */
export async function deleteHabitEntry(id: string, habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Update habit streak and progress after deletion
  await updateHabitStreakAndProgress(habitId);
}

/**
 * Delete all entries for a specific date (used for resetting today's progress)
 */
export async function deleteHabitEntriesForDate(habitId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date);

  if (error) throw error;

  // Update habit streak and progress
  await updateHabitStreakAndProgress(habitId);
}

/**
 * Delete all entries for a date range (used for resetting weekly/monthly progress)
 */
export async function deleteHabitEntriesForDateRange(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', habitId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;

  // Update habit streak and progress
  await updateHabitStreakAndProgress(habitId);
}

/**
 * Delete all entries for a habit (used for resetting history)
 */
export async function deleteAllHabitEntries(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_entries')
    .delete()
    .eq('habit_id', habitId);

  if (error) throw error;

  // Reset habit streak and progress
  await supabase
    .from('habits')
    .update({
      streak_count: 0,
      best_streak: 0,
      current_progress: 0,
    })
    .eq('id', habitId);
}

// =====================================================
// REMINDER-SPECIFIC QUERIES
// =====================================================

/**
 * Get habits with reminders enabled
 * Used by useHabitReminders hook
 */
export async function getHabitsWithReminders(): Promise<HabitData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('reminder_enabled', true)
        .not('reminder_time', 'is', null);

      if (error) throw error;
      return (data ?? []) as HabitData[];
    },
    { domain: 'HabitsAPI', operation: 'getHabitsWithReminders' }
  );
}

/**
 * Get habits with active streaks for streak protection alerts
 * @param minStreak - Minimum streak count to include (default: 3)
 */
export async function getHabitsWithStreaks(minStreak: number = 3): Promise<HabitData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('streak_count', minStreak);

      if (error) throw error;
      return (data ?? []) as HabitData[];
    },
    { domain: 'HabitsAPI', operation: 'getHabitsWithStreaks', data: { minStreak } }
  );
}

/**
 * Check if a habit was completed on a specific date
 */
export async function checkHabitCompletionForDate(habitId: string, date: string): Promise<boolean> {
  return apiCall(
    async () => {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    { domain: 'HabitsAPI', operation: 'checkHabitCompletionForDate', data: { habitId, date } }
  );
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate and update habit streak and progress
 */
async function updateHabitStreakAndProgress(habitId: string): Promise<void> {
  // Get all entries for this habit, ordered by date descending
  const { data: entries, error } = await supabase
    .from('habit_entries')
    .select('*')
    .eq('habit_id', habitId)
    .order('date', { ascending: false });

  if (error) throw error;

  if (!entries || entries.length === 0) {
    // No entries, reset streak
    await supabase
      .from('habits')
      .update({
        streak_count: 0,
        current_progress: 0,
      })
      .eq('id', habitId);
    return;
  }

  // Calculate current streak
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  let lastDate: Date | null = null;

  for (const entry of entries) {
    const entryDate = new Date((entry as { date: string }).date);

    if (!lastDate) {
      // First entry
      tempStreak = 1;
      lastDate = entryDate;

      // Only count as current streak if it's today or yesterday
      const daysDiff = Math.floor((new Date(today).getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        currentStreak = 1;
      }
    } else {
      // Check if this entry is consecutive (within 1 day of last entry)
      const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
        // Update current streak if we're still within range of today
        const daysFromToday = Math.floor((new Date(today).getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysFromToday <= tempStreak) {
          currentStreak = tempStreak;
        }
      } else {
        // Streak broken
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = entryDate;
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak);

  // Update habit with calculated values
  await supabase
    .from('habits')
    .update({
      streak_count: currentStreak,
      best_streak: bestStreak,
      current_progress: entries.length, // Total completions
    })
    .eq('id', habitId);
}
