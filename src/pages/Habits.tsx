/**
 * Habits Component - Migrated to React Query
 *
 * Before: Used useAppStore with local Habit type containing embedded completions
 * After: Uses React Query hooks with separate habits and habit_entries tables
 *
 * Server State (React Query):
 * - Habits data loading and caching
 * - Habit entries data loading and caching
 * - Create/Update/Delete mutations for habits
 * - Create/Delete mutations for entries
 *
 * Client State (useState):
 * - UI state (editing, forms)
 * - Draft state for creating/editing habits
 */

import React, { type ReactElement, useMemo, useState, type FormEvent } from 'react';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import {
  useHabits,
  useHabitEntries,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCreateHabitEntry,
  useDeleteHabitEntriesForDate,
  useDeleteHabitEntriesForDateRange,
  useDeleteAllHabitEntries,
} from '../hooks/useHabitsQuery';
import { logger } from '../services/logger';
import type { HabitDraft } from '../habits/types';
import { createDraft, toHabitDraft } from '../habits/services/habitHelpers';
import { HabitForm } from '../habits/components/HabitForm';
import { HabitsHeader } from '../habits/components/layout/HabitsHeader';
import { HabitsLoadingState } from '../habits/components/layout/HabitsLoadingState';
import { HabitsErrorState } from '../habits/components/layout/HabitsErrorState';
import { HabitsList } from '../habits/components/layout/HabitsList';

