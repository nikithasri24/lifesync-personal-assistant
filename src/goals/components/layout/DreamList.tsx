import React, { type ReactElement } from 'react';
import { Sparkles, Trash2, Undo2, Users, Edit3 } from 'lucide-react';
import type { LifeDream } from '../../types/lifeGoals';

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400">
      <Sparkles className="h-6 w-6" />
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

interface DreamListProps {
  dreams: LifeDream[];
  onMarkAchieved: (dreamId: string, previousStatus: LifeDream['status']) => void;
  onUndoAchieved: (dreamId: string) => void;
  onDelete: (dreamId: string) => void;
  onEdit: (dream: LifeDream) => void;
  // Merged mode props
  isMerged?: boolean;
  partnerId?: string | null;
  partnerName?: string;
}

/**
 * List of dreams with status tracking
 */
export function DreamList({
  dreams,
  onMarkAchieved,
  onUndoAchieved,
  onDelete,
  onEdit,
  isMerged = false,
  partnerId: _partnerId = null,
  partnerName = 'Partner',
}: DreamListProps): ReactElement {
  if (dreams.length === 0) {
    return <EmptyState label="No dreams captured yet. Start with one aspiration." />;
  }

  return (
    <ul className="space-y-3">
      {dreams.map((dream) => {
        const isAchieved = dream.status === 'achieved';

        return (
          <li
            key={dream.id}
            className={`flex flex-col gap-2 rounded-lg border p-4 shadow-sm transition ${
              isAchieved
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isAchieved ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {isAchieved && '✨ '}{dream.title}
                  </p>
                  {isMerged && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <Users className="h-2.5 w-2.5" />
                      Shared
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {dream.category} • {dream.priority}
                  {isMerged && ` • with ${partnerName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAchieved ? (
                  <button
                    type="button"
                    onClick={() => {
                      onUndoAchieved(dream.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-100"
                    title="Undo achievement"
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkAchieved(dream.id, dream.status);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                  >
                    <Sparkles className="h-4 w-4" />
                    Achieved
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onEdit(dream);
                  }}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  title="Edit dream"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(dream.id);
                  }}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  title="Delete dream"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {dream.description && (
              <p className={`text-sm ${isAchieved ? 'text-emerald-700' : 'text-slate-600'}`}>
                {dream.description}
              </p>
            )}
            <div className={`flex flex-wrap items-center gap-3 text-xs ${isAchieved ? 'text-emerald-600' : 'text-slate-500'}`}>
              <span className="font-medium">Status: {dream.status}</span>
              {typeof dream.estimatedCost === 'number' && (
                <span>Cost: ${dream.estimatedCost.toLocaleString()}</span>
              )}
              {dream.estimatedTimeframe && (
                <span>Timeframe: {dream.estimatedTimeframe}</span>
              )}
              {isAchieved && dream.achievedAt && (
                <span className="font-medium text-emerald-700">
                  🎉 Achieved on {new Date(dream.achievedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
