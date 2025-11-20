/**
 * Mood Page - Migrated to React Query
 *
 * Before: Used Zustand store with manual state management
 * After: Uses React Query hooks for automatic caching and updates
 */

import { FormEvent, useState } from 'react';
import { SmilePlus, Trash2 } from 'lucide-react';
import { SkeletonCard } from '../components/LoadingSpinner';
import { useMoodEntries, useCreateMoodEntry, useDeleteMoodEntry } from '../hooks/useMoodQuery';
import type { JournalMood } from '../types';

const MOOD_OPTIONS: { value: JournalMood; label: string; emoji: string }[] = [
  { value: 'excellent', label: 'Excellent', emoji: '🌈' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'bad', label: 'Tough', emoji: '🌧️' },
  { value: 'terrible', label: 'Drained', emoji: '☔️' },
];

const Mood: React.FC = () => {
  // React Query hooks - automatic loading, caching, and refetching
  const { data: moodEntries = [], isLoading, error } = useMoodEntries();
  const createMutation = useCreateMoodEntry();
  const deleteMutation = useDeleteMoodEntry();

  // Form state (client-only)
  const [mood, setMood] = useState<JournalMood>('good');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createMutation.mutate(
      {
        mood,
        energy,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset form on success
          setNotes('');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Error state
  if (error) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Mood check-in</h1>
          <p className="text-sm text-red-600">
            Error loading mood entries: {error.message}
          </p>
        </header>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Mood Entries</h3>
          <p className="text-sm text-red-700 mb-4">
            Unable to load your mood entries. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Mood check-in</h1>
          <p className="text-sm text-slate-600">Loading your mood entries...</p>
        </header>
        <SkeletonCard className="h-64" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Mood check-in</h1>
        <p className="text-sm text-slate-600">
          Track how you feel to spot patterns and celebrate the good days. Entries stay private and help your future self.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <SmilePlus className="h-5 w-5 text-amber-500" />
          How are you today?
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Mood</span>
            <select
              value={mood}
              onChange={(event) => setMood(event.target.value as JournalMood)}
              disabled={createMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {MOOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Energy</span>
            <select
              value={energy}
              onChange={(event) => setEnergy(event.target.value as typeof energy)}
              disabled={createMutation.isPending}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Balanced</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Wins, challenges, triggers, anything worth remembering"
              disabled={createMutation.isPending}
              className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Saving...' : 'Save entry'}
          </button>
          {createMutation.isError && (
            <p className="mt-2 text-sm text-red-600">
              Error saving mood entry. Please try again.
            </p>
          )}
        </div>
      </form>

      <section className="space-y-3">
        {moodEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No mood entries yet. Log how you feel above.
          </div>
        ) : (
          moodEntries.map((entry) => {
            const option = MOOD_OPTIONS.find((item) => item.value === entry.mood);
            return (
              <article key={entry.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {option ? `${option.emoji} ${option.label}` : entry.mood}
                  </p>
                  <p className="text-xs text-slate-500">
                    Energy: {entry.energy} • {entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Just now'}
                  </p>
                  {entry.notes && <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id!)}
                  disabled={deleteMutation.isPending}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default Mood;