// Helper function to get the start and end of the current week (Monday to Sunday)
const getWeekBoundaries = (date: Date = new Date()): { start: string; end: string } => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

  const monday = new Date(current.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

const Habits: React.FC = () => {
  // React Query hooks - automatic loading and caching
  const { data: apiHabits = [], isLoading: habitsLoading, error: habitsError } = useHabits({ isActive: true });
  const { data: apiEntries = [], isLoading: entriesLoading } = useHabitEntries();

  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const createEntryMutation = useCreateHabitEntry();
  const deleteEntriesForDateMutation = useDeleteHabitEntriesForDate();
  const deleteEntriesForDateRangeMutation = useDeleteHabitEntriesForDateRange();
  const deleteAllEntriesMutation = useDeleteAllHabitEntries();

  // UI State
  const [draft, setDraft] = useState<HabitDraft>(createDraft());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<HabitDraft | null>(null);

  const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const weekBoundaries = getWeekBoundaries();
  const { toast, showToast, dismissToast } = useToast();

  // Combine habits with their entry counts
  const habitsWithStats = useMemo(() => {
    return apiHabits.map((habit) => {
      // Filter entries for this habit
      const habitEntries = apiEntries.filter(entry => entry.habit_id === habit.id);

      const targetCount = habit.target_value ?? 1;
      let completionCount = 0;
      let hasReachedTarget = false;

      // Handle different frequencies
      if (habit.frequency === 'weekly') {
        // For weekly habits, count completions within the current week
        completionCount = habitEntries.filter(
          entry => entry.date >= weekBoundaries.start && entry.date <= weekBoundaries.end
        ).length;
        hasReachedTarget = completionCount >= targetCount;
      } else if (habit.frequency === 'monthly') {
        // For monthly habits, count completions within the current month
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        completionCount = habitEntries.filter(
          entry => entry.date.startsWith(currentMonth)
        ).length;
        hasReachedTarget = completionCount >= targetCount;
      } else {
        // For daily habits (default), count today's completions
        completionCount = habitEntries.filter(
          entry => entry.date === todayKey
        ).length;
        hasReachedTarget = completionCount >= targetCount;
      }

      return {
        habit,
        todayCompletions: completionCount,
        targetCount,
        hasReachedTarget,
        currentStreak: habit.streak_count ?? 0,
        totalCompletions: habit.current_progress ?? 0,
      };
    });
  }, [apiHabits, apiEntries, todayKey, weekBoundaries]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!draft.name.trim()) return;

    const parsedTarget = Number(draft.targetValue);
    const normalizedTarget = Number.isFinite(parsedTarget) ? Math.max(1, Math.floor(parsedTarget)) : 1;

    createHabitMutation.mutate({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      frequency: draft.frequency,
      target_value: normalizedTarget,
      category: draft.category,
      color: draft.color,
      is_active: true,
      streak_count: 0,
      best_streak: 0,
      current_progress: 0,
      goal_mode: 'daily-target',
    }, {
      onSuccess: () => {
        setDraft(createDraft());
        showToast('Habit created successfully', 'success');
      },
      onError: (error) => {
        logger.error('Habits', error);
        showToast('Unable to save the habit right now. Please try again.', 'error');
      },
    });
  };

  const handleResetToday = (habitId: string): void => {
    const habit = apiHabits.find(h => h.id === habitId);
    if (!habit) return;

    // For weekly/monthly habits, delete all entries within the period
    if (habit.frequency === 'weekly') {
      deleteEntriesForDateRangeMutation.mutate(
        { habitId, startDate: weekBoundaries.start, endDate: weekBoundaries.end },
        {
          onSuccess: () => {
            showToast('Cleared this week\'s completion', 'success');
          },
          onError: (error) => {
            logger.error('[Habits] Failed to reset this week', error);
            showToast('Unable to reset this week. Please try again.', 'error');
          },
        }
      );
    } else if (habit.frequency === 'monthly') {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      deleteEntriesForDateRangeMutation.mutate(
        { habitId, startDate: startOfMonth, endDate: endOfMonth },
        {
          onSuccess: () => {
            showToast('Cleared this month\'s completion', 'success');
          },
          onError: (error) => {
            logger.error('[Habits] Failed to reset this month', error);
            showToast('Unable to reset this month. Please try again.', 'error');
          },
        }
      );
    } else {
      // For daily habits, delete only today's entries
      deleteEntriesForDateMutation.mutate(
        { habitId, date: todayKey },
        {
          onSuccess: () => {
            showToast('Cleared today\'s completion', 'success');
          },
          onError: (error) => {
            logger.error('[Habits] Failed to reset today', error);
            showToast('Unable to reset today. Please try again.', 'error');
          },
        }
      );
    }
  };

  const handleResetHistory = (habitId: string): void => {
    deleteAllEntriesMutation.mutate(habitId, {
      onSuccess: () => {
        showToast('Streak and history reset', 'success');
      },
      onError: (error) => {
        logger.error('Habits', error);
        showToast('Unable to reset history. Please try again.', 'error');
      },
    });
  };

  const startEditing = (habitId: string): void => {
    const habit = apiHabits.find(h => h.id === habitId);
    if (!habit) return;
    setEditingHabitId(habitId);
    setEditDraft(toHabitDraft(habit));
  };

  const cancelEditing = (): void => {
    setEditingHabitId(null);
    setEditDraft(null);
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!editingHabitId || !editDraft) return;
    if (!editDraft.name.trim()) return;

    const parsedTarget = Number(editDraft.targetValue);
    const normalizedTarget = Number.isFinite(parsedTarget) ? Math.max(1, Math.floor(parsedTarget)) : 1;

    updateHabitMutation.mutate(
      {
        id: editingHabitId,
        updates: {
          name: editDraft.name.trim(),
          description: editDraft.description.trim() || undefined,
          frequency: editDraft.frequency,
          target_value: normalizedTarget,
          category: editDraft.category,
          color: editDraft.color,
        },
      },
      {
        onSuccess: () => {
          setEditingHabitId(null);
          setEditDraft(null);
          showToast('Habit updated successfully', 'success');
        },
        onError: (error) => {
          logger.error('Habits', error);
          showToast('Saving changes failed. Please try again.', 'error');
        },
      }
    );
  };

  const handleCompleteHabit = (habitId: string): void => {
    createEntryMutation.mutate(
      {
        habit_id: habitId,
        date: todayKey,
        value: 1,
      },
      {
        onSuccess: () => {
          showToast('Habit completed!', 'success');
        },
        onError: (error) => {
          logger.error('Habits', error);
          showToast('Could not record the completion. Please try again.', 'error');
        },
      }
    );
  };

  const handleDeleteHabit = (habitId: string): void => {
    deleteHabitMutation.mutate(habitId, {
      onSuccess: () => {
        showToast('Habit deleted', 'success');
      },
      onError: (error) => {
        logger.error('Habits', error);
        showToast('Deleting the habit failed. Please try again.', 'error');
      },
    });
  };

  // Loading state
  if (habitsLoading || entriesLoading) {
    return <HabitsLoadingState />;
  }

  // Error state
  if (habitsError) {
    return (
      <>
        <Toast toast={toast} onDismiss={dismissToast} />
        <HabitsErrorState />
      </>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Toast toast={toast} onDismiss={dismissToast} />
      <HabitsHeader />

      <HabitForm
        draft={draft}
        isSubmitting={createHabitMutation.isPending}
        hasError={createHabitMutation.isError}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        onClear={() => setDraft(createDraft())}
      />

      <HabitsList
        habitsWithStats={habitsWithStats}
        apiEntries={apiEntries}
        editingHabitId={editingHabitId}
        editDraft={editDraft}
        isCompletingHabit={createEntryMutation.isPending}
        isUpdating={updateHabitMutation.isPending}
        hasUpdateError={updateHabitMutation.isError}
        isResettingToday={deleteEntriesForDateMutation.isPending || deleteEntriesForDateRangeMutation.isPending}
        isResettingHistory={deleteAllEntriesMutation.isPending}
        isDeleting={deleteHabitMutation.isPending}
        onComplete={handleCompleteHabit}
        onStartEdit={startEditing}
        onCancelEdit={cancelEditing}
        onEditDraftChange={setEditDraft}
        onEditSubmit={handleEditSubmit}
        onResetToday={handleResetToday}
        onResetHistory={handleResetHistory}
        onDelete={handleDeleteHabit}
      />
    </div>
  );
};

export default Habits;
