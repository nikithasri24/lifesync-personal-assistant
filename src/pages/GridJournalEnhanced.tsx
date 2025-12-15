/**
 * Grid Journal Enhanced
 *
 * Migrated to use React Query for server state management
 * Before: Manual loading with useEffect and state management
 * After: Automatic caching, loading, and refetching with React Query
 */

import React, { useMemo, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, NotebookPen, Edit2 } from 'lucide-react';
import type { JournalEntry, JournalMood } from '../types';
import type { JournalEntryFilters } from '../api/journalAPI';
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../hooks/useJournalQuery';
import { JournalSearchBar } from './components/JournalSearchBar';
import { RichTextEditor } from '../components/RichTextEditor';

type JournalDraft = {
  title: string;
  content: string;
  mood: JournalMood;
  tags: string;
};

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
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Journal</h1>
          <p className="text-sm text-red-600">
            Error loading journal entries: {errorMessage}
          </p>
        </header>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            Unable to load your journal entries. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Journal</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Capture daily reflections with mood tracking and tags
        </p>
      </header>

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
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
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
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
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
                onChange={(event) => setDraft((prev) => ({ ...prev, mood: event.target.value as JournalMood }))}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {MOOD_OPTIONS.map((option) => (
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
                onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
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
              onChange={(content) => setDraft((prev) => ({ ...prev, content }))}
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
                onClick={handleCancelEdit}
                className="rounded-full border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            )}
            {!editingId && (
              <button
                type="button"
                onClick={() => setDraft(createDraft())}
                className="rounded-full border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Clear
              </button>
            )}
          </div>
          {/* Mutation error messages */}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600">
              Error {editingId ? 'updating' : 'creating'} entry. Please try again.
            </p>
          )}
        </div>
      </form>

      {/* Entries List */}
      <section className="space-y-3">
        {isLoading ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
            Loading entries...
          </div>
        ) : typedEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
            {hasActiveFilters ? 'No entries match your filters.' : 'No entries yet. Capture your first reflection above.'}
          </div>
        ) : (
          typedEntries.map((entry: JournalEntry) => (
            <article key={entry.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{entry.title ?? 'Untitled'}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{format(entry.createdAt, 'PPpp')}</span>
                    <span className={`rounded-full px-2 py-1 font-medium capitalize ${MOOD_COLORS[entry.mood]}`}>
                      {entry.mood}
                    </span>
                    {entry.tags.length > 0 && (
                      <span className="text-slate-500 dark:text-slate-400">#{entry.tags.join(' #')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    className="rounded-full border border-slate-200 dark:border-slate-600 p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                    aria-label="Edit entry"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(entry.id)}
                    className="rounded-full border border-slate-200 dark:border-slate-600 p-1.5 text-slate-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                className="mt-3 prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: entry.content }}
              />

              {/* Delete Confirmation Dialog */}
              {deleteConfirm === entry.id && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">Are you sure you want to delete this entry?</p>
                  <p className="mt-1 text-xs text-red-700 dark:text-red-300">This action cannot be undone.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default React.memo(GridJournalEnhanced);