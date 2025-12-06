/**
 * Habits and Habit Entries API
 * CRUD operations for habits and habit tracking with Supabase
 */

import { supabase } from '../lib/supabase';
import type { HabitData, HabitEntryData } from '../services/types';

// =====================================================
// HABITS CRUD OPERATIONS
// =====================================================

/**
 * Get all habits for the current user
 */
export async function getHabits(filters?: {
  category?: string;
  isActive?: boolean;
}): Promise<HabitData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters) {
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) throw new Error('Failed to retrieve habits');
  return data as HabitData[];
}

/**
 * Get a single habit by ID
 */
export async function getHabit(id: string): Promise<HabitData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Habit not found');
  return result.data as unknown as HabitData;
}

/**
 * Create a new habit
 */
export async function createHabit(habit: Omit<HabitData, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<HabitData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      ...habit,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Failed to create habit');
  return result.data as unknown as HabitData;
}

/**
 * Update an existing habit
 */
export async function updateHabit(id: string, updates: Partial<HabitData>): Promise<HabitData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Habit not found or update failed');
  return result.data as unknown as HabitData;
}

/**
 * Delete a habit (hard delete)
 */
export async function deleteHabit(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
 * Get habit entries with optional filters
 */
export async function getHabitEntries(filters?: {
  habitId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<HabitEntryData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First get user's habits to filter entries
  const { data: userHabits, error: habitsError } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', user.id);

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
  if (!data) throw new Error('Failed to retrieve habit entries');
  return data as HabitEntryData[];
}

/**
 * Get entries for a specific habit
 */
export async function getHabitEntriesForHabit(habitId: string): Promise<HabitEntryData[]> {
  return getHabitEntries({ habitId });
}

/**
 * Create a habit entry (log completion)
 */
export async function createHabitEntry(entry: Omit<HabitEntryData, 'id' | 'created_at'>): Promise<HabitEntryData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify the habit belongs to the user
  const habitResult = await supabase
    .from('habits')
    .select('id')
    .eq('id', entry.habit_id)
    .eq('user_id', user.id)
    .single();

  if (habitResult.error) throw habitResult.error;
  if (!habitResult.data) throw new Error('Habit not found or access denied');

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
  if (!result.data) throw new Error('Failed to create habit entry');

  // Update habit streak and progress
  await updateHabitStreakAndProgress(entry.habit_id);

  return result.data as unknown as HabitEntryData;
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
  if (!result.data) throw new Error('Habit entry not found or update failed');
  return result.data as unknown as HabitEntryData;
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
