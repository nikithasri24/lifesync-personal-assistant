import React, { type FormEvent } from 'react';
import { Plus, NotebookPen, Edit2 } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import type { JournalMood } from '../../types';

type JournalDraft = {
  title: string;
  content: string;
  mood: JournalMood;
  tags: string;
};

interface JournalEntryFormProps {
  draft: JournalDraft;
  onDraftChange: (draft: JournalDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  onCancelEdit: () => void;
  editingId: string | null;
  isSubmitting: boolean;
  hasError: boolean;
  moodOptions: JournalMood[];
}

/**
 * Form for creating and editing journal entries
 */
export function JournalEntryForm({
  draft,
  onDraftChange,
  onSubmit,
  onClear,
  onCancelEdit,
  editingId,
  isSubmitting,
  hasError,
  moodOptions,
}: JournalEntryFormProps): React.ReactElement {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <NotebookPen className="h-5 w-5 text-indigo-500" />
        {editingId ? 'Edit entry' : 'New entry'}
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {/* Title - Full Width */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Title</span>
          <input
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="A quick headline for the day"
          />
        </label>

        {/* Mood and Tags - Side by Side */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Mood</span>
            <select
              value={draft.mood}
              onChange={(event) => onDraftChange({ ...draft, mood: event.target.value as JournalMood })}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {moodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Tags</span>
            <input
              value={draft.tags}
              onChange={(event) => onDraftChange({ ...draft, tags: event.target.value })}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Creativity, focus, gratitude"
            />
          </label>
        </div>

        {/* What happened - Full Width */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">What happened?</span>
          <RichTextEditor
            content={draft.content}
            onChange={(content) => onDraftChange({ ...draft, content })}
            placeholder="Capture highlights, lessons, or anything noteworthy"
            disabled={isSubmitting}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isSubmitting ? 'Saving...' : editingId ? 'Update entry' : 'Save entry'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          )}
          {!editingId && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Clear
            </button>
          )}
        </div>
        {/* Mutation error messages */}
        {hasError && (
          <p className="text-sm text-red-600">
            Error {editingId ? 'updating' : 'creating'} entry. Please try again.
          </p>
        )}
      </div>
    </form>
  );
}

export type { JournalDraft };
