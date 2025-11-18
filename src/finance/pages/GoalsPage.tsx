/**
 * GoalsPage - Financial Goals Management
 * Track savings goals and debt payoff with smart recommendations
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { getFinanceAPI } from '../data';
import type { Goal, GoalInput, GoalProgressPoint, Account } from '../types';
import GoalCard from '../components/goals/GoalCard';
import GoalEditor from '../components/goals/GoalEditor';

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [progressHistories, setProgressHistories] = React.useState<Map<string, GoalProgressPoint[]>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | undefined>(undefined);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log('[GoalsPage] Loading goals and accounts');
      const api = await getFinanceAPI();
      const [goalsData, accountsData] = await Promise.all([
        api.listGoals(),
        api.listAccounts(),
      ]);

      console.log('[GoalsPage] Loaded:', {
        goals: goalsData.length,
        accounts: accountsData.length,
      });

      setGoals(goalsData);
      setAccounts(accountsData);

      // Load progress history for each goal
      const histories = new Map<string, GoalProgressPoint[]>();
      for (const goal of goalsData) {
        try {
          const history = await api.getGoalProgressHistory(goal.id);
          histories.set(goal.id, history);
        } catch (err) {
          console.warn(`Failed to load history for goal ${goal.id}:`, err);
          histories.set(goal.id, []);
        }
      }
      setProgressHistories(histories);

    } catch (error) {
      console.error('[GoalsPage] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGoal = () => {
    setEditingGoal(undefined);
    setEditorOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditorOpen(true);
  };

  const handleSaveGoal = async (goal: GoalInput) => {
    const api = await getFinanceAPI();
    await api.upsertGoal(goal);
    await loadData(); // Reload all data
  };

  const handleDeleteGoal = async (goalId: string) => {
    const api = await getFinanceAPI();
    await api.deleteGoal(goalId);
    await loadData(); // Reload all data
  };

  const handleCloseEditor = () => {
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

  // Sort goals by status and due date
  const sortedGoals = [...goals].sort((a, b) => {
    // First by completion (incomplete first)
    const aComplete = a.currentAmount >= a.targetAmount;
    const bComplete = b.currentAmount >= b.targetAmount;
    if (aComplete !== bComplete) return aComplete ? 1 : -1;

    // Then by due date (soonest first)
    return new Date(a.dueDateISO).getTime() - new Date(b.dueDateISO).getTime();
  });

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Financial Goals</h2>
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
          {sortedGoals.map((goal) => {
            const linkedAccount = goal.linkedAccountId
              ? accounts.find(a => a.id === goal.linkedAccountId)
              : undefined;
            const progressHistory = progressHistories.get(goal.id) || [];

            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                progressHistory={progressHistory}
                linkedAccount={linkedAccount}
                onEdit={handleEditGoal}
              />
            );
          })}
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
