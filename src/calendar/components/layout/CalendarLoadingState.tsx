import React from 'react';
import { SkeletonCard } from '../../../components/LoadingSpinner';

/**
 * Loading state for Calendar page
 */
export function CalendarLoadingState(): React.ReactElement {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <div className="flex-1 flex items-center justify-center gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
