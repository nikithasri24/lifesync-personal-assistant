import { useState, useMemo } from 'react';
import type { ProjectFormData, ProjectMetrics, ProjectStats } from '../../projects/types';
import type { TodoItem } from '../../types';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  type Project
} from '../../projects/hooks/useProjectsQuery';
import {
  calculateProjectMetrics,
  calculateProjectStats,
  createEmptyFormData,
  projectToFormData
} from '../../projects/services/projectHelpers';
import { useTasks } from '../../hooks/useTasksQuery';
import { logger } from '../../services/logger';

interface UseProjectTrackingReturn {
  projects: Project[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'active' | 'on_hold' | 'completed';
  setStatusFilter: (filter: 'all' | 'active' | 'on_hold' | 'completed') => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  editingProject: Project | null;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  expandedProjectId: string | null;
  setExpandedProjectId: (id: string | null) => void;
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  projectMetrics: ProjectMetrics[];
  filteredProjects: Project[];
  stats: ProjectStats;
  handleCreateProject: () => Promise<void>;
  handleUpdateProject: () => Promise<void>;
  handleDeleteProject: (id: string) => Promise<void>;
  openEditModal: (project: Project) => void;
  closeModal: () => void;
}

export const useProjectTracking = (): UseProjectTrackingReturn => {
  const projectsQuery = useProjectsQuery();
  const todosQuery = useTasks();

  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const loading = projectsQuery.isLoading || todosQuery.isLoading;

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const todos = useMemo(() => (todosQuery.data ?? []) as unknown as TodoItem[], [todosQuery.data]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_hold' | 'completed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(createEmptyFormData());

  const projectMetrics = useMemo(() => calculateProjectMetrics(projects, todos), [projects, todos]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [projects, statusFilter, searchQuery]);

  const stats = useMemo(() => calculateProjectStats(projects, projectMetrics), [projects, projectMetrics]);

  const handleCreateProject = async (): Promise<void> => {
    if (!formData.name.trim()) return;

    try {
      await createProjectMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
        status: formData.status,
      });

      setShowCreateModal(false);
      setFormData(createEmptyFormData());
    } catch (error: unknown) {
      logger.error('Failed to create project', { error });
    }
  };

  const handleUpdateProject = async (): Promise<void> => {
    if (!editingProject || !formData.name.trim()) return;

    try {
      await updateProjectMutation.mutateAsync({
        projectId: editingProject.id,
        updates: {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          icon: formData.icon,
          status: formData.status,
        },
      });

      setEditingProject(null);
      setFormData(createEmptyFormData());
    } catch (error: unknown) {
      logger.error('Failed to update project', { error });
    }
  };

  const handleDeleteProject = async (id: string): Promise<void> => {
    try {
      await deleteProjectMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error: unknown) {
      logger.error('Failed to delete project', { error });
    }
  };

  const openEditModal = (project: Project): void => {
    setEditingProject(project);
    setFormData(projectToFormData(project));
  };

  const closeModal = (): void => {
    setShowCreateModal(false);
    setEditingProject(null);
    setFormData(createEmptyFormData());
  };

  return {
    projects,
    loading,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    showCreateModal,
    setShowCreateModal,
    editingProject,
    deleteConfirmId,
    setDeleteConfirmId,
    expandedProjectId,
    setExpandedProjectId,
    formData,
    setFormData,
    projectMetrics,
    filteredProjects,
    stats,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    openEditModal,
    closeModal,
  };
};