/**
 * TransactionsPageGrouped
 * Transactions organized by category with date sorting and inline editing
 */

import React from 'react';
import { Plus, Settings } from 'lucide-react';
import { Card } from '../components/Card';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '../ui/Button';
import { QuickAddTransaction } from '../components/QuickAddTransaction';
import ImportCSVButton from '../components/ImportCSVButton';
import { BudgetSummaryCard } from '../components/transactions/BudgetSummaryCard';
import { TransactionGroupHeader } from '../components/transactions/TransactionGroupHeader';
import { TransactionGroupTable } from '../components/transactions/TransactionGroupTable';
import BudgetTemplateManager from '../components/budgets/BudgetTemplateManager';
import {
  useTransactionsQuery,
  useCategoriesQuery,
  useBudgetsQuery,
  useBudgetTemplatesQuery,
} from '../hooks/useFinanceQuery';
import { useGroupedTransactions } from '../hooks/useGroupedTransactions';
import { useBudgetSummary } from '../hooks/useBudgetSummary';
import { formatCurrency } from '../utils/currency';
import useFinanceFilters from '../store/useFinanceFilters';
import { getFinanceAPI } from '../data';

const TransactionsPageGrouped: React.FC = () => {
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [showTemplateManager, setShowTemplateManager] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const filters = useFinanceFilters();

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

  // Group transactions by category
  const groupedTransactions = useGroupedTransactions({
    transactions,
    categories,
    budgets,
  });

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

  const grandTotal = Array.isArray(transactions)
    ? transactions.reduce(
        (sum, txn) => sum + (txn.type === 'credit' ? txn.amount : -txn.amount),
        0
      )
    : 0;

  // Calculate budget summary metrics
  const budgetSummary = useBudgetSummary(groupedTransactions);

  return (
    <div className="space-y-4">
      <Card title="Filters">
        <FiltersBar onApply={() => loadData()} onReset={() => filters.reset()} />
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
            {Array.isArray(transactions) ? transactions.length : 0} transaction{(Array.isArray(transactions) ? transactions.length : 0) !== 1 ? 's' : ''} in{' '}
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
                  />

                  {!collapsed && (
                    <TransactionGroupTable
                      transactions={group.transactions}
                      categories={categories}
                      onUpdate={loadData}
                      onDelete={loadData}
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

      {/* Budget Template Manager Modal */}
      {showTemplateManager && (
        <BudgetTemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
          categories={categories}
          existingTemplates={budgetTemplates}
          onSave={async (templates): Promise<void> => {
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
          onDelete={async (categoryId): Promise<void> => {
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
