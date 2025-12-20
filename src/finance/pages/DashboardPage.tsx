import React from 'react';
import { Card } from '../components/Card';
import { StackedBarChart } from '../components/StackedBarChart';
import SankeyChart from '../components/visualizations/SankeyChart';
import { FinancialInsightsCard } from '../components/insights/FinancialInsightsCard';
import { AccountModal } from '../components/AccountModal';
import { formatCurrency } from '../utils/currency';
import { currentMonth, monthRange, toMonth } from '../utils/date';
import { useFinanceMetrics, type FinanceMetrics } from '../hooks/useFinanceMetrics';
import {
  useTransactionsQuery,
  useAccountsQuery,
  useCategoriesQuery,
  useBudgetsQuery,
  useGoalsQuery,
} from '@/hooks/useFinanceQuery';
import { logger } from '@/services/logger';
import type { Transaction, Account } from '../types';
import { Pencil, Plus } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [showAccountModal, setShowAccountModal] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | undefined>(undefined);

  // React Query hooks
  const { data: transactions = [], isLoading: txnsLoading } = useTransactionsQuery({ limit: 500 });
  const { data: accounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useAccountsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetsQuery(month);
  const { data: goals = [], isLoading: goalsLoading } = useGoalsQuery();

  // useTransactionsQuery now returns Transaction[] directly (after our fix)
  const txns: Transaction[] = transactions;
  const loading = txnsLoading || accountsLoading || categoriesLoading || budgetsLoading || goalsLoading;

  const { from, to } = monthRange(month);
  // Filter transactions by extracting just the YYYY-MM part for comparison
  const monthTxns: Transaction[] = txns.filter((t: Transaction): boolean => {
    const txnMonth: string = t.dateISO.slice(0, 7); // Extract YYYY-MM
    return txnMonth === month;
  });

  // Debug logging
  React.useEffect((): void => {
    logger.debug('DashboardPage', 'Transaction Filtering', {
      selectedMonth: month,
      totalTransactions: txns.length,
      monthTransactions: monthTxns.length,
      allTxnMonths: [...new Set(txns.map((t: Transaction): string => t.dateISO.slice(0, 7)))].sort(),
      sampleTxns: txns.slice(0, 3).map((t: Transaction) => ({
        date: t.dateISO,
        month: t.dateISO.slice(0, 7),
        desc: t.description,
        type: t.type,
        amount: t.amount
      })),
      monthTxnsSample: monthTxns.slice(0, 3).map((t: Transaction) => ({
        date: t.dateISO,
        desc: t.description,
        type: t.type,
        amount: t.amount
      }))
    });
  }, [month, txns, monthTxns]);

  const income: number = monthTxns.filter((t: Transaction): boolean => t.type === 'credit').reduce((s: number, t: Transaction): number => s + t.amount, 0);
  const expense: number = monthTxns.filter((t: Transaction): boolean => t.type === 'debit').reduce((s: number, t: Transaction): number => s + t.amount, 0);
  const cashflow: number = income - expense;

  // Debug income calculation
  React.useEffect((): void => {
    const incomeTxns = monthTxns.filter((t: Transaction): boolean => t.type === 'credit');
    logger.debug('DashboardPage', 'Income Calculation', {
      selectedMonth: month,
      totalIncomeTxns: incomeTxns.length,
      totalIncomeAmount: income,
      incomeTxnsSample: incomeTxns.slice(0, 5).map((t: Transaction) => ({
        date: t.dateISO,
        month: t.dateISO.slice(0, 7),
        desc: t.description,
        amount: t.amount,
        type: t.type
      })),
      allCreditTxns: txns.filter((t: Transaction): boolean => t.type === 'credit').length
    });
  }, [month, monthTxns, income, txns]);

  // Calculate metrics for Money Flow visualization
  const currentPeriod = React.useMemo((): { from: string; to: string; label: string } => {
    return {
      from: from,
      to: to,
      label: month,
    };
  }, [from, to, month]);

  const previousPeriod = React.useMemo((): { from: string; to: string; label: string } => {
    const [year, monthNum]: number[] = month.split('-').map(Number);
    const prevMonth: number = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear: number = monthNum === 1 ? year - 1 : year;
    const prevMonthStr: string = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const { from: prevFrom, to: prevTo } = monthRange(prevMonthStr);
    return {
      from: prevFrom,
      to: prevTo,
      label: prevMonthStr,
    };
  }, [month]);

  // Only calculate metrics after data is loaded
  const metrics: FinanceMetrics = useFinanceMetrics({
    transactions: loading ? [] : txns,
    categories: loading ? [] : categories,
    accounts: loading ? [] : accounts,
    currentPeriod,
    previousPeriod,
    topCategoriesLimit: 10,
  });

  // Debug metrics
  React.useEffect((): void => {
    if (!loading && txns.length > 0) {
      logger.debug('DashboardPage', 'Metrics Debug', {
        sankeyDataLength: metrics.sankeyData.length,
        sankeyData: metrics.sankeyData,
        currentPeriod,
        txnsTotal: txns.length,
        monthTxnsTotal: monthTxns.length,
        categoriesTotal: categories.length,
      });
    }
  }, [loading, metrics.sankeyData, currentPeriod, txns, monthTxns, categories]);

  // Calculate spending by category
  const spendingMap: Record<string, number> = monthTxns.filter((t: Transaction): boolean => t.type === 'debit').reduce<Record<string, number>>((acc: Record<string, number>, t: Transaction): Record<string, number> => {
    const key: string = t.categoryId ?? 'uncategorized';
    acc[key] = (acc[key] ?? 0) + t.amount;
    return acc;
  }, {});

  // Include all budgeted categories, even if there's no spending
  const allCategoryIds: Set<string> = new Set([
    ...Object.keys(spendingMap),
    ...budgets.map((b) => b.categoryId)
  ]);

  // top 5 categories by spend or budget
  const spendByCat: Array<{ catId: string; name: string; total: number; budget: number }> = Array.from(allCategoryIds)
    .map((catId: string): { catId: string; name: string; total: number; budget: number } => {
      const budget = budgets.find((b) => b.categoryId === catId);
      const total: number = spendingMap[catId] ?? 0;
      return {
        catId,
        name: categories.find((c) => c.id === catId)?.name ?? 'Uncategorized',
        total,
        budget: budget?.limit ?? 0,
      };
    })
    .sort((a, b): number => {
      // Sort by spending first, then by budget
      if (b.total !== a.total) return b.total - a.total;
      return b.budget - a.budget;
    })
    .slice(0, 5);

  // Get months from transactions and ensure current month is included
  const monthsInTx: string[] = Array.from(
    new Set([...txns.map((t: Transaction): string => toMonth(t.dateISO)), currentMonth()])
  ).sort();

  // Get top 5 categories for stacked chart
  const topCategoriesForChart: Array<{ id: string; name: string; total: number }> = Array.from(allCategoryIds)
    .map((catId: string): { id: string; name: string; total: number } => {
      const total: number = spendingMap[catId] ?? 0;
      return {
        id: catId,
        name: categories.find((c) => c.id === catId)?.name ?? 'Uncategorized',
        total,
      };
    })
    .sort((a, b): number => b.total - a.total)
    .slice(0, 5);

  // Define colors for categories
  const categoryColors: string[] = [
    '#0f172a', // slate-900
    '#1e40af', // blue-700
    '#7c3aed', // violet-600
    '#db2777', // pink-600
    '#ea580c', // orange-600
  ];

  const stackKeys: Array<{ key: string; color: string; label: string }> = topCategoriesForChart.map((cat, idx: number): { key: string; color: string; label: string } => ({
    key: cat.id,
    color: categoryColors[idx] ?? '#64748b',
    label: cat.name,
  }));

  // Calculate month-on-month spending by category (last 6 months)
  const last6Months: string[] = monthsInTx.slice(-6);
  const momData: Array<Record<string, string | number>> = last6Months.map((m: string): Record<string, string | number> => {
    const { from: mFrom, to: mTo } = monthRange(m);
    const mTxns: Transaction[] = txns.filter((t: Transaction): boolean => t.dateISO >= mFrom && t.dateISO <= mTo && t.type === 'debit');
    const dataPoint: Record<string, string | number> = { month: m };

    // Calculate spending for top categories only
    topCategoriesForChart.forEach((cat): void => {
      const catSpending: number = mTxns
        .filter((t: Transaction): boolean => t.categoryId === cat.id)
        .reduce((sum: number, t: Transaction): number => sum + t.amount, 0);
      dataPoint[cat.id] = catSpending;
    });

    return dataPoint;
  });

  // Calculate spending trends for ALL available months (full history)
  const spendingTrendsData: Array<Record<string, string | number>> = monthsInTx.map((m: string): Record<string, string | number> => {
    const { from: mFrom, to: mTo } = monthRange(m);
    const mTxns: Transaction[] = txns.filter((t: Transaction): boolean => t.dateISO >= mFrom && t.dateISO <= mTo && t.type === 'debit');
    const dataPoint: Record<string, string | number> = { month: m };

    // Calculate spending for top categories
    topCategoriesForChart.forEach((cat): void => {
      const catSpending: number = mTxns
        .filter((t: Transaction): boolean => t.categoryId === cat.id)
        .reduce((sum: number, t: Transaction): number => sum + t.amount, 0);
      dataPoint[cat.id] = catSpending;
    });

    return dataPoint;
  });

  return (
    <>
      <div className="space-y-4">
        {/* Financial Insights - Full Width */}
        <div className="w-full">
          <FinancialInsightsCard
            transactions={txns}
            accounts={accounts}
            goals={goals}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Month" actions={
          <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={month} onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setMonth(e.target.value)}>
            {monthsInTx.map((m: string) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        }>
          <div className="text-sm text-slate-600">Showing data for {month}</div>
        </Card>

      <Card title={`Cash Flow (${month})`}>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="rounded-lg bg-emerald-50 p-3">
              <div className="text-emerald-700">Income</div>
              <div className="text-lg font-semibold">{formatCurrency(income)}</div>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <div className="text-rose-700">Expenses</div>
              <div className="text-lg font-semibold">{formatCurrency(expense)}</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="text-blue-700">Savings</div>
              <div className="text-lg font-semibold">{formatCurrency(cashflow)}</div>
              <div className="text-xs text-blue-600 mt-1">
                {income > 0 ? `${((cashflow / income) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-slate-700">Net</div>
              <div className="text-lg font-semibold">{formatCurrency(cashflow)}</div>
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Accounts Snapshot"
        actions={
          <button
            onClick={() => {
              setEditingAccount(undefined);
              setShowAccountModal(true);
            }}
            className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} />
            Add Account
          </button>
        }
      >
        <div className="space-y-2 text-sm">
          {accounts.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              No accounts yet. Click "Add Account" to create one.
            </div>
          ) : (
            accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 group hover:bg-slate-100 transition-colors">
                <div className="flex-1">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-slate-500">{a.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">
                    {formatCurrency(a.liability ? -a.balance : a.balance)}
                  </div>
                  <button
                    onClick={() => {
                      setEditingAccount(a);
                      setShowAccountModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                    title="Edit account"
                  >
                    <Pencil size={14} className="text-slate-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Top Categories vs Budget" className="md:col-span-2 xl:col-span-2">
        <div className="space-y-2 text-sm">
          {spendByCat.map((c) => (
            <div key={c.catId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <div className="w-40 truncate font-medium" title={c.name}>
                {c.name}
              </div>
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div className={`h-2 rounded-full ${c.total > c.budget && c.budget > 0 ? 'bg-rose-600' : 'bg-slate-900'}`} style={{ width: `${c.budget ? Math.min(100, (c.total / c.budget) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(c.total)}</div>
                <div className="text-xs text-slate-500">Budget {formatCurrency(c.budget)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Money Flow Visualization"
        className="md:col-span-2 xl:col-span-3"
        description="Visual representation of income sources flowing to expense categories"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading chart data…</div>
          </div>
        ) : metrics.sankeyData.length > 0 ? (
          <div className="pt-2">
            <SankeyChart data={metrics.sankeyData} width={800} height={500} />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">No cash flow data for this period</div>
          </div>
        )}
      </Card>

      <Card
        title="Recent Spending Trends"
        className="md:col-span-2 xl:col-span-3"
        description="Top 5 spending categories over the last 6 months"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading chart data…</div>
          </div>
        ) : momData.length > 0 && stackKeys.length > 0 ? (
          <div className="pt-2">
            <StackedBarChart data={momData} xKey="month" stackKeys={stackKeys} height={360} />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">No spending data available</div>
          </div>
        )}
      </Card>

      <Card
        title="Full Spending History"
        className="md:col-span-2 xl:col-span-3"
        description="All-time spending breakdown by top categories"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading chart data…</div>
          </div>
        ) : spendingTrendsData.length > 0 && stackKeys.length > 0 ? (
          <div className="pt-2">
            <StackedBarChart data={spendingTrendsData} xKey="month" stackKeys={stackKeys} height={360} />
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">No historical spending data available</div>
          </div>
        )}
      </Card>
        </div>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <AccountModal
          account={editingAccount}
          onClose={() => {
            setShowAccountModal(false);
            setEditingAccount(undefined);
          }}
          onSuccess={() => {
            void refetchAccounts();
          }}
        />
      )}
    </>
  );
};

export default DashboardPage;
