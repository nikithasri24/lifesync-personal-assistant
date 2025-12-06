/**
 * Notes API - Supabase backend for notes persistence
 * Provides CRUD operations and search/filter capabilities
 */

import { supabase } from '../lib/supabase';
import type { Note } from '../types';

// Database row type
interface NoteRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
}

// Input types for API operations
export interface CreateNoteInput {
  title?: string;
  content: string;
  tags?: string[];
  category?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  category?: string;
}

export interface NoteFilters {
  searchQuery?: string;
  tags?: string[];
  category?: string;
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
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all notes for the authenticated user with optional filters
 */
export async function getNotes(filters?: NoteFilters): Promise<Note[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply category filter
  if (filters?.category) {
    query = query.eq('category', filters.category);
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
}

/**
 * Get a single note by ID
 */
export async function getNote(id: string): Promise<Note> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Note not found');

  return mapDbToNote(result.data as NoteRow);
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: input.title ?? null,
      content: input.content,
      tags: input.tags ?? [],
      category: input.category ?? null,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Failed to create note');

  return mapDbToNote(result.data as NoteRow);
}

/**
 * Update an existing note
 */
export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error('Not authenticated');

  const updateData: Partial<NoteRow> = {};

  if (input.title !== undefined) updateData.title = input.title || null;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.category !== undefined) updateData.category = input.category || null;

  const result = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Note not found or update failed');

  return mapDbToNote(result.data as NoteRow);
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Get all unique tags from user's notes
 */
export async function getNoteTags(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .select('tags')
    .eq('user_id', user.id);

  if (error) throw error;

  // Flatten and deduplicate tags
  const typedData = (data ?? []) as Array<{ tags: string[] | null }>;
  const allTags = typedData.flatMap((row) => row.tags ?? []);
  return Array.from(new Set(allTags)).sort();
}

/**
 * Get all unique categories from user's notes
 */
export async function getNoteCategories(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}
