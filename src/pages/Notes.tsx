/**
 * Notes Page
 *
 * Migrated to use React Query for server state management
 * Before: Used Zustand store with manual loading/caching
 * After: Uses React Query hooks for automatic caching and updates
 */

import { type FormEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useNotes, useCreateNote, useDeleteNote } from '../hooks/useNotesQuery';

const Notes: React.FC = () => {
  // React Query hooks - automatic loading, caching, and refetching
  const { data: notes, isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  // Form state (client-only)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!title.trim() && !content.trim()) return;

    // Use mutation instead of store action
    createMutation.mutate(
      {
        title: title.trim() || 'Untitled',
        content: content.trim(),
        tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
      },
      {
        onSuccess: () => {
          // Clear form on success
          setTitle('');
          setContent('');
          setTags('');
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
        <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
        <p className="text-sm text-slate-600">
          Capture quick ideas, meeting takeaways, or personal reflections.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-indigo-500" />
          Add a note
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Project kickoff"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={createMutation.isPending}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="work, planning"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={createMutation.isPending}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Details</span>
            <textarea
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Capture the important bits..."
              className="h-28 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={createMutation.isPending}
            />
          </label>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Saving...' : 'Save note'}
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No notes yet. Add your first one above.
          </div>
        ) : (
          notes?.map((note) => (
            <article
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {note.title}
                </p>
                <p className="text-xs text-slate-500">
                  Last updated {new Date(note.updatedAt).toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                  {note.content}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    #{note.tags.join(' #')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                disabled={deleteMutation.isPending}
                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default Notes;
