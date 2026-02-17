/**
 * Journal Container
 *
 * Main orchestrator component for the journal feature.
 * Uses React Query for server state management with automatic caching.
 * Uses useJournalFilters hook for filter state management.
 */

import React, { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { logger } from '../services/logger';
import type { JournalEntry } from '../types';
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../hooks/useJournalQuery';
import { JournalEntryForm, type JournalDraft } from './components/JournalEntryForm';
import { useJournalFilters } from './hooks/useJournalFilters';
import { useJournalState, type JournalTabView } from './hooks';
import { EntriesView, CalendarTabView, InsightsView, TagsView } from './components/views';
import { useComposedStore } from '@/stores/useComposedStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

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
  const colors = useThemeColors();

  // Tab navigation
  const { activeTab, setActiveTab } = useJournalState();

  // Pagination and selected date from Zustand
  // Using useShallow to prevent infinite loops from object reference changes
  const {
    journalSelectedDate,
    journalCurrentPage,
    setJournalSelectedDate,
    setJournalCurrentPage,
  } = useComposedStore(
    useShallow((state) => ({
      journalSelectedDate: state.journalSelectedDate,
      journalCurrentPage: state.journalCurrentPage,
      setJournalSelectedDate: state.setJournalSelectedDate,
      setJournalCurrentPage: state.setJournalCurrentPage,
    }))
  );

  // Form visibility state - defaults to false, shows on FAB click or when editing
  const [showForm, setShowForm] = useState(false);

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
      logger.error('Journal', err instanceof Error ? err : new Error(String(err)), { context: 'restoreDraft' });
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
        logger.error('Journal', err instanceof Error ? err : new Error(String(err)), { context: 'saveDraft' });
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
    setShowForm(false);
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
      <div className="mx-auto flex max-w-4xl flex-col" data-testid="journal-error">
        <JournalHeader />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Unable to load your journal entries. Please try refreshing the page.
            </p>
            <p className="text-xs text-red-600 mt-2">{errorMessage}</p>
          </div>
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
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }} data-testid="journal-container">
      {/* Header with Logo and Title */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: colors.bg.primary }}>
        <div className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={24} style={{ color: colors.accent.start }} />
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              Journal
            </h1>
          </div>

          {/* Tab Navigation */}
          <SegmentedControl
            segments={[
              { value: 'entries', label: 'Entries' },
              { value: 'calendar', label: 'Calendar' },
              { value: 'insights', label: 'Insights' },
              { value: 'tags', label: 'Tags' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as JournalTabView)}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {activeTab === 'entries' && (
          <EntriesView
            paginatedEntries={paginatedEntries}
            isLoading={isLoading}
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
            showForm={showForm}
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            onClear={() => {
              setDraft(createDraft());
              localStorage.removeItem(DRAFT_STORAGE_KEY);
              setShowForm(false);
            }}
            onCancelEdit={handleCancelEdit}
            editingId={editingId}
            isSubmitting={isSubmitting}
            hasError={createMutation.isError || updateMutation.isError}
            deleteConfirm={deleteConfirm}
            onEdit={handleEdit}
            onDeleteStart={setDeleteConfirm}
            onDeleteConfirm={handleDelete}
            onDeleteCancel={() => setDeleteConfirm(null)}
            currentPage={journalCurrentPage}
            totalPages={totalPages}
            onPageChange={setJournalCurrentPage}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTabView
            entries={typedEntries}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        )}

        {activeTab === 'insights' && <InsightsView />}

        {activeTab === 'tags' && <TagsView />}
      </div>

      {/* FAB (Floating Action Button) - only in entries tab and when not editing */}
      {activeTab === 'entries' && !editingId && (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed z-50 rounded-full flex items-center justify-center text-white text-3xl font-light shadow-lg hover:scale-105 active:scale-95 transition-transform"
          style={{
            bottom: '80px',
            right: '24px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
          }}
          aria-label="Create new journal entry"
          data-testid="journal-fab"
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default JournalContainer;

