import type { Project } from '../../projects/hooks/useProjectsQuery';
import type { ProjectFormData, ProjectStats } from '../../projects/types';

// Project tracking hook stub
export function useProjectTracking() {
  return {
    loading: false,
    viewMode: 'list' as 'list' | 'grid',
    setViewMode: (_mode: 'list' | 'grid') => {},
    statusFilter: 'all' as const,
    setStatusFilter: (_filter: string) => {},
    searchQuery: '',
    setSearchQuery: (_query: string) => {},
    showCreateModal: false,
    setShowCreateModal: (_show: boolean) => {},
    editingProject: null as Project | null,
    deleteConfirmId: null as string | null,
    setDeleteConfirmId: (_id: string | null) => {},
    expandedProjectId: null as string | null,
    setExpandedProjectId: (_id: string | null) => {},
    formData: {} as ProjectFormData,
    setFormData: (_data: ProjectFormData) => {},
    projectMetrics: [] as never[],
    filteredProjects: [] as Project[],
    stats: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
    } as ProjectStats,
    handleCreateProject: async () => {},
    handleUpdateProject: async () => {},
    handleDeleteProject: async (_id: string) => {},
    openEditModal: (_project: Project) => {},
    closeModal: () => {},
  };
}
