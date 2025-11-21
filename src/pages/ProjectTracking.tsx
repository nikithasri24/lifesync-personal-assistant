import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Circle,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '../projects/hooks/useProjectsQuery';
import { useTasksQuery } from '../tasks/hooks/useTasksQuery';
import type { Project } from '../projects/hooks/useProjectsQuery';
import type { TodoItem } from '../types';
import { logger } from '../services/logger';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'completed' | 'on_hold';

const ProjectTracking: React.FC = () => {
  // React Query hooks
  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();
  const { data: todos = [], isLoading: todosLoading } = useTasksQuery();
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const loading = projectsLoading || todosLoading;

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '📁',
    status: 'active' as const,
  });

  // Calculate project metrics
  const projectMetrics = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = todos.filter((task) => task.projectId === project.id && !task.deleted);
      const completedTasks = projectTasks.filter((task) => task.completed);
      const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;

      return {
        projectId: project.id,
        totalTasks: projectTasks.length,
        completedTasks: completedTasks.length,
        progress: Math.round(progress),
        tasks: projectTasks,
      };
    });
  }, [projects, todos]);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [projects, statusFilter, searchQuery]);

  const getMetrics = (projectId: string) => {
    return projectMetrics.find((m) => m.projectId === projectId) || {
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
      tasks: [],
    };
  };

  const handleCreateProject = async () => {
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
      resetForm();
    } catch (error) {
      logger.error('Failed to create project:', { error });
    }
  };

  const handleUpdateProject = async () => {
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
      resetForm();
    } catch (error) {
      logger.error('Failed to update project:', { error });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProjectMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (error) {
      logger.error('Failed to delete project:', { error });
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color,
      icon: project.icon,
      status: project.status,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      icon: '📁',
      status: 'active',
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    resetForm();
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      on_hold: { label: 'On Hold', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <Circle className="h-4 w-4 text-emerald-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'on_hold':
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const totalTasks = projectMetrics.reduce((sum, m) => sum + m.totalTasks, 0);
    const completedTasks = projectMetrics.reduce((sum, m) => sum + m.completedTasks, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
    };
  }, [projects, projectMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Organize your work into projects and track progress
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProjects}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Projects</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeProjects}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedProjects}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTasks}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Completion</div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border-none bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-800">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <FolderOpen className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
            {searchQuery || statusFilter !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first project'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {filteredProjects.map((project) => {
            const metrics = getMetrics(project.id);
            const isExpanded = expandedProjectId === project.id;

            return (
              <div
                key={project.id}
                className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{project.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                          {project.name}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(project)}
                      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(project.id)}
                      className="rounded p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {metrics.completedTasks} / {metrics.totalTasks} tasks
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${metrics.progress}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>

                  {/* Task List Toggle */}
                  {metrics.totalTasks > 0 && (
                    <button
                      onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <span>View Tasks ({metrics.totalTasks})</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Task List */}
                  {isExpanded && metrics.tasks.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                      {metrics.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          {task.completed ? (
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          )}
                          <span
                            className={`flex-1 ${
                              task.completed
                                ? 'text-slate-500 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingProject ? 'Edit Project' : 'Create Project'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Icon and Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="📁"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-2xl text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1 h-[42px] w-full rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={editingProject ? handleUpdateProject : handleCreateProject}
                disabled={!formData.name.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Project</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTracking;
