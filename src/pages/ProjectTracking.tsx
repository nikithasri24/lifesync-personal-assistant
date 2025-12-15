import React from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Filter,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useProjectTracking } from './hooks/useProjectTracking';
import type { StatusFilter } from '../projects/types';
import { ProjectStats } from '../projects/components/ProjectStats';
import { StatusBadge } from '../projects/components/StatusBadge';
import type { Project } from '../projects/hooks/useProjectsQuery';
import type { TodoItem } from '../types';
import { ProjectFormModal, DeleteConfirmModal } from './components/ProjectModals';

const ProjectTracking: React.FC = () => {
  const hookResult = useProjectTracking();
  const {
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
    closeModal
  } = hookResult;

  const safeProjectAccess = (project: Project): {
    id: string;
    name: string;
    icon: string;
    status: 'active' | 'completed' | 'on_hold';
    description: string;
    color: string;
  } => {
    return {
      id: project.id,
      name: project.name,
      icon: project.icon,
      status: project.status,
      description: project.description ?? '',
      color: project.color
    };
  };




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
        <ProjectStats stats={stats} />
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
          {filteredProjects.map((project: Project) => {
            const safeProject = safeProjectAccess(project);
            const metrics = projectMetrics.find((m: { projectId: string }) => m.projectId === safeProject.id) ?? {
              projectId: safeProject.id,
              completedTasks: 0,
              totalTasks: 0,
              progress: 0,
              tasks: []
            };
            const isExpanded = expandedProjectId === safeProject.id;

            return (
              <div
                key={safeProject.id}
                className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{safeProject.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                          {safeProject.name}
                        </h3>
                        <StatusBadge status={safeProject.status} />
                      </div>
                      {safeProject.description && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {safeProject.description}
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
                      onClick={() => setDeleteConfirmId(safeProject.id)}
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
                        backgroundColor: safeProject.color,
                      }}
                    />
                  </div>

                  {/* Task List Toggle */}
                  {metrics.totalTasks > 0 && (
                    <button
                      onClick={() => setExpandedProjectId(isExpanded ? null : safeProject.id)}
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

                  {isExpanded && metrics.tasks.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                      {metrics.tasks.map((task: TodoItem) => (
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

      <ProjectFormModal
        showCreateModal={showCreateModal}
        editingProject={editingProject}
        formData={formData}
        setFormData={setFormData}
        closeModal={closeModal}
        handleCreateProject={handleCreateProject}
        handleUpdateProject={handleUpdateProject}
      />

      <DeleteConfirmModal
        deleteConfirmId={deleteConfirmId}
        setDeleteConfirmId={setDeleteConfirmId}
        handleDeleteProject={handleDeleteProject}
      />
    </div>
  );
};

export default ProjectTracking;
