import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Pencil, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { Habit } from '../types';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';

type HabitDraft = {
  name: string;
  description: string;
  frequency: Habit['frequency'];
  categoryId: string;
  color: string;
  targetCount: string;
};

const createDraft = (defaultCategoryId: string): HabitDraft => ({
  name: '',
  description: '',
  frequency: 'daily',
  categoryId: defaultCategoryId,
  color: '#22c55e',
  targetCount: '1',
});

const Habits: React.FC = () => {
  const { 
    habitCategories,
    habits,
    addHabit,
    deleteHabit,
    completeHabit,
    updateHabit,
    resetHabitToday,
    resetHabitHistory,
  } = useAppStore();

  const defaultCategoryId = habitCategories[0]?.id ?? 'general';
  const [draft, setDraft] = useState<HabitDraft>(() => createDraft(defaultCategoryId));
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<HabitDraft | null>(null);

  const todayKey = new Date().toDateString();
  const { toast, showToast, dismissToast } = useToast();

  const habitsWithCategory = useMemo(() => {
    const categoryMap = new Map(habitCategories.map((category) => [category.id, category]));
    return habits.map((habit) => ({
      habit,
      categoryName: categoryMap.get(habit.categoryId)?.name ?? 'Uncategorised',
    }));
  }, [habitCategories, habits]);

  const toHabitDraft = (habit: Habit): HabitDraft => ({
    name: habit.name,
    description: habit.description ?? '',
    frequency: habit.frequency,
    categoryId: habit.categoryId ?? defaultCategoryId,
    color: habit.color,
    targetCount: String(habit.targetCount ?? 1),
  });

  const hasReachedTargetToday = (habit: Habit) => {
    const completionsToday = habit.completions.filter(
      (completion) => completion.completedAt.toDateString() === todayKey,
    ).length;

    return completionsToday >= Math.max(1, habit.targetCount);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) return;

    const parsedTarget = Number(draft.targetCount);
    const normalizedTarget = Number.isFinite(parsedTarget) ? Math.max(1, Math.floor(parsedTarget)) : 1;

    try {
      await addHabit({
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        frequency: draft.frequency,
        customFrequency: draft.frequency === 'custom' ? { type: 'every-x-days', interval: 1 } : undefined,
        targetCount: normalizedTarget,
        goalMode: 'daily-target',
        goalTarget: undefined,
        goalUnit: undefined,
        currentProgress: 0,
        categoryId: draft.categoryId,
        color: draft.color,
        reminder: undefined,
        streak: 0,
      });

      setDraft(createDraft(defaultCategoryId));
    } catch (error) {
      console.error('[Habits] Failed to add habit', error);
      showToast('Unable to save the habit right now. Please try again.', 'error');
    }
  };

  const handleResetToday = async (habit: Habit) => {
    try {
      await resetHabitToday(habit.id)
      showToast('Cleared today\'s completion', 'success')
    } catch (error) {
      console.error('[Habits] Failed to reset today', error)
      showToast('Unable to reset today. Please try again.', 'error')
    }
  }

  const handleResetHistory = async (habit: Habit) => {
    try {
      await resetHabitHistory(habit.id)
      showToast('Streak and history reset', 'success')
    } catch (error) {
      console.error('[Habits] Failed to reset history', error)
      showToast('Unable to reset history. Please try again.', 'error')
    }
  }

  const startEditing = (habit: Habit) => {
    setEditingHabitId(habit.id);
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

    const parsedTarget = Number(editDraft.targetCount);
    const normalizedTarget = Number.isFinite(parsedTarget) ? Math.max(1, Math.floor(parsedTarget)) : 1;

    try {
      await updateHabit(editingHabitId, {
        name: editDraft.name.trim(),
        description: editDraft.description.trim() || undefined,
        frequency: editDraft.frequency,
        targetCount: normalizedTarget,
        categoryId: editDraft.categoryId,
        color: editDraft.color,
      });

      setEditingHabitId(null);
      setEditDraft(null);
    } catch (error) {
      console.error('[Habits] Failed to update habit', error);
      showToast('Saving changes failed. Please try again.', 'error');
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await completeHabit(habitId);
    } catch (error) {
      console.error('[Habits] Failed to complete habit', error);
      showToast('Could not record the completion. Please try again.', 'error');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
    } catch (error) {
      console.error('[Habits] Failed to delete habit', error);
      showToast('Deleting the habit failed. Please try again.', 'error');
    }
  };

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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Morning stretch"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Optional details or reminders"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Frequency</span>
            <select
              value={draft.frequency}
              onChange={(event) => setDraft((prev) => ({ ...prev, frequency: event.target.value as Habit['frequency'] }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Target count</span>
            <input
              type="number"
              min={0}
              value={draft.targetCount}
              onChange={(event) => {
                const value = event.target.value;
                if (value === '' || Number(value) >= 0) {
                  setDraft((prev) => ({ ...prev, targetCount: value }));
                }
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <select
              value={draft.categoryId}
              onChange={(event) => setDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {habitCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
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
              className="h-10 rounded-lg border border-slate-200 px-2"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            data-testid="habit-add-submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Save habit
          </button>
          <button
            type="button"
            onClick={() => setDraft(createDraft(defaultCategoryId))}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      <section className="space-y-3">
        {habitsWithCategory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No habits yet. Add one above to start tracking.
          </div>
        ) : (
          habitsWithCategory.map(({ habit, categoryName }) => {
            const reachedTodayTarget = hasReachedTargetToday(habit);
            const todayCount = habit.completions.filter(
              (c) => c.completedAt.toDateString() === todayKey,
            ).length;
            const targetForToday = Math.max(1, habit.targetCount ?? 1);
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
                      {reachedTodayTarget ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-200">
                          Completed today{targetForToday > 1 ? ` (${todayCount}/${targetForToday})` : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                          Today {todayCount}/{targetForToday}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{categoryName} • {habit.frequency}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompleteHabit(habit.id)}
                      disabled={reachedTodayTarget || isEditing}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                        reachedTodayTarget || isEditing
                          ? 'cursor-not-allowed bg-emerald-100 text-emerald-400'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {reachedTodayTarget ? 'Completed today' : 'Complete today'}
                    </button>
                    <button
                      type="button"
                      onClick={() => (isEditing ? cancelEditing() : startEditing(habit))}
                      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium transition ${
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
                        onClick={() => handleResetToday(habit)}
                        data-testid={`habit-reset-today-${habit.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        title="Clear today\'s completion"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reset today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetHistory(habit)}
                        data-testid={`habit-reset-streak-${habit.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        title="Reset streak and history"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reset streak
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHabit(habit.id)}
                      data-testid={`habit-delete-${habit.id}`}
                      className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
                      aria-label="Delete habit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {habit.description && <p className="text-sm text-slate-600">{habit.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Target: {habit.targetCount} per {habit.frequency === 'daily' ? 'day' : habit.frequency === 'weekly' ? 'week' : habit.frequency === 'monthly' ? 'month' : 'period'}</span>
                  <span>Progress: {habit.currentProgress ?? 0}</span>
                  <span>Streak: {habit.streak ?? 0}</span>
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
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="font-medium text-slate-700">Description</span>
                      <textarea
                        value={editDraft.description}
                        onChange={(event) =>
                          setEditDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                        }
                        className="h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Frequency</span>
                      <select
                        value={editDraft.frequency}
                        onChange={(event) =>
                          setEditDraft((prev) =>
                            prev ? { ...prev, frequency: event.target.value as Habit['frequency'] } : prev,
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Target count</span>
                      <input
                        type="number"
                        min={0}
                        value={editDraft.targetCount}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setEditDraft((prev) => (prev ? { ...prev, targetCount: value } : prev));
                          }
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-slate-700">Category</span>
                      <select
                        value={editDraft.categoryId}
                        onChange={(event) =>
                          setEditDraft((prev) => (prev ? { ...prev, categoryId: event.target.value } : prev))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        {habitCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
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
                        className="h-10 rounded-lg border border-slate-200 px-2"
                      />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="submit"
                        data-testid="habit-save-changes"
                        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                      >
                        <Save className="h-4 w-4" />
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
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
