/**
 * Tasks API with Merged Mode Support
 *
 * This API supports "merged mode" where couples/partners can share tasks data.
 * When both users set the 'todos' module to "merged" permission level,
 * the API automatically fetches data for both users.
 *
 * Security: RLS policies on tasks table ensure users can only see
 * partner's data if merged permission is mutually granted.
 *
 * @see src/shared/api/SharedDataProvider.ts - Core merged mode logic
 * @see supabase/migrations/*_add_tasks_merged_mode.sql - RLS policies
 *
 * Note: Project operations are in projectsAPI.ts
 */

import { supabase } from '../lib/supabase';
import type { TaskData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
import { validateApiResponse } from '../lib/validation';
import { TaskDataSchema, TaskDataArraySchema } from '../tasks/schemas';

// ============================================
// MERGED MODE SUPPORT
// ============================================

// Merged connection cache for Tasks
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for tasks module.
 * Returns connection info if both users have enabled merged mode, null otherwise.
 *
 * @returns MergedConnectionResult with partnerId and partnerName, or null
 */
export async function getTasksMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('todos');
  return cachedMergedConnection;
}

/**
 * Clear cached merged connection.
 * Call this when connection status changes or user logs out.
 */
export function clearTasksMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

// =====================================================
// TASKS CRUD OPERATIONS
// =====================================================

/**
 * Get all tasks for the current user.
 * In merged mode, fetches both user's and partner's tasks.
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

      // Check for merged connection
      const mergedConnection = await getTasksMergedConnection();

      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      // If merged mode enabled, fetch both users' data
      // Otherwise, fetch only current user's data
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

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
 * Get tasks by ID list.
 * In merged mode, includes partner's tasks.
 */
export async function getTasksByIds(ids: string[]): Promise<TaskData[]> {
  return apiCall(
    async () => {
      if (ids.length === 0) return [];
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getTasksMergedConnection();

      let query = supabase
        .from('tasks')
        .select('*')
        .in('id', ids);

      // Apply user filter based on merged mode
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error} = await query;

      if (error) throw error;
      return validateApiResponse(
        TaskDataArraySchema,
        data ?? [],
        'getTasksByIds'
      );
    },
    { domain: 'TasksAPI', operation: 'getTasksByIds', data: { count: ids.length } }
  );
}

/**
 * Get scheduled tasks for a specific date.
 * In merged mode, includes partner's scheduled tasks.
 */
export async function getScheduledTasksForDate(date: string): Promise<TaskData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getTasksMergedConnection();

      let query = supabase
        .from('tasks')
        .select('*')
        .gte('scheduled_start', `${date}T00:00:00`)
        .lt('scheduled_start', `${date}T23:59:59`);

      // Apply user filter based on merged mode
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

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

      const data = handleSupabaseResponse(response, 'Task', id);
      return validateApiResponse(TaskDataSchema, data, 'getTask');
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

      const data = handleSupabaseResponse(response, 'Task');
      return validateApiResponse(TaskDataSchema, data, 'createTask');
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

      const data = handleSupabaseResponse(response, 'Task', id);
      return validateApiResponse(TaskDataSchema, data, 'updateTask');
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

/**
 * Get tasks for reminder scheduling
 * Returns active tasks with scheduled_start or upcoming due_date
 */
export async function getTasksForReminders(options?: {
  includeScheduled?: boolean;
  includeDueToday?: boolean;
  daysAhead?: number;
}): Promise<TaskData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const today = new Date().toISOString().split('T')[0];
      const daysAhead = options?.daysAhead ?? 7;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'done')
        .eq('deleted', false);

      // Build OR conditions for scheduled_start and due_date
      const conditions: string[] = [];
      if (options?.includeScheduled !== false) {
        conditions.push('scheduled_start.not.is.null');
      }
      if (options?.includeDueToday !== false) {
        conditions.push(`due_date.gte.${today},due_date.lte.${futureDateStr}`);
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }

      query = query.order('scheduled_start', { ascending: true, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      return validateApiResponse(
        TaskDataArraySchema,
        data ?? [],
        'getTasksForReminders'
      );
    },
    { domain: 'TasksAPI', operation: 'getTasksForReminders', data: { options } }
  );
}

// NOTE: Project CRUD operations are in projectsAPI.ts
// Use projectsAPI.ts for all project-related operations
