import React from 'react';

/**
 * Error state for Todos page
 */
export function TodosErrorState(): React.ReactElement {
  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 max-w-md">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Tasks</h3>
        <p className="text-sm text-red-700 mb-4">
          Unable to load your tasks. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
