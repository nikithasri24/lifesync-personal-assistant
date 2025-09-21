import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const Personal: React.FC = () => {
  const { goals, dreams, recipes, moodEntries } = useAppStore();

  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === 'completed'), [goals]);
  const achievedDreams = useMemo(() => dreams.filter((dream) => dream.status === 'achieved'), [dreams]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Personal hub</h1>
          <p className="text-sm text-slate-600">A single snapshot of the milestones and rituals that make life feel balanced.</p>
        </div>
        <div className="rounded-full bg-indigo-50 p-3 text-indigo-500">
          <Sparkles className="h-5 w-5" />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goals</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{completedGoals.length} completed</p>
          <p className="text-xs text-slate-500">{goals.length - completedGoals.length} still in motion</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dreams</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{achievedDreams.length} achieved</p>
          <p className="text-xs text-slate-500">{dreams.length} kept alive</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipes saved</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{recipes.length}</p>
          <p className="text-xs text-slate-500">Perfect for the next meal plan</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent moods</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{moodEntries.length}</p>
          <p className="text-xs text-slate-500">Keep tracking to spot trends</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Why this matters</h2>
        <p className="mt-3 text-sm text-slate-600">
          LifeSync keeps fragments of personal growth—habits, food, memories, ambitions—in one calm place. The more you capture,
          the easier it becomes to notice what energises you and what deserves attention next.
        </p>
      </section>
    </div>
  );
};

export default Personal;
