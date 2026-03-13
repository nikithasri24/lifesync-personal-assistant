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
import { logger } from '../services/logger';
import { useToast } from '../hooks/useToast';
import ErrorState from '../components/ErrorState';
import { supabase } from '../lib/supabase';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';

// Import layout components
import { LifeGoalsLoadingState } from '../goals/components/layout/LifeGoalsLoadingState';
import { StatsCards } from '../goals/components/layout/StatsCards';
import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';
import { GoalList } from '../goals/components/layout/GoalList';
import { DreamList } from '../goals/components/layout/DreamList';
import { FilterBar, type StatusFilter, type OwnershipFilter } from '../goals/components/layout/FilterBar';
import { FABV2 } from '@/components/v2/FABV2';
import { Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePagination } from '@/hooks/utilities/usePagination';
import { PaginationV2 } from '@/components/ui/PaginationV2';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';

// Import V2 components
import { GoalsHeaderV2, GoalFormModalV2, DreamFormModalV2 } from '../goals/components/v2';

// Removed createGoalDraft and createDreamDraft - V2 modals manage their own state

const LifeGoalsContent: React.FC = () => {
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
  const colors = useThemeColors();
  const { showToast } = useToast();

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
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDreamForm, setShowDreamForm] = useState(false);
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

  // Pagination state for Goals and Dreams tabs
  const { page: goalsPage, setPage: setGoalsPage, resetPage: resetGoalsPage } = usePagination();
  const { page: dreamsPage, setPage: setDreamsPage, resetPage: resetDreamsPage } = usePagination();

  // Reset goal page when filters change
  useEffect(() => { resetGoalsPage(); }, [goalStatusFilter, goalOwnershipFilter, resetGoalsPage]);
  // Reset dream page when filters change
  useEffect(() => { resetDreamsPage(); }, [dreamStatusFilter, dreamOwnershipFilter, resetDreamsPage]);

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

  const handleGoalSubmit = async (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    targetDate: string;
    isShared: boolean;
    trackingMode: string;
  }): Promise<void> => {
    if (editingGoalId) {
      // Update existing goal
      await updateGoalMutation.mutateAsync({
        goalId: editingGoalId,
        updates: {
          title: data.title,
          description: data.description,
          category: data.category as any,
          priority: data.priority as any,
          targetDate: data.targetDate,
          // Sharing options - only update if merged mode is available
          isShared: isMerged ? data.isShared : undefined,
          trackingMode: isMerged && data.isShared ? (data.trackingMode as any) : undefined,
        },
      });
      setEditingGoalId(null);
    } else {
      // Create new goal
      await createGoalMutation.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category as any,
        priority: data.priority as any,
        targetDate: data.targetDate,
        startDate: new Date().toISOString(),
        // Sharing options - only set if merged mode is available
        isShared: isMerged ? data.isShared : false,
        trackingMode: data.isShared ? (data.trackingMode as any) : 'combined',
      });
    }
  };

  const handleDreamSubmit = async (data: {
    title: string;
    description: string;
    category: string;
    estimatedCost: string;
    estimatedTimeframe: string;
    isShared: boolean;
    trackingMode: string;
  }): Promise<void> => {
    if (editingDreamId) {
      // Update existing dream
      await updateDreamMutation.mutateAsync({
        dreamId: editingDreamId,
        updates: {
          title: data.title,
          description: data.description,
          category: data.category as any,
          estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
          estimatedTimeframe: data.estimatedTimeframe || undefined,
          // Sharing options - only update if merged mode is available
          isShared: isMerged ? data.isShared : undefined,
          trackingMode: isMerged && data.isShared ? (data.trackingMode as any) : undefined,
        },
      });
      setEditingDreamId(null);
    } else {
      // Create new dream
      await createDreamMutation.mutateAsync({
        title: data.title,
        description: data.description,
        category: data.category as any,
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
        estimatedTimeframe: data.estimatedTimeframe || undefined,
        // Sharing options - only set if merged mode is available
        isShared: isMerged ? data.isShared : false,
        trackingMode: data.isShared ? (data.trackingMode as any) : 'combined',
      });
    }
  };

  const handleEditGoal = (goal: LifeGoal): void => {
    setEditingGoalId(goal.id);
    setShowGoalForm(true);
  };

  const handleEditDream = (dream: LifeDream): void => {
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
      const updates: Record<string, unknown> = { progress: progressValue };
      if (progressValue >= 100) {
        updates.status = 'completed';
        updates.completedDate = new Date().toISOString();
      }
      await updateGoalMutation.mutateAsync({ goalId, updates: updates as any });
      if (progressValue >= 100) {
        showToast('Goal achieved! Marked as complete. 🏆', 'success');
      }
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
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <GoalsHeaderV2 />

        {/* Merged mode indicator */}
        {isMerged && (
          <div
            className="flex items-center gap-2 rounded-2xl p-4 mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)',
              borderWidth: '1px',
              borderColor: '#E8DCC8',
            }}
          >
            <Users className="h-5 w-5" style={{ color: '#C18B5E' }} />
            <span className="text-sm font-semibold" style={{ color: '#5C4A3A' }}>
              Shared Goals with {partnerName}
            </span>
            <span className="ml-auto text-xs font-medium" style={{ color: '#9B8B7A' }}>
              Both of you can see and edit these goals
            </span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6">
          <StatsCards goalStats={goalStats} dreamStats={dreamStats} activeTab={activeTab} />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <SegmentedControlV2
            segments={[
              { value: 'goals', label: 'Goals' },
              { value: 'dreams', label: 'Dreams' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'goals' | 'dreams')}
            aria-label="Toggle between Goals and Dreams"
          />
        </div>

        {/* Content Views */}
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
              goals={filteredGoals.slice((goalsPage - 1) * DEFAULT_PAGE_SIZE, goalsPage * DEFAULT_PAGE_SIZE)}
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
            {filteredGoals.length > DEFAULT_PAGE_SIZE && (
              <PaginationV2
                currentPage={goalsPage}
                totalPages={Math.ceil(filteredGoals.length / DEFAULT_PAGE_SIZE)}
                totalItems={filteredGoals.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setGoalsPage}
              />
            )}
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
              dreams={filteredDreams.slice((dreamsPage - 1) * DEFAULT_PAGE_SIZE, dreamsPage * DEFAULT_PAGE_SIZE)}
              onMarkAchieved={handleMarkDreamAchieved}
              onUndoAchieved={handleUndoDreamAchieved}
              onDelete={handleDeleteDream}
              onEdit={handleEditDream}
              isMerged={isMerged}
              partnerId={partnerId}
              partnerName={partnerName}
            />
            {filteredDreams.length > DEFAULT_PAGE_SIZE && (
              <PaginationV2
                currentPage={dreamsPage}
                totalPages={Math.ceil(filteredDreams.length / DEFAULT_PAGE_SIZE)}
                totalItems={filteredDreams.length}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setDreamsPage}
              />
            )}
            </>
          )}
        </section>

        {/* Goal Form Modal V2 */}
        <GoalFormModalV2
          isOpen={showGoalForm}
          onClose={() => {
            setShowGoalForm(false);
            setEditingGoalId(null);
          }}
          onSubmit={handleGoalSubmit}
          onDelete={editingGoalId ? () => handleDeleteGoal(editingGoalId) : undefined}
          initialData={editingGoalId ? {
            title: goals.find(g => g.id === editingGoalId)?.title || '',
            description: goals.find(g => g.id === editingGoalId)?.description || '',
            category: goals.find(g => g.id === editingGoalId)?.category || 'personal',
            priority: goals.find(g => g.id === editingGoalId)?.priority || 'medium',
            targetDate: goals.find(g => g.id === editingGoalId)?.targetDate || '',
            isShared: !!goals.find(g => g.id === editingGoalId)?.connectionId,
            trackingMode: goals.find(g => g.id === editingGoalId)?.trackingMode || 'combined',
          } : undefined}
          isEditing={!!editingGoalId}
          isPending={createGoalMutation.isPending || updateGoalMutation.isPending}
          isMergedModeAvailable={isMerged}
        />

        {/* Dream Form Modal V2 */}
        <DreamFormModalV2
          isOpen={showDreamForm}
          onClose={() => {
            setShowDreamForm(false);
            setEditingDreamId(null);
          }}
          onSubmit={handleDreamSubmit}
          onDelete={editingDreamId ? () => handleDeleteDream(editingDreamId) : undefined}
          initialData={editingDreamId ? {
            title: dreams.find(d => d.id === editingDreamId)?.title || '',
            description: dreams.find(d => d.id === editingDreamId)?.description || '',
            category: dreams.find(d => d.id === editingDreamId)?.category || 'travel',
            estimatedCost: dreams.find(d => d.id === editingDreamId)?.estimatedCost?.toString() || '',
            estimatedTimeframe: dreams.find(d => d.id === editingDreamId)?.estimatedTimeframe || '',
            isShared: !!dreams.find(d => d.id === editingDreamId)?.connectionId,
            trackingMode: dreams.find(d => d.id === editingDreamId)?.trackingMode || 'combined',
          } : undefined}
          isEditing={!!editingDreamId}
          isPending={createDreamMutation.isPending || updateDreamMutation.isPending}
          isMergedModeAvailable={isMerged}
        />

        {/* FAB */}
        <FABV2
          icon={Plus}
          onClick={() => {
            if (activeTab === 'goals') {
            setShowGoalForm(true);
          } else {
            setShowDreamForm(true);
          }
        }}
        label={activeTab === 'goals' ? 'New Goal' : 'New Dream'}
        position="bottom-right"
        size="md"
      />

      </div>
    </div>
  );
};

const LifeGoals: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="LifeGoals">
      <LifeGoalsContent />
    </FeatureErrorBoundary>
  );
};

export default LifeGoals;
