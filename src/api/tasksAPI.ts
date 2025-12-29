/**
 * Tasks API
 * CRUD operations for tasks with Supabase
 * Note: Project operations are in projectsAPI.ts
 */

import { supabase } from '../lib/supabase';
import type { TaskData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

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
  return apiCall(
    async () => {
      const user = await requireAuth();

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
    },
    { domain: 'TasksAPI', operation: 'getTasks', data: { filters } }
  );
}

/**
 * Get tasks by ID list
 */
export async function getTasksByIds(ids: string[]): Promise<TaskData[]> {
  return apiCall(
    async () => {
      if (ids.length === 0) return [];
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;
      return (data ?? []) as TaskData[];
    },
    { domain: 'TasksAPI', operation: 'getTasksByIds', data: { count: ids.length } }
  );
}

/**
 * Get scheduled tasks for a specific date
 */
export async function getScheduledTasksForDate(date: string): Promise<TaskData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_start', `${date}T00:00:00`)
        .lt('scheduled_start', `${date}T23:59:59`);

      if (error) throw error;
      return (data ?? []) as TaskData[];
    },
    { domain: 'TasksAPI', operation: 'getScheduledTasksForDate', data: { date } }
  );
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<TaskData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const response = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      return handleSupabaseResponse(response, 'Task', id);
    },
    { domain: 'TasksAPI', operation: 'getTask', data: { id } }
  );
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<TaskData, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TaskData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const response = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          ...task,
        })
        .select()
        .single();

      return handleSupabaseResponse(response, 'Task');
    },
    { domain: 'TasksAPI', operation: 'createTask', data: { title: task.title } }
  );
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const response = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      return handleSupabaseResponse(response, 'Task', id);
    },
    { domain: 'TasksAPI', operation: 'updateTask', data: { id } }
  );
}

/**
 * Delete a task (soft delete)
 */
export async function deleteTask(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('tasks')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'TasksAPI', operation: 'deleteTask', data: { id } }
  );
}

/**
 * Permanently delete a task
 */
export async function permanentlyDeleteTask(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'TasksAPI', operation: 'permanentlyDeleteTask', data: { id } }
  );
}

/**
 * Restore a deleted task
 */
export async function restoreTask(id: string): Promise<TaskData> {
  return updateTask(id, { deleted: false, deleted_at: null });
}

// NOTE: Project CRUD operations are in projectsAPI.ts
// Use projectsAPI.ts for all project-related operations
