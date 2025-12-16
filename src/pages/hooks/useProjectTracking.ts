import type { Project } from '../../projects/hooks/useProjectsQuery';
import type { ProjectFormData } from '../../projects/types';

// Stats type expected by ProjectsHeader
interface SimpleProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}

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
      total: 0,
      active: 0,
      completed: 0,
      onHold: 0,
    } as SimpleProjectStats,
    handleCreateProject: async () => {},
    handleUpdateProject: async () => {},
    handleDeleteProject: async (_id: string) => {},
    openEditModal: (_project: Project) => {},
    closeModal: () => {},
  };
}
