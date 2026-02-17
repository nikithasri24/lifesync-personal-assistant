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
import { useThemeColors } from '@/hooks/useThemeColors';

export const JournalDetailView: React.FC = () => {
  const colors = useThemeColors();
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
          <div className="h-8 rounded w-1/4" style={{ backgroundColor: colors.bg.tertiary }}></div>
          <div className="h-12 rounded w-3/4" style={{ backgroundColor: colors.bg.tertiary }}></div>
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: colors.bg.tertiary }}></div>
          <div className="h-64 rounded" style={{ backgroundColor: colors.bg.tertiary }}></div>
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
          className="inline-flex items-center gap-2 hover:opacity-70 mb-6 no-underline"
          style={{ color: colors.text.secondary }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Journal
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
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
        className="inline-flex items-center gap-2 hover:opacity-70 mb-6 no-underline"
        style={{ color: colors.text.secondary }}
        data-testid="journal-detail-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Journal
      </Link>

      {/* Entry card */}
      <article
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg.white,
          boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        }}
      >
        {/* Header */}
        <header className="px-6 py-5 border-b" style={{ borderColor: colors.border.light }}>
          <h1
            className="text-2xl font-extrabold mb-2"
            style={{ color: colors.text.primary }}
            data-testid="journal-detail-title"
          >
            {typedEntry.title || 'Untitled Entry'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: colors.text.tertiary }}>
            <span className="inline-flex items-center gap-1.5">
              📅 {format(new Date(typedEntry.createdAt), 'MMMM d, yyyy')}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              ⏰ {format(new Date(typedEntry.createdAt), 'h:mm a')}
            </span>
          </div>

          {/* Tags */}
          {typedEntry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" data-testid="journal-detail-tags">
              {typedEntry.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: colors.border.light,
                    color: colors.text.secondary,
                  }}
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
          className="px-6 py-6 prose max-w-none"
          style={{ color: colors.text.secondary }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(typedEntry.content) }}
          data-testid="journal-detail-content"
        />

        {/* Attachments */}
        {typedEntry.attachments && typedEntry.attachments.length > 0 && (
          <div className="px-6 py-4 border-t" style={{ borderColor: colors.border.light }}>
            <JournalAttachmentList attachments={typedEntry.attachments} readonly />
          </div>
        )}

        {/* Actions */}
        <footer className="px-6 py-4 border-t flex items-center gap-3" style={{ borderColor: colors.border.light }}>
          <button
            type="button"
            onClick={() => navigate(`/journal?edit=${typedEntry.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              color: 'white',
            }}
            data-testid="journal-detail-edit"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition hover:opacity-70"
              style={{
                backgroundColor: colors.border.light,
                color: colors.text.primary,
              }}
              data-testid="journal-detail-delete"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.text.secondary }}>Delete this entry?</span>
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
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition hover:opacity-70"
                style={{
                  backgroundColor: colors.border.light,
                  color: colors.text.primary,
                }}
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

