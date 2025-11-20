/**
 * Goals and Dreams Page
 *
 * Migrated to use React Query for server state management
 * Before: Manual loading with useEffect and Zustand store
 * After: Automatic caching, loading, and refetching with React Query
 */

import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays } from 'date-fns';
import { Plus, Target, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { SkeletonCard } from '../components/LoadingSpinner';
import {
  useLifeGoals,
  useCreateLifeGoal,
  useUpdateLifeGoal,
  useDeleteLifeGoal,
  useLifeDreams,
  useCreateLifeDream,
  useUpdateLifeDream,
  useDeleteLifeDream,
} from '../hooks/useGoalsQuery';
import type { LifeGoal, LifeDream } from '../goals/types/lifeGoals';

const GOAL_CATEGORIES: LifeGoal['category'][] = ['personal', 'health', 'career', 'financial', 'fitness'];
const GOAL_PRIORITIES: LifeGoal['priority'][] = ['low', 'medium', 'high', 'critical'];

const DREAM_CATEGORIES: LifeDream['category'][] = ['travel', 'experiences', 'possessions', 'achievements', 'relationships', 'lifestyle'];
const DREAM_PRIORITIES: LifeDream['priority'][] = ['someday', 'within-5-years', 'within-10-years', 'lifetime'];
const DREAM_STATUSES: LifeDream['status'][] = ['dreaming', 'planning', 'in-progress', 'achieved', 'no-longer-interested'];

type GoalDraft = {
  title: string;
  description: string;
  category: LifeGoal['category'];
  priority: LifeGoal['priority'];
  targetDate: string;
};

type DreamDraft = {
  title: string;
  description: string;
  category: LifeDream['category'];
  priority: LifeDream['priority'];
  status: LifeDream['status'];
  estimatedCost: string;
  estimatedTimeframe: string;
};

const createGoalDraft = (): GoalDraft => ({
  title: '',
  description: '',
  category: 'personal',
  priority: 'medium',
  targetDate: addDays(new Date(), 30).toISOString().slice(0, 10),
});

const createDreamDraft = (): DreamDraft => ({
  title: '',
  description: '',
  category: 'travel',
  priority: 'someday',
  status: 'dreaming',
  estimatedCost: '',
  estimatedTimeframe: '',
});

const mapGoalDraftToCreateInput = (draft: GoalDraft) => {
  const targetDate = draft.targetDate ? new Date(draft.targetDate) : addDays(new Date(), 30);
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    priority: draft.priority,
    startDate: new Date().toISOString(),
    targetDate: targetDate.toISOString(),
    difficulty: 'medium' as const,
    currentValue: 0,
    targetValue: 100,
    unit: 'percent',
  };
};

const mapDreamDraftToCreateInput = (draft: DreamDraft) => {
  const estimatedCost = draft.estimatedCost.trim();
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    priority: draft.priority,
    status: draft.status,
    estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    estimatedTimeframe: draft.estimatedTimeframe.trim() || undefined,
  };
};

const EmptyState: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
      {icon ?? <Sparkles className="h-6 w-6" />}
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

