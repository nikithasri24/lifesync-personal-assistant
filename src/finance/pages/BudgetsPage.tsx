import React from 'react';
import { Plus, Copy } from 'lucide-react';
import { currentMonth, monthRange } from '../utils/date';
import { getFinanceAPI } from '../data';
import type { Budget, Transaction, Category } from '../types';
import { MonthPicker } from '../components/MonthPicker';
import BudgetCard from '../components/budgets/BudgetCard';
import BudgetSummary, { type BudgetSummaryData } from '../components/budgets/BudgetSummary';
import BudgetEditor from '../components/budgets/BudgetEditor';
import { getBudgetStatus } from '../components/budgets/BudgetProgressBar';

const BudgetsPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [txns, setTxns] = React.useState<Transaction[]>([]);
  const [months, setMonths] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<Budget | undefined>(undefined);

  // Load data
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const api = await getFinanceAPI();
      const [{ items }, b, c] = await Promise.all([
        api.listTransactions({ limit: 1000 }),
        api.listBudgets(month),
        api.listCategories(),
      ]);
      setTxns(items);
      setBudgets(b);
      setCategories(c);
      setMonths(Array.from(new Set(items.map((t) => t.dateISO.slice(0, 7)))).sort().reverse());
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  }, [month]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Handlers
  const handleCreateBudget = () => {
    setEditingBudget(undefined);
    setEditorOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setEditorOpen(true);
  };

  const handleSaveBudget = async (data: { categoryId: string; month: string; limit: number }) => {
    const api = await getFinanceAPI();
    await api.upsertBudget(data);
    await loadData(); // Reload data after save
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Budgets</h2>
          <p className="mt-1 text-sm text-primary opacity-70">
            Track your spending against monthly budgets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} months={months} />
          <button
            onClick={() => console.log('Copy last month - TODO')}
            className="inline-flex items-center gap-2 rounded-md bg-primary/20 hover:bg-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy Last Month
          </button>
          <button
            onClick={handleCreateBudget}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Budget
          </button>
        </div>
      </div>

      {/* Summary Card */}
      {budgets.length > 0 && <BudgetSummary data={summaryData} month={month} />}

      {/* Empty state */}
      {budgets.length === 0 && (
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ring-primary/20 p-12 text-center">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold text-primary mb-2">No Budgets Yet</h3>
            <p className="text-sm text-primary opacity-70 mb-6">
              Get started by creating your first budget. Assign every dollar a job and take control
              of your spending.
            </p>
            <button
              onClick={handleCreateBudget}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Budget
            </button>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      {/* Budget Editor Modal */}
      <BudgetEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveBudget}
        categories={categories}
        month={month}
        existingBudget={editingBudget}
        previousMonthSpent={
          editingBudget
            ? prevMonthTxns
                .filter((t) => t.categoryId === editingBudget.categoryId)
                .reduce((s, t) => s + t.amount, 0)
            : undefined
        }
        categoryName={
          editingBudget
            ? categories.find((c) => c.id === editingBudget.categoryId)?.name
            : undefined
        }
      />
    </div>
  );
};

export default BudgetsPage;

