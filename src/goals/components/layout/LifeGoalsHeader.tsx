import React from 'react';
import { Plus, Sparkles, Lightbulb } from 'lucide-react';

interface LifeGoalsHeaderProps {
  onShowTemplates: () => void;
  onNewGoal: () => void;
  onNewDream: () => void;
}

/**
 * Header for Goals & Dreams page with action buttons
 */
export function LifeGoalsHeader({
  onShowTemplates,
  onNewGoal,
  onNewDream,
}: LifeGoalsHeaderProps): React.ReactElement {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Goals & Dreams</h1>
        <p className="text-sm text-slate-600">Track meaningful progress and celebrate future aspirations.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onShowTemplates}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-700 hover:to-indigo-700"
          aria-label="Browse goal templates"
        >
          <Lightbulb className="h-4 w-4" />
          Browse Templates
        </button>
        <button
          type="button"
          onClick={onNewGoal}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          aria-label="Create new goal"
        >
          <Plus className="h-4 w-4" />
          New goal
        </button>
        <button
          type="button"
          onClick={onNewDream}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          aria-label="Create new dream"
        >
          <Sparkles className="h-4 w-4" />
          New dream
        </button>
      </div>
    </header>
  );
}
