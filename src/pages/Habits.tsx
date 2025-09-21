import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { Habit } from '../types';

type HabitDraft = {
  name: string;
  description: string;
  frequency: Habit['frequency'];
  categoryId: string;
  color: string;
  targetCount: number;
};

const createDraft = (defaultCategoryId: string): HabitDraft => ({
  name: '',
  description: '',
  frequency: 'daily',
  categoryId: defaultCategoryId,
  color: '#22c55e',
  targetCount: 1,
});

const Habits: React.FC = () => {
  const {
    habitCategories,
    habits,
    addHabit,
    deleteHabit,
    completeHabit,
    updateHabit,
  } = useAppStore();

  const defaultCategoryId = habitCategories[0]?.id ?? 'general';
  const [draft, setDraft] = useState<HabitDraft>(() => createDraft(defaultCategoryId));

  const habitsWithCategory = useMemo(() => {
    const categoryMap = new Map(habitCategories.map((category) => [category.id, category]));
    return habits.map((habit) => ({
      habit,
      categoryName: categoryMap.get(habit.categoryId)?.name ?? 'Uncategorised',
    }));
  }, [habitCategories, habits]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) return;

    await addHabit({
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      frequency: draft.frequency,
      customFrequency: draft.frequency === 'custom' ? { type: 'every-x-days', interval: 1 } : undefined,
      targetCount: draft.targetCount,
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
  };

  const resetProgress = (habit: Habit) => {
    updateHabit(habit.id, { currentProgress: 0, streak: 0 });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
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
              min={1}
              value={draft.targetCount}
              onChange={(event) => setDraft((prev) => ({ ...prev, targetCount: Number(event.target.value) || 1 }))}
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
          habitsWithCategory.map(({ habit, categoryName }) => (
            <article key={habit.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{habit.name}</p>
                  <p className="text-xs text-slate-500">{categoryName} • {habit.frequency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => completeHabit(habit.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete today
                  </button>
                  <button
                    type="button"
                    onClick={() => resetProgress(habit)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reset streak
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
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
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default Habits;
