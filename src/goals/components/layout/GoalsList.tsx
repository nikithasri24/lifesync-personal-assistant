import React from 'react';
import { Target, CheckCircle2, Trash2 } from 'lucide-react';
import { SkeletonCard } from '../../../components/LoadingSpinner';
import { EmptyState } from '../EmptyState';
import type { LifeGoal } from '../../types/lifeGoals';

interface GoalsListProps {
  goals: LifeGoal[];
  isLoading: boolean;
  error: Error | null;
  onMarkComplete: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * List of goals with loading, error, and empty states
 */
export function GoalsList({
  goals,
  isLoading,
  error,
  onMarkComplete,
  onDelete,
  isUpdating,
  isDeleting,
}: GoalsListProps): React.ReactElement {
  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Error loading goals. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Show empty state
  if (goals.length === 0) {
    return <EmptyState label="No goals yet. Start by creating one." icon={<Target className="h-6 w-6" />} />;
  }

  return (
    <ul className="space-y-3">
      {goals.map((goal) => (
        <li key={goal.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
              <p className="text-xs text-slate-500">
                {goal.category} • {goal.priority}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMarkComplete(goal.id)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark complete
              </button>
              <button
                type="button"
                onClick={() => onDelete(goal.id)}
                disabled={isDeleting}
                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {goal.description && <p className="text-sm text-slate-600">{goal.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Status: {goal.status}</span>
            <span>Progress: {goal.progress}%</span>
            {goal.targetDate && <span>Target date: {new Date(goal.targetDate).toLocaleDateString()}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
