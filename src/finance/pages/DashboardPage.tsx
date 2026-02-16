import React from 'react';
import { Card } from '../components/Card';
import SankeyChart from '../components/visualizations/SankeyChart';
import { AccountModal } from '../components/AccountModal';
import { formatCurrency } from '../utils/currency';
import { currentMonth, monthRange, toMonth, formatMonth } from '../utils/date';
import { useFinanceMetrics, type FinanceMetrics } from '../hooks/useFinanceMetrics';
import {
  useTransactionsQuery,
  useAccountsQuery,
  useCategoriesQuery,
  useBudgetsQuery,
} from '@/hooks/useFinanceQuery';
import { useCurrentUserId, useMergedConnection, usePartnerName } from '@/hooks/useOwnerInfo';
import { logger } from '@/services/logger';
import type { Transaction, Account } from '../types';
import { Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { OwnerBadge } from '../../components/common/OwnerBadge';
import { SplitMetricCard } from '../components/SplitMetricCard';
import { OwnerFilter } from '../components/OwnerFilter';
import useFinanceFilters from '../store/useFinanceFilters';

const DashboardPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [showAccountModal, setShowAccountModal] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | undefined>(undefined);

  // Auth and merged connection (using standardized hooks)
  const { user } = useAuth();
  const { data: currentUserId } = useCurrentUserId();
  const { data: mergedConnection } = useMergedConnection('finances');
  const { data: partnerName } = usePartnerName('finances');

  // React Query hooks
  const { data: transactions = [], isLoading: txnsLoading } = useTransactionsQuery({ limit: 500 });
  const { data: accounts = [], isLoading: accountsLoading, refetch: refetchAccounts } = useAccountsQuery();
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

  const { from, to } = monthRange(month);
  // Filter transactions by extracting just the YYYY-MM part for comparison
  const monthTxns: Transaction[] = filteredTxns.filter((t: Transaction): boolean => {
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

  // Net worth split by owner
  const myNetWorth = React.useMemo(() => {
    if (!user) return 0;
    return accounts
      .filter((a: Account) => a.userId === user.id)
      .reduce((sum: number, a: Account) => {
        return sum + (a.liability ? -a.balance : a.balance);
      }, 0);
  }, [accounts, user]);

  const partnerNetWorth = React.useMemo(() => {
    if (!user) return 0;
    return accounts
      .filter((a: Account) => a.userId !== user.id)
      .reduce((sum: number, a: Account) => {
        return sum + (a.liability ? -a.balance : a.balance);
      }, 0);
  }, [accounts, user]);

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

  // Get months from transactions and ensure current month is included
  const monthsInTx: string[] = Array.from(
    new Set([...filteredTxns.map((t: Transaction): string => toMonth(t.dateISO)), currentMonth()])
  ).sort();



  return (
    <>
      <div className="space-y-6">
        {/* Owner Filter - only show in merged mode */}
        {mergedConnection && (
          <div className="flex justify-end">
            <OwnerFilter
              value={filters.ownerFilter}
              onChange={filters.setOwnerFilter}
              partnerName={partnerName}
            />
          </div>
        )}

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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <>
                  <div className="rounded-xl bg-slate-100 animate-pulse h-48"></div>
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
                  <SplitMetricCard
                    title="Net Worth"
                    myValue={myNetWorth}
                    partnerValue={partnerNetWorth}
                    partnerName={partnerName}
                    colorScheme="networth"
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
                  <Card title="Net Worth">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(filters.ownerFilter === 'mine' ? myNetWorth : partnerNetWorth)}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Month" actions={
          <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={month} onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => setMonth(e.target.value)}>
            {monthsInTx.map((m: string) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        }>
          <div className="h-2"></div>
        </Card>

      {/* Simple Cash Flow Card for Non-Merged Mode */}
      {!mergedConnection && (
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
      )}

      <Card
        title="Accounts Snapshot"
        className="md:col-span-2"
        actions={
          <button
            onClick={() => {
              setEditingAccount(undefined);
              setShowAccountModal(true);
            }}
            className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 transition-colors"
            aria-label="Add account"
          >
            <Plus size={16} />
            Add Account
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {filteredAccounts.length === 0 ? (
            <div className="col-span-full text-center py-6 text-slate-500">
              {filters.ownerFilter === 'all' ? 'No accounts yet. Click "Add Account" to create one.' : 'No accounts for this owner filter.'}
            </div>
          ) : (
            filteredAccounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 group hover:bg-slate-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{a.name}</div>
                    {mergedConnection && user && (
                      <OwnerBadge
                        userId={a.userId}
                        currentUserId={user.id}
                        partnerName={partnerName}
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{a.type}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
                    aria-label="Edit account"
                  >
                    <Pencil size={14} className="text-slate-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Budget Progress (Top 5 Categories)" className="md:col-span-2 xl:col-span-2">
        <div className="space-y-3">
          {spendByCat.slice(0, 5).map((c) => {
            const percentage = c.budget > 0 ? Math.min(100, (c.total / c.budget) * 100) : 0;
            const isOverBudget = c.total > c.budget && c.budget > 0;

            // Create visual block progress bar (10 blocks total)
            const filledBlocks = Math.round((percentage / 100) * 10);
            const emptyBlocks = 10 - filledBlocks;
            const blockBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

            return (
              <div key={c.catId} className="flex items-center gap-4">
                {/* Category Name */}
                <div className="w-32 truncate font-medium text-slate-900" title={c.name}>
                  {c.name}
                </div>

                {/* Spent / Budget */}
                <div className="w-32 text-sm text-slate-600">
                  {formatCurrency(c.total)} / {formatCurrency(c.budget)}
                </div>

                {/* Visual Block Progress Bar */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`font-mono text-sm tracking-tight ${
                    isOverBudget ? 'text-rose-500' : 'text-blue-500'
                  }`}>
                    [{blockBar}]
                  </span>
                </div>

                {/* Percentage */}
                <div className={`w-12 text-right text-sm font-semibold ${
                  isOverBudget ? 'text-rose-600' : 'text-slate-700'
                }`}>
                  {Math.round(percentage)}%
                </div>

                {/* Owner Badge */}
                {mergedConnection && user && (
                  <div className="w-20 text-right text-xs">
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
            );
          })}
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Transactions" className="md:col-span-2 xl:col-span-2">
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
                <div key={txn.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">{txn.description}</span>
                      {mergedConnection && user && (
                        <OwnerBadge
                          userId={txn.userId}
                          currentUserId={user.id}
                          partnerName={partnerName}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(txn.dateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' • '}
                      {category?.name || 'Uncategorized'}
                    </div>
                  </div>
                  <div className={`font-semibold text-sm ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(txn.amount))}
                  </div>
                </div>
              );
            })
          )}
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
