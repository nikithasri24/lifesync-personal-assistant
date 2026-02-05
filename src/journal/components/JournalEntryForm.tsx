import React, { type FormEvent, useEffect, useRef, useCallback } from 'react';
import { Plus, NotebookPen, Edit2, Mic, MicOff, AlertCircle } from 'lucide-react';
import { RichTextEditor } from '../../components/RichTextEditor';
import { JournalAttachmentUpload } from './JournalAttachmentUpload';
import { JournalAttachmentList } from './JournalAttachmentList';
import { useVoiceToText } from '../hooks/useVoiceToText';
import type { Attachment } from '../../types';

type JournalDraft = {
  title: string;
  content: string;
  tags: string;
  attachments: Attachment[];
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
}: JournalEntryFormProps): React.ReactElement {
  const {
    isSupported: isVoiceSupported,
    isRecording,
    transcript,
    error: voiceError,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useVoiceToText();

  // Use ref to access current draft without adding to dependencies
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Use ref for onDraftChange to avoid dependency issues
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;

  // Append transcript to content when voice recognition produces text
  useEffect(() => {
    if (transcript) {
      // Wrap in paragraph tags for TipTap
      const currentDraft = draftRef.current;
      const newContent = currentDraft.content
        ? `${currentDraft.content}<p>${transcript}</p>`
        : `<p>${transcript}</p>`;
      onDraftChangeRef.current({ ...currentDraft, content: newContent });
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  // Use ref for form to programmatically submit
  const formRef = useRef<HTMLFormElement>(null);

  // Refs for cancel handler to avoid recreating keyboard handler
  const onCancelEditRef = useRef(onCancelEdit);
  onCancelEditRef.current = onCancelEdit;
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;

  // Helper to check for actual text content (strips HTML tags)
  const hasTextContent = (html: string): boolean => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return !!(doc.body.textContent?.trim());
  };

  // Keyboard shortcuts: Cmd/Ctrl+Enter to save, Escape to cancel
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Cmd/Ctrl+Enter to submit (only if there's actual text content)
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      // Only submit if there's actual text content (not just empty HTML)
      if (formRef.current && hasTextContent(draftRef.current.content)) {
        formRef.current.requestSubmit();
      }
    }

    // Escape to cancel edit (only when editing an existing entry)
    if (event.key === 'Escape' && editingIdRef.current) {
      event.preventDefault();
      onCancelEditRef.current();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm" data-testid="journal-entry-form">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <NotebookPen className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {editingId ? 'Edit entry' : 'New entry'}
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {/* Title - Full Width */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-white">Title</span>
          <input
            value={draft.title}
            onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="A quick headline for the day"
            data-testid="journal-form-title"
          />
        </label>

        {/* Tags */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-white">Tags</span>
          <input
            value={draft.tags}
            onChange={(event) => onDraftChange({ ...draft, tags: event.target.value })}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Creativity, focus, gratitude"
            data-testid="journal-form-tags"
          />
        </label>

        {/* What happened - Full Width */}
        <div className="flex flex-col gap-1 text-sm" data-testid="journal-form-content-label">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-white">What happened?</span>
            {isVoiceSupported && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isSubmitting}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition ${
                  isRecording
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording'}
                data-testid="journal-form-voice-btn"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Voice Input
                  </>
                )}
              </button>
            )}
          </div>
          <RichTextEditor
            content={draft.content}
            onChange={(content) => onDraftChange({ ...draft, content })}
            placeholder="Capture highlights, lessons, or anything noteworthy"
            disabled={isSubmitting}
          />
          {isRecording && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                Listening... speak now
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Say "<span className="font-medium">that's it for today</span>" or "<span className="font-medium">stop recording</span>" when done
              </div>
            </div>
          )}
          {voiceError && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {voiceError}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="space-y-3" data-testid="journal-form-attachments-section">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachments</span>
          <JournalAttachmentUpload
            onAttachmentAdd={(attachment) =>
              onDraftChange({ ...draft, attachments: [...draft.attachments, attachment] })
            }
          />
          <JournalAttachmentList
            attachments={draft.attachments}
            onRemove={(id) =>
              onDraftChange({
                ...draft,
                attachments: draft.attachments.filter((a) => a.id !== id),
              })
            }
          />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={editingId ? 'Update entry' : 'Save entry'}
            data-testid="journal-form-submit"
          >
            {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isSubmitting ? 'Saving...' : editingId ? 'Update entry' : 'Save entry'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-full border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Cancel editing"
              data-testid="journal-form-cancel"
            >
              Cancel
            </button>
          )}
          {!editingId && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Clear entry form"
              data-testid="journal-form-clear"
            >
              Clear
            </button>
          )}
        </div>
        {/* Keyboard shortcut hints */}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono">⌘/Ctrl+Enter</kbd>
          <span className="ml-1">to save</span>
          {editingId && (
            <>
              <span className="mx-2">•</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 font-mono">Esc</kbd>
              <span className="ml-1">to cancel</span>
            </>
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
