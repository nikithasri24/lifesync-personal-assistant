/**
 * Journal API
 * CRUD operations for journal entries with Supabase
 */

import { supabase } from '../lib/supabase';
import type { JournalEntry, JournalMood, Attachment } from '../types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// Database types (snake_case from Supabase)
interface JournalEntryDB {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: JournalMood;
  tags: string[];
  weather: unknown;
  gratitude: string | null;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

// Input types for API calls
export interface CreateJournalEntryInput {
  title?: string;
  content: string;
  mood: JournalMood;
  tags?: string[];
  weather?: unknown;
  gratitude?: string;
  attachments?: Attachment[];
}

export interface UpdateJournalEntryInput {
  title?: string;
  content?: string;
  mood?: JournalMood;
  tags?: string[];
  weather?: unknown;
  gratitude?: string;
  attachments?: Attachment[];
}

export interface JournalEntryFilters extends Record<string, unknown> {
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
  const entry: JournalEntry = {
    id: data.id,
    title: data.title ?? '',
    content: data.content,
    mood: data.mood,
    tags: data.tags ?? [],
    attachments: data.attachments ?? [],
    createdAt: new Date(data.created_at),
  };

  // Add optional fields if needed
  if (data.weather) {
    entry.weather = data.weather;
  }
  if (data.gratitude) {
    entry.gratitude = data.gratitude;
  }

  return entry;
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all journal entries for the current user
 * @param filters - Optional filters for search, moods, tags, and date range
 * @returns Promise<JournalEntry[]> - Array of journal entries matching the filters
 * @throws Error if user not authenticated
 */
export async function getJournalEntries(filters?: JournalEntryFilters): Promise<JournalEntry[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

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

      let entries = (data ?? []).map(mapDbToJournalEntry);

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
    },
    { domain: 'JournalAPI', operation: 'getJournalEntries', data: { filters } }
  );
}

/**
 * Get a single journal entry by ID
 * @param id - Journal entry ID
 * @returns Promise<JournalEntry> - The requested journal entry
 * @throws Error if entry not found or user not authenticated
 */
export async function getJournalEntry(id: string): Promise<JournalEntry> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Journal Entry', id);
      return mapDbToJournalEntry(data as JournalEntryDB);
    },
    { domain: 'JournalAPI', operation: 'getJournalEntry', data: { id } }
  );
}

/**
 * Create a new journal entry
 * @param input - Journal entry data including content, mood, tags, etc.
 * @returns Promise<JournalEntry> - The created journal entry
 * @throws Error if creation fails or user not authenticated
 */
export async function createJournalEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: input.title ?? null,
          content: input.content,
          mood: input.mood,
          tags: input.tags ?? [],
          weather: input.weather ?? null,
          gratitude: input.gratitude ?? null,
          attachments: input.attachments ?? [],
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Journal Entry');
      return mapDbToJournalEntry(data as JournalEntryDB);
    },
    { domain: 'JournalAPI', operation: 'createJournalEntry', data: { mood: input.mood } }
  );
}

/**
 * Update an existing journal entry
 * @param id - Journal entry ID to update
 * @param input - Partial journal entry data to update
 * @returns Promise<JournalEntry> - The updated journal entry
 * @throws Error if entry not found or user not authenticated
 */
export async function updateJournalEntry(
  id: string,
  input: UpdateJournalEntryInput
): Promise<JournalEntry> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const updateData: Partial<{
        title: string | null;
        content: string;
        mood: JournalMood;
        tags: string[];
        weather: unknown;
        gratitude: string | null;
        attachments: Attachment[];
      }> = {};
      if (input.title !== undefined) updateData.title = input.title ?? null;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.mood !== undefined) updateData.mood = input.mood;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.weather !== undefined) updateData.weather = input.weather;
      if (input.gratitude !== undefined) updateData.gratitude = input.gratitude;
      if (input.attachments !== undefined) updateData.attachments = input.attachments;

      const result = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Journal Entry', id);
      return mapDbToJournalEntry(data as JournalEntryDB);
    },
    { domain: 'JournalAPI', operation: 'updateJournalEntry', data: { id } }
  );
}

/**
 * Delete a journal entry
 * @param id - Journal entry ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteJournalEntry(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'JournalAPI', operation: 'deleteJournalEntry', data: { id } }
  );
}

/**
 * Get all unique tags used by the user
 * @returns Promise<string[]> - Sorted array of unique tags
 * @throws Error if user not authenticated
 */
export async function getJournalTags(): Promise<string[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('journal_entries')
        .select('tags')
        .eq('user_id', user.id);

      if (error) throw error;

      // Flatten and deduplicate tags
      const allTags = (data ?? []).flatMap((entry: { tags?: string[] }) => entry.tags ?? []);
      return Array.from(new Set(allTags)).sort();
    },
    { domain: 'JournalAPI', operation: 'getJournalTags' }
  );
}

/**
 * Get mood statistics for a date range
 * @param startDate - Optional start date for filtering
 * @param endDate - Optional end date for filtering
 * @returns Promise<Record<JournalMood, number>> - Count of each mood type
 * @throws Error if user not authenticated
 */
export async function getMoodStats(startDate?: Date, endDate?: Date): Promise<Record<JournalMood, number>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

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

      (data ?? []).forEach((entry: { mood: JournalMood }) => {
        if (entry.mood in stats) {
          stats[entry.mood]++;
        }
      });

      return stats;
    },
    { domain: 'JournalAPI', operation: 'getMoodStats', data: { startDate, endDate } }
  );
}
