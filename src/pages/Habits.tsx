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
import { CheckCircle2, Pencil, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';
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
import type { HabitData } from '../services/types';
import { logger } from '../services/logger';

type HabitDraft = {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  color: string;
  targetValue: string;
};

const createDraft = (): HabitDraft => ({
  name: '',
  description: '',
  frequency: 'daily',
  category: 'general',
  color: '#22c55e',
  targetValue: '1',
});

const CATEGORIES = [
  'general',
  'health',
  'fitness',
  'learning',
  'work',
  'personal',
  'creative',
  'social'
];

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
  const [draft, setDraft] = useState<HabitDraft>(createDraft);
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

      const targetCount = habit.target_value || 1;
      const hasReachedTarget = todayCompletions >= targetCount;

      return {
        habit,
        todayCompletions,
        targetCount,
        hasReachedTarget,
        currentStreak: habit.streak_count || 0,
        totalCompletions: habit.current_progress || 0,
      };
    });
  }, [apiHabits, apiEntries, todayKey]);

  const toHabitDraft = (habit: HabitData): HabitDraft => ({
    name: habit.name,
    description: habit.description || '',
    frequency: (habit.frequency || 'daily') as 'daily' | 'weekly' | 'monthly',
    category: habit.category || 'general',
    color: habit.color || '#22c55e',
    targetValue: String(habit.target_value || 1),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleResetToday = async (habitId: string) => {
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

  const handleResetHistory = async (habitId: string) => {
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

  const startEditing = (habit: HabitData) => {
    setEditingHabitId(habit.id!);
    setEditDraft(toHabitDraft(habit));
  };

  const cancelEditing = () => {
    setEditingHabitId(null);
    setEditDraft(null);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleCompleteHabit = async (habitId: string) => {
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

  const handleDeleteHabit = async (habitId: string) => {
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

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add a habit</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Name</span>
            <input
              data-testid="habit-add-name"
              required
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              disabled={createHabitMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              placeholder="Morning stretch"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              disabled={createHabitMutation.isPending}
              className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              placeholder="Optional details or reminders"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Frequency</span>
            <select
              value={draft.frequency}
              onChange={(event) => setDraft((prev) => ({ ...prev, frequency: event.target.value as 'daily' | 'weekly' | 'monthly' }))}
              disabled={createHabitMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Target count</span>
            <input
              type="number"
              min={0}
              value={draft.targetValue}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || Number(value) >= 0) {
                  setDraft((prev) => ({ ...prev, targetValue: value }));
                }
              }}
              disabled={createHabitMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <select
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
              disabled={createHabitMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Accent colour</span>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => setDraft((prev) => ({ ...prev, color: event.target.value }))}
              disabled={createHabitMutation.isPending}
              className="h-10 rounded-lg border border-slate-200 px-2 disabled:opacity-50"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            data-testid="habit-add-submit"
            disabled={createHabitMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {createHabitMutation.isPending ? 'Saving...' : 'Save habit'}
          </button>
          <button
            type="button"
            onClick={() => setDraft(createDraft())}
            disabled={createHabitMutation.isPending}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
        {createHabitMutation.isError && (
          <p className="mt-2 text-xs text-red-600">Failed to create habit. Please try again.</p>
        )}
      </form>

      <section className="space-y-3">
        {habitsWithStats.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No habits yet. Add one above to start tracking.
          </div>
        ) : (
          habitsWithStats.map(({ habit, todayCompletions, targetCount, hasReachedTarget, currentStreak, totalCompletions }) => {
            const isEditing = editingHabitId === habit.id && editDraft;

            return (
              <article
                key={habit.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{habit.name}</p>
                      {hasReachedTarget ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-200">
                          Completed today{targetCount > 1 ? ` (${todayCompletions}/${targetCount})` : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                          Today {todayCompletions}/{targetCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{habit.category || 'general'} • {habit.frequency || 'daily'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompleteHabit(habit.id!)}
                      disabled={hasReachedTarget || isEditing || createEntryMutation.isPending}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                        hasReachedTarget || isEditing || createEntryMutation.isPending
                          ? 'cursor-not-allowed bg-emerald-100 text-emerald-400'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {hasReachedTarget ? 'Completed today' : createEntryMutation.isPending ? 'Saving...' : 'Complete today'}
                    </button>
                    <button
                      type="button"
                      onClick={() => (isEditing ? cancelEditing() : startEditing(habit))}
                      disabled={updateHabitMutation.isPending}
                      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        isEditing ? 'bg-slate-100 text-slate-500' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetToday(habit.id!)}
                        data-testid={`habit-reset-today-${habit.id}`}
                        disabled={deleteEntriesForDateMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        title="Clear today's completion"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        {deleteEntriesForDateMutation.isPending ? 'Resetting...' : 'Reset today'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetHistory(habit.id!)}
                        data-testid={`habit-reset-streak-${habit.id}`}
                        disabled={deleteAllEntriesMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        title="Reset streak and history"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        {deleteAllEntriesMutation.isPending ? 'Resetting...' : 'Reset streak'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit.id!)}
                      data-testid={`habit-delete-${habit.id}`}
                      disabled={deleteHabitMutation.isPending}
                      className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                      aria-label="Delete habit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {habit.description && <p className="text-sm text-slate-600">{habit.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Target: {targetCount} per {habit.frequency === 'daily' ? 'day' : habit.frequency === 'weekly' ? 'week' : 'month'}</span>
                  <span>Progress: {totalCompletions}</span>
                  <span>Streak: {currentStreak}</span>
                </div>
                {isEditing && editDraft && (
                  <form onSubmit={handleEditSubmit} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="font-medium text-slate-700">Name</span>
                      <input
                        data-testid="habit-edit-name"
                        required
                        value={editDraft.name}
                        onChange={(event) =>
                          setEditDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                        }
                        disabled={updateHabitMutation.isPending}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="font-medium text-slate-700">Description</span>
                      <textarea
                        value={editDraft.description}
                        onChange={(event) =>
                          setEditDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                        }
                        disabled={updateHabitMutation.isPending}
                        className="h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Frequency</span>
                      <select
                        value={editDraft.frequency}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev ? { ...prev, frequency: event.target.value as 'daily' | 'weekly' | 'monthly' } : prev,
                          )
                        }
                        disabled={updateHabitMutation.isPending}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Target count</span>
                      <input
                        type="number"
                        min={0}
                        value={editDraft.targetValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setEditDraft((prev) => (prev ? { ...prev, targetValue: value } : prev));
                          }
                        }}
                        disabled={updateHabitMutation.isPending}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Category</span>
                      <select
                        value={editDraft.category}
                        onChange={(event) =>
                          setEditDraft((prev) => (prev ? { ...prev, category: event.target.value } : prev))
                        }
                        disabled={updateHabitMutation.isPending}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Accent colour</span>
                      <input
                        type="color"
                        value={editDraft.color}
                        onChange={(event) =>
                          setEditDraft((prev) => (prev ? { ...prev, color: event.target.value } : prev))
                        }
                        disabled={updateHabitMutation.isPending}
                        className="h-10 rounded-lg border border-slate-200 px-2 disabled:opacity-50"
                      />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="submit"
                        data-testid="habit-save-changes"
                        disabled={updateHabitMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {updateHabitMutation.isPending ? 'Saving...' : 'Save changes'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={updateHabitMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                    {updateHabitMutation.isError && (
                      <p className="text-xs text-red-600 sm:col-span-2">Failed to update habit. Please try again.</p>
                    )}
                  </form>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default Habits;
