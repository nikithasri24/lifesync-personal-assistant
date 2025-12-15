import React from 'react';

/**
 * Loading state for Projects page
 */
export function ProjectsLoadingState(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading projects...</p>
      </div>
    </div>
  );
}
