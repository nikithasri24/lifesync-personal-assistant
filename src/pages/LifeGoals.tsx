import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Target, Trash2, CheckCircle2, Sparkles, TrendingUp, Edit3, Lightbulb } from 'lucide-react';
import {
  getUserLifeGoals,
  getUserLifeDreams,
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
  createLifeDream,
  updateLifeDream,
  deleteLifeDream,
  getLifeGoalById,
} from '../goals/api/lifeGoalsAPI';
import type {
  LifeGoal,
  LifeDream,
  GoalCategory,
  GoalPriority,
  DreamCategory,
  DreamPriority,
  DreamStatus,
  LifeGoalWithMilestones,
} from '../goals/types/lifeGoals';
import GoalTemplates from '../goals/components/GoalTemplates';

const GOAL_CATEGORIES: GoalCategory[] = ['personal', 'health', 'career', 'financial', 'fitness'];
const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high', 'critical'];

const DREAM_CATEGORIES: DreamCategory[] = ['travel', 'experiences', 'possessions', 'achievements', 'relationships', 'lifestyle'];
const DREAM_PRIORITIES: DreamPriority[] = ['someday', 'within-5-years', 'within-10-years', 'lifetime'];
const DREAM_STATUSES: DreamStatus[] = ['dreaming', 'planning', 'in-progress', 'achieved', 'no-longer-interested'];

type GoalDraft = {
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate: string;
};

type DreamDraft = {
  title: string;
  description: string;
  category: DreamCategory;
  priority: DreamPriority;
  status: DreamStatus;
  estimatedCost: string;
  estimatedTimeframe: string;
};

