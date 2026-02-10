/* eslint-disable max-lines */
import React, { useMemo, useState , type FormEvent, useEffect } from 'react';
import {
  useLifeGoalsQuery,
  useLifeDreamsQuery,
  useCreateLifeGoalMutation,
  useUpdateLifeGoalMutation,
  useDeleteLifeGoalMutation,
  useCreateLifeDreamMutation,
  useUpdateLifeDreamMutation,
  useDeleteLifeDreamMutation,
  useMergedGoalsConnectionQuery,
} from '@/hooks/useLifeGoalsQuery';
import type {
  LifeGoal,
  LifeDream,
  LifeGoalWithMilestones,
  DreamStatus,
} from '../goals/types/lifeGoals';
import { Users } from 'lucide-react';
import GoalTemplates from '../goals/components/GoalTemplates';
import { logger } from '../services/logger';
import ErrorState from '../components/ErrorState';
import { supabase } from '../lib/supabase';

// Import layout components
import { LifeGoalsHeader } from '../goals/components/layout/LifeGoalsHeader';
import { LifeGoalsLoadingState } from '../goals/components/layout/LifeGoalsLoadingState';
import { StatsCards } from '../goals/components/layout/StatsCards';
import { TabNavigation } from '../goals/components/layout/TabNavigation';
import { GoalList } from '../goals/components/layout/GoalList';
import { DreamList } from '../goals/components/layout/DreamList';
import { GoalFormModal, type GoalDraft } from '../goals/components/layout/GoalFormModal';
import { DreamFormModal, type DreamDraft } from '../goals/components/layout/DreamFormModal';
import { FilterBar, type StatusFilter, type OwnershipFilter } from '../goals/components/layout/FilterBar';

const createGoalDraft = (): GoalDraft => ({
  title: '',
  description: '',
  category: 'personal',
  priority: 'medium',
  targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  isShared: false,
  trackingMode: 'combined',
});

const createDreamDraft = (): DreamDraft => ({
  title: '',
  description: '',
  category: 'travel',
  estimatedCost: '',
  estimatedTimeframe: '',
  isShared: false,
  trackingMode: 'combined',
});

