import React, { type FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import type { DreamCategory, DreamPriority, DreamStatus } from '../../types/lifeGoals';

const DREAM_CATEGORIES: DreamCategory[] = ['travel', 'experiences', 'possessions', 'achievements', 'relationships', 'lifestyle'];
const DREAM_PRIORITIES: DreamPriority[] = ['someday', 'within-5-years', 'within-10-years', 'lifetime'];
const DREAM_STATUSES: DreamStatus[] = ['dreaming', 'planning', 'in-progress', 'achieved', 'no-longer-interested'];

export type DreamDraft = {
  title: string;
  description: string;
  category: DreamCategory;
  priority: DreamPriority;
  status: DreamStatus;
  estimatedCost: string;
  estimatedTimeframe: string;
};

interface DreamFormModalProps {
  isOpen: boolean;
  dreamDraft: DreamDraft;
  onDraftChange: (draft: DreamDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/**
 * Modal form for capturing a new dream
 */
export function DreamFormModal({
  isOpen,
  dreamDraft,
  onDraftChange,
  onSubmit,
  onClose,
}: DreamFormModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Capture a dream</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            required
            value={dreamDraft.title}
            onChange={(event) => onDraftChange({ ...dreamDraft, title: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Backpack through Europe"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Category</span>
          <select
            value={dreamDraft.category}
            onChange={(event) => onDraftChange({ ...dreamDraft, category: event.target.value as DreamCategory })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {DREAM_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={dreamDraft.description}
            onChange={(event) => onDraftChange({ ...dreamDraft, description: event.target.value })}
            className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Why this dream is meaningful and what it looks like"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Priority</span>
          <select
            value={dreamDraft.priority}
            onChange={(event) => onDraftChange({ ...dreamDraft, priority: event.target.value as DreamPriority })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {DREAM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Status</span>
          <select
            value={dreamDraft.status}
            onChange={(event) => onDraftChange({ ...dreamDraft, status: event.target.value as DreamStatus })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {DREAM_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Estimated cost (optional)</span>
          <input
            type="number"
            min="0"
            value={dreamDraft.estimatedCost}
            onChange={(event) => onDraftChange({ ...dreamDraft, estimatedCost: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="5000"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Timeframe (optional)</span>
          <input
            value={dreamDraft.estimatedTimeframe}
            onChange={(event) => onDraftChange({ ...dreamDraft, estimatedTimeframe: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Within 5 years"
          />
        </label>
      </div>
      <div className="mt-6 flex gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Sparkles className="h-4 w-4" />
          Save dream
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
