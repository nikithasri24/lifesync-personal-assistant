import { FormEvent, useState } from 'react';
import { SmilePlus, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { JournalMood } from '../types';

const MOOD_OPTIONS: { value: JournalMood; label: string; emoji: string }[] = [
  { value: 'excellent', label: 'Excellent', emoji: '🌈' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'bad', label: 'Tough', emoji: '🌧️' },
  { value: 'terrible', label: 'Drained', emoji: '☔️' },
];

const Mood: React.FC = () => {
  const { moodEntries, addMoodEntry, deleteMoodEntry } = useAppStore();
  const [mood, setMood] = useState<JournalMood>('good');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addMoodEntry({ mood, energy, notes: notes.trim() || undefined });
    setNotes('');
  };

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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Save entry
          </button>
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
                    Energy: {entry.energy} • {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  {entry.notes && <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMoodEntry(entry.id)}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
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
