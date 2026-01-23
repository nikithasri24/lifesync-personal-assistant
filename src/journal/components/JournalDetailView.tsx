/**
 * Journal Detail View
 *
 * Displays a single journal entry with full content.
 * Accessed via /journal/:id route.
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useJournalEntry, useDeleteJournalEntry } from '@/hooks/useJournalQuery';
import type { JournalEntry } from '@/types';
import { JournalAttachmentList } from './JournalAttachmentList';
import { sanitizeHtml } from '../utils/sanitizeHtml';

export const JournalDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: entry, isLoading, error } = useJournalEntry(id ?? null);
  const deleteMutation = useDeleteJournalEntry();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const typedEntry = entry as JournalEntry | undefined;

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        navigate('/journal');
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6" data-testid="journal-detail-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !typedEntry) {
    return (
      <div className="mx-auto max-w-3xl p-6" data-testid="journal-detail-error">
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-white hover:text-slate-800 dark:hover:text-slate-200 mb-6 no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error instanceof Error ? error.message : 'Entry not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6" data-testid="journal-detail-view">
      {/* Back link */}
      <Link
        to="/journal"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-white hover:text-slate-800 dark:hover:text-slate-200 mb-6 no-underline"
        data-testid="journal-detail-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Journal
      </Link>

      {/* Entry card */}
      <article className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h1
            className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2"
            data-testid="journal-detail-title"
          >
            {typedEntry.title || 'Untitled Entry'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(typedEntry.createdAt), 'MMMM d, yyyy')} at{' '}
              {format(new Date(typedEntry.createdAt), 'h:mm a')}
            </span>
          </div>

          {/* Tags */}
          {typedEntry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" data-testid="journal-detail-tags">
              {typedEntry.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div
          className="px-6 py-6 prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(typedEntry.content) }}
          data-testid="journal-detail-content"
        />

        {/* Attachments */}
        {typedEntry.attachments && typedEntry.attachments.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <JournalAttachmentList attachments={typedEntry.attachments} readonly />
          </div>
        )}

        {/* Actions */}
        <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/journal?edit=${typedEntry.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
            data-testid="journal-detail-edit"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              data-testid="journal-detail-delete"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Delete this entry?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                data-testid="journal-detail-delete-confirm"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                data-testid="journal-detail-delete-cancel"
              >
                Cancel
              </button>
            </div>
          )}
        </footer>
      </article>
    </div>
  );
};

export default JournalDetailView;

