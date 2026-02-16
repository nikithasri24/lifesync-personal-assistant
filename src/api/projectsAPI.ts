/**
 * Projects API
 * CRUD operations for enhanced project tracking with milestones and task linking
 */

import { supabase } from '../lib/supabase';
import type { Project, ProjectMilestone, ProjectTask } from '../services/types';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { NotFoundError, AuthorizationError } from '../lib/errors';

// =====================================================
// PROJECTS CRUD OPERATIONS
// =====================================================

/**
 * Get all projects for the current user
 */
export async function getProjects(filters?: {
  status?: Project['status'];
  priority?: Project['priority'];
  tags?: string[];
}): Promise<Project[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process milestones to ensure proper ordering
      const projects = (data ?? []).map(project => ({
        ...project,
        milestones: (project.milestones || []).sort((a: ProjectMilestone, b: ProjectMilestone) => a.order_index - b.order_index)
      })) as Project[];

      return projects;
    },
    { domain: 'ProjectsAPI', operation: 'getProjects', data: { filters } }
  );
}

/**
 * Get a single project by ID with all related data
 */
export async function getProject(id: string): Promise<Project> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new NotFoundError('Project', id);

      // Sort milestones by order
      const project = {
        ...data,
        milestones: (data.milestones || []).sort((a: ProjectMilestone, b: ProjectMilestone) => a.order_index - b.order_index)
      } as Project;

      return project;
    },
    { domain: 'ProjectsAPI', operation: 'getProject', data: { id } }
  );
}

/**
 * Create a new project
 */
export async function createProject(
  project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>
): Promise<Project> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Sanitize payload - ensure required fields have defaults
      const sanitizedProject = {
        user_id: user.id,
        name: project.name,
        description: project.description ?? null,
        status: project.status ?? 'planning',
        priority: project.priority ?? 'medium',
        start_date: project.start_date ?? null,
        target_date: project.target_date ?? null,
        completed_date: project.completed_date ?? null,
        tags: project.tags ?? [],
        color: project.color ?? null,
        progress: project.progress ?? 0,
        team_members: project.team_members ?? null,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(sanitizedProject)
        .select('*')
        .single();

      if (error) throw error;
      return data as Project;
    },
    { domain: 'ProjectsAPI', operation: 'createProject', data: { name: project.name } }
  );
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>>
): Promise<Project> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Sanitize updates - remove undefined values
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('projects')
        .update(sanitizedUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      // Sort milestones by order
      const project = {
        ...data,
        milestones: (data.milestones || []).sort((a: ProjectMilestone, b: ProjectMilestone) => a.order_index - b.order_index)
      } as Project;

      return project;
    },
    { domain: 'ProjectsAPI', operation: 'updateProject', data: { id } }
  );
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'ProjectsAPI', operation: 'deleteProject', data: { id } }
  );
}

// =====================================================
// PROJECT MILESTONES OPERATIONS
// =====================================================

/**
 * Get all milestones for a project
 */
export async function getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify user has access to the project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (!project) throw new NotFoundError('Project', milestone.project_id);

      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProjectMilestone[];
    },
    { domain: 'ProjectsAPI', operation: 'getProjectMilestones', data: { projectId } }
  );
}

/**
 * Create a new milestone
 */
export async function createMilestone(
  milestone: Omit<ProjectMilestone, 'id' | 'created_at'>
): Promise<ProjectMilestone> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify user has access to the project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', milestone.project_id)
        .eq('user_id', user.id)
        .single();

      if (!project) throw new NotFoundError('Project', milestone.project_id);

      // Sanitize payload
      const sanitizedMilestone = {
        project_id: milestone.project_id,
        title: milestone.title,
        description: milestone.description ?? null,
        target_date: milestone.target_date ?? null,
        completed: milestone.completed ?? false,
        completed_date: milestone.completed_date ?? null,
        order_index: milestone.order_index ?? 0,
      };

      const { data, error } = await supabase
        .from('project_milestones')
        .insert(sanitizedMilestone)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMilestone;
    },
    { domain: 'ProjectsAPI', operation: 'createMilestone', data: { projectId: milestone.project_id, title: milestone.title } }
  );
}

/**
 * Update a milestone
 */
export async function updateMilestone(
  id: string,
  updates: Partial<Omit<ProjectMilestone, 'id' | 'project_id' | 'created_at'>>
): Promise<ProjectMilestone> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Sanitize updates - remove undefined values
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      // If marking as completed, set completed_date
      if (sanitizedUpdates.completed === true && !sanitizedUpdates.completed_date) {
        sanitizedUpdates.completed_date = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('project_milestones')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMilestone;
    },
    { domain: 'ProjectsAPI', operation: 'updateMilestone', data: { id } }
  );
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    { domain: 'ProjectsAPI', operation: 'deleteMilestone', data: { id } }
  );
}

// =====================================================
// PROJECT TASKS LINKING OPERATIONS
// =====================================================

/**
 * Get all tasks linked to a project
 */
export async function getProjectTasks(projectId: string): Promise<string[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify user has access to the project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (!project) throw new NotFoundError('Project', milestone.project_id);

      const { data, error } = await supabase
        .from('project_tasks')
        .select('task_id')
        .eq('project_id', projectId);

      if (error) throw error;
      return (data ?? []).map(pt => pt.task_id);
    },
    { domain: 'ProjectsAPI', operation: 'getProjectTasks', data: { projectId } }
  );
}

/**
 * Link a task to a project
 */
export async function linkTaskToProject(
  projectId: string,
  taskId: string
): Promise<ProjectTask> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify user has access to both the project and the task
      const [projectResult, taskResult] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('tasks')
          .select('id')
          .eq('id', taskId)
          .eq('user_id', user.id)
          .single()
      ]);

      if (!projectResult.data) throw new NotFoundError('Project', projectId);
      if (!taskResult.data) throw new NotFoundError('Task', taskId);

      const { data, error } = await supabase
        .from('project_tasks')
        .insert({ project_id: projectId, task_id: taskId })
        .select()
        .single();

      if (error) {
        // Ignore duplicate key errors (task already linked)
        if (error.code === '23505') {
          logger.info('ProjectsAPI', 'Task already linked to project', { projectId, taskId });
          const { data: existing } = await supabase
            .from('project_tasks')
            .select()
            .eq('project_id', projectId)
            .eq('task_id', taskId)
            .single();
          return existing as ProjectTask;
        }
        throw error;
      }

      return data as ProjectTask;
    },
    { domain: 'ProjectsAPI', operation: 'linkTaskToProject', data: { projectId, taskId } }
  );
}

/**
 * Unlink a task from a project
 */
export async function unlinkTaskFromProject(
  projectId: string,
  taskId: string
): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('project_id', projectId)
        .eq('task_id', taskId);

      if (error) throw error;
    },
    { domain: 'ProjectsAPI', operation: 'unlinkTaskFromProject', data: { projectId, taskId } }
  );
}
