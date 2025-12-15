import React from 'react';
import { SkeletonCard } from '../../components/LoadingSpinner';

/**
 * Loading state for Dashboard page
 */
export function DashboardLoadingState(): React.ReactElement {
  return (
    <div className="space-y-8">
      <SkeletonCard className="h-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>
    </div>
  );
}
