/**
 * Journal API
 * CRUD operations for journal entries with Supabase
 */

import { supabase } from '../lib/supabase';
import type { JournalEntry, JournalMood } from '../types';

// Database types (snake_case from Supabase)
interface JournalEntryDB {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: JournalMood;
  tags: string[];
  weather: any;
  gratitude: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

// Input types for API calls
export interface CreateJournalEntryInput {
  title?: string;
  content: string;
  mood: JournalMood;
  tags?: string[];
  weather?: any;
  gratitude?: string;
  attachments?: any[];
}

export interface UpdateJournalEntryInput {
  title?: string;
  content?: string;
  mood?: JournalMood;
  tags?: string[];
  weather?: any;
  gratitude?: string;
  attachments?: any[];
}

export interface JournalEntryFilters {
  searchQuery?: string;
  moods?: JournalMood[];
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
}

// =====================================================
// MAPPER FUNCTIONS
// =====================================================

function mapDbToJournalEntry(data: JournalEntryDB): JournalEntry {
  return {
    id: data.id,
    title: data.title || '',
    content: data.content,
    mood: data.mood,
    tags: data.tags || [],
    attachments: data.attachments || [],
    createdAt: new Date(data.created_at),
    // Add optional fields if needed
    ...(data.weather && { weather: data.weather }),
    ...(data.gratitude && { gratitude: data.gratitude }),
  };
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all journal entries for the current user
 */
export async function getJournalEntries(filters?: JournalEntryFilters): Promise<JournalEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters) {
    if (filters.moods && filters.moods.length > 0) {
      query = query.in('mood', filters.moods);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  let entries = (data || []).map(mapDbToJournalEntry);

  // Client-side search filtering (for title and content)
  if (filters?.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    entries = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(searchLower) ||
        entry.content.toLowerCase().includes(searchLower)
    );
  }

  return entries;
}

/**
 * Get a single journal entry by ID
 */
export async function getJournalEntry(id: string): Promise<JournalEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Journal entry not found');

  return mapDbToJournalEntry(data);
}

/**
 * Create a new journal entry
 */
export async function createJournalEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      title: input.title || null,
      content: input.content,
      mood: input.mood,
      tags: input.tags || [],
      weather: input.weather || null,
      gratitude: input.gratitude || null,
      attachments: input.attachments || [],
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToJournalEntry(data);
}

/**
 * Update an existing journal entry
 */
export async function updateJournalEntry(
  id: string,
  input: UpdateJournalEntryInput
): Promise<JournalEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title || null;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.mood !== undefined) updateData.mood = input.mood;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.weather !== undefined) updateData.weather = input.weather;
  if (input.gratitude !== undefined) updateData.gratitude = input.gratitude;
  if (input.attachments !== undefined) updateData.attachments = input.attachments;

  const { data, error } = await supabase
    .from('journal_entries')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToJournalEntry(data);
}

/**
 * Delete a journal entry
 */
export async function deleteJournalEntry(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Get all unique tags used by the user
 */
export async function getJournalTags(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('tags')
    .eq('user_id', user.id);

  if (error) throw error;

  // Flatten and deduplicate tags
  const allTags = (data || []).flatMap((entry: any) => entry.tags || []);
  return Array.from(new Set(allTags)).sort();
}

/**
 * Get mood statistics for a date range
 */
export async function getMoodStats(startDate?: Date, endDate?: Date): Promise<Record<JournalMood, number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('journal_entries')
    .select('mood')
    .eq('user_id', user.id);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats: Record<JournalMood, number> = {
    excellent: 0,
    good: 0,
    neutral: 0,
    bad: 0,
    terrible: 0,
  };

  (data || []).forEach((entry: any) => {
    if (entry.mood in stats) {
      stats[entry.mood as JournalMood]++;
    }
  });

  return stats;
}
