/**
 * Projects API
 * CRUD operations for enhanced project tracking with milestones and task linking
 */

import { supabase } from '../lib/supabase';
import type { Project, ProjectMilestone, ProjectTask } from '../services/types';
import { logger } from '../services/logger';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('projects')
    .select(`
      *,
      milestones:project_milestones(*)
    `)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
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

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'getProjects', filters });
    throw error;
  }

  // Process milestones to ensure proper ordering
  const projects = (data ?? []).map(project => ({
    ...project,
    milestones: (project.milestones || []).sort((a: ProjectMilestone, b: ProjectMilestone) => a.order_index - b.order_index)
  })) as Project[];

  return projects;
}

/**
 * Get a single project by ID with all related data
 */
export async function getProject(id: string): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      milestones:project_milestones(*)
    `)
    .eq('id', id)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .single();

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'getProject', id });
    throw error;
  }
  if (!data) throw new Error('Project not found');

  // Sort milestones by order
  const project = {
    ...data,
    milestones: (data.milestones || []).sort((a: ProjectMilestone, b: ProjectMilestone) => a.order_index - b.order_index)
  } as Project;

  return project;
}

/**
 * Create a new project
 */
export async function createProject(
  project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>
): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
    .select(`
      *,
      milestones:project_milestones(*)
    `)
    .single();

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'createProject', project: sanitizedProject });
    throw error;
  }

  return data as Project;
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>>
): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Sanitize updates - remove undefined values
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );

  const { data, error } = await supabase
    .from('projects')
    .update(sanitizedUpdates)
    .eq('id', id)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .select(`
      *,
      milestones:project_milestones(*)
    `)
    .single();

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'updateProject', id, updates: sanitizedUpdates });
    throw error;
  }

  // Sort milestones by order
  const project = {
    ...data,
    milestones: (data.milestones || []).sort((a: ProjectMilestone, b: ProjectMilestone) => a.order_index - b.order_index)
  } as Project;

  return project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'deleteProject', id });
    throw error;
  }
}

// =====================================================
// PROJECT MILESTONES OPERATIONS
// =====================================================

/**
 * Get all milestones for a project
 */
export async function getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user has access to the project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .single();

  if (!project) throw new Error('Project not found or access denied');

  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'getProjectMilestones', projectId });
    throw error;
  }

  return (data ?? []) as ProjectMilestone[];
}

/**
 * Create a new milestone
 */
export async function createMilestone(
  milestone: Omit<ProjectMilestone, 'id' | 'created_at'>
): Promise<ProjectMilestone> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user has access to the project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', milestone.project_id)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .single();

  if (!project) throw new Error('Project not found or access denied');

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

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'createMilestone', milestone: sanitizedMilestone });
    throw error;
  }

  return data as ProjectMilestone;
}

/**
 * Update a milestone
 */
export async function updateMilestone(
  id: string,
  updates: Partial<Omit<ProjectMilestone, 'id' | 'project_id' | 'created_at'>>
): Promise<ProjectMilestone> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'updateMilestone', id, updates: sanitizedUpdates });
    throw error;
  }

  return data as ProjectMilestone;
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'deleteMilestone', id });
    throw error;
  }
}

// =====================================================
// PROJECT TASKS LINKING OPERATIONS
// =====================================================

/**
 * Get all tasks linked to a project
 */
export async function getProjectTasks(projectId: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user has access to the project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .single();

  if (!project) throw new Error('Project not found or access denied');

  const { data, error } = await supabase
    .from('project_tasks')
    .select('task_id')
    .eq('project_id', projectId);

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'getProjectTasks', projectId });
    throw error;
  }

  return (data ?? []).map(pt => pt.task_id);
}

/**
 * Link a task to a project
 */
export async function linkTaskToProject(
  projectId: string,
  taskId: string
): Promise<ProjectTask> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify user has access to both the project and the task
  const [projectResult, taskResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
      .single(),
    supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()
  ]);

  if (!projectResult.data) throw new Error('Project not found or access denied');
  if (!taskResult.data) throw new Error('Task not found or access denied');

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
    logger.error('ProjectsAPI', error, { context: 'linkTaskToProject', projectId, taskId });
    throw error;
  }

  return data as ProjectTask;
}

/**
 * Unlink a task from a project
 */
export async function unlinkTaskFromProject(
  projectId: string,
  taskId: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('project_id', projectId)
    .eq('task_id', taskId);

  if (error) {
    logger.error('ProjectsAPI', error, { context: 'unlinkTaskFromProject', projectId, taskId });
    throw error;
  }
}
