/**
 * Notes Page
 *
 * Migrated to use React Query for server state management
 * Extended to support list-type notes with checkable items
 */

import { type FormEvent, useState } from 'react';
import { Plus, List, FileText } from 'lucide-react';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useNotes, useCreateNote, useDeleteNote } from '../hooks/useNotesQuery';
import type { NoteType } from '../types';
import NoteCard from '../components/lists/NoteCard';

const Notes: React.FC = () => {
  // React Query hooks - automatic loading, caching, and refetching
  const { data: notes, isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  // Form state (client-only)
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!title.trim()) return;
    if (noteType === 'note' && !content.trim()) return;

    // Use mutation instead of store action
    createMutation.mutate(
      {
        title: title.trim() || 'Untitled',
        content: noteType === 'list' ? '' : content.trim(),
        tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
        noteType,
      },
      {
        onSuccess: () => {
          // Clear form on success
          setTitle('');
          setContent('');
          setTags('');
          setNoteType('note');
        },
      }
    );
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
  };

  // Error state
  if (error) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
          <p className="text-sm text-red-600">
            Error loading notes: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </header>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Unable to load your notes. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
          <p className="text-sm text-slate-600">Loading your notes...</p>
        </header>
        <SkeletonCard className="h-64" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Notes & Lists</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Capture quick notes or create trackable lists for movies, books, places, and more.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <Plus className="h-5 w-5 text-indigo-500" />
          Create New
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Note Type Selector */}
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Type</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNoteType('note')}
                disabled={createMutation.isPending}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  noteType === 'note'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="h-4 w-4" />
                Regular Note
              </button>
              <button
                type="button"
                onClick={() => setNoteType('list')}
                disabled={createMutation.isPending}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  noteType === 'list'
                    ? 'bg-indigo-600 text-white'
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
              onChange={(event) => setTitle(event.target.value)}
              placeholder={noteType === 'list' ? 'e.g., Movies to Watch, Books to Read' : 'Project kickoff'}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
              disabled={createMutation.isPending}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={noteType === 'list' ? 'movies, entertainment' : 'work, planning'}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
              disabled={createMutation.isPending}
            />
          </label>
          {noteType === 'note' && (
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">Details</span>
              <textarea
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Capture the important bits..."
                className="h-28 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
                disabled={createMutation.isPending}
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
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Creating...' : noteType === 'list' ? 'Create list' : 'Save note'}
          </button>
          {createMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              Error creating note. Please try again.
            </p>
          )}
        </div>
      </form>

      <section className="space-y-3">
        {notes && notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
            No notes or lists yet. Create your first one above!
          </div>
        ) : (
          notes?.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={() => handleDelete(note.id)}
            />
          ))
        )}
      </section>
    </div>
  );
};

export default Notes;
