import { FormEvent, useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { SkeletonCard } from '../components/LoadingSpinner';

const Notes: React.FC = () => {
  const { notes, addNote, deleteNote, loadNotes, notesLoaded, notesLoading } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Lazy load notes when page mounts
  useEffect(() => {
    if (loadNotes && !notesLoaded && !notesLoading) {
      loadNotes();
    }
  }, [loadNotes, notesLoaded, notesLoading]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() && !content.trim()) return;
    addNote({ title: title.trim() || 'Untitled', content: content.trim(), tags: tags ? tags.split(',').map((tag) => tag.trim()) : [] });
    setTitle('');
    setContent('');
    setTags('');
  };

  // Show loading state while notes are loading
  if (notesLoading && !notesLoaded) {
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
        <p className="text-sm text-slate-600">Capture quick ideas, meeting takeaways, or personal reflections.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="work, planning"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
            />
          </label>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Save note
          </button>
        </div>
      </form>

      <section className="space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No notes yet. Add your first one above.
          </div>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                <p className="text-xs text-slate-500">Last updated {note.updatedAt.toLocaleString()}</p>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{note.content}</p>
                {note.tags.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">#{note.tags.join(' #')}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
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
