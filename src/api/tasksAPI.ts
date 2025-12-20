/**
 * Tasks API
 * CRUD operations for tasks with Supabase
 * Note: Project operations are in projectsAPI.ts
 */

import { supabase } from '../lib/supabase';
import type { TaskData } from '../services/types';

// =====================================================
// TASKS CRUD OPERATIONS
// =====================================================

/**
 * Get all tasks for the current user
 */
export async function getTasks(filters?: {
  status?: TaskData['status'];
  priority?: TaskData['priority'];
  category?: TaskData['category'];
  projectId?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
}): Promise<TaskData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.starred !== undefined) query = query.eq('starred', filters.starred);
    if (filters.archived !== undefined) query = query.eq('archived', filters.archived);
    if (filters.deleted !== undefined) query = query.eq('deleted', filters.deleted);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as TaskData[];
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<TaskData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const response = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (response.error) throw response.error;
  if (!response.data) throw new Error('Task not found');
  return response.data as TaskData;
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<TaskData, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TaskData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const response = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      ...task,
    })
    .select()
    .single();

  if (response.error) throw response.error;
  return response.data as TaskData;
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const response = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (response.error) throw response.error;
  return response.data as TaskData;
}

/**
 * Delete a task (soft delete)
 */
export async function deleteTask(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('tasks')
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Permanently delete a task
 */
export async function permanentlyDeleteTask(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Restore a deleted task
 */
export async function restoreTask(id: string): Promise<TaskData> {
  return updateTask(id, { deleted: false, deleted_at: null });
}

// NOTE: Project CRUD operations are in projectsAPI.ts
// Use projectsAPI.ts for all project-related operations