/**
 * Habit Edit Form Component
 * Inline form for editing existing habits
 */

import React from 'react';
import type { FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import type { HabitDraft } from '../types';
import { CATEGORIES } from '../constants';

interface HabitEditFormProps {
  editDraft: HabitDraft;
  isSubmitting: boolean;
  hasError: boolean;
  onDraftChange: (draft: HabitDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function HabitEditForm({
  editDraft,
  isSubmitting,
  hasError,
  onDraftChange,
  onSubmit,
  onCancel,
}: HabitEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Name</span>
        <input
          data-testid="habit-edit-name"
          required
          value={editDraft.name}
          onChange={(event) => onDraftChange({ ...editDraft, name: event.target.value })}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Description</span>
        <textarea
          value={editDraft.description}
          onChange={(event) => onDraftChange({ ...editDraft, description: event.target.value })}
          disabled={isSubmitting}
          className="h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Frequency</span>
        <select
          value={editDraft.frequency}
          onChange={(event) => onDraftChange({ ...editDraft, frequency: event.target.value as 'daily' | 'weekly' | 'monthly' })}
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
          value={editDraft.targetValue}
          onChange={(event) => {
            const value = event.target.value;
            if (value === '' || Number(value) >= 0) {
              onDraftChange({ ...editDraft, targetValue: value });
            }
          }}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Category</span>
        <select
          value={editDraft.category}
          onChange={(event) => onDraftChange({ ...editDraft, category: event.target.value })}
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
          value={editDraft.color}
          onChange={(event) => onDraftChange({ ...editDraft, color: event.target.value })}
          disabled={isSubmitting}
          className="h-10 rounded-lg border border-slate-200 px-2 disabled:opacity-50"
        />
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          data-testid="habit-save-changes"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
      {hasError && (
        <p className="text-xs text-red-600 sm:col-span-2">Failed to update habit. Please try again.</p>
      )}
    </form>
  );
}
