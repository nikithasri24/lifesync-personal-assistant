import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Edit2, Trash2, ChevronRight, Paperclip } from 'lucide-react';
import type { JournalEntry } from '../../types';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: colors.bg.white,
            boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
            color: colors.text.tertiary,
          }}
        >
          Loading entries...
        </div>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="space-y-3">
        <div className="rounded-2xl p-20 text-center" style={{ backgroundColor: colors.bg.white }}>
          <div className="text-6xl mb-4 opacity-50">📓</div>
          <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            {hasActiveFilters ? 'No entries match your filters' : 'Start journaling'}
          </h3>
          <p className="text-sm mt-2" style={{ color: colors.text.tertiary }}>
            {hasActiveFilters ? 'Try adjusting your search or filters' : 'Capture your thoughts, memories, and daily reflections'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" data-testid="journal-entries-list">
      {entries.map((entry: JournalEntry) => (
        <article
          key={entry.id}
          className="rounded-2xl p-4 transition-transform active:scale-98"
          style={{
            backgroundColor: colors.bg.white,
            boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
          }}
          data-testid={`journal-entry-${entry.id}`}
        >
          <div className="flex items-start justify-between mb-2">
            <Link to={`/journal/${entry.id}`} className="flex-1 group no-underline">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold group-hover:opacity-70 transition-opacity" style={{ color: colors.text.primary }}>
                  {entry.title ?? 'Untitled'}
                </h3>
                <span className="text-xs whitespace-nowrap" style={{ color: colors.text.tertiary }}>
                  {format(entry.createdAt, 'MMM d')}
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="rounded-full p-1.5 transition hover:opacity-70"
                style={{ color: colors.text.secondary }}
                aria-label="Edit entry"
                data-testid={`journal-entry-edit-${entry.id}`}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteStart(entry.id)}
                className="rounded-full p-1.5 transition hover:bg-red-50 hover:text-red-600"
                style={{ color: colors.text.secondary }}
                aria-label="Delete entry"
                data-testid={`journal-entry-delete-${entry.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link
                to={`/journal/${entry.id}`}
                className="rounded-full p-1.5 transition hover:opacity-70 no-underline"
                style={{ color: colors.text.secondary }}
                aria-label="View entry details"
                data-testid={`journal-entry-view-${entry.id}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Content preview */}
          <Link to={`/journal/${entry.id}`} className="block no-underline">
            <div
              className="line-clamp-3 prose prose-sm max-w-none"
              style={{ color: colors.text.secondary }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
            />
          </Link>

          {/* Tags and attachments */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: colors.border.light,
                  color: colors.text.secondary,
                }}
              >
                {tag}
              </span>
            ))}
            {entry.attachments && entry.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: colors.text.tertiary }}>
                <Paperclip className="h-3 w-3" />
                {entry.attachments.length}
              </span>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteConfirm === entry.id && (
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                backgroundColor: colors.bg.secondary,
                border: `2px solid ${colors.border.light}`,
              }}
            >
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>
                Are you sure you want to delete this entry?
              </p>
              <p className="mt-1 text-xs" style={{ color: colors.text.secondary }}>
                This action cannot be undone.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteConfirm(entry.id)}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                  aria-label={`Confirm delete entry ${entry.title || 'Untitled'}`}
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onDeleteCancel}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-70"
                  style={{
                    backgroundColor: colors.border.light,
                    color: colors.text.primary,
                  }}
                  aria-label="Cancel deletion"
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
