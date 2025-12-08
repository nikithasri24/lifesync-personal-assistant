/**
 * Goals & Dreams API - Supabase backend for goals and dreams persistence
 * Provides CRUD operations and filtering capabilities
 */

import { supabase } from '../lib/supabase';
import type { Goal, Dream } from '../types';

// Database row types
interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  status: string;
  progress: number;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface DreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
  last_updated: string;
}

// Input types for API operations
export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: string;
  targetDate?: Date;
  status?: 'active' | 'completed' | 'archived' | 'on_hold';
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  category?: string;
  targetDate?: Date;
  status?: 'active' | 'completed' | 'archived' | 'on_hold';
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface CreateDreamInput {
  title: string;
  description?: string;
  category?: string;
  notes?: string;
}

export interface UpdateDreamInput {
  title?: string;
  description?: string;
  category?: string;
  notes?: string;
}

export interface GoalFilters {
  status?: string;
  category?: string;
  priority?: string;
}

/**
 * Map database row to Goal type
 */
function mapDbToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    targetDate: row.target_date ? new Date(row.target_date) : undefined,
    status: row.status as Goal['status'],
    progress: row.progress,
    priority: row.priority as Goal['priority'],
    createdAt: new Date(row.created_at),
  };
}

/**
 * Map database row to Dream type
 */
function mapDbToDream(row: DreamRow): Dream {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    category: row.category || undefined,
    notes: row.notes || '',
    createdAt: new Date(row.created_at),
    lastUpdated: new Date(row.last_updated),
  };
}

// ==================== GOALS API ====================

/**
 * Get all goals for the authenticated user with optional filters
 * @param filters - Optional filters for status, category, and priority
 * @returns Promise<Goal[]> - Array of goals matching the filters
 */
export async function getGoals(filters?: GoalFilters): Promise<Goal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(mapDbToGoal);
}

/**
 * Get a single goal by ID
 * @param id - Goal ID
 * @returns Promise<Goal> - The requested goal
 * @throws Error if goal not found or user not authenticated
 */
export async function getGoal(id: string): Promise<Goal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Goal not found');

  return mapDbToGoal(result.data as GoalRow);
}

/**
 * Create a new goal
 * @param input - Goal data including title, description, category, etc.
 * @returns Promise<Goal> - The created goal
 * @throws Error if creation fails or user not authenticated
 */
export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      target_date: input.targetDate ? input.targetDate.toISOString().split('T')[0] : null,
      status: input.status ?? 'active',
      progress: input.progress ?? 0,
      priority: input.priority ?? 'medium',
    })
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Failed to create goal');

  return mapDbToGoal(result.data as GoalRow);
}

/**
 * Update an existing goal
 * @param id - Goal ID to update
 * @param input - Partial goal data to update
 * @returns Promise<Goal> - The updated goal
 * @throws Error if goal not found or user not authenticated
 */
export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: Partial<GoalRow> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description ?? null;
  if (input.category !== undefined) updateData.category = input.category ?? null;
  if (input.targetDate !== undefined) {
    updateData.target_date = input.targetDate ? input.targetDate.toISOString().split('T')[0] : null;
  }
  if (input.status !== undefined) updateData.status = input.status;
  if (input.progress !== undefined) updateData.progress = input.progress;
  if (input.priority !== undefined) updateData.priority = input.priority;

  const result = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Goal not found or update failed');

  return mapDbToGoal(result.data as GoalRow);
}

/**
 * Delete a goal
 * @param id - Goal ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteGoal(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ==================== DREAMS API ====================

/**
 * Get all dreams for the authenticated user
 * @returns Promise<Dream[]> - Array of all user's dreams
 * @throws Error if user not authenticated
 */
export async function getDreams(): Promise<Dream[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapDbToDream);
}

/**
 * Get a single dream by ID
 * @param id - Dream ID
 * @returns Promise<Dream> - The requested dream
 * @throws Error if dream not found or user not authenticated
 */
export async function getDream(id: string): Promise<Dream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('dreams')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Dream not found');

  return mapDbToDream(result.data as DreamRow);
}

/**
 * Create a new dream
 * @param input - Dream data including title, description, etc.
 * @returns Promise<Dream> - The created dream
 * @throws Error if creation fails or user not authenticated
 */
export async function createDream(input: CreateDreamInput): Promise<Dream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('dreams')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Failed to create dream');

  return mapDbToDream(result.data as DreamRow);
}

/**
 * Update an existing dream
 * @param id - Dream ID to update
 * @param input - Partial dream data to update
 * @returns Promise<Dream> - The updated dream
 * @throws Error if dream not found or user not authenticated
 */
export async function updateDream(id: string, input: UpdateDreamInput): Promise<Dream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: Partial<DreamRow> = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description ?? null;
  if (input.category !== undefined) updateData.category = input.category ?? null;
  if (input.notes !== undefined) updateData.notes = input.notes ?? null;

  const result = await supabase
    .from('dreams')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  if (!result.data) throw new Error('Dream not found or update failed');

  return mapDbToDream(result.data as DreamRow);
}

/**
 * Delete a dream
 * @param id - Dream ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteDream(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('dreams')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}