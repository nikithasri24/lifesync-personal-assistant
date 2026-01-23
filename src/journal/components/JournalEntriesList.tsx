import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit2, Trash2, ChevronRight, Paperclip } from 'lucide-react';
import type { JournalEntry } from '../../types';
import { sanitizeHtml } from '../utils/sanitizeHtml';

interface JournalEntriesListProps {
  entries: JournalEntry[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  deleteConfirm: string | null;
  onEdit: (entry: JournalEntry) => void;
  onDeleteStart: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

/**
 * List of journal entries with edit and delete functionality
 */
export function JournalEntriesList({
  entries,
  isLoading,
  hasActiveFilters,
  deleteConfirm,
  onEdit,
  onDeleteStart,
  onDeleteConfirm,
  onDeleteCancel,
}: JournalEntriesListProps): React.ReactElement {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          Loading entries...
        </div>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="space-y-3">
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          {hasActiveFilters ? 'No entries match your filters.' : 'No entries yet. Capture your first reflection above.'}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3" data-testid="journal-entries-list">
      {entries.map((entry: JournalEntry) => (
        <article
          key={entry.id}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
          data-testid={`journal-entry-${entry.id}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link to={`/journal/${entry.id}`} className="flex-1 group no-underline">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                {entry.title ?? 'Untitled'}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{format(entry.createdAt, 'PPpp')}</span>
                {entry.tags.length > 0 && (
                  <span className="text-slate-500 dark:text-slate-400">#{entry.tags.join(' #')}</span>
                )}
                {entry.attachments && entry.attachments.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <Paperclip className="h-3 w-3" />
                    {entry.attachments.length}
                  </span>
                )}
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="rounded-full border border-slate-200 dark:border-slate-600 p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Edit entry"
                data-testid={`journal-entry-edit-${entry.id}`}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteStart(entry.id)}
                className="rounded-full border border-slate-200 dark:border-slate-600 p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                aria-label="Delete entry"
                data-testid={`journal-entry-delete-${entry.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link
                to={`/journal/${entry.id}`}
                className="rounded-full border border-slate-200 dark:border-slate-600 p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 no-underline"
                aria-label="View entry details"
                data-testid={`journal-entry-view-${entry.id}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {/* Truncated content preview - click through for full view */}
          <Link to={`/journal/${entry.id}`} className="block no-underline">
            <div
              className="mt-3 prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
            />
          </Link>

          {/* Delete Confirmation Dialog */}
          {deleteConfirm === entry.id && (
            <div className="mt-4 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-4">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Are you sure you want to delete this entry?</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">This action cannot be undone.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteConfirm(entry.id)}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onDeleteCancel}
                  className="rounded-full bg-slate-200 dark:bg-slate-600 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white transition hover:bg-slate-300 dark:hover:bg-slate-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
