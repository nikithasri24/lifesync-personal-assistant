import React, { type ReactElement, useMemo, useState } from 'react';
import { Target, Users, Edit3 } from 'lucide-react';
import type { LifeGoal } from '../../types/lifeGoals';
import { GoalCard } from '../GoalCard';
import { GoalMilestones } from '../GoalMilestones';
import { GoalCheckins } from '../GoalCheckins';
import {
  useGoalProgressTrackingQuery,
  usePartnerGoalProgressQuery,
  useUpdateGoalProgressMutation,
} from '@/hooks/useLifeGoalsQuery';
import { useToast } from '@/hooks/useToast';
import { useThemeColors } from '@/hooks/useThemeColors';

const EmptyState: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => {
  const colors = useThemeColors();

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-12 text-center"
      style={{ borderColor: colors.border.medium, backgroundColor: colors.bg.white }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.badge.bg, color: colors.badge.text }}
      >
        {icon ?? <Target className="h-6 w-6" />}
      </div>
      <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
        {label}
      </p>
    </div>
  );
};

interface GoalListProps {
  goals: LifeGoal[];
  expandedGoalId: string | null;
  editingProgress: string | null;
  progressValue: number;
  onMarkComplete: (goalId: string) => void;
  onUndoComplete: (goalId: string) => void;
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
 * List of goals with progress tracking, milestones, and streaks using modern GoalCard
 */
export function GoalList({
  goals,
  expandedGoalId,
  editingProgress,
  progressValue,
  onMarkComplete,
  onUndoComplete,
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
  const colors = useThemeColors();

  // Get goal IDs for progress tracking queries
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals]);

  // Personal progress tracking (only in merged mode)
  const { data: personalProgress = [] } = useGoalProgressTrackingQuery(isMerged ? goalIds : []);
  const { data: partnerProgress = [] } = usePartnerGoalProgressQuery(
    isMerged ? goalIds : [],
    partnerId
  );
  const updateProgressMutation = useUpdateGoalProgressMutation();
  const { showToast } = useToast();

  // Local state for editing personal progress
  const [editingPersonalProgress, setEditingPersonalProgress] = useState<string | null>(null);
  const [personalProgressValue, setPersonalProgressValue] = useState<number>(0);

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

  // Helper to determine goal ownership
  const getGoalOwnership = (goal: LifeGoal): 'mine' | 'partner' | 'shared' => {
    if (goal.connectionId) return 'shared';
    if (partnerId && goal.userId === partnerId) return 'partner';
    return 'mine';
  };

  return (
    <ul className="space-y-3">
      {goals.map((goal) => {
        const isExpanded = expandedGoalId === goal.id;
        const ownership = isMerged ? getGoalOwnership(goal) : 'mine';
        const isPartnerGoal = ownership === 'partner';

        return (
          <li key={goal.id}>
            <GoalCard
              goal={goal}
              onEdit={onEdit}
              onComplete={onMarkComplete}
              onUndoComplete={onUndoComplete}
              onDelete={onDelete}
              onExpand={onExpandGoal}
              isExpanded={isExpanded}
              isPartner={isPartnerGoal}
            >
              {/* Progress editing section */}
              {!isPartnerGoal && (
                <div className="mb-4">
                  {editingProgress === goal.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={progressValue}
                        onChange={(e) => onSetProgressValue(Number(e.target.value))}
                        className="flex-1"
                        aria-label="Shared progress slider"
                      />
                      <span className="text-sm font-medium w-12" style={{ color: colors.text.primary }}>
                        {progressValue}%
                      </span>
                      <button
                        onClick={() => onUpdateProgress(goal.id)}
                        className="px-3 py-1 text-white text-xs rounded-full font-semibold transition-colors"
                        style={{ background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)` }}
                      >
                        Save
                      </button>
                      <button
                        onClick={onCancelEditProgress}
                        className="px-3 py-1 text-xs rounded-full font-medium transition-colors"
                        style={{ backgroundColor: colors.bg.secondary, color: colors.text.secondary }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartEditProgress(goal.id, goal.progress)}
                      className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                      style={{ color: colors.accent.end }}
                    >
                      <Edit3 className="h-3 w-3" />
                      {isMerged ? 'Update shared progress' : 'Update progress'}
                    </button>
                  )}
                </div>
              )}

              {/* Personal progress tracking in merged mode */}
              {isMerged && (
                <div className="mb-4 space-y-2 pb-4" style={{ borderBottom: `1px solid ${colors.border.light}` }}>
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="h-3 w-3" style={{ color: colors.accent.end }} />
                    <span className="font-semibold" style={{ color: colors.text.secondary }}>
                      Personal Progress
                    </span>
                  </div>
                  {/* Your progress */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-16" style={{ color: colors.text.tertiary }}>
                      You:
                    </span>
                    <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: colors.bg.secondary }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${personalProgressMap.get(goal.id) ?? 0}%`,
                          backgroundColor: '#10B981',
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right" style={{ color: colors.text.secondary }}>
                      {personalProgressMap.get(goal.id) ?? 0}%
                    </span>
                  </div>
                  {/* Partner's progress */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-16 truncate" style={{ color: colors.text.tertiary }}>
                      {partnerName}:
                    </span>
                    <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: colors.bg.secondary }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${partnerProgressMap.get(goal.id) ?? 0}%`,
                          backgroundColor: '#8B5CF6',
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right" style={{ color: colors.text.secondary }}>
                      {partnerProgressMap.get(goal.id) ?? 0}%
                    </span>
                  </div>
                  {/* Update personal progress editor */}
                  {editingPersonalProgress === goal.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={personalProgressValue}
                        onChange={(e) => setPersonalProgressValue(Number(e.target.value))}
                        className="flex-1"
                        aria-label="Personal progress slider"
                      />
                      <span className="text-sm font-medium w-12" style={{ color: colors.text.primary }}>
                        {personalProgressValue}%
                      </span>
                      <button
                        onClick={() => {
                          updateProgressMutation.mutate({
                            goalId: goal.id,
                            personalProgress: personalProgressValue,
                          }, {
                            onSuccess: () => {
                              showToast(`Progress updated to ${personalProgressValue}%! Keep up the great work! 🎉`, 'success');
                              setEditingPersonalProgress(null);
                            },
                            onError: (error) => {
                              showToast(`Failed to update progress: ${error.message}`, 'error');
                            },
                          });
                        }}
                        disabled={updateProgressMutation.isPending}
                        className="px-3 py-1 text-white text-xs rounded-full font-semibold disabled:opacity-50"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPersonalProgress(null)}
                        className="px-3 py-1 text-xs rounded-full font-medium"
                        style={{ backgroundColor: colors.bg.secondary, color: colors.text.secondary }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const currentPersonal = personalProgressMap.get(goal.id) ?? 0;
                        setPersonalProgressValue(currentPersonal);
                        setEditingPersonalProgress(goal.id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: '#10B981' }}
                      aria-label="Update my progress"
                    >
                      <Edit3 className="h-3 w-3" />
                      Update my progress
                    </button>
                  )}
                </div>
              )}

              {/* Milestones and Check-ins */}
              <GoalMilestones goal={goal} />
              <GoalCheckins goal={goal} />
            </GoalCard>
          </li>
        );
      })}
    </ul>
  );
}
