/**
 * ReportsPage Component
 *
 * Main reports hub with tabbed interface for Cash Flow, Spending, and Income reports.
 * Matches the Forbes Advisor design with metric cards and visualizations.
 */

import React, { useState, useEffect } from 'react';
import { getFinanceAPI } from '../data';
import { getTimePeriodRange, getPreviousPeriodRange, type TimePeriod, type DateRange } from '../utils/timePeriodUtils';
import { useFinanceMetrics } from '../hooks/useFinanceMetrics';
import type { Transaction, Category, Account } from '../types';

// Components
import MetricCard from '../components/metrics/MetricCard';
import SavingsRateCard from '../components/metrics/SavingsRateCard';
import TimePeriodFilter from '../components/filters/TimePeriodFilter';
import CashFlowReport from '../components/reports/CashFlowReport';
import SpendingReport from '../components/reports/SpendingReport';
import IncomeReport from '../components/reports/IncomeReport';
import { DollarSign, TrendingDown, TrendingUp, PiggyBank, Filter } from 'lucide-react';

type ReportTab = 'cash-flow' | 'spending' | 'income';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('cash-flow');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last-6-months');
  const [loading, setLoading] = useState(true);

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Date ranges
  const currentPeriod = getTimePeriodRange(timePeriod);
  const previousPeriod = getPreviousPeriodRange(currentPeriod);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const api = await getFinanceAPI();
        const [{ items: txItems }, cats, accts] = await Promise.all([
          api.listTransactions({ limit: 5000 }),
          api.listCategories(),
          api.listAccounts(),
        ]);
        if (!mounted) return;
        console.log('📊 Finance Reports Debug:', {
          transactions: txItems.length,
          categories: cats.length,
          accounts: accts.length,
          sampleTransaction: txItems[0],
          transactionDates: txItems.slice(0, 5).map(t => ({ date: t.date, desc: t.description, amount: t.amount })),
        });
        setTransactions(txItems);
        setCategories(cats);
        setAccounts(accts);
      } catch (error) {
        console.error('Failed to load finance data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Calculate metrics using hook
  const metrics = useFinanceMetrics({
    transactions,
    categories,
    accounts,
    currentPeriod,
    previousPeriod,
    topCategoriesLimit: 10,
  });

  // Debug metrics
  React.useEffect(() => {
    if (!loading && transactions.length > 0) {
      console.log('📈 Metrics Calculated:', {
        timePeriod,
        dateRange: `${currentPeriod.startDate} to ${currentPeriod.endDate}`,
        totalIncome: metrics.summary.totalIncome,
        totalExpenses: metrics.summary.totalExpenses,
        netCashFlow: metrics.summary.netCashFlow,
        savingsRate: metrics.savingsRate.savingsRate,
        transactionCount: metrics.summary.transactionCount,
        categoryCount: metrics.categoryAggregates.length,
      });
    }
  }, [loading, transactions.length, metrics, timePeriod, currentPeriod]);

  const tabs = [
    { key: 'cash-flow' as const, label: 'Cash Flow', icon: DollarSign },
    { key: 'spending' as const, label: 'Spending', icon: TrendingDown },
    { key: 'income' as const, label: 'Income', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
          <p className="mt-2 text-sm text-primary">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Reports</h2>
          <p className="mt-1 text-sm text-primary opacity-70">
            Comprehensive financial insights and analytics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TimePeriodFilter value={timePeriod} onChange={setTimePeriod} />
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Income"
          value={metrics.summary.totalIncome}
          format="currency"
          colorScheme="positive"
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
          changePercent={metrics.trend?.incomeChangePercent}
        />
        <MetricCard
          title="Total Expenses"
          value={metrics.summary.totalExpenses}
          format="currency"
          colorScheme="negative"
          icon={<TrendingDown className="h-6 w-6 text-rose-600" />}
          changePercent={metrics.trend?.expensesChangePercent}
        />
        <MetricCard
          title="Total Net Income"
          value={metrics.summary.netCashFlow}
          format="currency"
          colorScheme={metrics.summary.netCashFlow >= 0 ? 'positive' : 'negative'}
          icon={<DollarSign className="h-6 w-6 text-slate-600" />}
          changePercent={metrics.trend?.netChangePercent}
        />
        <SavingsRateCard
          savingsRate={metrics.savingsRate.savingsRate}
          savings={metrics.savingsRate.savings}
          income={metrics.savingsRate.income}
          expenses={metrics.savingsRate.expenses}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-black opacity-60 hover:border-black hover:opacity-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report Content */}
      <div className="pb-8">
        {activeTab === 'cash-flow' && (
          <CashFlowReport
            transactions={transactions}
            categories={categories}
            dateRange={currentPeriod}
            metrics={metrics}
          />
        )}
        {activeTab === 'spending' && (
          <SpendingReport
            transactions={transactions}
            categories={categories}
            dateRange={currentPeriod}
            metrics={metrics}
          />
        )}
        {activeTab === 'income' && (
          <IncomeReport
            transactions={transactions}
            categories={categories}
            dateRange={currentPeriod}
            metrics={metrics}
          />
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