const LifeGoals: React.FC = () => {
  // React Query hooks
  const {
    data: goals = [],
    isLoading: goalsLoading,
    error: goalsError,
    refetch: refetchGoals,
  } = useLifeGoalsQuery();
  const {
    data: dreams = [],
    isLoading: dreamsLoading,
    error: dreamsError,
    refetch: refetchDreams,
  } = useLifeDreamsQuery();
  const { data: mergedConnection } = useMergedGoalsConnectionQuery();
  const createGoalMutation = useCreateLifeGoalMutation();
  const updateGoalMutation = useUpdateLifeGoalMutation();
  const deleteGoalMutation = useDeleteLifeGoalMutation();
  const createDreamMutation = useCreateLifeDreamMutation();
  const updateDreamMutation = useUpdateLifeDreamMutation();
  const deleteDreamMutation = useDeleteLifeDreamMutation();

  const isMerged = !!mergedConnection;
  const partnerId = mergedConnection?.partnerId ?? null;
  const partnerName = mergedConnection?.partnerName && mergedConnection.partnerName.trim()
    ? mergedConnection.partnerName
    : 'Partner';

  const loading = goalsLoading || dreamsLoading;

  // Get current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    void fetchUser();
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(createGoalDraft);
  const [dreamDraft, setDreamDraft] = useState<DreamDraft>(createDreamDraft);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDreamForm, setShowDreamForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  // Edit mode state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingDreamId, setEditingDreamId] = useState<string | null>(null);
  // Filter state
  const [goalStatusFilter, setGoalStatusFilter] = useState<StatusFilter>('all');
  const [goalOwnershipFilter, setGoalOwnershipFilter] = useState<OwnershipFilter>('all');
  const [dreamStatusFilter, setDreamStatusFilter] = useState<StatusFilter>('all');
  const [dreamOwnershipFilter, setDreamOwnershipFilter] = useState<OwnershipFilter>('all');

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

  // Filtered goals
  const filteredGoals = useMemo(() => {
    let filtered = [...goals];

    // Apply status filter
    if (goalStatusFilter === 'active') {
      filtered = filtered.filter((goal) => goal.status !== 'completed');
    } else if (goalStatusFilter === 'completed') {
      filtered = filtered.filter((goal) => goal.status === 'completed');
    }

    // Apply ownership filter (only in merged mode and if not 'all')
    if (isMerged && goalOwnershipFilter !== 'all') {
      filtered = filtered.filter((goal) => {
        // Determine ownership
        let ownership: 'mine' | 'partner' | 'shared' = 'mine';
        if (goal.connectionId) {
          ownership = 'shared';
        } else if (currentUserId && goal.userId === currentUserId) {
          ownership = 'mine';
        } else if (partnerId && goal.userId === partnerId) {
          ownership = 'partner';
        }
        return ownership === goalOwnershipFilter;
      });
    }

    return filtered;
  }, [goals, goalStatusFilter, goalOwnershipFilter, isMerged, partnerId, currentUserId]);

  // Filtered dreams
  const filteredDreams = useMemo(() => {
    let filtered = [...dreams];

    // Apply status filter
    if (dreamStatusFilter === 'active') {
      filtered = filtered.filter((dream) => dream.status !== 'achieved');
    } else if (dreamStatusFilter === 'completed') {
      filtered = filtered.filter((dream) => dream.status === 'achieved');
    }

    // Apply ownership filter (only in merged mode and if not 'all')
    if (isMerged && dreamOwnershipFilter !== 'all') {
      filtered = filtered.filter((dream) => {
        // Determine ownership
        let ownership: 'mine' | 'partner' | 'shared' = 'mine';
        if (dream.connectionId) {
          ownership = 'shared';
        } else if (currentUserId && dream.userId === currentUserId) {
          ownership = 'mine';
        } else if (partnerId && dream.userId === partnerId) {
          ownership = 'partner';
        }
        return ownership === dreamOwnershipFilter;
      });
    }

    return filtered;
  }, [dreams, dreamStatusFilter, dreamOwnershipFilter, isMerged, partnerId, currentUserId]);

  const handleGoalSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!goalDraft.title.trim()) return;

    try {
      if (editingGoalId) {
        // Update existing goal
        await updateGoalMutation.mutateAsync({
          goalId: editingGoalId,
          updates: {
            title: goalDraft.title,
            description: goalDraft.description,
            category: goalDraft.category,
            priority: goalDraft.priority,
            targetDate: goalDraft.targetDate,
            // Sharing options - only update if merged mode is available
            isShared: isMerged ? goalDraft.isShared : undefined,
            trackingMode: isMerged && goalDraft.isShared ? goalDraft.trackingMode : undefined,
          },
        });
        setEditingGoalId(null);
      } else {
        // Create new goal
        await createGoalMutation.mutateAsync({
          title: goalDraft.title,
          description: goalDraft.description,
          category: goalDraft.category,
          priority: goalDraft.priority,
          targetDate: goalDraft.targetDate,
          startDate: new Date().toISOString(),
          // Sharing options - only set if merged mode is available
          isShared: isMerged ? goalDraft.isShared : false,
          trackingMode: goalDraft.isShared ? goalDraft.trackingMode : 'combined',
        });
      }
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
      if (editingDreamId) {
        // Update existing dream
        await updateDreamMutation.mutateAsync({
          dreamId: editingDreamId,
          updates: {
            title: dreamDraft.title,
            description: dreamDraft.description,
            category: dreamDraft.category,
            estimatedCost: dreamDraft.estimatedCost ? Number(dreamDraft.estimatedCost) : undefined,
            estimatedTimeframe: dreamDraft.estimatedTimeframe || undefined,
            // Sharing options - only update if merged mode is available
            isShared: isMerged ? dreamDraft.isShared : undefined,
            trackingMode: isMerged && dreamDraft.isShared ? dreamDraft.trackingMode : undefined,
          },
        });
        setEditingDreamId(null);
      } else {
        // Create new dream
        await createDreamMutation.mutateAsync({
          title: dreamDraft.title,
          description: dreamDraft.description,
          category: dreamDraft.category,
          estimatedCost: dreamDraft.estimatedCost ? Number(dreamDraft.estimatedCost) : undefined,
          estimatedTimeframe: dreamDraft.estimatedTimeframe || undefined,
          // Sharing options - only set if merged mode is available
          isShared: isMerged ? dreamDraft.isShared : false,
          trackingMode: dreamDraft.isShared ? dreamDraft.trackingMode : 'combined',
        });
      }
      setDreamDraft(createDreamDraft());
      setShowDreamForm(false);
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleEditGoal = (goal: LifeGoal): void => {
    setGoalDraft({
      title: goal.title,
      description: goal.description ?? '',
      category: goal.category,
      priority: goal.priority,
      targetDate: goal.targetDate ?? '',
      isShared: !!goal.connectionId,
      trackingMode: goal.trackingMode,
    });
    setEditingGoalId(goal.id);
    setShowGoalForm(true);
  };

  const handleEditDream = (dream: LifeDream): void => {
    setDreamDraft({
      title: dream.title,
      description: dream.description ?? '',
      category: dream.category,
      estimatedCost: dream.estimatedCost?.toString() ?? '',
      estimatedTimeframe: dream.estimatedTimeframe ?? '',
      isShared: !!dream.connectionId,
      trackingMode: dream.trackingMode,
    });
    setEditingDreamId(dream.id);
    setShowDreamForm(true);
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

  const handleUndoGoalComplete = async (goalId: string): Promise<void> => {
    try {
      await updateGoalMutation.mutateAsync({
        goalId,
        updates: {
          status: 'in-progress',
          completedDate: undefined,
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

  const handleMarkDreamAchieved = async (dreamId: string, previousStatus: DreamStatus): Promise<void> => {
    try {
      window.localStorage.setItem(`life_dream_previous_status:${dreamId}`, previousStatus);
      await updateDreamMutation.mutateAsync({
        dreamId,
        updates: {
          status: 'achieved',
          achievedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('LifeGoals', error as Error);
    }
  };

  const handleUndoDreamAchieved = async (dreamId: string): Promise<void> => {
    try {
      const storedStatus = window.localStorage.getItem(`life_dream_previous_status:${dreamId}`) as DreamStatus | null;
      const nextStatus: DreamStatus = storedStatus ?? 'dreaming';
      window.localStorage.removeItem(`life_dream_previous_status:${dreamId}`);
      await updateDreamMutation.mutateAsync({
        dreamId,
        updates: {
          status: nextStatus,
          achievedAt: undefined,
        },
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

  const handleGoalCreatedFromTemplate = (_goal: LifeGoalWithMilestones): void => {
    setShowTemplates(false);
  };

  const handleExpandGoal = (goalId: string): void => {
    if (expandedGoalId === goalId) {
      setExpandedGoalId(null);
      return;
    }
    setExpandedGoalId(goalId);
  };

  if (loading) {
    return <LifeGoalsLoadingState />;
  }

  if (goalsError || dreamsError) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <ErrorState
          error={goalsError ?? dreamsError}
          onRetry={() => {
            void refetchGoals();
            void refetchDreams();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {/* Merged mode indicator */}
      {isMerged && (
        <div className="flex items-center gap-2 rounded-lg bg-purple-50 p-3 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">
            Shared Goals with {partnerName}
          </span>
          <span className="ml-auto text-xs opacity-75">
            Both of you can see and edit these goals
          </span>
        </div>
      )}

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

      <section className="space-y-4">
        {activeTab === 'goals' && (
          <>
            <FilterBar
              statusFilter={goalStatusFilter}
              onStatusFilterChange={setGoalStatusFilter}
              ownershipFilter={goalOwnershipFilter}
              onOwnershipFilterChange={setGoalOwnershipFilter}
              isMerged={isMerged}
              partnerName={partnerName}
              itemType="goals"
            />
            <GoalList
              goals={filteredGoals}
              expandedGoalId={expandedGoalId}
              editingProgress={editingProgress}
              progressValue={progressValue}
              onMarkComplete={handleMarkGoalComplete}
              onUndoComplete={handleUndoGoalComplete}
              onDelete={handleDeleteGoal}
              onEdit={handleEditGoal}
              onStartEditProgress={handleStartEditProgress}
              onUpdateProgress={handleUpdateProgress}
              onCancelEditProgress={handleCancelEditProgress}
              onExpandGoal={handleExpandGoal}
              onSetProgressValue={setProgressValue}
              isMerged={isMerged}
              partnerId={partnerId}
              partnerName={partnerName}
            />
          </>
        )}
        {activeTab === 'dreams' && (
          <>
            <FilterBar
              statusFilter={dreamStatusFilter}
              onStatusFilterChange={setDreamStatusFilter}
              ownershipFilter={dreamOwnershipFilter}
              onOwnershipFilterChange={setDreamOwnershipFilter}
              isMerged={isMerged}
              partnerName={partnerName}
              itemType="dreams"
            />
            <DreamList
              dreams={filteredDreams}
              onMarkAchieved={handleMarkDreamAchieved}
              onUndoAchieved={handleUndoDreamAchieved}
              onDelete={handleDeleteDream}
              onEdit={handleEditDream}
              isMerged={isMerged}
              partnerId={partnerId}
              partnerName={partnerName}
            />
          </>
        )}
      </section>

      <GoalFormModal
        isOpen={showGoalForm}
        goalDraft={goalDraft}
        onDraftChange={setGoalDraft}
        onSubmit={handleGoalSubmit}
        onClose={() => {
          setShowGoalForm(false);
          setGoalDraft(createGoalDraft());
          setEditingGoalId(null);
        }}
        isMergedModeAvailable={isMerged}
        isEditMode={!!editingGoalId}
      />

      <DreamFormModal
        isOpen={showDreamForm}
        dreamDraft={dreamDraft}
        onDraftChange={setDreamDraft}
        onSubmit={handleDreamSubmit}
        onClose={() => {
          setShowDreamForm(false);
          setDreamDraft(createDreamDraft());
          setEditingDreamId(null);
        }}
        isMergedModeAvailable={isMerged}
        isEditMode={!!editingDreamId}
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
