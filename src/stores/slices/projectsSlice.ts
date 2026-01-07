/**
 * Projects Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (projects, milestones, tasks, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useProjectsQuery.ts:
 * - useProjectsQuery() - Get all projects
 * - useProjectQuery(id) - Get single project with milestones
 * - useCreateProjectMutation() - Create project
 * - useUpdateProjectMutation() - Update project
 * - useDeleteProjectMutation() - Delete project
 * - useCreateMilestoneMutation() - Add milestone
 * - useUpdateMilestoneMutation() - Update milestone
 * - useDeleteMilestoneMutation() - Delete milestone
 * - useLinkTaskMutation() - Link task to project
 * - useUnlinkTaskMutation() - Unlink task from project
 *
 * Additional React Query Features:
 * - Project progress tracking hooks
 * - Milestone completion hooks
 * - Task dependency management
 * - Project analytics and reporting
 *
 * Benefits of React Query:
 * - Better project caching and synchronization
 * - Optimistic updates for milestone completion
 * - Automatic invalidation when projects change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface ProjectsSlice {
  // UI State only - no server data!
  projectsViewMode: 'grid' | 'list' | 'kanban' | 'timeline';
  projectsFilterStatus: 'all' | 'active' | 'completed' | 'on_hold' | 'archived';
  projectsFilterPriority: 'all' | 'low' | 'medium' | 'high';
  projectsFilterCategory: string | null;
  projectsSortBy: 'name' | 'created_at' | 'due_date' | 'progress' | 'priority';
  projectsSortOrder: 'asc' | 'desc';
  projectsShowArchived: boolean;
  projectsSelectedProject: string | null;
  projectsShowMilestones: boolean;
  projectsShowTasks: boolean;

  // UI Actions
  setProjectsViewMode: (mode: 'grid' | 'list' | 'kanban' | 'timeline') => void;
  setProjectsFilterStatus: (status: 'all' | 'active' | 'completed' | 'on_hold' | 'archived') => void;
  setProjectsFilterPriority: (priority: 'all' | 'low' | 'medium' | 'high') => void;
  setProjectsFilterCategory: (category: string | null) => void;
  setProjectsSortBy: (sortBy: 'name' | 'created_at' | 'due_date' | 'progress' | 'priority') => void;
  setProjectsSortOrder: (order: 'asc' | 'desc') => void;
  setProjectsShowArchived: (show: boolean) => void;
  setProjectsSelectedProject: (projectId: string | null) => void;
  setProjectsShowMilestones: (show: boolean) => void;
  setProjectsShowTasks: (show: boolean) => void;
  resetProjectsFilters: () => void;
}

export const createProjectsSlice: StateCreator<ProjectsSlice, [], [], ProjectsSlice> = (set) => ({
  // Initial UI state
  projectsViewMode: 'grid',
  projectsFilterStatus: 'all',
  projectsFilterPriority: 'all',
  projectsFilterCategory: null,
  projectsSortBy: 'created_at',
  projectsSortOrder: 'desc',
  projectsShowArchived: false,
  projectsSelectedProject: null,
  projectsShowMilestones: true,
  projectsShowTasks: true,

  // UI Actions
  setProjectsViewMode: (mode) => set({ projectsViewMode: mode }),
  setProjectsFilterStatus: (status) => set({ projectsFilterStatus: status }),
  setProjectsFilterPriority: (priority) => set({ projectsFilterPriority: priority }),
  setProjectsFilterCategory: (category) => set({ projectsFilterCategory: category }),
  setProjectsSortBy: (sortBy) => set({ projectsSortBy: sortBy }),
  setProjectsSortOrder: (order) => set({ projectsSortOrder: order }),
  setProjectsShowArchived: (show) => set({ projectsShowArchived: show }),
  setProjectsSelectedProject: (projectId) => set({ projectsSelectedProject: projectId }),
  setProjectsShowMilestones: (show) => set({ projectsShowMilestones: show }),
  setProjectsShowTasks: (show) => set({ projectsShowTasks: show }),
  resetProjectsFilters: () =>
    set({
      projectsFilterStatus: 'all',
      projectsFilterPriority: 'all',
      projectsFilterCategory: null,
      projectsShowArchived: false,
      projectsSelectedProject: null,
      projectsShowMilestones: true,
      projectsShowTasks: true,
    }),
});
