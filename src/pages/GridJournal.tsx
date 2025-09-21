import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, NotebookPen } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { JournalEntry } from '../types';

type JournalDraft = {
  title: string;
  content: string;
  mood: JournalEntry['mood'];
  tags: string;
};

const MOOD_OPTIONS: JournalEntry['mood'][] = ['excellent', 'good', 'neutral', 'bad', 'terrible'];

const createDraft = (): JournalDraft => ({
  title: '',
  content: '',
  mood: 'neutral',
  tags: '',
});

const GridJournal: React.FC = () => {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useAppStore();
  const [draft, setDraft] = useState<JournalDraft>(createDraft);

  const sortedEntries = useMemo(
    () => [...journalEntries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [journalEntries],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim() && !draft.content.trim()) return;

    const tags = draft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    addJournalEntry({
      title: draft.title.trim() || 'Untitled entry',
      content: draft.content.trim(),
      mood: draft.mood,
      tags,
      attachments: [],
      weather: undefined,
      gratitude: undefined,
    });

    setDraft(createDraft());
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Grid Journal</h1>
        <p className="text-sm text-slate-600">Capture daily reflections with a lightweight journal that keeps the focus on consistency.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <NotebookPen className="h-5 w-5 text-indigo-500" />
          New entry
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="A quick headline for the day"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">What happened?</span>
            <textarea
              required
              value={draft.content}
              onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
              className="h-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Capture highlights, lessons, or anything noteworthy"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Mood</span>
            <select
              value={draft.mood}
              onChange={(event) => setDraft((prev) => ({ ...prev, mood: event.target.value as JournalEntry['mood'] }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {MOOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tags</span>
            <input
              value={draft.tags}
              onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Creativity, focus, gratitude"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Save entry
          </button>
          <button
            type="button"
            onClick={() => setDraft(createDraft())}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </form>

      <section className="space-y-3">
        {sortedEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No entries yet. Capture your first reflection above.
          </div>
        ) : (
          sortedEntries.map((entry) => (
            <article key={entry.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">{entry.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{format(entry.createdAt, 'PPpp')}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-medium capitalize text-slate-600">{entry.mood}</span>
                  {entry.tags.length > 0 && (
                    <span className="text-slate-500">#{entry.tags.join(' #')}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteJournalEntry(entry.id)}
                    className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{entry.content}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

export default GridJournal;
