import React, { type ReactElement } from 'react';
import { Target, CheckCircle2, Trash2, Edit3, TrendingUp } from 'lucide-react';
import type { LifeGoal } from '../../types/lifeGoals';
import { GoalMilestones } from '../GoalMilestones';
import { GoalStreaks } from '../GoalStreaks';
import { GoalCheckins } from '../GoalCheckins';

const EmptyState: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
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
  onStartEditProgress: (goalId: string, currentProgress: number) => void;
  onUpdateProgress: (goalId: string) => void;
  onCancelEditProgress: () => void;
  onExpandGoal: (goalId: string) => void;
  onSetProgressValue: (value: number) => void;
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
  onStartEditProgress,
  onUpdateProgress,
  onCancelEditProgress,
  onExpandGoal,
  onSetProgressValue,
}: GoalListProps): ReactElement {
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
                    onDelete(goal.id);
                  }}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
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
                <span className="text-slate-600 font-medium">Progress</span>
                <span className="text-slate-700 font-semibold">{goal.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {/* Progress editor */}
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
                  <span className="text-sm font-medium text-slate-700 w-12">{progressValue}%</span>
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
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
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
                  Update progress
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
