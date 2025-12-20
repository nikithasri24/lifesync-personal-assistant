/* eslint-disable max-lines */
import React, { useMemo, useState , type FormEvent } from 'react';
import {
  useLifeGoalsQuery,
  useLifeDreamsQuery,
  useCreateLifeGoalMutation,
  useUpdateLifeGoalMutation,
  useDeleteLifeGoalMutation,
  useCreateLifeDreamMutation,
  useUpdateLifeDreamMutation,
  useDeleteLifeDreamMutation,
} from '@/hooks/useLifeGoalsQuery';
import type {
  LifeGoal,
  LifeGoalWithMilestones,
  LifeGoalMilestone,
} from '../goals/types/lifeGoals';
import GoalTemplates from '../goals/components/GoalTemplates';
import GoalGamification from '../goals/components/GoalGamification';
import { logger } from '../services/logger';

// Import layout components
import { LifeGoalsHeader } from '../goals/components/layout/LifeGoalsHeader';
import { LifeGoalsLoadingState } from '../goals/components/layout/LifeGoalsLoadingState';
import { StatsCards } from '../goals/components/layout/StatsCards';
import { TabNavigation } from '../goals/components/layout/TabNavigation';
import { GoalList } from '../goals/components/layout/GoalList';
import { DreamList } from '../goals/components/layout/DreamList';
import { GoalFormModal, type GoalDraft } from '../goals/components/layout/GoalFormModal';
import { DreamFormModal, type DreamDraft } from '../goals/components/layout/DreamFormModal';

