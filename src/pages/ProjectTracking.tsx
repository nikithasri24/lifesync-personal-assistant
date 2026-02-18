import React from 'react';
import { Plus } from 'lucide-react';
import { useProjectTracking } from './hooks/useProjectTracking';
import type { Project } from '@/hooks/useProjectsQuery';
import { ProjectFormModal, DeleteConfirmModal } from './components/ProjectModals';
import { ProjectsLoadingState } from '../projects/components/layout/ProjectsLoadingState';
import { ProjectsHeader } from '../projects/components/layout/ProjectsHeader';
import { ProjectsFiltersBar } from '../projects/components/layout/ProjectsFiltersBar';
import { EmptyProjectsState } from '../projects/components/layout/EmptyProjectsState';
import { ProjectCard } from '../projects/components/layout/ProjectCard';
import { FABV2 } from '@/components/v2/FABV2';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

const ProjectTrackingContent: React.FC = () => {
  const hookResult = useProjectTracking();
  const {
    loading,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    ownerFilter,
    setOwnerFilter,
    mergedConnection,
    currentUserId,
    partnerName,
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
    <div className="mx-auto max-w-7xl p-6 pb-32">
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
        showOwnerFilter={!!mergedConnection}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        partnerName={partnerName}
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
                showOwnerBadge={!!mergedConnection}
                currentUserId={currentUserId ?? undefined}
                partnerName={partnerName}
              />
            );
          })}
        </div>
      )}

      {/* FAB */}
      <FABV2
        icon={Plus}
        onClick={() => setShowCreateModal(true)}
        label="New Project"
        position="bottom-right"
        size="md"
      />

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

// Wrap with error boundary for graceful error handling
const ProjectTracking: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Projects">
      <ProjectTrackingContent />
    </FeatureErrorBoundary>
  );
};

export default ProjectTracking;
