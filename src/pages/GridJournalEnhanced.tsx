/**
 * Grid Journal Enhanced
 *
 * Migrated to use React Query for server state management
 * Before: Manual loading with useEffect and state management
 * After: Automatic caching, loading, and refetching with React Query
 */

import React, { useMemo, useState, type FormEvent } from 'react';
import type { JournalEntry, JournalMood } from '../types';
import type { JournalEntryFilters } from '../api/journalAPI';
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../hooks/useJournalQuery';
import { JournalSearchBar } from './components/JournalSearchBar';
import { JournalHeader } from '../journal/components/JournalHeader';
import { JournalEntryForm, type JournalDraft } from '../journal/components/JournalEntryForm';
import { JournalEntriesList } from '../journal/components/JournalEntriesList';

const MOOD_OPTIONS: JournalMood[] = ['excellent', 'good', 'neutral', 'bad', 'terrible'];

const MOOD_COLORS: Record<JournalMood, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  neutral: 'bg-slate-100 text-slate-800',
  bad: 'bg-orange-100 text-orange-800',
  terrible: 'bg-red-100 text-red-800',
};

const createDraft = (): JournalDraft => ({
  title: '',
  content: '',
  mood: 'neutral',
  tags: '',
});

const GridJournalEnhanced: React.FC = () => {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<JournalMood[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Build filters object for React Query
  const buildFilters = (
    searchQuery: string,
    selectedMoods: JournalMood[],
    selectedTags: string[]
  ): JournalEntryFilters | undefined => {
    const filters: Partial<JournalEntryFilters> = {};

    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }
    if (selectedMoods.length > 0) {
      filters.moods = selectedMoods;
    }
    if (selectedTags.length > 0) {
      filters.tags = selectedTags;
    }

    return Object.keys(filters).length > 0
      ? filters
      : undefined;
  };

  const filters: JournalEntryFilters | undefined = useMemo(
    () => buildFilters(searchQuery, selectedMoods, selectedTags),
    [searchQuery, selectedMoods, selectedTags]
  );

  // React Query hooks - automatic loading and caching
  const { data: entries = [], isLoading, error } = useJournalEntries(filters);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  // Type the entries array explicitly to avoid unsafe call errors
  const typedEntries = entries as JournalEntry[];

  // Form state
  const [draft, setDraft] = useState<JournalDraft>(createDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Available tags from entries
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    typedEntries.forEach((entry: JournalEntry) => {
      entry.tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [typedEntries]);

  const toggleMoodFilter = (mood: JournalMood): void => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const toggleTagFilter = (tag: string): void => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = (): void => {
    setSearchQuery('');
    setSelectedMoods([]);
    setSelectedTags([]);
  };

  const hasActiveFilters = Boolean(searchQuery) || selectedMoods.length > 0 || selectedTags.length > 0;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!draft.content.trim()) return;

    const tags = draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const input = {
      title: draft.title.trim() || undefined,
      content: draft.content.trim(),
      mood: draft.mood,
      tags,
    };

    if (editingId) {
      // Update existing entry
      updateMutation.mutate(
        { id: editingId, updates: input },
        {
          onSuccess: () => {
            setDraft(createDraft());
            setEditingId(null);
          },
        }
      );
    } else {
      // Create new entry
      createMutation.mutate(input, {
        onSuccess: () => {
          setDraft(createDraft());
        },
      });
    }
  };

  const handleEdit = (entry: JournalEntry): void => {
    setDraft({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags.join(', '),
    });
    setEditingId(entry.id);
    // Scroll to form
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
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <JournalHeader />

      {/* Search and Filter Bar */}
      <JournalSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedMoods={selectedMoods}
        selectedTags={selectedTags}
        hasActiveFilters={hasActiveFilters}
        MOOD_OPTIONS={MOOD_OPTIONS}
        availableTags={availableTags}
        toggleMoodFilter={toggleMoodFilter}
        toggleTagFilter={toggleTagFilter}
        clearFilters={clearFilters}
        MOOD_COLORS={MOOD_COLORS}
      />

      {/* Entry Form */}
      <JournalEntryForm
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        onClear={() => setDraft(createDraft())}
        onCancelEdit={handleCancelEdit}
        editingId={editingId}
        isSubmitting={isSubmitting}
        hasError={createMutation.isError || updateMutation.isError}
        moodOptions={MOOD_OPTIONS}
      />

      {/* Entries List */}
      <JournalEntriesList
        entries={typedEntries}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        deleteConfirm={deleteConfirm}
        moodColors={MOOD_COLORS}
        onEdit={handleEdit}
        onDeleteStart={setDeleteConfirm}
        onDeleteConfirm={handleDelete}
        onDeleteCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default GridJournalEnhanced;
