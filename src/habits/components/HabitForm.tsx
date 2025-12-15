/**
 * Habit Form Component
 * Form for creating new habits
 */

import React from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { HabitDraft } from '../types';
import { CATEGORIES } from '../constants';

interface HabitFormProps {
  draft: HabitDraft;
  isSubmitting: boolean;
  hasError: boolean;
  onDraftChange: (draft: HabitDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}

export function HabitForm({
  draft,
  isSubmitting,
  hasError,
  onDraftChange,
  onSubmit,
  onClear,
}: HabitFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add a habit</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Name</span>
          <input
            data-testid="habit-add-name"
            required
            value={draft.name}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            placeholder="Morning stretch"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={draft.description}
            onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
            disabled={isSubmitting}
            className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            placeholder="Optional details or reminders"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Frequency</span>
          <select
            value={draft.frequency}
            onChange={(event) => onDraftChange({ ...draft, frequency: event.target.value as 'daily' | 'weekly' | 'monthly' })}
            disabled={isSubmitting}
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
                onDraftChange({ ...draft, targetValue: value });
              }
            }}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <select
            value={draft.category}
            onChange={(event) => onDraftChange({ ...draft, category: event.target.value })}
            disabled={isSubmitting}
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
            onChange={(event) => onDraftChange({ ...draft, color: event.target.value })}
            disabled={isSubmitting}
            className="h-10 rounded-lg border border-slate-200 px-2 disabled:opacity-50"
          />
        </label>
      </div>
      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          data-testid="habit-add-submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save habit'}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={isSubmitting}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      {hasError && (
        <p className="mt-2 text-xs text-red-600">Failed to create habit. Please try again.</p>
      )}
    </form>
  );
}
