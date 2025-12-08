/**
 * Life Goals API
 * CRUD operations for long-term life goals and planning
 */

import { supabase } from '../lib/supabase';
import type { LifeGoal } from '../services/types';
import { logger } from '../services/logger';

// =====================================================
// LIFE GOALS CRUD OPERATIONS
// =====================================================

/**
 * Get all life goals for the current user
 * @param filters - Optional filters for status, category, and priority
 * @returns Promise<LifeGoal[]> - Array of life goals matching the filters
 * @throws Error if user not authenticated
 */
export async function getLifeGoals(filters?: {
  status?: LifeGoal['status'];
  category?: LifeGoal['category'];
  priority?: LifeGoal['priority'];
}): Promise<LifeGoal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('life_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters) {
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
  }

  const { data, error } = await query;

  if (error) {
    logger.error('LifeGoalsAPI', error, { context: 'getLifeGoals', filters });
    throw error;
  }

  return (data ?? []) as LifeGoal[];
}

/**
 * Get a single life goal by ID
 * @param id - Life goal ID
 * @returns Promise<LifeGoal> - The requested life goal
 * @throws Error if life goal not found or user not authenticated
 */
export async function getLifeGoal(id: string): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    logger.error('LifeGoalsAPI', error, { context: 'getLifeGoal', id });
    throw error;
  }

  return data as LifeGoal;
}

/**
 * Create a new life goal
 * @param goal - Life goal data
 * @returns Promise<LifeGoal> - The created life goal
 * @throws Error if creation fails or user not authenticated
 */
export async function createLifeGoal(
  goal: Omit<LifeGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goals')
    .insert({ ...goal, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('LifeGoalsAPI', error, { context: 'createLifeGoal', goal });
    throw error;
  }

  logger.info('LifeGoalsAPI', 'Life goal created', { id: data.id, title: data.title });
  return data as LifeGoal;
}

/**
 * Update an existing life goal
 * @param id - Life goal ID to update
 * @param updates - Partial life goal data to update
 * @returns Promise<LifeGoal> - The updated life goal
 * @throws Error if life goal not found or user not authenticated
 */
export async function updateLifeGoal(
  id: string,
  updates: Partial<LifeGoal>
): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('LifeGoalsAPI', error, { context: 'updateLifeGoal', id, updates });
    throw error;
  }

  logger.info('LifeGoalsAPI', 'Life goal updated', { id });
  return data as LifeGoal;
}

/**
 * Delete a life goal
 * @param id - Life goal ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteLifeGoal(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('life_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('LifeGoalsAPI', error, { context: 'deleteLifeGoal', id });
    throw error;
  }

  logger.info('LifeGoalsAPI', 'Life goal deleted', { id });
}
