/**
 * Projects React Query Hooks
 *
 * Comprehensive hooks for Projects domain with optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectsAPI from '@/api/projectsAPI';
import type { Project, ProjectMilestone } from '@/services/types';
import { logger } from '@/services/logger';

// ==================== Types ====================

// Re-export types from services/types for convenience
export type { Project, ProjectMilestone } from '@/services/types';

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

export type ProjectInput = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>;
export type ProjectUpdate = Partial<ProjectInput>;
export type MilestoneInput = Omit<ProjectMilestone, 'id' | 'project_id' | 'created_at'>;
export type MilestoneUpdate = Partial<Omit<ProjectMilestone, 'id' | 'project_id' | 'created_at'>>;

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

// ==================== Queries ====================

/**
 * Fetch all projects
 */
export function useProjectsQuery(): ReturnType<typeof useQuery<Project[]>> {
  return useQuery({
    queryKey: projectsKeys.list(),
    queryFn: () => projectsAPI.getProjects(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single project by ID
 */
export function useProjectQuery(projectId: string | undefined): ReturnType<typeof useQuery<Project>> {
  return useQuery({
    queryKey: projectsKeys.detail(projectId ?? ''),
    queryFn: () => projectsAPI.getProject(projectId!),
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
      logger.debug('Projects', 'Creating project', { name: input.name, status: input.status });
      return projectsAPI.createProject(input);
    },
    onMutate: async (input) => {
      logger.debug('Projects', 'Optimistic update: create project', { name: input.name });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: projectsKeys.list() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(projectsKeys.list());

      // Optimistically add new project
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        user_id: 'temp',
        name: input.name,
        description: input.description,
        status: input.status ?? 'planning',
        priority: input.priority ?? 'medium',
        start_date: input.start_date,
        target_date: input.target_date,
        tags: input.tags ?? [],
        color: input.color,
        progress: input.progress ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [optimisticProject];
        return [optimisticProject, ...old];
      });

      return { previousProjects };
    },
    onError: (err: Error, input, context) => {
      logger.error('Projects', 'Failed to create project', { error: err.message, name: input.name });
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsKeys.list(), context.previousProjects);
      }
    },
    onSuccess: (newProject) => {
      logger.info('Projects', 'Project created successfully', { id: newProject.id, name: newProject.name });
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
      logger.debug('Projects', 'Updating project', { projectId, updates });
      return projectsAPI.updateProject(projectId, updates);
    },
    onMutate: async ({ projectId, updates }) => {
      logger.debug('Projects', 'Optimistic update: project', { projectId, updates });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: projectsKeys.list() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData<Project[]>(projectsKeys.list());

      // Optimistically update
      queryClient.setQueryData<Project[]>(projectsKeys.list(), (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === projectId
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p
        );
      });

      return { previousProjects };
    },
    onError: (err: Error, { projectId }, context) => {
      logger.error('Projects', 'Failed to update project', { error: err.message, projectId });
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsKeys.list(), context.previousProjects);
      }
    },
    onSuccess: (updatedProject) => {
      logger.info('Projects', 'Project updated successfully', { id: updatedProject.id, name: updatedProject.name });
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
      logger.debug('Projects', 'Deleting project', { projectId });
      await projectsAPI.deleteProject(projectId);
      return projectId;
    },
    onMutate: async (projectId) => {
      logger.debug('Projects', 'Optimistic update: delete project', { projectId });
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
      logger.error('Projects', 'Failed to delete project', { error: err.message, projectId });
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsKeys.list(), context.previousProjects);
      }
    },
    onSuccess: (projectId) => {
      logger.info('Projects', 'Project deleted successfully', { id: projectId });
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

  return { data: filtered, ...rest } as ReturnType<typeof useProjectsQuery> & { data: Project[] };
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
    onHold: projects.filter(p => p.status === 'on-hold').length,
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
        onHold: projects.filter(p => p.status === 'on-hold').length,
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
      logger.debug('Projects', 'Creating milestone', { projectId, title: milestone.title });
      // TODO: Implement API endpoint
      // const created = await apiClient.createProjectMilestone(projectId, milestone);
      throw new Error('API endpoint not yet implemented');
    },
    onSuccess: (newMilestone: any, { projectId }) => {
      logger.info('Projects', 'Milestone created successfully', { id: newMilestone?.id, projectId });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.milestones(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.analytics() });
    },
    onError: (error: Error, { projectId, milestone }) => {
      logger.error('Projects', 'Failed to create milestone', { error: error.message, projectId, title: milestone.title });
    },
  });
}

/**
 * Update a project milestone
 * Note: Requires API endpoint implementation
 */
export function useUpdateProjectMilestoneMutation(): ReturnType<typeof useMutation<ProjectMilestone, Error, { milestoneId: string; projectId: string; updates: MilestoneUpdate }, unknown>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId, updates }: { milestoneId: string; projectId: string; updates: MilestoneUpdate }) => {
      logger.debug('Projects', 'Updating milestone', { milestoneId, updates });
      // TODO: Implement API endpoint
      // const updated = await apiClient.updateProjectMilestone(milestoneId, updates);
      throw new Error('API endpoint not yet implemented');
    },
    onSuccess: (updatedMilestone: any, { projectId }) => {
      logger.info('Projects', 'Milestone updated successfully', { id: updatedMilestone?.id, projectId });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.milestones(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.analytics() });
    },
    onError: (error: Error, { milestoneId }) => {
      logger.error('Projects', 'Failed to update milestone', { error: error.message, milestoneId });
    },
  });
}

/**
 * Delete a project milestone
 * Note: Requires API endpoint implementation
 */
export function useDeleteProjectMilestoneMutation(): ReturnType<typeof useMutation<void, Error, { milestoneId: string; projectId: string }, unknown>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: string; projectId: string }) => {
      logger.debug('Projects', 'Deleting milestone', { milestoneId });
      // TODO: Implement API endpoint
      // await apiClient.deleteProjectMilestone(milestoneId);
      throw new Error('API endpoint not yet implemented');
    },
    onSuccess: (_, { milestoneId, projectId }) => {
      logger.info('Projects', 'Milestone deleted successfully', { id: milestoneId, projectId });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.milestones(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectsKeys.analytics() });
    },
    onError: (error: Error, { milestoneId }) => {
      logger.error('Projects', 'Failed to delete milestone', { error: error.message, milestoneId });
    },
  });
}
