import React from 'react';
import { Card } from '../components/Card';
import { StackedBarChart } from '../components/StackedBarChart';
import { formatCurrency } from '../utils/currency';
import { currentMonth, monthRange, toMonth } from '../utils/date';
import { getFinanceAPI } from '../data';
import type { Transaction } from '../types';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [month, setMonth] = React.useState(currentMonth());
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [budgets, setBudgets] = React.useState<any[]>([]);
  const [txns, setTxns] = React.useState<Transaction[]>([]);

  // Initialize month from transactions only on first load
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const api = await getFinanceAPI();

      // On first load, get transactions and use current month by default
      if (!initialized) {
        const { items: txItems } = await api.listTransactions({ limit: 500 });
        if (!mounted) return;

        // Use current month instead of latest transaction month
        // This ensures budgets are shown for the current month
        const defaultMonth = currentMonth();

        setTxns(txItems);
        setMonth(defaultMonth);
        setInitialized(true);
        setLoading(false);
        return;
      }

      // Load all data for the selected month
      const [{ items: txItems }, accts, cats, b] = await Promise.all([
        api.listTransactions({ limit: 500 }),
        api.listAccounts(),
        api.listCategories(),
        api.listBudgets(month),
      ]);
      if (!mounted) return;
      setTxns(txItems);
      setAccounts(accts);
      setCategories(cats);
      setBudgets(b);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [month, initialized]);

  const { from, to } = monthRange(month);
  const monthTxns = txns.filter((t) => t.dateISO >= from && t.dateISO <= to);
  const income = monthTxns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const cashflow = income - expense;

  // Calculate spending by category
  const spendingMap = monthTxns.filter((t) => t.type === 'debit').reduce<Record<string, number>>((acc, t) => {
    const key = t.categoryId ?? 'uncategorized';
    acc[key] = (acc[key] ?? 0) + t.amount;
    return acc;
  }, {});

  // Include all budgeted categories, even if there's no spending
  const allCategoryIds = new Set([
    ...Object.keys(spendingMap),
    ...budgets.map(b => b.categoryId)
  ]);

  // top 5 categories by spend or budget
  const spendByCat = Array.from(allCategoryIds)
    .map((catId) => {
      const budget = budgets.find((b) => b.categoryId === catId);
      const total = spendingMap[catId] || 0;
      return {
        catId,
        name: categories.find((c) => c.id === catId)?.name ?? 'Uncategorized',
        total,
        budget: budget?.limit ?? 0,
      };
    })
    .sort((a, b) => {
      // Sort by spending first, then by budget
      if (b.total !== a.total) return b.total - a.total;
      return b.budget - a.budget;
    })
    .slice(0, 5);

  // Get months from transactions and ensure current month is included
  const monthsInTx = Array.from(
    new Set([...txns.map((t) => toMonth(t.dateISO)), currentMonth()])
  ).sort();

  // Get top 5 categories for stacked chart
  const topCategoriesForChart = Array.from(allCategoryIds)
    .map((catId) => {
      const total = spendingMap[catId] || 0;
      return {
        id: catId,
        name: categories.find((c) => c.id === catId)?.name ?? 'Uncategorized',
        total,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Define colors for categories
  const categoryColors = [
    '#0f172a', // slate-900
    '#1e40af', // blue-700
    '#7c3aed', // violet-600
    '#db2777', // pink-600
    '#ea580c', // orange-600
  ];

  const stackKeys = topCategoriesForChart.map((cat, idx) => ({
    key: cat.id,
    color: categoryColors[idx] || '#64748b',
    label: cat.name,
  }));

  // Calculate month-on-month spending by category (last 6 months)
  const last6Months = monthsInTx.slice(-6);
  const momData = last6Months.map((m) => {
    const { from: mFrom, to: mTo } = monthRange(m);
    const mTxns = txns.filter((t) => t.dateISO >= mFrom && t.dateISO <= mTo && t.type === 'debit');
    const dataPoint: Record<string, any> = { month: m };

    // Calculate spending for top categories only
    topCategoriesForChart.forEach((cat) => {
      const catSpending = mTxns
        .filter((t) => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      dataPoint[cat.id] = catSpending;
    });

    return dataPoint;
  });

  // Calculate spending trends for ALL available months (full history)
  const spendingTrendsData = monthsInTx.map((m) => {
    const { from: mFrom, to: mTo } = monthRange(m);
    const mTxns = txns.filter((t) => t.dateISO >= mFrom && t.dateISO <= mTo && t.type === 'debit');
    const dataPoint: Record<string, any> = { month: m };

    // Calculate spending for top categories
    topCategoriesForChart.forEach((cat) => {
      const catSpending = mTxns
        .filter((t) => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      dataPoint[cat.id] = catSpending;
    });

    return dataPoint;
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Month" actions={
        <select className="rounded-md border border-slate-300 px-2 py-1 text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
          {monthsInTx.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      }>
        <div className="text-sm text-slate-600">Showing data for {month}</div>
      </Card>

      <Card title="Cash Flow (This Month)">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-emerald-50 p-3">
              <div className="text-emerald-700">Income</div>
              <div className="text-lg font-semibold">{formatCurrency(income)}</div>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <div className="text-rose-700">Expenses</div>
              <div className="text-lg font-semibold">{formatCurrency(expense)}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-slate-700">Net</div>
              <div className="text-lg font-semibold">{formatCurrency(cashflow)}</div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Accounts Snapshot">
        <div className="space-y-2 text-sm">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-slate-500">{a.type}</div>
              </div>
              <div className="font-semibold">{formatCurrency(a.balance)}</div>
            </div>
          ))}
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
  );
};

export default DashboardPage;
