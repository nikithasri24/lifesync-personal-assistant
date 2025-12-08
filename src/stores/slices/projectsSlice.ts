/**
 * Projects Slice
 *
 * Manages enhanced project tracking state and operations
 */

import { type StateCreator } from 'zustand';
import type { Project, ProjectMilestone, ProjectTask } from '@/services/types';
import {
  getProjects,
  getProject,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  createMilestone as apiCreateMilestone,
  updateMilestone as apiUpdateMilestone,
  deleteMilestone as apiDeleteMilestone,
  linkTaskToProject as apiLinkTaskToProject,
  unlinkTaskFromProject as apiUnlinkTaskFromProject,
} from '@/api/projectsAPI';
import { logger } from '@/services/logger';

export interface ProjectsSlice {
  // State
  projects: Project[];
  projectsLoaded: boolean;
  projectsLoading: boolean;
  projectsError: string | null;

  // Project Actions
  loadProjects: (filters?: Parameters<typeof getProjects>[0]) => Promise<void>;
  refreshProject: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;

  // Milestone Actions
  addMilestone: (milestone: Omit<ProjectMilestone, 'id' | 'created_at'>) => Promise<ProjectMilestone>;
  updateMilestone: (id: string, updates: Partial<ProjectMilestone>) => Promise<ProjectMilestone>;
  deleteMilestone: (projectId: string, milestoneId: string) => Promise<void>;

  // Task Linking Actions
  linkTask: (projectId: string, taskId: string) => Promise<void>;
  unlinkTask: (projectId: string, taskId: string) => Promise<void>;
}

export const createProjectsSlice: StateCreator<ProjectsSlice, [], [], ProjectsSlice> = (
  set,
  get
) => ({
  // Initial state
  projects: [],
  projectsLoaded: false,
  projectsLoading: false,
  projectsError: null,

  // Load all projects
  loadProjects: async (filters): Promise<void> => {
    // Prevent duplicate loads
    if (get().projectsLoading) return;

    set({ projectsLoading: true, projectsError: null });
    try {
      const projects = await getProjects(filters);
      set({ projects, projectsLoaded: true, projectsLoading: false });
      logger.info('ProjectsSlice', 'Projects loaded successfully', { count: projects.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      logger.error('ProjectsSlice', error as Error, { context: 'loadProjects' });
      set({
        projectsError: errorMessage,
        projectsLoading: false,
      });
      throw error;
    }
  },

  // Refresh a single project
  refreshProject: async (id: string): Promise<void> => {
    try {
      const project = await getProject(id);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? project : p)),
      }));
      logger.info('ProjectsSlice', 'Project refreshed', { id });
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, { context: 'refreshProject', id });
      throw error;
    }
  },

  // Add a new project
  addProject: async (project): Promise<Project> => {
    try {
      const created = await apiCreateProject(project);
      set((state) => ({ projects: [created, ...state.projects] }));
      logger.info('ProjectsSlice', 'Project created', { id: created.id, name: created.name });
      return created;
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, { context: 'addProject' });
      throw error;
    }
  },

  // Update a project
  updateProject: async (id, updates): Promise<Project> => {
    try {
      // Optimistic update
      const oldProjects = get().projects;
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));

      const updated = await apiUpdateProject(id, updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
      }));
      logger.info('ProjectsSlice', 'Project updated', { id, updates: Object.keys(updates) });
      return updated;
    } catch (error) {
      // Revert optimistic update on error
      set({ projects: get().projects });
      logger.error('ProjectsSlice', error as Error, { context: 'updateProject', id });
      throw error;
    }
  },

  // Delete a project
  deleteProject: async (id): Promise<void> => {
    try {
      // Optimistic delete
      const oldProjects = get().projects;
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
      }));

      await apiDeleteProject(id);
      logger.info('ProjectsSlice', 'Project deleted', { id });
    } catch (error) {
      // Revert optimistic delete on error
      set({ projects: get().projects });
      logger.error('ProjectsSlice', error as Error, { context: 'deleteProject', id });
      throw error;
    }
  },

  // Get project by ID from state
  getProjectById: (id): Project | undefined => {
    return get().projects.find((p) => p.id === id);
  },

  // Add a milestone to a project
  addMilestone: async (milestone): Promise<ProjectMilestone> => {
    try {
      const created = await apiCreateMilestone(milestone);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === milestone.project_id
            ? {
                ...p,
                milestones: [...(p.milestones || []), created].sort(
                  (a, b) => a.order_index - b.order_index
                ),
              }
            : p
        ),
      }));
      logger.info('ProjectsSlice', 'Milestone created', {
        id: created.id,
        projectId: milestone.project_id,
        title: created.title,
      });
      return created;
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, { context: 'addMilestone' });
      throw error;
    }
  },

  // Update a milestone
  updateMilestone: async (id, updates): Promise<ProjectMilestone> => {
    try {
      const updated = await apiUpdateMilestone(id, updates);
      set((state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          milestones: (p.milestones || [])
            .map((m) => (m.id === id ? updated : m))
            .sort((a, b) => a.order_index - b.order_index),
        })),
      }));
      logger.info('ProjectsSlice', 'Milestone updated', { id, updates: Object.keys(updates) });
      return updated;
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, { context: 'updateMilestone', id });
      throw error;
    }
  },

  // Delete a milestone
  deleteMilestone: async (projectId, milestoneId): Promise<void> => {
    try {
      await apiDeleteMilestone(milestoneId);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                milestones: (p.milestones || []).filter((m) => m.id !== milestoneId),
              }
            : p
        ),
      }));
      logger.info('ProjectsSlice', 'Milestone deleted', { projectId, milestoneId });
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, {
        context: 'deleteMilestone',
        projectId,
        milestoneId,
      });
      throw error;
    }
  },

  // Link a task to a project
  linkTask: async (projectId, taskId): Promise<void> => {
    try {
      await apiLinkTaskToProject(projectId, taskId);
      logger.info('ProjectsSlice', 'Task linked to project', { projectId, taskId });
      // Optionally refresh the project to get updated task list
      await get().refreshProject(projectId);
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, { context: 'linkTask', projectId, taskId });
      throw error;
    }
  },

  // Unlink a task from a project
  unlinkTask: async (projectId, taskId): Promise<void> => {
    try {
      await apiUnlinkTaskFromProject(projectId, taskId);
      logger.info('ProjectsSlice', 'Task unlinked from project', { projectId, taskId });
      // Optionally refresh the project to get updated task list
      await get().refreshProject(projectId);
    } catch (error) {
      logger.error('ProjectsSlice', error as Error, {
        context: 'unlinkTask',
        projectId,
        taskId,
      });
      throw error;
    }
  },
});
