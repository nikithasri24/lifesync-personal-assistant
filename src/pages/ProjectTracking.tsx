import React from 'react';
import { useProjectTracking } from './hooks/useProjectTracking';
import type { Project } from '../projects/hooks/useProjectsQuery';
import { ProjectFormModal, DeleteConfirmModal } from './components/ProjectModals';
import { ProjectsLoadingState } from '../projects/components/layout/ProjectsLoadingState';
import { ProjectsHeader } from '../projects/components/layout/ProjectsHeader';
import { ProjectsFiltersBar } from '../projects/components/layout/ProjectsFiltersBar';
import { EmptyProjectsState } from '../projects/components/layout/EmptyProjectsState';
import { ProjectCard } from '../projects/components/layout/ProjectCard';

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

  if (loading) {
    return <ProjectsLoadingState />;
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <ProjectsHeader
        stats={stats}
        onCreateClick={() => setShowCreateModal(true)}
      />

      <ProjectsFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <EmptyProjectsState
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onCreateClick={() => setShowCreateModal(true)}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
          {filteredProjects.map((project: Project) => {
            const metrics = projectMetrics.find((m: { projectId: string }) => m.projectId === project.id) ?? {
              projectId: project.id,
              completedTasks: 0,
              totalTasks: 0,
              progress: 0,
              tasks: []
            };
            const isExpanded = expandedProjectId === project.id;

            return (
              <ProjectCard
                key={project.id}
                project={project}
                metrics={metrics}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpandedProjectId(isExpanded ? null : project.id)}
                onEdit={() => openEditModal(project)}
                onDelete={() => setDeleteConfirmId(project.id)}
              />
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
