/**
 * Projects React Query Hooks
 *
 * Comprehensive hooks for Projects domain with optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import type { ProjectData } from '../../services/types';
import { logger } from '@/services/logger';

// ==================== Types ====================

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold';
  icon: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  completed: boolean;
  completedDate?: Date;
  orderIndex: number;
  createdAt?: Date;
}

export interface ProjectAnalytics {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
  totalMilestones: number;
  completedMilestones: number;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;
export type MilestoneInput = Omit<ProjectMilestone, 'id' | 'projectId' | 'createdAt'>;
export type MilestoneUpdate = Partial<Omit<ProjectMilestone, 'id' | 'projectId' | 'createdAt'>>;

// ==================== Query Keys ====================

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: () => [...projectsKeys.lists()] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
  milestones: (projectId: string) => [...projectsKeys.all, 'milestones', projectId] as const,
  tasks: (projectId: string) => [...projectsKeys.all, 'tasks', projectId] as const,
  analytics: () => [...projectsKeys.all, 'analytics'] as const,
};

// ==================== Mappers ====================

const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitize = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

function mapProjectDataToProject(data: ProjectData): Project {
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    description: data.description ?? undefined,
    color: data.color ?? '#6366f1',
    status: (data.status as Project['status']) ?? 'active',
    icon: data.icon ?? '📁',
    createdAt: toDate(data.created_at) ?? new Date(),
    updatedAt: toDate(data.updated_at),
  };
}

function buildProjectInsertPayload(
  input: ProjectInput
): Omit<ProjectData, 'id' | 'created_at' | 'updated_at'> {
  return sanitize({
    name: input.name,
    description: input.description ?? undefined,
    color: input.color ?? '#6366f1',
    status: input.status ?? 'active',
    icon: input.icon ?? '📁',
  });
}

function buildProjectUpdatePayload(updates: ProjectUpdate): Partial<ProjectData> {
  return sanitize({
    name: updates.name,
    description: updates.description,
    color: updates.color,
    status: updates.status,
    icon: updates.icon,
  });
}

// ==================== Queries ====================

/**
 * Fetch all projects
 */
export function useProjectsQuery(): ReturnType<typeof useQuery<Project[]>> {
  return useQuery({
    queryKey: projectsKeys.list(),
    queryFn: async (): Promise<Project[]> => {
      const data = await apiClient.getProjects();
      return data.map(mapProjectDataToProject);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single project by ID
 */
export function useProjectQuery(projectId: string | undefined): ReturnType<typeof useQuery<Project>> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: projectsKeys.detail(projectId ?? ''),
    queryFn: (): Project => {
      // Try to get from cache first
      const cachedProjects = queryClient.getQueryData<Project[]>(projectsKeys.list());
      if (cachedProjects) {
        const cached = cachedProjects.find(p => p.id === projectId);
        if (cached) return cached;
      }

      // If not in cache, we'd need a getProject endpoint
      // For now, return from cached list or throw
      throw new Error('Project not found in cache and no single-project endpoint available');
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Mutations ====================

/**
 * Create a new project
 */
export function useCreateProjectMutation(): ReturnType<typeof useMutation<Project, Error, ProjectInput, { previousProjects?: Project[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      logger.debug('Creating project', { name: input.name, status: input.status });
      const payload = buildProjectInsertPayload(input);
      const created = await apiClient.createProject(payload);
      return mapProjectDataToProject(created);
    },
    onMutate: async (input) => {
      logger.debug('Optimistic update: create project', { name: input.name });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: projectsKeys.list() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(projectsKeys.list());

      // Optimistically add new project
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        ...input,
        color: input.color ?? '#6366f1',
        icon: input.icon ?? '📁',
        status: input.status ?? 'active',
        createdAt: new Date(),
      };

      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [optimisticProject];
        return [optimisticProject, ...old];
      });

      return { previousProjects };
    },
    onError: (err: Error, input, context) => {
      logger.error('Failed to create project', { error: err.message, name: input.name });
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsKeys.list(), context.previousProjects);
      }
    },
    onSuccess: (newProject) => {
      logger.info('Project created successfully', { id: newProject.id, name: newProject.name });
      // Replace temp project with real one
      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [newProject];
        return old.map((p) => (p.id.startsWith('temp-') ? newProject : p));
      });
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProjectMutation(): ReturnType<typeof useMutation<Project, Error, { projectId: string; updates: ProjectUpdate }, { previousProjects?: Project[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: ProjectUpdate }) => {
      logger.debug('Updating project', { projectId, updates });
      const payload = buildProjectUpdatePayload(updates);
      const updated = await apiClient.updateProject(projectId, payload);
      return mapProjectDataToProject(updated);
    },
    onMutate: async ({ projectId, updates }) => {
      logger.debug('Optimistic update: project', { projectId, updates });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: projectsKeys.list() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(projectsKeys.list());

      // Optimistically update
      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === projectId
            ? { ...p, ...updates, updatedAt: new Date() }
            : p
        );
      });

      return { previousProjects };
    },
    onError: (err: Error, { projectId }, context) => {
      logger.error('Failed to update project', { error: err.message, projectId });
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsKeys.list(), context.previousProjects);
      }
    },
    onSuccess: (updatedProject) => {
      logger.info('Project updated successfully', { id: updatedProject.id, name: updatedProject.name });
      // Update with server response
      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [updatedProject];
        return old.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProjectMutation(): ReturnType<typeof useMutation<string, Error, string, { previousProjects?: Project[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      logger.debug('Deleting project', { projectId });
      await apiClient.deleteProject(projectId);
      return projectId;
    },
    onMutate: async (projectId) => {
      logger.debug('Optimistic update: delete project', { projectId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: projectsKeys.list() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(projectsKeys.list());

      // Optimistically remove
      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== projectId);
      });

      return { previousProjects };
    },
    onError: (err: Error, projectId, context) => {
      logger.error('Failed to delete project', { error: err.message, projectId });
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsKeys.list(), context.previousProjects);
      }
    },
    onSuccess: (projectId) => {
      logger.info('Project deleted successfully', { id: projectId });
      // Invalidate to ensure consistency
      void queryClient.invalidateQueries({ queryKey: projectsKeys.list() });
    },
  });
}