const Goals: React.FC = () => {
  // React Query hooks - automatic loading and caching
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useLifeGoals();
  const { data: dreams = [], isLoading: dreamsLoading, error: dreamsError } = useLifeDreams();

  const createGoalMutation = useCreateLifeGoal();
  const updateGoalMutation = useUpdateLifeGoal();
  const deleteGoalMutation = useDeleteLifeGoal();

  const createDreamMutation = useCreateLifeDream();
  const updateDreamMutation = useUpdateLifeDream();
  const deleteDreamMutation = useDeleteLifeDream();

  const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(createGoalDraft);
  const [dreamDraft, setDreamDraft] = useState<DreamDraft>(createDreamDraft);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDreamForm, setShowDreamForm] = useState(false);

  const goalStats = useMemo(() => {
    const completed = goals.filter((goal) => goal.status === 'completed').length;
    const inProgress = goals.filter((goal) => goal.status === 'in-progress').length;
    return {
      total: goals.length,
      completed,
      inProgress,
    };
  }, [goals]);

  const dreamStats = useMemo(() => {
    const achieved = dreams.filter((dream) => dream.status === 'achieved').length;
    return {
      total: dreams.length,
      achieved,
    };
  }, [dreams]);

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goalDraft.title.trim()) return;

    createGoalMutation.mutate(mapGoalDraftToCreateInput(goalDraft), {
      onSuccess: () => {
        setGoalDraft(createGoalDraft());
        setShowGoalForm(false);
      },
    });
  };

  const handleDreamSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dreamDraft.title.trim()) return;

    createDreamMutation.mutate(mapDreamDraftToCreateInput(dreamDraft), {
      onSuccess: () => {
        setDreamDraft(createDreamDraft());
        setShowDreamForm(false);
      },
    });
  };

  const renderGoalList = () => {
    // Show loading state
    if (goalsLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      );
    }

    // Show error state
    if (goalsError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Error loading goals. Please try refreshing the page.
          </p>
        </div>
      );
    }

    if (goals.length === 0) {
      return <EmptyState label="No goals yet. Start by creating one." icon={<Target className="h-6 w-6" />} />;
    }

    return (
      <ul className="space-y-3">
        {goals.map((goal) => (
          <li key={goal.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                <p className="text-xs text-slate-500">{goal.category} • {goal.priority}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateGoalMutation.mutate({
                    id: goal.id,
                    updates: {
                      status: 'completed',
                      progress: 100,
                      completedDate: new Date().toISOString(),
                    },
                  })}
                  disabled={updateGoalMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark complete
                </button>
                <button
                  type="button"
                  onClick={() => deleteGoalMutation.mutate(goal.id)}
                  disabled={deleteGoalMutation.isPending}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {goal.description && (
              <p className="text-sm text-slate-600">{goal.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Status: {goal.status}</span>
              <span>Progress: {goal.progress}%</span>
              {goal.targetDate && (
                <span>Target date: {new Date(goal.targetDate).toLocaleDateString()}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderDreamList = () => {
    // Show loading state
    if (dreamsLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      );
    }

    // Show error state
    if (dreamsError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Error loading dreams. Please try refreshing the page.
          </p>
        </div>
      );
    }

    if (dreams.length === 0) {
      return <EmptyState label="No dreams captured yet. Start with one aspiration." />;
    }

    return (
      <ul className="space-y-3">
        {dreams.map((dream) => (
          <li key={dream.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{dream.title}</p>
                <p className="text-xs text-slate-500">{dream.category} • {dream.priority}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateDreamMutation.mutate({
                    id: dream.id,
                    updates: {
                      status: 'achieved',
                      achievedAt: new Date().toISOString(),
                    },
                  })}
                  disabled={updateDreamMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Mark achieved
                </button>
                <button
                  type="button"
                  onClick={() => deleteDreamMutation.mutate(dream.id)}
                  disabled={deleteDreamMutation.isPending}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {dream.description && (
              <p className="text-sm text-slate-600">{dream.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Status: {dream.status}</span>
              {typeof dream.estimatedCost === 'number' && (
                <span>Estimated cost: ${dream.estimatedCost.toLocaleString()}</span>
              )}
              {dream.estimatedTimeframe && (
                <span>Timeframe: {dream.estimatedTimeframe}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Goals & Dreams</h1>
          <p className="text-sm text-slate-600">Track meaningful progress and celebrate future aspirations.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowGoalForm(true);
              setActiveTab('goals');
            }}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New goal
          </button>
          <button
            type="button"
            onClick={() => {
              setShowDreamForm(true);
              setActiveTab('dreams');
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4" />
            New dream
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goals</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{goalStats.total}</p>
          <p className="text-xs text-slate-500">{goalStats.completed} completed • {goalStats.inProgress} in progress</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dreams</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{dreamStats.total}</p>
          <p className="text-xs text-slate-500">{dreamStats.achieved} achieved</p>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('goals')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === 'goals' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Goals
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dreams')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === 'dreams' ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Dreams
        </button>
      </div>

      <section>
        {activeTab === 'goals' ? renderGoalList() : renderDreamList()}
      </section>

      {showGoalForm && (
        <form onSubmit={handleGoalSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create a goal</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input
                required
                value={goalDraft.title}
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Launch new product"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <select
                value={goalDraft.category}
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, category: event.target.value as Goal['category'] }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {GOAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Description</span>
              <textarea
                value={goalDraft.description}
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Why this goal matters and how you will tackle it"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Priority</span>
              <select
                value={goalDraft.priority}
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, priority: event.target.value as Goal['priority'] }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {GOAL_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Target date</span>
              <input
                type="date"
                value={goalDraft.targetDate}
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, targetDate: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <Target className="h-4 w-4" />
              Save goal
            </button>
            <button
              type="button"
              onClick={() => {
                setShowGoalForm(false);
                setGoalDraft(createGoalDraft());
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showDreamForm && (
        <form onSubmit={handleDreamSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Capture a dream</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input
                required
                value={dreamDraft.title}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Backpack through Europe"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <select
                value={dreamDraft.category}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, category: event.target.value as Dream['category'] }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {DREAM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Description</span>
              <textarea
                value={dreamDraft.description}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Why this dream is meaningful and what it looks like"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Priority</span>
              <select
                value={dreamDraft.priority}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, priority: event.target.value as Dream['priority'] }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {DREAM_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Status</span>
              <select
                value={dreamDraft.status}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, status: event.target.value as Dream['status'] }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {DREAM_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Estimated cost (optional)</span>
              <input
                type="number"
                min="0"
                value={dreamDraft.estimatedCost}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, estimatedCost: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="5000"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Timeframe (optional)</span>
              <input
                value={dreamDraft.estimatedTimeframe}
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, estimatedTimeframe: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Within 5 years"
              />
            </label>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              <Sparkles className="h-4 w-4" />
              Save dream
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDreamForm(false);
                setDreamDraft(createDreamDraft());
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Goals;