const createGoalDraft = (): GoalDraft => ({
  title: '',
  description: '',
  category: 'personal',
  priority: 'medium',
  targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  streakEnabled: false,
  streakFrequency: 'daily',
  streakTarget: '',
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

const LifeGoals: React.FC = () => {
  // React Query hooks
  const { data: goals = [], isLoading: goalsLoading } = useLifeGoalsQuery();
  const { data: dreams = [], isLoading: dreamsLoading } = useLifeDreamsQuery();
  const createGoalMutation = useCreateLifeGoalMutation();
  const updateGoalMutation = useUpdateLifeGoalMutation();
  const deleteGoalMutation = useDeleteLifeGoalMutation();
  const createDreamMutation = useCreateLifeDreamMutation();
  const updateDreamMutation = useUpdateLifeDreamMutation();
  const deleteDreamMutation = useDeleteLifeDreamMutation();

  const loading = goalsLoading || dreamsLoading;

  // UI state
  const [activeTab, setActiveTab] = useState<'goals' | 'dreams' | 'progress'>('goals');
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(createGoalDraft);
  const [dreamDraft, setDreamDraft] = useState<DreamDraft>(createDreamDraft);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDreamForm, setShowDreamForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [goalMilestones, setGoalMilestones] = useState<Record<string, LifeGoalMilestone[]>>({});

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

  const handleGoalSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!goalDraft.title.trim()) return;

    try {
      await createGoalMutation.mutateAsync({
        title: goalDraft.title,
        description: goalDraft.description,
        category: goalDraft.category,
        priority: goalDraft.priority,
        targetDate: goalDraft.targetDate,
        startDate: new Date().toISOString(),
        streakEnabled: goalDraft.streakEnabled,
        streakFrequency: goalDraft.streakFrequency,
        streakTarget: goalDraft.streakTarget ? Number(goalDraft.streakTarget) : undefined,
      });
      setGoalDraft(createGoalDraft());
      setShowGoalForm(false);
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleDreamSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!dreamDraft.title.trim()) return;

    try {
      await createDreamMutation.mutateAsync({
        title: dreamDraft.title,
        description: dreamDraft.description,
        category: dreamDraft.category,
        priority: dreamDraft.priority,
        estimatedCost: dreamDraft.estimatedCost ? Number(dreamDraft.estimatedCost) : undefined,
        estimatedTimeframe: dreamDraft.estimatedTimeframe || undefined,
      });
      setDreamDraft(createDreamDraft());
      setShowDreamForm(false);
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleMarkGoalComplete = async (goalId: string): Promise<void> => {
    try {
      await updateGoalMutation.mutateAsync({
        goalId,
        updates: {
          status: 'completed',
          progress: 100,
          completedDate: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleDeleteGoal = async (goalId: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      await deleteGoalMutation.mutateAsync(goalId);
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleMarkDreamAchieved = async (dreamId: string): Promise<void> => {
    try {
      await updateDreamMutation.mutateAsync({
        dreamId,
        updates: { status: 'achieved' },
      });
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleDeleteDream = async (dreamId: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this dream?')) return;

    try {
      await deleteDreamMutation.mutateAsync(dreamId);
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleUpdateProgress = async (goalId: string): Promise<void> => {
    try {
      await updateGoalMutation.mutateAsync({
        goalId,
        updates: { progress: progressValue },
      });
      setEditingProgress(null);
      setProgressValue(0);
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleCancelEditProgress = (): void => {
    setEditingProgress(null);
    setProgressValue(0);
  };

  const handleStartEditProgress = (goalId: string, currentProgress: number): void => {
    setEditingProgress(goalId);
    setProgressValue(currentProgress);
  };

  const handleGoalCreatedFromTemplate = (goal: LifeGoalWithMilestones): void => {
    if (goal.milestones && goal.milestones.length > 0) {
      setGoalMilestones(prev => ({ ...prev, [goal.id]: goal.milestones ?? [] }));
    }
    setShowTemplates(false);
  };

  const handleExpandGoal = (goalId: string): void => {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
      return;
    }
    setExpandedGoalId(goalId);
  };

  const handleMilestonesUpdated = (goal: LifeGoal, milestones: LifeGoalMilestone[]): void => {
    setGoalMilestones(prev => ({ ...prev, [goal.id]: milestones }));
  };

  if (loading) {
    return <LifeGoalsLoadingState />;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <LifeGoalsHeader
        onShowTemplates={() => setShowTemplates(true)}
        onNewGoal={() => {
          setShowGoalForm(true);
          setActiveTab('goals');
        }}
        onNewDream={() => {
          setShowDreamForm(true);
          setActiveTab('dreams');
        }}
      />

      <StatsCards goalStats={goalStats} dreamStats={dreamStats} />

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <section>
        {activeTab === 'goals' && (
          <GoalList
            goals={goals}
            expandedGoalId={expandedGoalId}
            goalMilestones={goalMilestones}
            editingProgress={editingProgress}
            progressValue={progressValue}
            onMarkComplete={handleMarkGoalComplete}
            onDelete={handleDeleteGoal}
            onStartEditProgress={handleStartEditProgress}
            onUpdateProgress={handleUpdateProgress}
            onCancelEditProgress={handleCancelEditProgress}
            onExpandGoal={handleExpandGoal}
            onMilestonesUpdated={handleMilestonesUpdated}
            onSetProgressValue={setProgressValue}
          />
        )}
        {activeTab === 'dreams' && (
          <DreamList
            dreams={dreams}
            onMarkAchieved={handleMarkDreamAchieved}
            onDelete={handleDeleteDream}
          />
        )}
        {activeTab === 'progress' && <GoalGamification goals={goals} />}
      </section>

      <GoalFormModal
        isOpen={showGoalForm}
        goalDraft={goalDraft}
        onDraftChange={setGoalDraft}
        onSubmit={handleGoalSubmit}
        onClose={() => {
          setShowGoalForm(false);
          setGoalDraft(createGoalDraft());
        }}
      />

      <DreamFormModal
        isOpen={showDreamForm}
        dreamDraft={dreamDraft}
        onDraftChange={setDreamDraft}
        onSubmit={handleDreamSubmit}
        onClose={() => {
          setShowDreamForm(false);
          setDreamDraft(createDreamDraft());
        }}
      />

      {showTemplates && (
        <GoalTemplates
          onClose={() => setShowTemplates(false)}
          onGoalCreated={handleGoalCreatedFromTemplate}
        />
      )}
    </div>
  );
};

export default LifeGoals;
