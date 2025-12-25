/**
 * Goals and Dreams Page
 *
 * Migrated to use React Query for server state management
 * Before: Manual loading with useEffect and Zustand store
 * After: Automatic caching, loading, and refetching with React Query
 */

/* eslint-disable max-lines */

import React, { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
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
import type { GoalDraft, DreamDraft } from '../goals/types/drafts';
import {
  createGoalDraft,
  createDreamDraft,
  mapGoalDraftToCreateInput,
  mapDreamDraftToCreateInput,
} from '../goals/services/goalHelpers';
import { PageLayoutV2 } from '../components/v2';
import { GoalsHeader } from '../goals/components/layout/GoalsHeader';
import { GoalsStatsGrid } from '../goals/components/layout/GoalsStatsGrid';
import { GoalsTabSwitcher } from '../goals/components/layout/GoalsTabSwitcher';
import { GoalsList } from '../goals/components/layout/GoalsList';
import { DreamsList } from '../goals/components/layout/DreamsList';
import { GoalForm } from '../goals/components/layout/GoalForm';
import { DreamForm } from '../goals/components/layout/DreamForm';

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

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!goalDraft.title.trim()) return;

    createGoalMutation.mutate(mapGoalDraftToCreateInput(goalDraft), {
      onSuccess: () => {
        setGoalDraft(createGoalDraft());
        setShowGoalForm(false);
      },
    });
  };

  const handleDreamSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!dreamDraft.title.trim()) return;

    createDreamMutation.mutate(mapDreamDraftToCreateInput(dreamDraft), {
      onSuccess: () => {
        setDreamDraft(createDreamDraft());
        setShowDreamForm(false);
      },
    });
  };

  const handleMarkGoalComplete = (goalId: string): void => {
    updateGoalMutation.mutate({
      id: goalId,
      updates: {
        status: 'completed',
        progress: 100,
        completedDate: new Date().toISOString(),
      },
    });
  };

  const handleDeleteGoal = (goalId: string): void => {
    deleteGoalMutation.mutate(goalId);
  };

  const handleMarkDreamAchieved = (dreamId: string): void => {
    updateDreamMutation.mutate({
      id: dreamId,
      updates: {
        status: 'achieved',
        achievedAt: new Date().toISOString(),
      },
    });
  };

  const handleDeleteDream = (dreamId: string): void => {
    deleteDreamMutation.mutate(dreamId);
  };

  return (
    <PageLayoutV2 maxWidth="xl" spacing="normal">
      <GoalsHeader
        onNewGoal={() => {
          setShowGoalForm(true);
          setActiveTab('goals');
        }}
        onNewDream={() => {
          setShowDreamForm(true);
          setActiveTab('dreams');
        }}
      />

      <GoalsStatsGrid goalStats={goalStats} dreamStats={dreamStats} />

      <GoalsTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      <section>
        {activeTab === 'goals' ? (
          <GoalsList
            goals={goals}
            isLoading={goalsLoading}
            error={goalsError}
            onMarkComplete={handleMarkGoalComplete}
            onDelete={handleDeleteGoal}
            isUpdating={updateGoalMutation.isPending}
            isDeleting={deleteGoalMutation.isPending}
          />
        ) : (
          <DreamsList
            dreams={dreams}
            isLoading={dreamsLoading}
            error={dreamsError}
            onMarkAchieved={handleMarkDreamAchieved}
            onDelete={handleDeleteDream}
            isUpdating={updateDreamMutation.isPending}
            isDeleting={deleteDreamMutation.isPending}
          />
        )}
      </section>

      {showGoalForm && (
        <GoalForm
          goalDraft={goalDraft}
          onDraftChange={(updates) => setGoalDraft((prev) => ({ ...prev, ...updates }))}
          onSubmit={handleGoalSubmit}
          onCancel={() => {
            setShowGoalForm(false);
            setGoalDraft(createGoalDraft());
          }}
        />
      )}

      {showDreamForm && (
        <DreamForm
          dreamDraft={dreamDraft}
          onDraftChange={(updates) => setDreamDraft((prev) => ({ ...prev, ...updates }))}
          onSubmit={handleDreamSubmit}
          onCancel={() => {
            setShowDreamForm(false);
            setDreamDraft(createDreamDraft());
          }}
        />
      )}
    </PageLayoutV2>
  );
};

export default Goals;
