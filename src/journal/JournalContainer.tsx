/**
 * Journal Container
 *
 * Main orchestrator component for the journal feature.
 * Uses React Query for server state management with automatic caching.
 * Uses useJournalFilters hook for filter state management.
 */

import React, { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, CalendarDays } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { JournalEntry } from '../types';
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../hooks/useJournalQuery';
import { JournalSearchBar } from './components/JournalSearchBar';
import { JournalHeader } from './components/JournalHeader';
import { JournalEntryForm, type JournalDraft } from './components/JournalEntryForm';
import { JournalEntriesList } from './components/JournalEntriesList';
import { JournalCalendarView } from './components/JournalCalendarView';
import { JournalPagination } from './components/JournalPagination';
import { useJournalFilters } from './hooks/useJournalFilters';
import { useComposedStore } from '@/stores/useComposedStore';

// Pagination constant
const ENTRIES_PER_PAGE = 3;

// localStorage key for auto-saving drafts
const DRAFT_STORAGE_KEY = 'lifesync-journal-draft';

const createDraft = (): JournalDraft => ({
  title: '',
  content: '',
  tags: '',
  attachments: [],
});

// Helper to strip HTML tags and check for actual text content
const getTextContent = (html: string): string => {
  // Remove HTML tags and decode entities
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

// Helper to check if draft has content worth saving
const hasDraftContent = (draft: JournalDraft): boolean => {
  return !!(draft.title.trim() || getTextContent(draft.content) || draft.tags.trim() || draft.attachments.length > 0);
};

export const JournalContainer: React.FC = () => {
  // View mode, pagination, and selected date from Zustand
  // Using useShallow to prevent infinite loops from object reference changes
  const {
    journalViewMode,
    journalSelectedDate,
    journalCurrentPage,
    setJournalViewMode,
    setJournalSelectedDate,
    setJournalCurrentPage,
  } = useComposedStore(
    useShallow((state) => ({
      journalViewMode: state.journalViewMode,
      journalSelectedDate: state.journalSelectedDate,
      journalCurrentPage: state.journalCurrentPage,
      setJournalViewMode: state.setJournalViewMode,
      setJournalSelectedDate: state.setJournalSelectedDate,
      setJournalCurrentPage: state.setJournalCurrentPage,
    }))
  );

  // Filter state from custom hook (eliminates local state for filters)
  const {
    searchQuery,
    selectedTags,
    showFilters,
    hasActiveFilters,
    filters,
    dateRange,
    setSearchQuery,
    toggleTagFilter,
    setShowFilters,
    setDateRange,
    clearFilters,
    getAvailableTags,
  } = useJournalFilters();

  // React Query hooks - automatic loading and caching
  const { data: entries = [], isLoading, error } = useJournalEntries(filters);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  // Type the entries array explicitly to avoid unsafe call errors
  const typedEntries = entries as JournalEntry[];

  // Pagination logic
  const totalPages = Math.ceil(typedEntries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const startIndex = journalCurrentPage * ENTRIES_PER_PAGE;
    return typedEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
  }, [typedEntries, journalCurrentPage]);

  // Form state - initialize from localStorage if available
  const [draft, setDraft] = useState<JournalDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the parsed object has expected shape
        if (parsed && typeof parsed === 'object' && 'title' in parsed && 'content' in parsed) {
          return parsed as JournalDraft;
        }
      }
    } catch (err) {
      console.error('[Journal] Failed to restore draft from localStorage:', err);
    }
    return createDraft();
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Auto-save draft to localStorage (only for new entries, not edits)
  useEffect(() => {
    if (!editingId && hasDraftContent(draft)) {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.error('[Journal] Failed to save draft to localStorage:', err);
      }
    } else if (!editingId && !hasDraftContent(draft)) {
      // Clear localStorage if draft is empty and not editing
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [draft, editingId]);

  // Handle ?edit=<id> query parameter from detail view
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && typedEntries.length > 0 && !editingId) {
      const entryToEdit = typedEntries.find((e) => e.id === editId);
      if (entryToEdit) {
        setDraft({
          title: entryToEdit.title,
          content: entryToEdit.content,
          tags: entryToEdit.tags.join(', '),
          attachments: entryToEdit.attachments || [],
        });
        setEditingId(entryToEdit.id);
        // Clear the query param so refreshing doesn't re-trigger edit
        setSearchParams({}, { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [searchParams, typedEntries, editingId, setSearchParams]);

  // Available tags from entries (using hook's helper)
  const availableTags = useMemo(() => getAvailableTags(typedEntries), [typedEntries, getAvailableTags]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // Check for actual text content (not just empty HTML tags like <p></p>)
    if (!getTextContent(draft.content)) return;

    const tags = draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const input = {
      title: draft.title.trim() || undefined,
      content: draft.content.trim(),
      tags,
      attachments: draft.attachments,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, updates: input },
        {
          onSuccess: () => {
            setDraft(createDraft());
            setEditingId(null);
            // Note: We don't clear localStorage on edit since we only save new entry drafts
          },
        }
      );
    } else {
      createMutation.mutate(input, {
        onSuccess: () => {
          setDraft(createDraft());
          // Clear auto-saved draft on successful save
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        },
      });
    }
  };

  const handleEdit = (entry: JournalEntry): void => {
    setDraft({
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      attachments: entry.attachments || [],
    });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = (): void => {
    setDraft(createDraft());
    setEditingId(null);
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
      },
    });
  };

  // Error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6" data-testid="journal-error">
        <JournalHeader />
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            Unable to load your journal entries. Please try refreshing the page.
          </p>
          <p className="text-xs text-red-600 mt-2">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Parse selected date from string
  const selectedDate = journalSelectedDate ? new Date(journalSelectedDate) : null;
  const handleSelectDate = (date: Date | null) => {
    setJournalSelectedDate(date ? date.toISOString() : null);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6" data-testid="journal-container">
      {/* Header with view mode toggle */}
      <div className="flex items-center justify-between">
        <JournalHeader />
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setJournalViewMode('list')}
            className={`p-2 rounded-md transition ${
              journalViewMode === 'list'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            aria-label="List view"
            data-testid="journal-view-list"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setJournalViewMode('calendar')}
            className={`p-2 rounded-md transition ${
              journalViewMode === 'calendar'
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            aria-label="Calendar view"
            data-testid="journal-view-calendar"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search and Filter Bar (only in list view) */}
      {journalViewMode === 'list' && (
        <JournalSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          selectedTags={selectedTags}
          hasActiveFilters={hasActiveFilters}
          availableTags={availableTags}
          toggleTagFilter={toggleTagFilter}
          clearFilters={clearFilters}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      )}

      {/* Entry Form (only in list view) */}
      {journalViewMode === 'list' && (
        <JournalEntryForm
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          onClear={() => {
            setDraft(createDraft());
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          }}
          onCancelEdit={handleCancelEdit}
          editingId={editingId}
          isSubmitting={isSubmitting}
          hasError={createMutation.isError || updateMutation.isError}
        />
      )}

      {/* View content based on mode */}
      {journalViewMode === 'list' ? (
        <>
          <JournalEntriesList
            entries={paginatedEntries}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            deleteConfirm={deleteConfirm}
            onEdit={handleEdit}
            onDeleteStart={setDeleteConfirm}
            onDeleteConfirm={handleDelete}
            onDeleteCancel={() => setDeleteConfirm(null)}
          />
          <JournalPagination
            currentPage={journalCurrentPage}
            totalPages={totalPages}
            onPageChange={setJournalCurrentPage}
          />
        </>
      ) : (
        <JournalCalendarView
          entries={typedEntries}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      )}
    </div>
  );
};

export default JournalContainer;

