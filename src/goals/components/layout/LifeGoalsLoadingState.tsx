import React from 'react';

/**
 * Loading state for Life Goals page
 */
export function LifeGoalsLoadingState(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 p-6 min-h-[400px]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      <p className="text-sm text-slate-600">Loading your goals...</p>
    </div>
  );
}
