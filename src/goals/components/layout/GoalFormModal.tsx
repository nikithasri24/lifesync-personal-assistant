import React, { type FormEvent } from 'react';
import { Target } from 'lucide-react';
import type { GoalCategory, GoalPriority } from '../../types/lifeGoals';

const GOAL_CATEGORIES: GoalCategory[] = ['personal', 'health', 'career', 'financial', 'fitness'];
const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high', 'critical'];

export type GoalDraft = {
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate: string;
  streakEnabled: boolean;
  streakFrequency: 'daily' | 'weekly';
  streakTarget: string;
};

interface GoalFormModalProps {
  isOpen: boolean;
  goalDraft: GoalDraft;
  onDraftChange: (draft: GoalDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/**
 * Modal form for creating a new goal
 */
export function GoalFormModal({
  isOpen,
  goalDraft,
  onDraftChange,
  onSubmit,
  onClose,
}: GoalFormModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Create a goal</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            required
            value={goalDraft.title}
            onChange={(event) => onDraftChange({ ...goalDraft, title: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Launch new product"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <select
            value={goalDraft.category}
            onChange={(event) => onDraftChange({ ...goalDraft, category: event.target.value as GoalCategory })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {GOAL_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={goalDraft.description}
            onChange={(event) => onDraftChange({ ...goalDraft, description: event.target.value })}
            className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Why this goal matters and how you will tackle it"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Priority</span>
          <select
            value={goalDraft.priority}
            onChange={(event) => onDraftChange({ ...goalDraft, priority: event.target.value as GoalPriority })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {GOAL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Target date</span>
          <input
            type="date"
            value={goalDraft.targetDate}
            onChange={(event) => onDraftChange({ ...goalDraft, targetDate: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </label>

        {/* Streak tracking options */}
        <div className="sm:col-span-2 border-t border-slate-200 pt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={goalDraft.streakEnabled}
              onChange={(e) => onDraftChange({ ...goalDraft, streakEnabled: e.target.checked })}
              className="rounded border-slate-300"
            />
            <span className="font-medium text-slate-700">Enable daily streak tracking</span>
          </label>
          <p className="text-xs text-slate-500 mt-1 ml-6">Track daily progress with check-ins and earn XP for consistency</p>

          {goalDraft.streakEnabled && (
            <div className="mt-3 ml-6 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Frequency</span>
                <select
                  value={goalDraft.streakFrequency}
                  onChange={(e) => onDraftChange({ ...goalDraft, streakFrequency: e.target.value as 'daily' | 'weekly' })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Target streak (days)</span>
                <input
                  type="number"
                  min="1"
                  value={goalDraft.streakTarget}
                  onChange={(e) => onDraftChange({ ...goalDraft, streakTarget: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g., 30"
                />
              </label>
            </div>
          )}
        </div>
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
          onClick={onClose}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
