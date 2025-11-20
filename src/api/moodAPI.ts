/**
 * Mood Entries API
 * CRUD operations for mood tracking with Supabase
 */

import { supabase } from '../lib/supabase';
import type { JournalMood } from '../types';

export interface MoodEntryData {
  id?: string;
  user_id?: string;
  mood: JournalMood;
  energy: 'low' | 'medium' | 'high';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// MOOD ENTRIES CRUD OPERATIONS
// =====================================================

/**
 * Get all mood entries for the current user
 */
export async function getMoodEntries(): Promise<MoodEntryData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single mood entry by ID
 */
export async function getMoodEntry(id: string): Promise<MoodEntryData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Mood entry not found');
  return data;
}

/**
 * Create a new mood entry
 */
export async function createMoodEntry(
  entry: Omit<MoodEntryData, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<MoodEntryData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mood_entries')
    .insert({
      user_id: user.id,
      ...entry,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing mood entry
 */
export async function updateMoodEntry(
  id: string,
  updates: Partial<MoodEntryData>
): Promise<MoodEntryData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('mood_entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a mood entry
 */
export async function deleteMoodEntry(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('mood_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
