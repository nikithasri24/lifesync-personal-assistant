import React from 'react';

/**
 * Error state for Habits page
 */
export function HabitsErrorState(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Habits</h3>
        <p className="text-sm text-red-700 mb-4">
          Unable to load your habits. Please try refreshing the page.
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
