/**
 * GoalsPage - Financial Goals Management
 * Track savings goals and debt payoff with smart recommendations
 */

import React from 'react';
import { Plus } from 'lucide-react';
import {
  useGoalsQuery,
  useUpsertGoalMutation,
  useDeleteGoalMutation,
  useFinanceMergedConnectionQuery,
} from '@/hooks/useFinanceQuery';
import type { Goal } from '../types';
import { GoalCardV2, GoalFormModalV2, type GoalFormData } from '@/finance/components/v2';
import { useAuth } from '@/hooks/useAuth';
import { OwnerFilter } from '../components/OwnerFilter';
import useFinanceFilters from '../store/useFinanceFilters';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logger } from '@/services/logger';

const GoalsPage: React.FC = () => {
  const colors = useThemeColors();
  const [showModal, setShowModal] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | undefined>(undefined);

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  // React Query hooks
  const { data: goals = [], isLoading } = useGoalsQuery();
  const upsertGoalMutation = useUpsertGoalMutation();
  const deleteGoalMutation = useDeleteGoalMutation();
  const filters = useFinanceFilters();

  // Filter goals by owner (if in merged mode)
  const filteredGoals = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return goals;
    if (filters.ownerFilter === 'mine') return goals.filter(g => g.userId === user?.id);
    if (filters.ownerFilter === 'partner') return goals.filter(g => g.userId !== user?.id);
    return goals;
  }, [goals, mergedConnection, filters.ownerFilter, user]);

  // Sort filtered goals
  const sortedGoals = React.useMemo<Goal[]>(() => {
    return [...filteredGoals].sort((a, b) => {
      const aComplete = a.currentAmount >= a.targetAmount;
      const bComplete = b.currentAmount >= b.targetAmount;
      if (aComplete !== bComplete) return aComplete ? 1 : -1;

      return new Date(a.dueDateISO).getTime() - new Date(b.dueDateISO).getTime();
    });
  }, [filteredGoals]);

  const handleCreateGoal = (): void => {
    setEditingGoal(undefined);
    setShowModal(true);
  };

  const handleEditGoal = (goal: Goal): void => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleSaveGoal = async (formData: GoalFormData): Promise<void> => {
    try {
      await upsertGoalMutation.mutateAsync({
        id: editingGoal?.id,
        name: formData.name,
        targetAmount: formData.targetAmount,
        currentAmount: formData.currentAmount,
        deadline: formData.deadline,
        category: formData.category,
        notes: formData.notes,
        userId: editingGoal?.userId || user?.id,
      });
      setShowModal(false);
      setEditingGoal(undefined);

      // Reset filter to show the newly created/updated goal
      if (!editingGoal && mergedConnection) {
        const goalUserId = user?.id;
        filters.setOwnerFilter(filters.ownerFilter === 'partner' ? 'mine' : filters.ownerFilter);
      }
    } catch (error) {
      logger.error('GoalsPage', error instanceof Error ? error : new Error(String(error)), {
        context: 'handleSaveGoal',
        formData
      });
      throw error; // Let modal handle error display
    }
  };

  const handleCloseModal = (): void => {
    setShowModal(false);
    setEditingGoal(undefined);
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
            <span className="text-4xl">🎯</span>
            Financial Goals
          </h1>
          <div className="flex items-center gap-3">
            {/* Owner Filter - only show in merged mode */}
            {mergedConnection && (
              <OwnerFilter
                value={filters.ownerFilter}
                onChange={filters.setOwnerFilter}
                partnerName={partnerName}
              />
            )}
            <button
              onClick={handleCreateGoal}
              className="px-4 py-3 rounded-xl font-semibold text-white transition-opacity flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
              aria-label="Create goal"
            >
              <Plus className="w-5 h-5" />
              Create Goal
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-xl border animate-pulse"
                style={{
                  backgroundColor: colors.bg.white,
                  borderColor: colors.border.light,
                }}
              >
                <div className="h-32 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredGoals.length === 0 && (
          <div
            className="p-8 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: colors.border.medium }}
          >
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
              No financial goals yet
            </p>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Set up your first goal to start tracking progress
            </p>
            <button
              onClick={handleCreateGoal}
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              Create First Goal
            </button>
          </div>
        )}

        {/* Goal Cards */}
        {!isLoading && filteredGoals.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedGoals.map((goal) => (
              <GoalCardV2
                key={goal.id}
                goal={{
                  id: goal.id,
                  name: goal.name,
                  targetAmount: goal.targetAmount,
                  currentAmount: goal.currentAmount,
                  deadline: goal.dueDateISO,
                  category: goal.category,
                }}
                onClick={() => handleEditGoal(goal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Goal Form Modal */}
      <GoalFormModalV2
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveGoal}
        initialData={editingGoal ? {
          name: editingGoal.name,
          targetAmount: editingGoal.targetAmount,
          currentAmount: editingGoal.currentAmount,
          deadline: editingGoal.dueDateISO,
          category: editingGoal.category,
          notes: editingGoal.notes,
        } : undefined}
        isPending={upsertGoalMutation.isPending}
      />
    </div>
  );
};

export default GoalsPage;
