/**
 * Budgets Page
 * Track spending against budgets (personal and household)
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/logger';
import {
  useBudgetsQuery,
  useUpsertBudgetMutation,
  useDeleteBudgetMutation,
  useCategoriesQuery,
  useTransactionsQuery,
  useFinanceMergedConnectionQuery
} from '@/hooks/useFinanceQuery';
import { currentMonth, monthRange } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { OwnerFilter } from '../components/OwnerFilter';
import { BudgetCardV2, BudgetFormModalV2, type BudgetFormData } from '@/finance/components/v2';
import useFinanceFilters from '../store/useFinanceFilters';
import type { Budget, Transaction } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

const BudgetsPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<Budget | undefined>(undefined);

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  // Calculate month range early for query filtering
  const { from, to } = React.useMemo(() => monthRange(month), [month]);

  // Queries - fetch only current month's debit transactions
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetsQuery(month);
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: transactions = [], isLoading: txnsLoading } = useTransactionsQuery({
    fromISO: from,
    toISO: to,
    type: 'debit',  // Only need expenses for budgets
    limit: 300      // Reduced from 1000
  });

  // Mutations
  const upsertBudget = useUpsertBudgetMutation();
  const deleteBudget = useDeleteBudgetMutation();
  const filters = useFinanceFilters();

  const loading = budgetsLoading || categoriesLoading || txnsLoading;

  // Transactions are pre-filtered by query (current month, debit only)
  const monthTxns = transactions;

  // Calculate spending by category
  const spendingByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    monthTxns.forEach((t: Transaction) => {
      if (t.categoryId) {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    });
    return map;
  }, [monthTxns]);

  // Calculate spending by category and user
  const spendingByCategoryAndUser = React.useMemo(() => {
    const map = new Map<string, { total: number; mySpending: number; partnerSpending: number }>();
    monthTxns.forEach((t: Transaction) => {
      if (t.categoryId) {
        const current = map.get(t.categoryId) || { total: 0, mySpending: 0, partnerSpending: 0 };
        current.total += t.amount;
        if (user && t.userId === user.id) {
          current.mySpending += t.amount;
        } else {
          current.partnerSpending += t.amount;
        }
        map.set(t.categoryId, current);
      }
    });
    return map;
  }, [monthTxns, user]);

  // Get recent transactions for a category
  const getRecentTransactions = (categoryId: string, limit: number = 2) => {
    return monthTxns
      .filter((t: Transaction) => t.categoryId === categoryId)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
      .slice(0, limit);
  };

  // Calculate days left in month
  const daysLeft = React.useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diff = endOfMonth.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  // Get category name
  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  // Handler functions for budget editor
  const handleOpenEditor = (budget?: Budget) => {
    setEditingBudget(budget);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingBudget(undefined);
  };

  const handleSaveBudget = async (budgetData: { categoryId: string; limit: number; userId?: string }) => {
    try {
      await upsertBudget.mutateAsync({
        id: editingBudget?.id,
        month,
        categoryId: budgetData.categoryId,
        limit: budgetData.limit,
        userId: budgetData.userId,
      });
      handleCloseEditor();
    } catch (error) {
      logger.error('Finance', 'Failed to save budget', { error, budgetData, month });
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await deleteBudget.mutateAsync(budgetId);
      handleCloseEditor();
    } catch (error) {
      logger.error('Finance', 'Failed to delete budget', { error, budgetId });
    }
  };

  // Filter transactions by owner (if filter is active)
  const filteredMonthTxns = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return monthTxns;
    if (filters.ownerFilter === 'mine') return monthTxns.filter(t => t.userId === user?.id);
    if (filters.ownerFilter === 'partner') return monthTxns.filter(t => t.userId !== user?.id);
    return monthTxns;
  }, [monthTxns, mergedConnection, filters.ownerFilter, user]);

  // Recalculate spending based on filtered transactions
  const filteredSpendingByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredMonthTxns.forEach((t: Transaction) => {
      if (t.categoryId) {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    });
    return map;
  }, [filteredMonthTxns]);

  // Group budgets by type (household vs personal) - using filtered data
  const { householdBudgets, myBudgets, partnerBudgets } = React.useMemo(() => {
    const household: Budget[] = [];
    const mine: Budget[] = [];
    const partner: Budget[] = [];

    budgets.forEach((budget) => {
      const spending = spendingByCategoryAndUser.get(budget.categoryId);

      // If both users have spending in this category, it's household
      if (spending && spending.mySpending > 0 && spending.partnerSpending > 0) {
        household.push(budget);
      } else if (spending && spending.mySpending > 0) {
        mine.push(budget);
      } else if (spending && spending.partnerSpending > 0) {
        partner.push(budget);
      } else {
        // No spending yet, default to household
        household.push(budget);
      }
    });

    return { householdBudgets: household, myBudgets: mine, partnerBudgets: partner };
  }, [budgets, spendingByCategoryAndUser]);

  // Handle delete budget
  const handleDelete = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget.mutateAsync({ categoryId, month });
    }
  };

  // Get available months from transactions
  const monthsInTx = React.useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t: Transaction) => {
      months.add(t.dateISO.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const colors = useThemeColors();

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2" style={{ color: colors.text.primary }}>
            <span className="text-4xl">📊</span>
            Budgets
          </h1>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Track spending against your monthly budgets
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Owner Filter - only show in merged mode */}
            {mergedConnection && (
              <OwnerFilter
                value={filters.ownerFilter}
                onChange={filters.setOwnerFilter}
                partnerName={partnerName}
              />
            )}
            <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {monthsInTx.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 transition-colors"
            aria-label="Add budget"
          >
            <Plus size={16} />
            Add Budget
          </button>
          </div>
        </div>

        {loading ? (
        <div className="text-center py-12 text-slate-500">Loading budgets...</div>
      ) : (
        <div className="space-y-8">
          {/* Household Budgets */}
          {mergedConnection && householdBudgets.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Household Budgets (Combined Spending)
              </h2>
              <div className="space-y-4">
                {householdBudgets.map((budget) => {
                  const spent = filteredSpendingByCategory.get(budget.categoryId) || 0;
                  const remaining = budget.limit - spent;
                  const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
                  const isOverBudget = spent > budget.limit;
                  const recentTxns = getRecentTransactions(budget.categoryId, 2);

                  // Create visual block progress bar (20 blocks total)
                  const filledBlocks = Math.min(20, Math.round((percentage / 100) * 20));
                  const emptyBlocks = 20 - filledBlocks;
                  const blockBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

                  return (
                    <div key={budget.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {getCategoryName(budget.categoryId)}
                            </h3>
                            <span className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded">
                              Household
                            </span>
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <span className={`font-mono text-sm tracking-tight ${
                          isOverBudget ? 'text-rose-500' : 'text-blue-500'
                        }`}>
                          {blockBar}
                        </span>
                        <span className={`ml-2 text-sm font-semibold ${
                          isOverBudget ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      {/* Status */}
                      <div className="text-sm text-slate-600 mb-3">
                        {formatCurrency(remaining)} remaining • {daysLeft} days left
                      </div>

                      {/* Recent Transactions */}
                      {recentTxns.length > 0 && (
                        <div className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Recent: </span>
                          {recentTxns.map((txn, idx) => (
                            <span key={txn.id}>
                              {txn.description} {formatCurrency(txn.amount)}
                              {user && mergedConnection && (
                                <span className="ml-1">
                                  <OwnerBadge
                                    userId={txn.userId}
                                    currentUserId={user.id}
                                    partnerName={partnerName}
                                    size="sm"
                                  />
                                </span>
                              )}
                              {idx < recentTxns.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEditor(budget)}
                          className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget.categoryId)}
                          className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal Budgets (My Spending Only) */}
          {mergedConnection && myBudgets.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Personal Budgets (My Spending Only)
              </h2>
              <div className="space-y-4">
                {myBudgets.map((budget) => {
                  const spending = spendingByCategoryAndUser.get(budget.categoryId);
                  const spent = spending?.mySpending || 0;
                  const remaining = budget.limit - spent;
                  const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
                  const isOverBudget = spent > budget.limit;
                  const recentTxns = getRecentTransactions(budget.categoryId, 2)
                    .filter((t) => user && t.userId === user.id);

                  // Create visual block progress bar (20 blocks total)
                  const filledBlocks = Math.min(20, Math.round((percentage / 100) * 20));
                  const emptyBlocks = 20 - filledBlocks;
                  const blockBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

                  return (
                    <div key={budget.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {getCategoryName(budget.categoryId)}
                            </h3>
                            {user && (
                              <OwnerBadge
                                userId={user.id}
                                currentUserId={user.id}
                                partnerName={partnerName}
                                size="sm"
                              />
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <span className={`font-mono text-sm tracking-tight ${
                          isOverBudget ? 'text-rose-500' : 'text-blue-500'
                        }`}>
                          {blockBar}
                        </span>
                        <span className={`ml-2 text-sm font-semibold ${
                          isOverBudget ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>


                      {/* Status */}
                      <div className="text-sm text-slate-600 mb-3">
                        {formatCurrency(remaining)} remaining • {daysLeft} days left
                      </div>

                      {/* Recent Transactions */}
                      {recentTxns.length > 0 && (
                        <div className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Recent: </span>
                          {recentTxns.map((txn, idx) => (
                            <span key={txn.id}>
                              {txn.description} {formatCurrency(txn.amount)}
                              {idx < recentTxns.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEditor(budget)}
                          className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget.categoryId)}
                          className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Partner's Personal Budgets */}
          {mergedConnection && partnerBudgets.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Partner's Personal Budgets ({partnerName}'s Spending Only)
              </h2>
              <div className="space-y-4">
                {partnerBudgets.map((budget) => {
                  const spending = spendingByCategoryAndUser.get(budget.categoryId);
                  const spent = spending?.partnerSpending || 0;
                  const remaining = budget.limit - spent;
                  const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
                  const isOverBudget = spent > budget.limit;
                  const recentTxns = getRecentTransactions(budget.categoryId, 2)
                    .filter((t) => user && t.userId !== user.id);

                  // Create visual block progress bar (20 blocks total)
                  const filledBlocks = Math.min(20, Math.round((percentage / 100) * 20));
                  const emptyBlocks = 20 - filledBlocks;
                  const blockBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

                  return (
                    <div key={budget.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {getCategoryName(budget.categoryId)}
                            </h3>
                            {user && (
                              <OwnerBadge
                                userId={'partner'}
                                currentUserId={user.id}
                                partnerName={partnerName}
                                size="sm"
                              />
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <span className={`font-mono text-sm tracking-tight ${
                          isOverBudget ? 'text-rose-500' : 'text-blue-500'
                        }`}>
                          {blockBar}
                        </span>
                        <span className={`ml-2 text-sm font-semibold ${
                          isOverBudget ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      {/* Status */}
                      <div className="text-sm text-slate-600 mb-3">
                        {formatCurrency(remaining)} remaining • {daysLeft} days left
                      </div>

                      {/* Recent Transactions */}
                      {recentTxns.length > 0 && (
                        <div className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Recent: </span>
                          {recentTxns.map((txn, idx) => (
                            <span key={txn.id}>
                              {txn.description} {formatCurrency(txn.amount)}
                              {idx < recentTxns.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* View Only */}
                      <div className="flex items-center gap-2 justify-end">
                        <span className="px-3 py-1.5 text-sm text-slate-500">
                          View Only
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No merged mode - show all budgets */}
          {!mergedConnection && budgets.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">My Budgets</h2>
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const spent = filteredSpendingByCategory.get(budget.categoryId) || 0;
                  const remaining = budget.limit - spent;
                  const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
                  const isOverBudget = spent > budget.limit;
                  const recentTxns = getRecentTransactions(budget.categoryId, 2);

                  // Create visual block progress bar (20 blocks total)
                  const filledBlocks = Math.min(20, Math.round((percentage / 100) * 20));
                  const emptyBlocks = 20 - filledBlocks;
                  const blockBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

                  return (
                    <div key={budget.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            {getCategoryName(budget.categoryId)}
                          </h3>
                          <div className="text-sm text-slate-600">
                            {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <span className={`font-mono text-sm tracking-tight ${
                          isOverBudget ? 'text-rose-500' : 'text-blue-500'
                        }`}>
                          {blockBar}
                        </span>
                        <span className={`ml-2 text-sm font-semibold ${
                          isOverBudget ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      {/* Status */}
                      <div className="text-sm text-slate-600 mb-3">
                        {formatCurrency(remaining)} remaining • {daysLeft} days left
                      </div>

                      {/* Recent Transactions */}
                      {recentTxns.length > 0 && (
                        <div className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Recent: </span>
                          {recentTxns.map((txn, idx) => (
                            <span key={txn.id}>
                              {txn.description} {formatCurrency(txn.amount)}
                              {idx < recentTxns.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEditor(budget)}
                          className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget.categoryId)}
                          className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {budgets.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No budgets yet for {month}</p>
              <button
                onClick={() => handleOpenEditor()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 transition-colors"
                aria-label="Create first budget"
              >
                <Plus size={16} />
                Create Your First Budget
              </button>
            </div>
          )}
        </div>
        )}

        {/* Budget Editor Modal */}
        <BudgetFormModalV2
          isOpen={editorOpen}
          onClose={handleCloseEditor}
          onSave={async (formData: BudgetFormData) => {
            await handleSaveBudget({
              categoryId: formData.categoryId,
              limit: formData.limitAmount,
              userId: user?.id,
            });
          }}
          initialData={editingBudget ? {
            categoryId: editingBudget.categoryId,
            limitAmount: editingBudget.limit,
            monthYear: editingBudget.month,
            notes: editingBudget.notes,
            rollover: editingBudget.rollover,
          } : undefined}
          isPending={upsertBudget.isPending}
        />
      </div>
    </div>
  );
};

export default BudgetsPage;

