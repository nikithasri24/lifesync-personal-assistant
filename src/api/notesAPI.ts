/**
 * Notes API - Supabase backend for notes persistence
 * Provides CRUD operations and search/filter capabilities
 * Extended to support list-type notes with list items
 */

import { supabase } from '../lib/supabase';
import type { Note, ListItem, NoteType } from '../types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// Database row types
interface NoteRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  category: string | null;
  note_type: string;
  created_at: string;
  updated_at: string;
}

interface ListItemRow {
  id: string;
  user_id: string;
  note_id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
  tags: string[];
  due_date: string | null;
  url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Input types for API operations
export interface CreateNoteInput {
  title?: string;
  content: string;
  tags?: string[];
  category?: string;
  noteType?: NoteType;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  category?: string;
  noteType?: NoteType;
}

export interface NoteFilters {
  searchQuery?: string;
  tags?: string[];
  category?: string;
  noteType?: NoteType;
}

// List Item input types
export interface CreateListItemInput {
  title: string;
  notes?: string;
  tags?: string[];
  dueDate?: Date;
  url?: string;
}

export interface UpdateListItemInput {
  title?: string;
  notes?: string;
  completed?: boolean;
  tags?: string[];
  dueDate?: Date | null;
  url?: string;
  sortOrder?: number;
}

/**
 * Map database row to Note type
 */
function mapDbToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title ?? '',
    content: row.content,
    tags: row.tags ?? [],
    category: row.category ?? undefined,
    noteType: (row.note_type as NoteType) ?? 'note',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map database row to ListItem type
 */
function mapDbToListItem(row: ListItemRow): ListItem {
  return {
    id: row.id,
    noteId: row.note_id,
    title: row.title,
    notes: row.notes ?? undefined,
    completed: row.completed,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    tags: row.tags ?? [],
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    url: row.url ?? undefined,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all notes for the authenticated user with optional filters
 */
export async function getNotes(filters?: NoteFilters): Promise<Note[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply category filter
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      // Apply note type filter
      if (filters?.noteType) {
        query = query.eq('note_type', filters.noteType);
      }

      // Apply tag filter (contains any of the specified tags)
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query;
      if (error) throw error;

      let notes = (data || []).map(mapDbToNote);

      // Client-side search filtering (for title and content)
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        notes = notes.filter(
          (note) =>
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower)
        );
      }

      return notes;
    },
    { domain: 'NotesAPI', operation: 'getNotes', data: { filters } }
  );
}

/**
 * Get a single note by ID
 */
export async function getNote(id: string): Promise<Note> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Note', id);
      return mapDbToNote(data as NoteRow);
    },
    { domain: 'NotesAPI', operation: 'getNote', data: { id } }
  );
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: input.title ?? null,
          content: input.content,
          tags: input.tags ?? [],
          category: input.category ?? null,
          note_type: input.noteType ?? 'note',
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Note');
      return mapDbToNote(data as NoteRow);
    },
    { domain: 'NotesAPI', operation: 'createNote', data: { noteType: input.noteType } }
  );
}

/**
 * Update an existing note
 */
export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const updateData: Partial<NoteRow> = {};

      if (input.title !== undefined) updateData.title = input.title || null;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.category !== undefined) updateData.category = input.category || null;
      if (input.noteType !== undefined) updateData.note_type = input.noteType;

      const result = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Note', id);
      return mapDbToNote(data as NoteRow);
    },
    { domain: 'NotesAPI', operation: 'updateNote', data: { id } }
  );
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'NotesAPI', operation: 'deleteNote', data: { id } }
  );
}

/**
 * Get all unique tags from user's notes
 */
export async function getNoteTags(): Promise<string[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('notes')
        .select('tags')
        .eq('user_id', user.id);

      if (error) throw error;

      // Flatten and deduplicate tags
      const typedData = (data ?? []) as Array<{ tags: string[] | null }>;
      const allTags = typedData.flatMap((row) => row.tags ?? []);
      return Array.from(new Set(allTags)).sort();
    },
    { domain: 'NotesAPI', operation: 'getNoteTags' }
  );
}

/**
 * Get all unique categories from user's notes
 */
export async function getNoteCategories(): Promise<string[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('notes')
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null);

      if (error) throw error;

      const typedData = (data ?? []) as Array<{ category: string | null }>;
      const categories = typedData
        .map((row) => row.category)
        .filter((cat): cat is string => cat !== null);

      return Array.from(new Set(categories)).sort();
    },
    { domain: 'NotesAPI', operation: 'getNoteCategories' }
  );
}

// ============================================================================
// LIST ITEMS API
// ============================================================================

/**
 * Get all list items for a specific note
 */
export async function getListItems(noteId: string): Promise<ListItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(mapDbToListItem);
    },
    { domain: 'NotesAPI', operation: 'getListItems', data: { noteId } }
  );
}

/**
 * Get a single list item by ID
 */
export async function getListItem(id: string): Promise<ListItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('list_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'List Item', id);
      return mapDbToListItem(data as ListItemRow);
    },
    { domain: 'NotesAPI', operation: 'getListItem', data: { id } }
  );
}

/**
 * Create a new list item
 */
export async function createListItem(noteId: string, input: CreateListItemInput): Promise<ListItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('list_items')
        .insert({
          user_id: user.id,
          note_id: noteId,
          title: input.title,
          notes: input.notes ?? null,
          tags: input.tags ?? [],
          due_date: input.dueDate?.toISOString().split('T')[0] ?? null,
          url: input.url ?? null,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'List Item');
      return mapDbToListItem(data as ListItemRow);
    },
    { domain: 'NotesAPI', operation: 'createListItem', data: { noteId, title: input.title } }
  );
}

/**
 * Update an existing list item
 */
export async function updateListItem(id: string, input: UpdateListItemInput): Promise<ListItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const updateData: Partial<{
        title: string;
        notes: string | null;
        completed: boolean;
        tags: string[];
        due_date: string | null;
        url: string | null;
        sort_order: number;
      }> = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.notes !== undefined) updateData.notes = input.notes || null;
      if (input.completed !== undefined) updateData.completed = input.completed;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.dueDate !== undefined) {
        updateData.due_date = input.dueDate ? input.dueDate.toISOString().split('T')[0] : null;
      }
      if (input.url !== undefined) updateData.url = input.url || null;
      if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

      const result = await supabase
        .from('list_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'List Item', id);
      return mapDbToListItem(data as ListItemRow);
    },
    { domain: 'NotesAPI', operation: 'updateListItem', data: { id } }
  );
}

/**
 * Delete a list item
 */
export async function deleteListItem(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('list_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'NotesAPI', operation: 'deleteListItem', data: { id } }
  );
}

/**
 * Get all unique tags from user's list items
 */
export async function getListItemTags(): Promise<string[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('list_items')
        .select('tags')
        .eq('user_id', user.id);

      if (error) throw error;

      const typedData = (data ?? []) as Array<{ tags: string[] | null }>;
      const allTags = typedData.flatMap((row) => row.tags ?? []);
      return Array.from(new Set(allTags)).sort();
    },
    { domain: 'NotesAPI', operation: 'getListItemTags' }
  );
}
