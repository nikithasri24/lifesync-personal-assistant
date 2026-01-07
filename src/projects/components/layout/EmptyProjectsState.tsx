import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';

interface EmptyProjectsStateProps {
  searchQuery: string;
  statusFilter: string;
  onCreateClick: () => void;
}

/**
 * Empty state display for Projects page
 */
export function EmptyProjectsState({
  searchQuery,
  statusFilter,
  onCreateClick,
}: EmptyProjectsStateProps): React.ReactElement {
  const hasFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
      <FolderOpen className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
      <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-white">
        {hasFilters ? 'No projects found' : 'No projects yet'}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {hasFilters
          ? 'Try adjusting your filters'
          : 'Get started by creating your first project'}
      </p>
      {!hasFilters && (
        <button
          onClick={onCreateClick}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      )}
    </div>
  );
}
