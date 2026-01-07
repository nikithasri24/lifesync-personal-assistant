import React from 'react';
import { SkeletonCard } from '../../../components/LoadingSpinner';

/**
 * Loading state for Habits page
 */
export function HabitsLoadingState(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Habit tracker</h1>
        <p className="text-sm text-slate-600">Loading your habits...</p>
      </header>
      <div className="space-y-3">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
    </div>
  );
}