// ==================== Helper Hooks ====================

/**
 * Get projects filtered by status
 */
export function useProjectsByStatus(status?: Project['status']): ReturnType<typeof useProjectsQuery> & { data: Project[] } {
  const { data: projects = [], ...rest } = useProjectsQuery();

  const filtered = status
    ? projects.filter((p) => p.status === status)
    : projects;

  return { data: filtered, ...rest };
}

/**
 * Get project statistics
 */
export function useProjectStats(): { data: { total: number; active: number; completed: number; onHold: number }; isLoading: boolean } {
  const { data: projects = [], isLoading } = useProjectsQuery();

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
  };

  return { data: stats, isLoading };
}

/**
 * Get project analytics
 */
export function useProjectAnalyticsQuery(): ReturnType<typeof useQuery<ProjectAnalytics>> {
  const { data: projects = [] } = useProjectsQuery();

  return useQuery({
    queryKey: projectsKeys.analytics(),
    queryFn: async () => {
      // Note: This is a simplified version. In a real app, you'd fetch task counts from the API
      return {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on_hold').length,
        totalTasks: 0, // Would need API endpoint
        completedTasks: 0, // Would need API endpoint
        averageProgress: 0, // Would need API endpoint
        totalMilestones: 0, // Would need API endpoint
        completedMilestones: 0, // Would need API endpoint
      };
    },
    enabled: projects.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== Milestone Mutations ====================
// Note: These require API endpoints to be implemented

/**
 * Create a milestone for a project
 * Note: Requires API endpoint implementation
 */
export function useCreateMilestoneMutation(): ReturnType<typeof useMutation<ProjectMilestone, Error, { projectId: string; milestone: MilestoneInput }, unknown>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, milestone }: { projectId: string; milestone: MilestoneInput }) => {
      logger.debug('Creating milestone', { projectId, title: milestone.title });
      // TODO: Implement API endpoint
      // const created = await apiClient.createProjectMilestone(projectId, milestone);
      throw new Error('API endpoint not yet implemented');
    },
    onSuccess: (newMilestone, { projectId }) => {
      logger.info('Milestone created successfully', { id: newMilestone.id, projectId });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.milestones(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.analytics() });
    },
    onError: (error: Error, { projectId, milestone }) => {
      logger.error('Failed to create milestone', { error: error.message, projectId, title: milestone.title });
    },
  });
}

/**
 * Update a milestone
 * Note: Requires API endpoint implementation
 */
export function useUpdateMilestoneMutation(): ReturnType<typeof useMutation<ProjectMilestone, Error, { milestoneId: string; projectId: string; updates: MilestoneUpdate }, unknown>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId, updates }: { milestoneId: string; projectId: string; updates: MilestoneUpdate }) => {
      logger.debug('Updating milestone', { milestoneId, updates });
      // TODO: Implement API endpoint
      // const updated = await apiClient.updateProjectMilestone(milestoneId, updates);
      throw new Error('API endpoint not yet implemented');
    },
    onSuccess: (updatedMilestone, { projectId }) => {
      logger.info('Milestone updated successfully', { id: updatedMilestone.id, projectId });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.milestones(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.analytics() });
    },
    onError: (error: Error, { milestoneId }) => {
      logger.error('Failed to update milestone', { error: error.message, milestoneId });
    },
  });
}

/**
 * Delete a milestone
 * Note: Requires API endpoint implementation
 */
export function useDeleteMilestoneMutation(): ReturnType<typeof useMutation<void, Error, { milestoneId: string; projectId: string }, unknown>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: string; projectId: string }) => {
      logger.debug('Deleting milestone', { milestoneId });
      // TODO: Implement API endpoint
      // await apiClient.deleteProjectMilestone(milestoneId);
      throw new Error('API endpoint not yet implemented');
    },
    onSuccess: (_, { milestoneId, projectId }) => {
      logger.info('Milestone deleted successfully', { id: milestoneId, projectId });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.milestones(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.analytics() });
    },
    onError: (error: Error, { milestoneId }) => {
      logger.error('Failed to delete milestone', { error: error.message, milestoneId });
    },
  });
}
