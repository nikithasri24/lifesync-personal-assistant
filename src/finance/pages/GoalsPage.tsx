/**
 * GoalsPage - Financial Goals Management
 * Track savings goals and debt payoff with smart recommendations
 */

import React from 'react';
import { Plus } from 'lucide-react';
import {
  useGoalsQuery,
  useAccountsQuery,
  useGoalProgressQuery,
  useUpsertGoalMutation,
  useDeleteGoalMutation,
  useFinanceMergedConnectionQuery,
} from '@/hooks/useFinanceQuery';
import type { Goal, GoalInput, Account } from '../types';
import GoalCard from '../components/goals/GoalCard';
import GoalEditor from '../components/goals/GoalEditor';
import { useAuth } from '@/hooks/useAuth';

// Wrapper component to load progress for each goal
const GoalCardWithProgress: React.FC<{
  goal: Goal;
  accounts: Account[];
  onEdit: (goal: Goal) => void;
  currentUserId?: string;
  partnerName?: string;
}> = ({ goal, accounts, onEdit, currentUserId, partnerName }) => {
  const { data: progressHistory = [] } = useGoalProgressQuery(goal.id);
  const linkedAccount = goal.linkedAccountId
    ? accounts.find(a => a.id === goal.linkedAccountId)
    : undefined;

  return (
    <GoalCard
      goal={goal}
      progressHistory={progressHistory}
      linkedAccount={linkedAccount}
      onEdit={onEdit}
      currentUserId={currentUserId}
      partnerName={partnerName}
    />
  );
};

const GoalsPage: React.FC = () => {
  const [editorOpen, setEditorOpen] = React.useState(false);
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
  const { data: goals = [], isLoading: goalsLoading } = useGoalsQuery();
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();
  const upsertGoalMutation = useUpsertGoalMutation();
  const deleteGoalMutation = useDeleteGoalMutation();

  const loading = goalsLoading || accountsLoading;

  // Sort goals - no filtering in merged mode, always show all
  const sortedGoals = React.useMemo<Goal[]>(() => {
    return [...goals].sort((a, b) => {
      const aComplete = a.currentAmount >= a.targetAmount;
      const bComplete = b.currentAmount >= b.targetAmount;
      if (aComplete !== bComplete) return aComplete ? 1 : -1;

      return new Date(a.dueDateISO).getTime() - new Date(b.dueDateISO).getTime();
    });
  }, [goals]);

  const handleCreateGoal = (): void => {
    setEditingGoal(undefined);
    setEditorOpen(true);
  };

  const handleEditGoal = (goal: Goal): void => {
    setEditingGoal(goal);
    setEditorOpen(true);
  };

  const handleSaveGoal = async (goal: GoalInput): Promise<void> => {
    await upsertGoalMutation.mutateAsync(goal);
    setEditorOpen(false);
    setEditingGoal(undefined);
  };

  const handleDeleteGoal = async (goalId: string): Promise<void> => {
    await deleteGoalMutation.mutateAsync(goalId);
    setEditorOpen(false);
    setEditingGoal(undefined);
  };

  const handleCloseEditor = (): void => {
    setEditorOpen(false);
    setEditingGoal(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="mt-2 text-sm text-primary">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-primary">🎯 Financial Goals</h2>
          <p className="mt-1 text-sm text-primary opacity-70">
            Track your savings targets and debt payoff progress
          </p>
        </div>
        <button
          onClick={handleCreateGoal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ring-primary/20 p-12 text-center mb-6">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold text-primary mb-2">No Goals Yet</h3>
            <p className="text-sm text-primary opacity-70 mb-6">
              Set up your first financial goal to start tracking your progress with smart recommendations
              and automatic account syncing.
            </p>
            <button
              onClick={handleCreateGoal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Goal</span>
            </button>
          </div>
        </div>
      )}

      {/* Goal Cards */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
          {sortedGoals.map((goal) => (
            <GoalCardWithProgress
              key={goal.id}
              goal={goal}
              accounts={accounts}
              onEdit={handleEditGoal}
              currentUserId={user?.id}
              partnerName={partnerName}
            />
          ))}
        </div>
      )}

      {/* Goal Editor Modal */}
      <GoalEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
        goal={editingGoal}
        accounts={accounts}
      />
    </>
  );
};

export default GoalsPage;
