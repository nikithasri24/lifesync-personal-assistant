import { useState, useMemo } from 'react';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useMergedProjectsConnectionQuery,
  type Project,
} from '@/hooks/useProjectsQuery';
import { useCurrentUserId, usePartnerName } from '@/utils/ownerUtils';
import type { OwnerFilterValue } from '@/components/common/OwnerFilter';
import type { ProjectFormData, StatusFilter } from '../../projects/types';
import { logger } from '@/services/logger';

// Stats type expected by ProjectsHeader
interface SimpleProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
}

export function useProjectTracking() {
  // Merged mode support
  const { data: mergedConnection } = useMergedProjectsConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);

  // Fetch projects (supports merged mode)
  const { data: projects = [], isLoading } = useProjectsQuery();

  // Mutations
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: null,
    target_date: null,
    tags: [],
    color: '#6366f1',
  });

  // Filter projects by owner (merged mode)
  const ownerFilteredProjects = useMemo(() => {
    if (!mergedConnection || ownerFilter === 'all') return projects;

    if (ownerFilter === 'mine') {
      return projects.filter(p => p.user_id === currentUserId);
    } else if (ownerFilter === 'partner') {
      return projects.filter(p => p.user_id === mergedConnection.partnerId);
    }

    return projects;
  }, [projects, ownerFilter, currentUserId, mergedConnection]);

  // Filter projects by status
  const statusFilteredProjects = useMemo(() => {
    if (statusFilter === 'all') return ownerFilteredProjects;
    return ownerFilteredProjects.filter(p => p.status === statusFilter);
  }, [ownerFilteredProjects, statusFilter]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredProjects;

    const query = searchQuery.toLowerCase();
    return statusFilteredProjects.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [statusFilteredProjects, searchQuery]);

  // Calculate stats
  const stats: SimpleProjectStats = useMemo(() => {
    return {
      total: ownerFilteredProjects.length,
      active: ownerFilteredProjects.filter(p => p.status === 'active').length,
      completed: ownerFilteredProjects.filter(p => p.status === 'completed').length,
      onHold: ownerFilteredProjects.filter(p => p.status === 'on-hold').length,
    };
  }, [ownerFilteredProjects]);

  // Project metrics (stub for now - would need task linking)
  const projectMetrics = useMemo(() => {
    return filteredProjects.map(project => ({
      projectId: project.id,
      completedTasks: 0,
      totalTasks: 0,
      progress: project.progress ?? 0,
      tasks: [],
    }));
  }, [filteredProjects]);

  // CRUD handlers
  const handleCreateProject = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        start_date: formData.start_date ?? undefined,
        target_date: formData.target_date ?? undefined,
        tags: formData.tags,
        color: formData.color,
      });
      closeModal();
    } catch (error) {
      logger.error('ProjectTracking', 'Failed to create project', { error });
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    try {
      await updateMutation.mutateAsync({
        projectId: editingProject.id,
        updates: {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          start_date: formData.start_date ?? undefined,
          target_date: formData.target_date ?? undefined,
          tags: formData.tags,
          color: formData.color,
        },
      });
      closeModal();
    } catch (error) {
      logger.error('ProjectTracking', 'Failed to update project', { error });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error) {
      logger.error('ProjectTracking', 'Failed to delete project', { error });
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      priority: project.priority ?? 'medium',
      start_date: project.start_date ?? null,
      target_date: project.target_date ?? null,
      tags: project.tags ?? [],
      color: project.color ?? '#6366f1',
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      start_date: null,
      target_date: null,
      tags: [],
      color: '#6366f1',
    });
  };

  return {
    // Loading state
    loading: isLoading,

    // View state
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,

    // Merged mode
    ownerFilter,
    setOwnerFilter,
    mergedConnection,
    currentUserId,
    partnerName,

    // Modal state
    showCreateModal,
    setShowCreateModal,
    editingProject,
    deleteConfirmId,
    setDeleteConfirmId,
    expandedProjectId,
    setExpandedProjectId,

    // Form state
    formData,
    setFormData,

    // Data
    projectMetrics,
    filteredProjects,
    stats,

    // Handlers
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    openEditModal,
    closeModal,
  };
}
