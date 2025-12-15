import React, { type FormEvent } from 'react';
import { HabitCard } from '../HabitCard';
import type { Habit } from '../../types';
import type { HabitDraft } from '../../types';

interface HabitWithStats {
  habit: Habit;
  todayCompletions: number;
  targetCount: number;
  hasReachedTarget: boolean;
  currentStreak: number;
  totalCompletions: number;
}

interface HabitsListProps {
  habitsWithStats: HabitWithStats[];
  apiEntries: Array<{ habit_id: string; date: string; value?: number }>;
  editingHabitId: string | null;
  editDraft: HabitDraft | null;
  isCompletingHabit: boolean;
  isUpdating: boolean;
  hasUpdateError: boolean;
  isResettingToday: boolean;
  isResettingHistory: boolean;
  isDeleting: boolean;
  onComplete: (habitId: string) => void;
  onStartEdit: (habitId: string) => void;
  onCancelEdit: () => void;
  onEditDraftChange: (draft: HabitDraft | null) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetToday: (habitId: string) => void;
  onResetHistory: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

/**
 * List of habits with filtering for completed weekly/monthly habits
 */
export function HabitsList({
  habitsWithStats,
  apiEntries,
  editingHabitId,
  editDraft,
  isCompletingHabit,
  isUpdating,
  hasUpdateError,
  isResettingToday,
  isResettingHistory,
  isDeleting,
  onComplete,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onEditSubmit,
  onResetToday,
  onResetHistory,
  onDelete,
}: HabitsListProps): React.ReactElement {
  if (habitsWithStats.length === 0) {
    return (
      <section className="space-y-3">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No habits yet. Add one above to start tracking.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {habitsWithStats
        .filter(({ habit }) => habit.id !== undefined)
        .filter(({ habit, hasReachedTarget }) => {
          // Hide weekly/monthly habits that have been completed for the period
          if (habit.frequency === 'weekly' && hasReachedTarget) {
            return false;
          }
          if (habit.frequency === 'monthly' && hasReachedTarget) {
            return false;
          }
          return true;
        })
        .map(({ habit, todayCompletions, targetCount, hasReachedTarget, currentStreak, totalCompletions }) => {
          // Filter entries for this specific habit
          const habitSpecificEntries = apiEntries.filter(entry => entry.habit_id === habit.id);

          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              habitEntries={habitSpecificEntries}
              todayCompletions={todayCompletions}
              targetCount={targetCount}
              hasReachedTarget={hasReachedTarget}
              currentStreak={currentStreak}
              totalCompletions={totalCompletions}
              isEditing={editingHabitId === habit.id}
              editDraft={editDraft}
              isCompletingHabit={isCompletingHabit}
              isUpdating={isUpdating}
              hasUpdateError={hasUpdateError}
              isResettingToday={isResettingToday}
              isResettingHistory={isResettingHistory}
              isDeleting={isDeleting}
              onComplete={() => { onComplete(habit.id as string); }}
              onStartEdit={() => { onStartEdit(habit.id as string); }}
              onCancelEdit={onCancelEdit}
              onEditDraftChange={onEditDraftChange}
              onEditSubmit={onEditSubmit}
              onResetToday={() => { onResetToday(habit.id as string); }}
              onResetHistory={() => { onResetHistory(habit.id as string); }}
              onDelete={() => { onDelete(habit.id as string); }}
            />
          );
        })}
    </section>
  );
}
