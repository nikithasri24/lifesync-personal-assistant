import React from 'react';
import { logger } from '../../services/logger';

import { Plus, Settings } from 'lucide-react';
import { currentMonth, monthRange } from '../utils/date';
import {
  useTransactionsQuery,
  useBudgetsQuery,
  useCategoriesQuery,
  useBudgetTemplatesQuery,
  useInitializeBudgetsMutation,
} from '../hooks/useFinanceQuery';
import type { Budget } from '../types';
import { MonthPicker } from '../components/MonthPicker';
import BudgetCard from '../components/budgets/BudgetCard';
import BudgetSummary, { type BudgetSummaryData } from '../components/budgets/BudgetSummary';
import BudgetEditor from '../components/budgets/BudgetEditor';
import BudgetBulkEditor from '../components/budgets/BudgetBulkEditor';
import BudgetTemplateManager from '../components/budgets/BudgetTemplateManager';
import { getBudgetStatus } from '../components/budgets/BudgetProgressBar';
import { calculateBudgetRecommendation } from '../utils/budgetRecommendations';

const BudgetsPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [bulkEditorOpen, setBulkEditorOpen] = React.useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<Budget | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>('');

  // React Query hooks
  const { data: transactionsData, isLoading: txnsLoading } = useTransactionsQuery({ limit: 1000 });
  const { data: budgetsData = [], isLoading: budgetsLoading } = useBudgetsQuery(month);
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: templates = [], isLoading: templatesLoading } = useBudgetTemplatesQuery();
  const initializeBudgetsMutation = useInitializeBudgetsMutation();

  const txns = transactionsData?.items || [];
  const budgets = budgetsData;
  const loading = txnsLoading || budgetsLoading || categoriesLoading || templatesLoading;

  // Calculate months from transactions
  const months = React.useMemo(() => {
    return Array.from(new Set(txns.map((t) => t.dateISO.slice(0, 7)))).sort().reverse();
  }, [txns]);

  // Auto-initialize budgets from templates if this month has no budgets
  React.useEffect(() => {
    if (!budgetsLoading && budgets.length === 0 && !initializeBudgetsMutation.isPending) {
      logger.info('BudgetsPage', '[BudgetsPage] No budgets found for', month, '- initializing from templates');
      initializeBudgetsMutation.mutate(month, {
        onSuccess: (initialized) => {
          if (initialized > 0) {
            logger.info('BudgetsPage', '[BudgetsPage] Initialized', initialized, 'budgets from templates');
          } else {
            logger.info('BudgetsPage', '[BudgetsPage] No templates found to initialize budgets');
          }
        },
        onError: (error) => {
          logger.error('BudgetsPage', '[BudgetsPage] Failed to initialize budgets:', error);
        },
      });
    }
  }, [budgets.length, budgetsLoading, month, initializeBudgetsMutation]);

  // Calculate current month transactions
  const { from, to } = monthRange(month);
  const monthTxns = txns.filter((t) => t.dateISO >= from && t.dateISO <= to && t.type === 'debit');

  // Calculate previous month for trend analysis
  const getPreviousMonth = (monthStr: string): string => {
    const date = new Date(monthStr + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  };

  const previousMonth = getPreviousMonth(month);
  const { from: prevFrom, to: prevTo } = monthRange(previousMonth);
  const prevMonthTxns = txns.filter(
    (t) => t.dateISO >= prevFrom && t.dateISO <= prevTo && t.type === 'debit'
  );

  // Calculate budget data for each category
  const budgetData = budgets.map((b) => {
    const spent = monthTxns
      .filter((t) => t.categoryId === b.categoryId)
      .reduce((s, t) => s + t.amount, 0);

    const previousMonthSpent = prevMonthTxns
      .filter((t) => t.categoryId === b.categoryId)
      .reduce((s, t) => s + t.amount, 0);

    const categoryName = categories.find((c) => c.id === b.categoryId)?.name ?? 'Unknown';
    const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    const status = getBudgetStatus(percentage);

    return {
      budget: b,
      spent,
      previousMonthSpent,
      categoryName,
      status,
    };
  });

  // Calculate summary statistics
  const summaryData: BudgetSummaryData = {
    totalBudget: budgets.reduce((sum, b) => sum + b.limit, 0),
    totalSpent: budgetData.reduce((sum, d) => sum + d.spent, 0),
    categoriesCount: budgets.length,
    overBudgetCount: budgetData.filter((d) => d.status === 'over').length,
    warningCount: budgetData.filter((d) => d.status === 'warning').length,
    okCount: budgetData.filter((d) => d.status === 'safe').length,
  };

  // Sort budgets: over -> warning -> safe, then by name
  const sortedBudgetData = [...budgetData].sort((a, b) => {
    const statusOrder = { over: 0, warning: 1, safe: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.categoryName.localeCompare(b.categoryName);
  });

  // Calculate budget recommendation for selected category
  const categoryIdForRecommendation = editingBudget?.categoryId || selectedCategoryId;
  const budgetRecommendation = React.useMemo(() => {
    if (!categoryIdForRecommendation) {
      logger.info('BudgetsPage', '[BudgetsPage] No category selected for recommendation');
      return null;
    }
    const rec = calculateBudgetRecommendation(txns, categoryIdForRecommendation, 3);
    logger.info('BudgetsPage', '[BudgetsPage] Budget recommendation for category', categoryIdForRecommendation, ':', rec);
    return rec;
  }, [txns, categoryIdForRecommendation]);

  // Handlers
  const handleCreateBudget = () => {
    logger.info('BudgetsPage', '[BudgetsPage] Opening bulk budget editor');
    setBulkEditorOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setSelectedCategoryId(budget.categoryId);
    setEditorOpen(true);
  };

  const handleSaveBudget = async (data: { categoryId: string; month: string; limit: number }) => {
    const api = await getFinanceAPI();
    await api.upsertBudget(data);
    await loadData(); // Reload data after save
  };

  const handleSaveBulkBudgets = async (budgets: Array<{ categoryId: string; month: string; limit: number }>) => {
    const api = await getFinanceAPI();
    logger.info('BudgetsPage', '[BudgetsPage] Saving', budgets.length, 'budgets');
    // Save all budgets
    for (const budget of budgets) {
      await api.upsertBudget(budget);
    }
    await loadData(); // Reload data after save
  };

  const handleSaveTemplates = async (templates: Array<{ categoryId: string; defaultAmount: number }>) => {
    const api = await getFinanceAPI();
    logger.info('BudgetsPage', '[BudgetsPage] Saving', templates.length, 'templates');
    // Save all templates
    for (const template of templates) {
      await api.upsertBudgetTemplate(template);
    }
    await loadData(); // Reload data after save
  };

  const handleDeleteTemplate = async (categoryId: string) => {
    const api = await getFinanceAPI();
    await api.deleteBudgetTemplate(categoryId);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingBudget(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="mt-2 text-sm text-primary">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Budgets</h2>
          <p className="mt-1 text-sm text-primary opacity-70">
            Set budget templates once - they auto-apply to new months
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} months={months} />
          <button
            onClick={() => setTemplateManagerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105"
            title="Manage budget templates that auto-apply to new months"
          >
            <Settings className="h-4 w-4" />
            <span>Manage Templates</span>
          </button>
          <button
            onClick={handleCreateBudget}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {budgets.length > 0 && (
        <div className="mb-6">
          <BudgetSummary data={summaryData} month={month} />
        </div>
      )}

      {/* Empty state */}
      {budgets.length === 0 && (
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ring-primary/20 p-12 text-center mb-6">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold text-primary mb-2">No Budgets Yet</h3>
            <p className="text-sm text-primary opacity-70 mb-6">
              {templates.length > 0
                ? 'Your budget templates are set up! Navigate to a new month to see them auto-apply.'
                : 'Set up budget templates once and they\'ll automatically apply to every new month. No more manual copying!'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setTemplateManagerOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105"
              >
                <Settings className="h-5 w-5" />
                <span>{templates.length > 0 ? 'Edit Templates' : 'Set Up Templates'}</span>
              </button>
              <button
                onClick={handleCreateBudget}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                <span>Create Budget</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
          {sortedBudgetData.map((data) => (
            <BudgetCard
              key={data.budget.id}
              budget={data.budget}
              spent={data.spent}
              categoryName={data.categoryName}
              previousMonthSpent={data.previousMonthSpent}
              onEdit={() => handleEditBudget(data.budget)}
            />
          ))}
        </div>
      )}

      {/* Budget Editor Modal (for editing individual budgets) */}
      <BudgetEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveBudget}
        categories={categories}
        month={month}
        existingBudget={editingBudget}
        initialCategoryId={selectedCategoryId}
        previousMonthSpent={
          editingBudget
            ? prevMonthTxns
                .filter((t) => t.categoryId === editingBudget.categoryId)
                .reduce((s, t) => s + t.amount, 0)
            : undefined
        }
        recommendation={budgetRecommendation}
        onCategoryChange={setSelectedCategoryId}
        categoryName={
          editingBudget
            ? categories.find((c) => c.id === editingBudget.categoryId)?.name
            : undefined
        }
      />

      {/* Bulk Budget Editor Modal (for creating budgets for all categories) */}
      <BudgetBulkEditor
        isOpen={bulkEditorOpen}
        onClose={() => setBulkEditorOpen(false)}
        onSave={handleSaveBulkBudgets}
        categories={categories}
        transactions={txns}
        month={month}
        existingBudgets={new Map(budgets.map(b => [b.categoryId, b.limit]))}
      />

      {/* Budget Template Manager Modal */}
      <BudgetTemplateManager
        isOpen={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        onSave={handleSaveTemplates}
        onDelete={handleDeleteTemplate}
        categories={categories}
        existingTemplates={new Map(templates.map(t => [t.categoryId, t.defaultAmount]))}
      />
    </>
  );
};

export default BudgetsPage;
