/**
 * TransactionsPageGrouped
 * Transactions organized by category with date sorting and inline editing
 */

import React from 'react';
import { ChevronDown, ChevronRight, Plus, Settings } from 'lucide-react';
import { Card } from '../components/Card';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '../ui/Button';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import ImportCSVButton from '../components/ImportCSVButton';
import { EditableTransactionRow } from '../components/transactions/EditableTransactionRow';
import BudgetTemplateManager from '../components/budgets/BudgetTemplateManager';
import { getFinanceAPI } from '../data';
import { formatCurrency } from '../utils/currency';
import useFinanceFilters from '../store/useFinanceFilters';
import type { Transaction, Category, Budget } from '../types';

type GroupedTransactions = {
  categoryId: string | null;
  categoryName: string;
  transactions: Transaction[];
  total: number;
  budget?: Budget;
  budgetLimit?: number;
};

const TransactionsPageGrouped: React.FC = () => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [budgetTemplates, setBudgetTemplates] = React.useState<Map<string, number>>(new Map());
  const [loading, setLoading] = React.useState(false);
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [showTemplateManager, setShowTemplateManager] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const filters = useFinanceFilters();

  // Get current month in YYYY-MM format
  const currentMonth = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const api = await getFinanceAPI();

      const [txns, cats, buds, templates] = await Promise.all([
        api.listTransactions({
          text: filters.text,
          fromISO: filters.fromISO,
          toISO: filters.toISO,
          type: filters.type,
          limit: 500,
        }),
        api.listCategories(),
        api.listBudgets(currentMonth),
        api.listBudgetTemplates(),
      ]);

      setTransactions(txns.items);
      setCategories(cats);
      setBudgets(buds);

      // Convert templates to Map
      const templateMap = new Map<string, number>();
      templates.forEach((t) => templateMap.set(t.categoryId, t.defaultAmount));
      setBudgetTemplates(templateMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.text, filters.fromISO, filters.toISO, filters.type]);

  // Group transactions by category
  const groupedTransactions: GroupedTransactions[] = React.useMemo(() => {
    const groups = new Map<string | null, Transaction[]>();

    transactions.forEach((txn) => {
      const key = txn.categoryId || null;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(txn);
    });

    // Convert to array and sort each group by date (newest first)
    const result: GroupedTransactions[] = [];

    groups.forEach((txns, categoryId) => {
      const categoryName = categoryId
        ? categories.find((c) => c.id === categoryId)?.name || 'Unknown Category'
        : 'Uncategorized';

      // Sort transactions by date (newest first)
      const sortedTxns = txns.sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );

      // Calculate group total (spent amount - only debits for budget comparison)
      const spent = Math.abs(txns.reduce(
        (sum, txn) => sum + (txn.type === 'debit' ? txn.amount : 0),
        0
      ));

      // Get budget for this category
      const budget = categoryId ? budgets.find((b) => b.categoryId === categoryId) : undefined;

      result.push({
        categoryId,
        categoryName,
        transactions: sortedTxns,
        total: spent,
        budget,
        budgetLimit: budget?.limit,
      });
    });

    // Sort groups: Uncategorized first, then by absolute total (largest first)
    return result.sort((a, b) => {
      if (a.categoryId === null) return -1;
      if (b.categoryId === null) return 1;
      return Math.abs(b.total) - Math.abs(a.total);
    });
  }, [transactions, categories, budgets]);

  const toggleGroup = (categoryId: string | null) => {
    const key = categoryId || 'uncategorized';
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isCollapsed = (categoryId: string | null) => {
    const key = categoryId || 'uncategorized';
    return collapsedGroups.has(key);
  };

  const grandTotal = transactions.reduce(
    (sum, txn) => sum + (txn.type === 'credit' ? txn.amount : -txn.amount),
    0
  );

  // Calculate budget summary metrics
  const budgetSummary = React.useMemo(() => {
    const categoriesWithBudgets = groupedTransactions.filter(g => g.budgetLimit);
    const totalBudgeted = categoriesWithBudgets.reduce((sum, g) => sum + (g.budgetLimit || 0), 0);
    const totalSpent = categoriesWithBudgets.reduce((sum, g) => sum + g.total, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overBudgetCount = categoriesWithBudgets.filter(g => g.total > (g.budgetLimit || 0)).length;

    return {
      categoriesWithBudgets: categoriesWithBudgets.length,
      totalCategories: groupedTransactions.length,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      utilizationPercent: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    };
  }, [groupedTransactions]);

  return (
    <div className="space-y-4">
      <Card title="Filters">
        <FiltersBar onApply={() => loadData()} onReset={() => filters.reset()} />
      </Card>

      {/* Budget Summary */}
      {budgetSummary.categoriesWithBudgets > 0 && (
        <Card title="Budget Summary">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Budgeted */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs font-medium text-blue-700 mb-1">Total Budgeted</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(budgetSummary.totalBudgeted)}</div>
              <div className="text-xs text-blue-600 mt-1">
                {budgetSummary.categoriesWithBudgets} of {budgetSummary.totalCategories} categories
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-xs font-medium text-slate-700 mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(budgetSummary.totalSpent)}</div>
              <div className="text-xs text-slate-600 mt-1">
                {budgetSummary.utilizationPercent.toFixed(1)}% utilized
              </div>
            </div>

            {/* Remaining */}
            <div className={`rounded-lg p-4 ${
              budgetSummary.totalRemaining < 0 ? 'bg-rose-50' : 'bg-emerald-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                budgetSummary.totalRemaining < 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {budgetSummary.totalRemaining < 0 ? 'Over Budget' : 'Remaining'}
              </div>
              <div className={`text-2xl font-bold ${
                budgetSummary.totalRemaining < 0 ? 'text-rose-900' : 'text-emerald-900'
              }`}>
                {formatCurrency(Math.abs(budgetSummary.totalRemaining))}
              </div>
              <div className={`text-xs mt-1 ${
                budgetSummary.totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {budgetSummary.totalRemaining < 0 ? 'Need to reduce' : 'Available to spend'}
              </div>
            </div>

            {/* Alerts */}
            <div className={`rounded-lg p-4 ${
              budgetSummary.overBudgetCount > 0 ? 'bg-amber-50' : 'bg-green-50'
            }`}>
              <div className={`text-xs font-medium mb-1 ${
                budgetSummary.overBudgetCount > 0 ? 'text-amber-700' : 'text-green-700'
              }`}>
                Budget Status
              </div>
              <div className={`text-2xl font-bold ${
                budgetSummary.overBudgetCount > 0 ? 'text-amber-900' : 'text-green-900'
              }`}>
                {budgetSummary.overBudgetCount}
              </div>
              <div className={`text-xs mt-1 ${
                budgetSummary.overBudgetCount > 0 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {budgetSummary.overBudgetCount > 0
                  ? `${budgetSummary.overBudgetCount} over budget`
                  : 'All on track'}
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700">Overall Budget Progress</span>
              <span className="text-xs text-slate-600">
                {budgetSummary.utilizationPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  budgetSummary.utilizationPercent > 100
                    ? 'bg-rose-500'
                    : budgetSummary.utilizationPercent > 90
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, budgetSummary.utilizationPercent)}%`,
                }}
              />
            </div>
          </div>
        </Card>
      )}

      <Card
        title="Transactions by Category"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowQuickAdd(true)} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
            <ImportCSVButton onSuccess={() => loadData()} />
            <Button
              variant="outline"
              onClick={() => setShowTemplateManager(true)}
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-1" />
              Budget Templates
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-primary opacity-70">
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in{' '}
            {groupedTransactions.length} categor{groupedTransactions.length !== 1 ? 'ies' : 'y'}
          </div>
          <div className="text-sm font-semibold text-primary">
            Total:{' '}
            <span className={grandTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-primary opacity-60">Loading transactions...</p>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-primary opacity-60">No transactions found</p>
            <p className="text-sm text-primary opacity-40 mt-1">
              Add a transaction or adjust your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedTransactions.map((group) => {
              const collapsed = isCollapsed(group.categoryId);

              return (
                <div
                  key={group.categoryId || 'uncategorized'}
                  className="rounded-lg border border-primary/20 overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="bg-slate-100">
                    <button
                      onClick={() => toggleGroup(group.categoryId)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {collapsed ? (
                          <ChevronRight className="h-5 w-5 text-slate-700" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-700" />
                        )}
                        <div className="text-left">
                          <h3 className="font-semibold text-slate-900">
                            {group.categoryName}
                            {!group.categoryId && (
                              <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Needs categorization
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-600">
                            {group.transactions.length} transaction
                            {group.transactions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {group.budgetLimit ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              <span className={group.total > group.budgetLimit ? 'text-rose-600' : 'text-emerald-600'}>
                                {formatCurrency(group.total)}
                              </span>
                              {' / '}
                              {formatCurrency(group.budgetLimit)}
                            </p>
                            <p className="text-xs text-slate-600">
                              {formatCurrency(Math.max(0, group.budgetLimit - group.total))} remaining
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-rose-600">
                              {formatCurrency(group.total)}
                            </p>
                            <p className="text-xs text-slate-500 italic">No budget set</p>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Budget Progress Bar */}
                    {group.budgetLimit && (
                      <div className="px-4 pb-3">
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              group.total > group.budgetLimit
                                ? 'bg-rose-500'
                                : group.total > group.budgetLimit * 0.9
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (group.total / group.budgetLimit) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Group Transactions */}
                  {!collapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Description
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Category
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                              Type
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.transactions.map((txn) => (
                            <EditableTransactionRow
                              key={txn.id}
                              transaction={txn}
                              categories={categories}
                              onUpdate={loadData}
                              onDelete={loadData}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddTransaction onClose={() => setShowQuickAdd(false)} onSuccess={() => loadData()} />
      )}

      {/* Budget Template Manager Modal */}
      {showTemplateManager && (
        <BudgetTemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
          categories={categories}
          existingTemplates={budgetTemplates}
          onSave={async (templates) => {
            const api = await getFinanceAPI();
            for (const template of templates) {
              await api.upsertBudgetTemplate({
                categoryId: template.categoryId,
                defaultAmount: template.defaultAmount,
              });
            }
            setShowTemplateManager(false);
            loadData();
          }}
          onDelete={async (categoryId) => {
            const api = await getFinanceAPI();
            await api.deleteBudgetTemplate(categoryId);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default TransactionsPageGrouped;
