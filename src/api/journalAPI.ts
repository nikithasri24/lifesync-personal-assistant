/**
 * Journal API
 * CRUD operations for journal entries with Supabase
 */

import { supabase } from '../lib/supabase';
import type { JournalEntry, Attachment } from '../types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { NotFoundError } from '../lib/errors';

// Database types (snake_case from Supabase)
interface JournalEntryDB {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

// Input types for API calls
export interface CreateJournalEntryInput {
  title?: string;
  content: string;
  tags?: string[];
  attachments?: Attachment[];
}

export interface UpdateJournalEntryInput {
  title?: string;
  content?: string;
  tags?: string[];
  attachments?: Attachment[];
}

export interface JournalEntryFilters extends Record<string, unknown> {
  searchQuery?: string;
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
    title: data.title ?? '',
    content: data.content,
    tags: data.tags ?? [],
    attachments: data.attachments ?? [],
    createdAt: new Date(data.created_at),
  };
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all journal entries for the current user
 * @param filters - Optional filters for search, tags, and date range
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

      // Use maybeSingle() instead of single() to avoid 406 errors
      // when the entry doesn't exist
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new NotFoundError('Journal Entry', id);
      }

      return mapDbToJournalEntry(data as JournalEntryDB);
    },
    { domain: 'JournalAPI', operation: 'getJournalEntry', data: { id } }
  );
}

/**
 * Create a new journal entry
 * @param input - Journal entry data including content, tags, etc.
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
          tags: input.tags ?? [],
          attachments: input.attachments ?? [],
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Journal Entry');
      return mapDbToJournalEntry(data as JournalEntryDB);
    },
    { domain: 'JournalAPI', operation: 'createJournalEntry', data: { title: input.title } }
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
        tags: string[];
        attachments: Attachment[];
      }> = {};
      if (input.title !== undefined) updateData.title = input.title ?? null;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.tags !== undefined) updateData.tags = input.tags;
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


