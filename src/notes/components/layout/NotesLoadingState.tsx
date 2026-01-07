import React from 'react';
import { SkeletonCard } from '../../../components/LoadingSpinner';

/**
 * Loading state for Notes page
 */
export function NotesLoadingState(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
        <p className="text-sm text-slate-600">Loading your notes...</p>
      </header>
      <SkeletonCard className="h-64" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
