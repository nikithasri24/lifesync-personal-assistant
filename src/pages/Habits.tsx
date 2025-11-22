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

import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { SkeletonCard } from '../components/LoadingSpinner';
import {
  useHabits,
  useHabitEntries,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCreateHabitEntry,
  useDeleteHabitEntriesForDate,
  useDeleteAllHabitEntries,
} from '../hooks/useHabitsQuery';
import { logger } from '../services/logger';
import type { HabitDraft } from '../habits/types';
import { createDraft, toHabitDraft } from '../habits/services/habitHelpers';
import { HabitForm } from '../habits/components/HabitForm';
import { HabitCard } from '../habits/components/HabitCard';

const Habits: React.FC = () => {
  // React Query hooks - automatic loading and caching
  const { data: apiHabits = [], isLoading: habitsLoading, error: habitsError } = useHabits({ isActive: true });
  const { data: apiEntries = [], isLoading: entriesLoading } = useHabitEntries();

  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const createEntryMutation = useCreateHabitEntry();
  const deleteEntriesForDateMutation = useDeleteHabitEntriesForDate();
  const deleteAllEntriesMutation = useDeleteAllHabitEntries();

  // UI State
  const [draft, setDraft] = useState<HabitDraft>(createDraft());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<HabitDraft | null>(null);

  const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const { toast, showToast, dismissToast } = useToast();

  // Combine habits with their entry counts
  const habitsWithStats = useMemo(() => {
    return apiHabits.map((habit) => {
      // Filter entries for this habit
      const habitEntries = apiEntries.filter(entry => entry.habit_id === habit.id);

      // Count today's completions
      const todayCompletions = habitEntries.filter(
        entry => entry.date === todayKey
      ).length;

      const targetCount = habit.target_value ?? 1;
      const hasReachedTarget = todayCompletions >= targetCount;

      return {
        habit,
        todayCompletions,
        targetCount,
        hasReachedTarget,
        currentStreak: habit.streak_count ?? 0,
        totalCompletions: habit.current_progress ?? 0,
      };
    });
  }, [apiHabits, apiEntries, todayKey]);

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
        logger.error('[Habits] Failed to add habit', { error });
        showToast('Unable to save the habit right now. Please try again.', 'error');
      },
    });
  };

  const handleResetToday = (habitId: string): void => {
    deleteEntriesForDateMutation.mutate(
      { habitId, date: todayKey },
      {
        onSuccess: () => {
          showToast('Cleared today\'s completion', 'success');
        },
        onError: (error) => {
          logger.error('[Habits] Failed to reset today', { error });
          showToast('Unable to reset today. Please try again.', 'error');
        },
      }
    );
  };

  const handleResetHistory = (habitId: string): void => {
    deleteAllEntriesMutation.mutate(habitId, {
      onSuccess: () => {
        showToast('Streak and history reset', 'success');
      },
      onError: (error) => {
        logger.error('[Habits] Failed to reset history', { error });
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
          logger.error('[Habits] Failed to update habit', { error });
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
          logger.error('[Habits] Failed to complete habit', { error });
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
        logger.error('[Habits] Failed to delete habit', { error });
        showToast('Deleting the habit failed. Please try again.', 'error');
      },
    });
  };

  // Loading state
  if (habitsLoading || entriesLoading) {
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

  // Error state
  if (habitsError) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <Toast toast={toast} onDismiss={dismissToast} />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Habits</h3>
          <p className="text-sm text-red-700 mb-4">
            Unable to load your habits. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Toast toast={toast} onDismiss={dismissToast} />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Habit tracker</h1>
        <p className="text-sm text-slate-600">A lightweight overview to help you stay consistent with the routines that matter.</p>
      </header>

      <HabitForm
        draft={draft}
        isSubmitting={createHabitMutation.isPending}
        hasError={createHabitMutation.isError}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        onClear={() => setDraft(createDraft())}
      />

      <section className="space-y-3">
        {habitsWithStats.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No habits yet. Add one above to start tracking.
          </div>
        ) : (
          habitsWithStats
            .filter(({ habit }) => habit.id !== undefined)
            .map(({ habit, todayCompletions, targetCount, hasReachedTarget, currentStreak, totalCompletions }) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayCompletions={todayCompletions}
                targetCount={targetCount}
                hasReachedTarget={hasReachedTarget}
                currentStreak={currentStreak}
                totalCompletions={totalCompletions}
                isEditing={editingHabitId === habit.id}
                editDraft={editDraft}
                isCompletingHabit={createEntryMutation.isPending}
                isUpdating={updateHabitMutation.isPending}
                hasUpdateError={updateHabitMutation.isError}
                isResettingToday={deleteEntriesForDateMutation.isPending}
                isResettingHistory={deleteAllEntriesMutation.isPending}
                isDeleting={deleteHabitMutation.isPending}
                onComplete={() => { handleCompleteHabit(habit.id as string); }}
                onStartEdit={() => { startEditing(habit.id as string); }}
                onCancelEdit={cancelEditing}
                onEditDraftChange={setEditDraft}
                onEditSubmit={handleEditSubmit}
                onResetToday={() => { handleResetToday(habit.id as string); }}
                onResetHistory={() => { handleResetHistory(habit.id as string); }}
                onDelete={() => { handleDeleteHabit(habit.id as string); }}
              />
            ))
        )}
      </section>
    </div>
  );
};

export default Habits;
