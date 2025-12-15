import React, { type FormEvent } from 'react';
import { Target } from 'lucide-react';
import type { GoalDraft } from '../../types/drafts';
import type { GoalCategory, GoalPriority } from '../../types/lifeGoals';
import { GOAL_CATEGORIES, GOAL_PRIORITIES } from '../../constants';

interface GoalFormProps {
  goalDraft: GoalDraft;
  onDraftChange: (updates: Partial<GoalDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

/**
 * Form for creating a new goal
 */
export function GoalForm({ goalDraft, onDraftChange, onSubmit, onCancel }: GoalFormProps): React.ReactElement {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Create a goal</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            required
            value={goalDraft.title}
            onChange={(event) => onDraftChange({ title: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Launch new product"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <select
            value={goalDraft.category}
            onChange={(event) => onDraftChange({ category: event.target.value as GoalCategory })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {GOAL_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={goalDraft.description}
            onChange={(event) => onDraftChange({ description: event.target.value })}
            className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Why this goal matters and how you will tackle it"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Priority</span>
          <select
            value={goalDraft.priority}
            onChange={(event) => onDraftChange({ priority: event.target.value as GoalPriority })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {GOAL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Target date</span>
          <input
            type="date"
            value={goalDraft.targetDate}
            onChange={(event) => onDraftChange({ targetDate: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Target className="h-4 w-4" />
          Save goal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
