import React from 'react';
import { SkeletonCard } from '../../../components/LoadingSpinner';

/**
 * Loading state for TaskScheduler page
 */
export function TaskSchedulerLoadingState(): React.ReactElement {
  return (
    <div className="flex h-screen bg-white dark:bg-slate-900">
      <div className="flex-1 p-6">
        <SkeletonCard className="h-full" />
      </div>
    </div>
  );
}
