import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { SkeletonCard } from '../../../components/LoadingSpinner';
import { EmptyState } from '../EmptyState';
import type { LifeDream } from '../../types/lifeGoals';

interface DreamsListProps {
  dreams: LifeDream[];
  isLoading: boolean;
  error: Error | null;
  onMarkAchieved: (dreamId: string) => void;
  onDelete: (dreamId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * List of dreams with loading, error, and empty states
 */
export function DreamsList({
  dreams,
  isLoading,
  error,
  onMarkAchieved,
  onDelete,
  isUpdating,
  isDeleting,
}: DreamsListProps): React.ReactElement {
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
          Error loading dreams. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Show empty state
  if (dreams.length === 0) {
    return <EmptyState label="No dreams captured yet. Start with one aspiration." />;
  }

  return (
    <ul className="space-y-3">
      {dreams.map((dream) => (
        <li key={dream.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{dream.title}</p>
              <p className="text-xs text-slate-500">
                {dream.category} • {dream.priority}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMarkAchieved(dream.id)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Mark achieved
              </button>
              <button
                type="button"
                onClick={() => onDelete(dream.id)}
                disabled={isDeleting}
                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          {dream.description && <p className="text-sm text-slate-600">{dream.description}</p>}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Status: {dream.status}</span>
            {typeof dream.estimatedCost === 'number' && (
              <span>Estimated cost: ${dream.estimatedCost.toLocaleString()}</span>
            )}
            {dream.estimatedTimeframe && <span>Timeframe: {dream.estimatedTimeframe}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
