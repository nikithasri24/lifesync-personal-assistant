import React, { type ReactElement, useMemo } from 'react';
import { Target, CheckCircle2, Trash2, Edit3, TrendingUp, Users } from 'lucide-react';
import type { LifeGoal } from '../../types/lifeGoals';
import { GoalMilestones } from '../GoalMilestones';
import { GoalStreaks } from '../GoalStreaks';
import { GoalCheckins } from '../GoalCheckins';
import {
  useGoalProgressTrackingQuery,
  usePartnerGoalProgressQuery,
  useUpdateGoalProgressMutation,
} from '@/hooks/useLifeGoalsQuery';

const EmptyState: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400">
      {icon ?? <Target className="h-6 w-6" />}
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

interface GoalListProps {
  goals: LifeGoal[];
  expandedGoalId: string | null;
  editingProgress: string | null;
  progressValue: number;
  onMarkComplete: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onEdit: (goal: LifeGoal) => void;
  onStartEditProgress: (goalId: string, currentProgress: number) => void;
  onUpdateProgress: (goalId: string) => void;
  onCancelEditProgress: () => void;
  onExpandGoal: (goalId: string) => void;
  onSetProgressValue: (value: number) => void;
  // Merged mode props
  isMerged?: boolean;
  partnerId?: string | null;
  partnerName?: string;
}

/**
 * List of goals with progress tracking, milestones, and streaks
 */
export function GoalList({
  goals,
  expandedGoalId,
  editingProgress,
  progressValue,
  onMarkComplete,
  onDelete,
  onEdit,
  onStartEditProgress,
  onUpdateProgress,
  onCancelEditProgress,
  onExpandGoal,
  onSetProgressValue,
  isMerged = false,
  partnerId = null,
  partnerName = 'Partner',
}: GoalListProps): ReactElement {
  // Get goal IDs for progress tracking queries
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals]);

  // Personal progress tracking (only in merged mode)
  const { data: personalProgress = [] } = useGoalProgressTrackingQuery(isMerged ? goalIds : []);
  const { data: partnerProgress = [] } = usePartnerGoalProgressQuery(
    isMerged ? goalIds : [],
    partnerId
  );
  const updateProgressMutation = useUpdateGoalProgressMutation();

  // Build progress lookup maps
  const personalProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    personalProgress.forEach((p) => map.set(p.goalId, p.personalProgress));
    return map;
  }, [personalProgress]);

  const partnerProgressMap = useMemo(() => {
    const map = new Map<string, number>();
    partnerProgress.forEach((p) => map.set(p.goalId, p.personalProgress));
    return map;
  }, [partnerProgress]);

  if (goals.length === 0) {
    return <EmptyState label="No goals yet. Start by creating one." icon={<Target className="h-6 w-6" />} />;
  }

  return (
    <ul className="space-y-3">
      {goals.map((goal) => {
        const isExpanded = expandedGoalId === goal.id;

        return (
          <li key={goal.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                <p className="text-xs text-slate-500">{goal.category} • {goal.priority}</p>
              </div>
              <div className="flex items-center gap-2">
                {goal.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkComplete(goal.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onEdit(goal);
                  }}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  title="Edit goal"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(goal.id);
                  }}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  title="Delete goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {goal.description && (
              <p className="text-sm text-slate-600">{goal.description}</p>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {isMerged ? 'Shared Progress' : 'Progress'}
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{goal.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {/* Personal progress tracking in merged mode */}
              {isMerged && (
                <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3 w-3 text-purple-500" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Personal Progress</span>
                  </div>
                  {/* Your progress */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-16">You:</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${personalProgressMap.get(goal.id) ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-8 text-right">
                      {personalProgressMap.get(goal.id) ?? 0}%
                    </span>
                  </div>
                  {/* Partner's progress */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-16 truncate">{partnerName}:</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${partnerProgressMap.get(goal.id) ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-8 text-right">
                      {partnerProgressMap.get(goal.id) ?? 0}%
                    </span>
                  </div>
                  {/* Update personal progress button */}
                  <button
                    onClick={() => {
                      const currentPersonal = personalProgressMap.get(goal.id) ?? 0;
                      const newProgress = Math.min(100, currentPersonal + 10);
                      updateProgressMutation.mutate({
                        goalId: goal.id,
                        personalProgress: newProgress,
                      });
                    }}
                    disabled={updateProgressMutation.isPending}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                  >
                    <Edit3 className="h-3 w-3" />
                    {updateProgressMutation.isPending ? 'Updating...' : 'Update my progress (+10%)'}
                  </button>
                </div>
              )}

              {/* Progress editor (for shared goal progress) */}
              {editingProgress === goal.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => onSetProgressValue(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-12">{progressValue}%</span>
                  <button
                    onClick={() => {
                      onUpdateProgress(goal.id);
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={onCancelEditProgress}
                    className="px-3 py-1 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onStartEditProgress(goal.id, goal.progress)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Edit3 className="h-3 w-3" />
                  {isMerged ? 'Update shared progress' : 'Update progress'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Status: {goal.status}
              </span>
              {goal.targetDate && (
                <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
              )}
              <button
                onClick={() => onExpandGoal(goal.id)}
                className="ml-auto text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isExpanded ? '▼ Hide details' : '▶ Show details'}
              </button>
            </div>

            {/* Milestones section */}
            {isExpanded && (
              <>
                <GoalMilestones goal={goal} />
                {/* Streaks section */}
                {goal.streakEnabled && (
                  <GoalStreaks
                    goal={goal}
                    onGoalUpdated={() => {
                      // React Query cache is automatically updated by mutations
                    }}
                  />
                )}
                {/* Check-ins section */}
                <GoalCheckins goal={goal} />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
