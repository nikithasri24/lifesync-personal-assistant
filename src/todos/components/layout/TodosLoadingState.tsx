import React from 'react';
import { SkeletonCard } from '../../../components/LoadingSpinner';

/**
 * Loading state for Todos page
 */
export function TodosLoadingState(): React.ReactElement {
  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="space-y-4 w-full max-w-2xl px-6">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
    </div>
  );
}
