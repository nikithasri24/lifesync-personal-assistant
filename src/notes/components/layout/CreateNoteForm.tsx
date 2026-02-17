import React, { type FormEvent } from 'react';
import { Plus, List, FileText } from 'lucide-react';
import type { NoteType } from '../../../types';

interface CreateNoteFormProps {
  noteType: NoteType;
  onNoteTypeChange: (type: NoteType) => void;
  title: string;
  onTitleChange: (title: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  tags: string;
  onTagsChange: (tags: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  isError: boolean;
}

/**
 * Form for creating new notes and lists
 */
export function CreateNoteForm({
  noteType,
  onNoteTypeChange,
  title,
  onTitleChange,
  content,
  onContentChange,
  tags,
  onTagsChange,
  onSubmit,
  isPending,
  isError,
}: CreateNoteFormProps): React.ReactElement {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <Plus className="h-5 w-5 text-[#C18B5E]" />
        Create New
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Note Type Selector */}
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">Type</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onNoteTypeChange('note')}
              disabled={isPending}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                noteType === 'note'
                  ? 'bg-[#C18B5E] text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              Regular Note
            </button>
            <button
              type="button"
              onClick={() => onNoteTypeChange('list')}
              disabled={isPending}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                noteType === 'list'
                  ? 'bg-[#C18B5E] text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {noteType === 'list' ? 'List Name' : 'Title'}
          </span>
          <input
            required
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder={noteType === 'list' ? 'e.g., Movies to Watch, Books to Read' : 'Project kickoff'}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
            disabled={isPending}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Tags</span>
          <input
            value={tags}
            onChange={(event) => onTagsChange(event.target.value)}
            placeholder={noteType === 'list' ? 'movies, entertainment' : 'work, planning'}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
            disabled={isPending}
          />
        </label>
        {noteType === 'note' && (
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Details</span>
            <textarea
              required
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Capture the important bits..."
              className="h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
              disabled={isPending}
            />
          </label>
        )}
        {noteType === 'list' && (
          <p className="text-xs text-slate-600 dark:text-slate-400 sm:col-span-2">
            💡 You'll be able to add items to your list after creating it
          </p>
        )}
      </div>
      <div className="mt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B5795A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating...' : noteType === 'list' ? 'Create list' : 'Save note'}
        </button>
        {isError && (
          <p className="mt-2 text-sm text-red-600">
            Error creating note. Please try again.
          </p>
        )}
      </div>
    </form>
  );
}
