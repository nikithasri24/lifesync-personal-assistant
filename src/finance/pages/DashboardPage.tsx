import React from 'react';
import { Card } from '../components/Card';
import SankeyChart from '../components/visualizations/SankeyChart';
import { formatCurrency } from '../utils/currency';
import { currentMonth, monthRange, formatMonth } from '../utils/date';
import { filterTransfers } from '../utils/cashFlowCalculator';
import { useFinanceMetrics, type FinanceMetrics } from '../hooks/useFinanceMetrics';
import {
  useTransactionsQuery,
  useTransactionMonthsQuery,
  useAccountsQuery,
  useCategoriesQuery,
  useBudgetsQuery,
} from '@/hooks/useFinanceQuery';
import { useCurrentUserId, useMergedConnection, usePartnerName } from '@/hooks/useOwnerInfo';
import { logger } from '@/services/logger';
import type { Transaction, Account } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { OwnerBadge } from '../../components/common/OwnerBadge';
import { SplitMetricCard } from '../components/SplitMetricCard';
import { OwnerFilter } from '../components/OwnerFilter';
import useFinanceFilters from '../store/useFinanceFilters';
import { useThemeColors } from '@/hooks/useThemeColors';

const DashboardPage: React.FC = () => {
  const colors = useThemeColors();
  const [month, setMonth] = React.useState(currentMonth());
  // Auth and merged connection (using standardized hooks)
  const { user } = useAuth();
  const { data: currentUserId } = useCurrentUserId();
  const { data: mergedConnection } = useMergedConnection('finances');
  const { data: partnerName } = usePartnerName('finances');

  // Calculate month range early for query filtering
  const { from, to } = React.useMemo(() => monthRange(month), [month]);

  // React Query hooks - fetch only current month's data
  const { data: transactions = [], isLoading: txnsLoading } = useTransactionsQuery({
    fromISO: from,
    toISO: to,
    limit: 200  // Reduced from 500 - only need 1 month
  });
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetsQuery(month);
  const filters = useFinanceFilters();

  // useTransactionsQuery now returns Transaction[] directly (after our fix)
  const txns: Transaction[] = transactions;
  const loading = txnsLoading || accountsLoading || categoriesLoading || budgetsLoading;

  // Filter data by owner (if in merged mode and filter is active)
  const filteredTxns = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return txns;
    if (filters.ownerFilter === 'mine') return txns.filter(t => t.userId === user?.id);
    if (filters.ownerFilter === 'partner') return txns.filter(t => t.userId !== user?.id);
    return txns;
  }, [txns, mergedConnection, filters.ownerFilter, user]);

  const filteredAccounts = React.useMemo(() => {
    if (!mergedConnection || filters.ownerFilter === 'all') return accounts;
    if (filters.ownerFilter === 'mine') return accounts.filter(a => a.userId === user?.id);
    if (filters.ownerFilter === 'partner') return accounts.filter(a => a.userId !== user?.id);
    return accounts;
  }, [accounts, mergedConnection, filters.ownerFilter, user]);

  // Transactions are already filtered by date from query.
  // Also strip inter-account transfers (Credit Card Payments etc.) to avoid double-counting.
  const monthTxns: Transaction[] = React.useMemo(
    () => filterTransfers(filteredTxns, categories),
    [filteredTxns, categories]
  );

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

  // Split metrics by owner (for merged mode)
  const myIncome = React.useMemo(() => {
    if (!user) return 0;
    return monthTxns
      .filter((t: Transaction): boolean => t.type === 'credit' && t.userId === user.id)
      .reduce((s: number, t: Transaction): number => s + t.amount, 0);
  }, [monthTxns, user]);

  const partnerIncome = React.useMemo(() => {
    if (!user) return 0;
    return monthTxns
      .filter((t: Transaction): boolean => t.type === 'credit' && t.userId !== user.id)
      .reduce((s: number, t: Transaction): number => s + t.amount, 0);
  }, [monthTxns, user]);

  const myExpense = React.useMemo(() => {
    if (!user) return 0;
    return monthTxns
      .filter((t: Transaction): boolean => t.type === 'debit' && t.userId === user.id)
      .reduce((s: number, t: Transaction): number => s + t.amount, 0);
  }, [monthTxns, user]);

  const partnerExpense = React.useMemo(() => {
    if (!user) return 0;
    return monthTxns
      .filter((t: Transaction): boolean => t.type === 'debit' && t.userId !== user.id)
      .reduce((s: number, t: Transaction): number => s + t.amount, 0);
  }, [monthTxns, user]);

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

  // Only calculate metrics after data is loaded - use filtered data
  const metrics: FinanceMetrics = useFinanceMetrics({
    transactions: loading ? [] : filteredTxns,
    categories: loading ? [] : categories,
    accounts: loading ? [] : filteredAccounts,
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

  // Calculate spending by category and track ownership
  const spendingMap: Record<string, number> = monthTxns.filter((t: Transaction): boolean => t.type === 'debit').reduce<Record<string, number>>((acc: Record<string, number>, t: Transaction): Record<string, number> => {
    const key: string = t.categoryId ?? 'uncategorized';
    acc[key] = (acc[key] ?? 0) + t.amount;
    return acc;
  }, {});

  // Calculate who spent in each category
  const categoryOwnership: Record<string, { hasMe: boolean; hasPartner: boolean }> = React.useMemo(() => {
    const ownership: Record<string, { hasMe: boolean; hasPartner: boolean }> = {};

    monthTxns.filter((t: Transaction): boolean => t.type === 'debit').forEach((t: Transaction) => {
      const key: string = t.categoryId ?? 'uncategorized';
      if (!ownership[key]) {
        ownership[key] = { hasMe: false, hasPartner: false };
      }

      if (user && t.userId === user.id) {
        ownership[key].hasMe = true;
      } else {
        ownership[key].hasPartner = true;
      }
    });

    return ownership;
  }, [monthTxns, user]);

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

  // Fetch distinct months that actually have transactions — lightweight query (date column only)
  const { data: monthsInTx = [currentMonth()] } = useTransactionMonthsQuery();



  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2" style={{ color: colors.text.primary }}>
                <span className="text-4xl">🏠</span>
                Dashboard
              </h1>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Overview of your financial health and activity
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Month Selector - always visible in header */}
              <select
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                value={month}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setMonth(e.target.value)}
                aria-label="Select month"
              >
                {monthsInTx.map((m: string) => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
              </select>
              {/* Owner Filter - merged mode only */}
              {mergedConnection && (
                <OwnerFilter
                  value={filters.ownerFilter}
                  onChange={filters.setOwnerFilter}
                  partnerName={partnerName}
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">

        {/* Metrics Section - Adapts to Owner Filter in Merged Mode */}
        {mergedConnection && user && (
          <div className="w-full">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-blue-500"></span>
              {filters.ownerFilter === 'all' ? 'Household Overview' :
               filters.ownerFilter === 'mine' ? 'My Overview' :
               `${partnerName}'s Overview`}
              <span className="text-sm font-normal text-slate-500">({month})</span>
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {loading ? (
                <>
                  <div className="rounded-xl bg-slate-100 animate-pulse h-48"></div>
                  <div className="rounded-xl bg-slate-100 animate-pulse h-48"></div>
                </>
              ) : filters.ownerFilter === 'all' ? (
                <>
                  <SplitMetricCard
                    title="Income"
                    myValue={myIncome}
                    partnerValue={partnerIncome}
                    partnerName={partnerName}
                    colorScheme="income"
                  />
                  <SplitMetricCard
                    title="Expenses"
                    myValue={myExpense}
                    partnerValue={partnerExpense}
                    partnerName={partnerName}
                    colorScheme="expense"
                  />
                </>
              ) : (
                <>
                  <Card title="Income">
                    <div className="text-3xl font-bold text-emerald-600">
                      {formatCurrency(filters.ownerFilter === 'mine' ? myIncome : partnerIncome)}
                    </div>
                  </Card>
                  <Card title="Expenses">
                    <div className="text-3xl font-bold text-rose-600">
                      {formatCurrency(filters.ownerFilter === 'mine' ? myExpense : partnerExpense)}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* Money Flow Visualization */}
        <Card
          title="Money Flow Visualization"
          description={`Income sources flowing to expense categories · ${formatMonth(month)}`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-slate-500">Loading chart data…</div>
            </div>
          ) : metrics.sankeyData.length > 0 ? (
            <div className="pt-2 w-full">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[600px]">
                  <SankeyChart
                    data={metrics.sankeyData}
                    categoryColors={Object.fromEntries(
                      categories.filter(c => c.color).map(c => [c.name, c.color!])
                    )}
                    width={800}
                    height={480}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-slate-500">No cash flow data for this period</div>
            </div>
          )}
        </Card>

        {/* Simple Cash Flow Card for Non-Merged Mode */}
        {!mergedConnection && (
          <Card title={`Cash Flow (${month})`}>
            {loading ? (
              <div>Loading…</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-emerald-700 font-medium">Income</div>
                  <div className="text-lg font-semibold">{formatCurrency(income)}</div>
                </div>
                <div className="rounded-lg bg-rose-50 p-3">
                  <div className="text-rose-700 font-medium">Expenses</div>
                  <div className="text-lg font-semibold">{formatCurrency(expense)}</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-blue-700 font-medium">Savings</div>
                  <div className="text-lg font-semibold">{formatCurrency(cashflow)}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {income > 0 ? `${((cashflow / income) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-slate-700 font-medium">Net</div>
                  <div className="text-lg font-semibold">{formatCurrency(cashflow)}</div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Budget Progress - Full Width */}
        <Card title="Budget Progress (Top 5 Categories)">
        <div className="space-y-4">
          {spendByCat.slice(0, 5).map((c) => {
            const percentage = c.budget > 0 ? Math.min(100, (c.total / c.budget) * 100) : 0;
            const isOverBudget = c.total > c.budget && c.budget > 0;

            return (
              <div key={c.catId} className="space-y-2">
                {/* Category Name and Amount */}
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-900">{c.name}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-sm text-slate-600">
                      {formatCurrency(c.total)} / {formatCurrency(c.budget)}
                    </div>
                    {mergedConnection && user && (
                      <div className="text-xs">
                        {(() => {
                          const ownership = categoryOwnership[c.catId];
                          if (!ownership) return <span className="text-slate-500">-</span>;
                          if (ownership.hasMe && ownership.hasPartner) {
                            return <span className="text-slate-600 font-medium">Both</span>;
                          } else if (ownership.hasMe) {
                            return <span className="text-blue-600 font-medium">Me</span>;
                          } else if (ownership.hasPartner) {
                            return <span className="text-purple-600 font-medium">{partnerName}</span>;
                          }
                          return <span className="text-slate-500">-</span>;
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOverBudget ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <div className={`text-sm font-semibold min-w-[3rem] text-right ${
                    isOverBudget ? 'text-rose-600' : 'text-slate-700'
                  }`}>
                    {Math.round(percentage)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

        {/* Recent Transactions - Full Width */}
        <Card title="Recent Transactions">
          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-slate-500">Loading transactions…</div>
            ) : monthTxns.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-6">No transactions this month</div>
            ) : (
              monthTxns.slice(0, 8).map((txn) => {
                const category = categories.find((c) => c.id === txn.categoryId);
                const isIncome = txn.type === 'credit';

                return (
                  <div key={txn.id} className="py-3 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="font-medium text-slate-900">{txn.description}</span>
                      <div className={`font-semibold text-sm flex-shrink-0 ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-500">
                        {new Date(txn.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' • '}
                        {category?.name || 'Uncategorized'}
                      </div>
                      {mergedConnection && user && (
                        <OwnerBadge
                          userId={txn.userId}
                          currentUserId={user.id}
                          partnerName={partnerName}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
