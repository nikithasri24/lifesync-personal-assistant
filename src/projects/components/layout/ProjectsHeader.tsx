import React from 'react';
import { Plus } from 'lucide-react';
import { ProjectStats } from '../ProjectStats';

interface ProjectsHeaderProps {
  stats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  onCreateClick: () => void;
}

/**
 * Header for Projects page with stats
 */
export function ProjectsHeader({
  stats,
  onCreateClick,
}: ProjectsHeaderProps): React.ReactElement {
  // Transform stats to match ProjectStats component expectations
  const projectStats = {
    totalProjects: stats.total,
    activeProjects: stats.active,
    completedProjects: stats.completed,
    totalTasks: 0, // Not available from simple stats
    completedTasks: 0, // Not available from simple stats
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Organize your work into projects and track progress
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <ProjectStats stats={projectStats} />
    </div>
  );
}
