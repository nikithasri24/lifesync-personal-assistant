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
  useFinanceMergedConnection
} from '@/hooks/useFinanceQuery';
import { currentMonth, monthRange } from '../utils/date';
import { formatCurrency } from '../utils/currency';
import { OwnerFilter } from '../components/OwnerFilter';
import { filterByOwner } from '@/finance/utils/ownerFilter';
import { BudgetFormModalV2, type BudgetFormData } from '@/finance/components/v2';
import { OwnerBadge } from '@/components/common/OwnerBadge';
import useFinanceFilters from '../store/useFinanceFilters';
import type { Budget, Transaction } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTransactionMonthsQuery } from '@/hooks/useFinanceQuery';

const BudgetsPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<Budget | undefined>(undefined);

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnection();

  // Get partner name
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  // Month date range
  const { from, to } = React.useMemo(() => monthRange(month), [month]);

  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetsQuery(month);
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();

  const { data: ytdTransactions = [], isLoading: txnsLoading } = useTransactionsQuery({
    fromISO: from,
    toISO: to,
    type: 'debit',
    limit: 500,
  });

  // Mutations
  const upsertBudget = useUpsertBudgetMutation();
  const deleteBudget = useDeleteBudgetMutation();
  const filters = useFinanceFilters();

  const loading = budgetsLoading || categoriesLoading || txnsLoading;

  const filteredYtdTxns = filterByOwner(ytdTransactions, filters.ownerFilter, user?.id);

  const ytdSpendingByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredYtdTxns.forEach((t: Transaction) => {
      if (t.categoryId) map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    });
    return map;
  }, [filteredYtdTxns]);

  const monthTxns = ytdTransactions;

  // Get recent transactions for a category (from current month only)
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
        month,
        categoryId: budgetData.categoryId,
        limit: budgetData.limit,
      });
      handleCloseEditor();
    } catch (error) {
      logger.error('Finance', 'Failed to save budget', { error, budgetData, month });
    }
  };

  const handleDeleteBudget = async (_budgetId: string) => {
    try {
      await deleteBudget.mutateAsync({ categoryId: editingBudget!.categoryId, month });
      handleCloseEditor();
    } catch (error) {
      logger.error('Finance', 'Failed to delete budget', { error, budgetId });
    }
  };

  // Filter transactions by owner (if filter is active)
  // YTD spending is already owner-filtered — use directly as the spending source
  const filteredSpendingByCategory = ytdSpendingByCategory;


  // Handle delete budget
  const handleDelete = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await deleteBudget.mutateAsync({ categoryId, month });
    }
  };

  // Months with actual transaction data — use the lightweight dedicated query
  // (can't derive from transactions since they're already filtered to the selected month)
  const { data: monthsInTx = [currentMonth()] } = useTransactionMonthsQuery();

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

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
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
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              aria-label="Select month"
            >
              {[...monthsInTx].reverse().map((m) => (
                <option key={m} value={m}>{new Date(m + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenEditor()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm transition-opacity"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            aria-label="Add budget"
          >
            <Plus size={16} />
            Add Budget
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-8 rounded-xl border-2 border-dashed text-center" style={{ borderColor: colors.border.medium }}>
            <div className="text-4xl mb-3">📊</div>
            <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
              No budgets for {new Date(month + '-02').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>Set limits to track where your money goes</p>
            <button
              onClick={() => handleOpenEditor()}
              className="px-4 py-2 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            >
              Create Your First Budget
            </button>
          </div>
        ) : (() => {
          const allBudgets = budgets.map(b => {
            const spent = filteredSpendingByCategory.get(b.categoryId) || 0;
            const pct   = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const cat   = categories.find(c => c.id === b.categoryId);
            return { ...b, spent, pct, remaining: b.limit - spent, catName: cat?.name || 'Unknown', catIcon: cat?.icon || '' };
          }).sort((a, b) => b.pct - a.pct);

          const totalBudget = allBudgets.reduce((s, b) => s + b.limit, 0);
          const totalSpent  = allBudgets.reduce((s, b) => s + b.spent, 0);
          const overallPct  = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

          return (
            <div className="space-y-5">
              {/* Summary */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    <span className="font-bold text-base" style={{ color: colors.text.primary }}>{formatCurrency(totalSpent)}</span>
                    {' spent · '}
                    <span className="font-semibold" style={{ color: '#10b981' }}>{formatCurrency(totalBudget - totalSpent)} left</span>
                    {' · of '}{formatCurrency(totalBudget)}
                  </p>
                  <span className="text-sm font-bold" style={{ color: overallPct > 100 ? '#ef4444' : '#C18B5E' }}>
                    {Math.round(overallPct)}% · {daysLeft}d left
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#e5e7eb' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, overallPct)}%`,
                      background: overallPct > 100 ? '#ef4444' : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                    }}
                  />
                </div>
              </div>

              {/* List */}
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.bg.white, border: `1px solid ${colors.border.light}` }}>
                {allBudgets.map((budget, idx) => {
                  const isOver    = budget.pct > 100;
                  const isWarning = budget.pct >= 80 && !isOver;
                  const barBg     = isOver ? '#ef4444' : isWarning ? '#f59e0b' : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)';
                  const pctColor  = isOver ? '#ef4444' : isWarning ? '#d97706' : colors.text.secondary;
                  const leftColor = isOver ? '#ef4444' : budget.remaining > 0 ? '#10b981' : '#6b7280';

                  return (
                    <div
                      key={budget.id}
                      className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50/80 transition-colors"
                      style={{ borderBottom: idx < allBudgets.length - 1 ? `1px solid ${colors.border.light}` : 'none' }}
                      onClick={() => handleOpenEditor(budget)}
                    >
                      {/* Icon + name */}
                      <div className="flex items-center gap-2 flex-shrink-0 w-40">
                        {budget.catIcon && <span className="text-sm leading-none">{budget.catIcon}</span>}
                        <span className="text-sm font-medium truncate" style={{ color: colors.text.primary }}>
                          {budget.catName}
                        </span>
                        {isOver && <span className="text-xs flex-shrink-0">⚠️</span>}
                      </div>

                      {/* Progress bar — single-div hard-stop gradient avoids h-full=0 bug */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="w-full h-2 rounded-full"
                          style={{
                            background: `linear-gradient(to right, ${isOver ? '#ef4444' : isWarning ? '#f59e0b' : '#C18B5E'} ${Math.min(100, budget.pct)}%, #e5e7eb ${Math.min(100, budget.pct)}%)`,
                          }}
                        />
                      </div>

                      {/* % */}
                      <span className="text-xs font-bold w-9 text-right flex-shrink-0" style={{ color: pctColor }}>
                        {Math.round(budget.pct)}%
                      </span>

                      {/* Remaining */}
                      <span className="text-xs font-medium w-24 text-right flex-shrink-0" style={{ color: leftColor }}>
                        {isOver
                          ? `${formatCurrency(Math.abs(budget.remaining))} over`
                          : `${formatCurrency(budget.remaining)} left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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

