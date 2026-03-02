/**
 * TransactionsPageGrouped
 * Transactions organized by category with date sorting and inline editing
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '../ui/Button';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import ImportCSVButton from '../components/ImportCSVButton';
import { BudgetSummaryCard } from '../components/transactions/BudgetSummaryCard';
import { TransactionGroupHeader } from '../components/transactions/TransactionGroupHeader';
import { TransactionGroupTable } from '../components/transactions/TransactionGroupTable';
import { OwnerFilter } from '../components/OwnerFilter';
import {
  useTransactionsQuery,
  useCategoriesQuery,
  useBudgetsQuery,
  useBudgetTemplatesQuery,
  useFinanceMergedConnectionQuery,
} from '@/hooks/useFinanceQuery';
import { useGroupedTransactions } from '../hooks/useGroupedTransactions';
import { useBudgetSummary } from '../hooks/useBudgetSummary';
import { formatCurrency } from '../utils/currency';
import useFinanceFilters from '../store/useFinanceFilters';
import { getFinanceAPI } from '../data';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';

const TransactionsPageGrouped: React.FC = () => {
  const colors = useThemeColors();
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = React.useState<'category' | 'owner'>('category');
  const filters = useFinanceFilters();

  // Auth and merged connection
  const { user } = useAuth();
  const { data: mergedConnection } = useFinanceMergedConnectionQuery();

  // Get partner name from merged connection
  const partnerName = React.useMemo(() => {
    if (!mergedConnection || !user) return undefined;
    return mergedConnection.partnerName;
  }, [mergedConnection, user]);

  // Get current month in YYYY-MM format
  const currentMonth = React.useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // React Query hooks
  const { data: transactions = [], isLoading: txnsLoading, refetch: refetchTransactions } = useTransactionsQuery({
    text: filters.text,
    fromISO: filters.fromISO,
    toISO: filters.toISO,
    type: filters.type,
    tag: filters.tag,
    limit: 500,
  });
  const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useCategoriesQuery();
  const { data: budgets = [], isLoading: budgetsLoading, refetch: refetchBudgets } = useBudgetsQuery(currentMonth);
  const { data: budgetTemplatesList = [], isLoading: templatesLoading, refetch: refetchTemplates } = useBudgetTemplatesQuery();

  const loading = txnsLoading || categoriesLoading || budgetsLoading || templatesLoading;

  // Load data function for refetching
  const loadData = React.useCallback((): void => {
    void refetchTransactions();
    void refetchCategories();
    void refetchBudgets();
    void refetchTemplates();
  }, [refetchTransactions, refetchCategories, refetchBudgets, refetchTemplates]);

  // Convert templates to Map
  const budgetTemplates = React.useMemo(() => {
    const templateMap = new Map<string, number>();
    budgetTemplatesList.forEach((t) => templateMap.set(t.categoryId, t.defaultAmount));
    return templateMap;
  }, [budgetTemplatesList]);

  // Filter transactions by owner (if in merged mode)
  const filteredTransactions = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return transactions;
    if (filters.ownerFilter === 'mine') return transactions.filter(t => t.userId === user?.id);
    if (filters.ownerFilter === 'partner') return transactions.filter(t => t.userId !== user?.id);
    return transactions;
  }, [transactions, mergedConnection, filters.ownerFilter, user]);

  // Group transactions by category or owner
  const groupedByCategory = useGroupedTransactions({
    transactions: filteredTransactions,
    categories,
    budgets,
  });

  // Group transactions by owner (only in merged mode)
  const groupedByOwner = React.useMemo(() => {
    if (!mergedConnection || !user) return [];

    const myTransactions = filteredTransactions.filter(t => t.userId === user.id);
    const partnerTransactions = filteredTransactions.filter(t => t.userId !== user.id);

    const groups = [];

    if (myTransactions.length > 0) {
      groups.push({
        categoryId: 'owner-me',
        categoryName: 'My Transactions',
        transactions: myTransactions.sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
        total: myTransactions.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0),
        budgetLimit: 0,
      });
    }

    if (partnerTransactions.length > 0) {
      groups.push({
        categoryId: 'owner-partner',
        categoryName: `${partnerName}'s Transactions`,
        transactions: partnerTransactions.sort((a, b) => b.dateISO.localeCompare(a.dateISO)),
        total: partnerTransactions.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0),
        budgetLimit: 0,
      });
    }

    return groups;
  }, [filteredTransactions, mergedConnection, user, partnerName]);

  const groupedTransactions = groupBy === 'category' ? groupedByCategory : groupedByOwner;

  const toggleGroup = (categoryId: string | null): void => {
    const key = categoryId ?? 'uncategorized';
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

  const isCollapsed = (categoryId: string | null): boolean => {
    const key = categoryId ?? 'uncategorized';
    return collapsedGroups.has(key);
  };

  const grandTotal = Array.isArray(filteredTransactions)
    ? filteredTransactions.reduce(
        (sum, txn) => sum + (txn.type === 'credit' ? txn.amount : -txn.amount),
        0
      )
    : 0;

  // Calculate budget summary metrics
  const budgetSummary = useBudgetSummary(groupedTransactions);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2" style={{ color: colors.text.primary }}>
            <span className="text-4xl">💸</span>
            Transactions
          </h1>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            Track and categorize all your income and expenses
          </p>
        </div>

        <div className="space-y-4">
      <Card title="💸 Transactions">
        <div className="space-y-3">
          <FiltersBar onApply={() => loadData()} onReset={() => filters.reset()} />

          {/* Owner Filter and Grouping Options - only show in merged mode */}
          {mergedConnection && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Group by:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                  <button
                    onClick={() => setGroupBy('category')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                      groupBy === 'category'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    onClick={() => setGroupBy('owner')}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                      groupBy === 'owner'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Owner
                  </button>
                </div>
              </div>
              <OwnerFilter
                value={filters.ownerFilter}
                onChange={filters.setOwnerFilter}
                partnerName={partnerName}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Budget Summary */}
      <BudgetSummaryCard summary={budgetSummary} />

      <Card
        title="Transactions by Category"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowQuickAdd(true)} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
            <ImportCSVButton onSuccess={() => loadData()} />
          </div>
        }
      >
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-primary opacity-70">
            {Array.isArray(filteredTransactions) ? filteredTransactions.length : 0} transaction{(Array.isArray(filteredTransactions) ? filteredTransactions.length : 0) !== 1 ? 's' : ''} in{' '}
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
                  key={group.categoryId ?? 'uncategorized'}
                  className="rounded-lg border border-primary/20 overflow-hidden"
                >
                  <TransactionGroupHeader
                    categoryId={group.categoryId}
                    categoryName={group.categoryName}
                    transactionCount={group.transactions.length}
                    total={group.total}
                    budgetLimit={group.budgetLimit}
                    isCollapsed={collapsed}
                    onToggle={() => toggleGroup(group.categoryId)}
                    isIncome={group.transactions.every(t => t.type === 'credit')}
                  />

                  {!collapsed && (
                    <TransactionGroupTable
                      transactions={group.transactions}
                      categories={categories}
                      onUpdate={loadData}
                      onDelete={loadData}
                      currentUserId={user?.id}
                      partnerName={partnerName}
                    />
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
        </div>
      </div>
    </div>
  );
};

export default TransactionsPageGrouped;
