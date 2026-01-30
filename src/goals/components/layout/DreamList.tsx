import React, { type ReactElement } from 'react';
import { Sparkles, Trash2, Undo2, Users, Edit3 } from 'lucide-react';
import type { LifeDream } from '../../types/lifeGoals';
import { useTheme } from '@/contexts/ThemeContext';

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
  partnerId = null,
  partnerName = 'Partner',
}: DreamListProps): ReactElement {
  // Get theme for dark mode detection
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Helper to determine dream ownership
  const getDreamOwnership = (dream: LifeDream): 'mine' | 'partner' | 'shared' => {
    if (dream.connectionId) return 'shared';
    if (partnerId && dream.userId === partnerId) return 'partner';
    return 'mine';
  };

  // Get card and badge styles based on ownership, achievement, and theme
  const getCardStyle = (isPartner: boolean, isShared: boolean, isAchieved: boolean): React.CSSProperties => {
    if (isAchieved) {
      return isDark
        ? { borderColor: '#10b981', backgroundColor: '#064e3b' } // emerald-500, emerald-950
        : { borderColor: '#10b981', backgroundColor: '#ecfdf5' }; // emerald-500, emerald-50
    }
    if (isPartner) {
      return isDark
        ? { borderColor: '#f59e0b', backgroundColor: '#451a03' } // amber-500, amber-950
        : { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }; // amber-500, amber-50
    }
    if (isShared) {
      return isDark
        ? { borderColor: '#6366f1', backgroundColor: '#1e1b4b' } // indigo-500, indigo-950
        : { borderColor: '#6366f1', backgroundColor: '#eef2ff' }; // indigo-500, indigo-50
    }
    return {};
  };

  const getBadgeStyle = (isPartner: boolean, isShared: boolean): React.CSSProperties => {
    if (isShared) {
      return isDark
        ? { backgroundColor: '#312e81', color: '#c7d2fe' } // indigo-900, indigo-200
        : { backgroundColor: '#e0e7ff', color: '#4338ca' }; // indigo-100, indigo-700
    }
    if (isPartner) {
      return isDark
        ? { backgroundColor: '#78350f', color: '#fde68a' } // amber-900, amber-200
        : { backgroundColor: '#fef3c7', color: '#b45309' }; // amber-100, amber-700
    }
    return isDark
      ? { backgroundColor: '#334155', color: '#cbd5e1' } // slate-700, slate-300
      : { backgroundColor: '#f1f5f9', color: '#475569' }; // slate-100, slate-600
  };

  if (dreams.length === 0) {
    return <EmptyState label="No dreams captured yet. Start with one aspiration." />;
  }

  return (
    <ul className="space-y-3">
      {dreams.map((dream) => {
        const isAchieved = dream.status === 'achieved';
        const ownership = isMerged ? getDreamOwnership(dream) : 'mine';
        const isPartnerDream = ownership === 'partner';
        const isSharedDream = ownership === 'shared';

        const cardStyle = getCardStyle(isPartnerDream, isSharedDream, isAchieved);
        const badgeStyle = getBadgeStyle(isPartnerDream, isSharedDream);

        return (
          <li
            key={dream.id}
            className="flex flex-col gap-2 rounded-lg border-2 p-4 shadow-sm transition border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            style={cardStyle}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isAchieved ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                    {isAchieved && '✨ '}{dream.title}
                  </p>
                  {/* Ownership badge */}
                  {isMerged && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={badgeStyle}
                    >
                      {isSharedDream ? (
                        <>
                          <Users className="h-3 w-3" />
                          Shared
                        </>
                      ) : isPartnerDream ? (
                        <>{partnerName}'s dream</>
                      ) : (
                        <>My dream</>
                      )}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {dream.category} • {dream.priority}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Only show action buttons if user can edit (own dreams or shared dreams) */}
                {!isPartnerDream && (
                  <>
                    {isAchieved ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUndoAchieved(dream.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 transition hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50"
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
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
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
                  </>
                )}
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