const createGoalDraft = (): GoalDraft => ({
  title: '',
  description: '',
  category: 'personal',
  priority: 'medium',
  targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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

const EmptyState: React.FC<{ label: string; icon?: React.ReactNode }> = ({ label, icon }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
      {icon ?? <Sparkles className="h-6 w-6" />}
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

const LifeGoals: React.FC = () => {
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [dreams, setDreams] = useState<LifeDream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(createGoalDraft);
  const [dreamDraft, setDreamDraft] = useState<DreamDraft>(createDreamDraft);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDreamForm, setShowDreamForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);

  // Load goals and dreams on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [goalsData, dreamsData] = await Promise.all([
          getUserLifeGoals(),
          getUserLifeDreams(),
        ]);
        setGoals(goalsData);
        setDreams(dreamsData);
      } catch (error) {
        console.error('Error loading goals/dreams:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  const handleGoalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goalDraft.title.trim()) return;

    try {
      const newGoal = await createLifeGoal({
        title: goalDraft.title,
        description: goalDraft.description,
        category: goalDraft.category,
        priority: goalDraft.priority,
        targetDate: goalDraft.targetDate,
        startDate: new Date().toISOString(),
      });
      setGoals(prev => [newGoal, ...prev]);
      setGoalDraft(createGoalDraft());
      setShowGoalForm(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleDreamSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dreamDraft.title.trim()) return;

    try {
      const newDream = await createLifeDream({
        title: dreamDraft.title,
        description: dreamDraft.description,
        category: dreamDraft.category,
        priority: dreamDraft.priority,
        estimatedCost: dreamDraft.estimatedCost ? Number(dreamDraft.estimatedCost) : undefined,
        estimatedTimeframe: dreamDraft.estimatedTimeframe || undefined,
      });
      setDreams(prev => [newDream, ...prev]);
      setDreamDraft(createDreamDraft());
      setShowDreamForm(false);
    } catch (error) {
      console.error('Error creating dream:', error);
      alert('Failed to create dream. Please try again.');
    }
  };

  const handleMarkGoalComplete = async (goalId: string) => {
    try {
      const updatedGoal = await updateLifeGoal(goalId, {
        status: 'completed',
        progress: 100,
        completedDate: new Date().toISOString(),
      });
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteLifeGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const handleMarkDreamAchieved = async (dreamId: string) => {
    try {
      const updatedDream = await updateLifeDream(dreamId, {
        status: 'achieved',
        achievedAt: new Date().toISOString(),
      });
      setDreams(prev => prev.map(d => d.id === dreamId ? updatedDream : d));
    } catch (error) {
      console.error('Error updating dream:', error);
      alert('Failed to update dream. Please try again.');
    }
  };

  const handleDeleteDream = async (dreamId: string) => {
    if (!confirm('Are you sure you want to delete this dream?')) return;

    try {
      await deleteLifeDream(dreamId);
      setDreams(prev => prev.filter(d => d.id !== dreamId));
    } catch (error) {
      console.error('Error deleting dream:', error);
      alert('Failed to delete dream. Please try again.');
    }
  };

  const handleUpdateProgress = async (goalId: string) => {
    try {
      const updatedGoal = await updateLifeGoal(goalId, {
        progress: progressValue,
        status: progressValue === 100 ? 'completed' : progressValue > 0 ? 'in-progress' : 'not-started',
        completedDate: progressValue === 100 ? new Date().toISOString() : undefined,
      });
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      setEditingProgress(null);
      setProgressValue(0);
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  const handleStartEditProgress = (goalId: string, currentProgress: number) => {
    setEditingProgress(goalId);
    setProgressValue(currentProgress);
  };

  const handleGoalCreatedFromTemplate = (goal: LifeGoalWithMilestones) => {
    setGoals(prev => [goal, ...prev]);
    setShowTemplates(false);
  };

  const renderGoalList = () => {
    if (goals.length === 0) {
      return <EmptyState label="No goals yet. Start by creating one." icon={<Target className="h-6 w-6" />} />;
    }

    return (
      <ul className="space-y-3">
        {goals.map((goal) => (
          <li key={goal.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                <p className="text-xs text-slate-500">{goal.category} • {goal.priority}</p>
              </div>
              <div className="flex items-center gap-2">
                {goal.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleMarkGoalComplete(goal.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {goal.description && (
              <p className="text-sm text-slate-600">{goal.description}</p>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Progress</span>
                <span className="text-slate-700 font-semibold">{goal.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {/* Progress editor */}
              {editingProgress === goal.id ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => setProgressValue(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-slate-700 w-12">{progressValue}%</span>
                  <button
                    onClick={() => handleUpdateProgress(goal.id)}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingProgress(null);
                      setProgressValue(0);
                    }}
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEditProgress(goal.id, goal.progress)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Edit3 className="h-3 w-3" />
                  Update progress
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Status: {goal.status}
              </span>
              {goal.targetDate && (
                <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderDreamList = () => {
    if (dreams.length === 0) {
      return <EmptyState label="No dreams captured yet. Start with one aspiration." />;
    }

    return (
      <ul className="space-y-3">
        {dreams.map((dream) => (
          <li key={dream.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{dream.title}</p>
                <p className="text-xs text-slate-500">{dream.category} • {dream.priority}</p>
              </div>
              <div className="flex items-center gap-2">
                {dream.status !== 'achieved' && (
                  <button
                    type="button"
                    onClick={() => handleMarkDreamAchieved(dream.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                  >
                    <Sparkles className="h-4 w-4" />
                    Achieved
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteDream(dream.id)}
                  className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
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
                <span>Cost: ${dream.estimatedCost.toLocaleString()}</span>
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

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 p-6 min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-600">Loading your goals...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Goals & Dreams</h1>
          <p className="text-sm text-slate-600">Track meaningful progress and celebrate future aspirations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-700 hover:to-indigo-700"
          >
            <Lightbulb className="h-4 w-4" />
            Browse Templates
          </button>
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
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, category: event.target.value as GoalCategory }))}
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
                onChange={(event) => setGoalDraft((prev) => ({ ...prev, priority: event.target.value as GoalPriority }))}
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
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, category: event.target.value as DreamCategory }))}
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
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, priority: event.target.value as DreamPriority }))}
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
                onChange={(event) => setDreamDraft((prev) => ({ ...prev, status: event.target.value as DreamStatus }))}
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

      {/* Goal Templates Modal */}
      {showTemplates && (
        <GoalTemplates
          onGoalCreated={handleGoalCreatedFromTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default LifeGoals;
