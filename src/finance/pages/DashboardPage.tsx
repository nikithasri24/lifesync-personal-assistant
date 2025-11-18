import React from 'react';
import { Card } from '../components/Card';
import { ChartLazy } from '../components/ChartLazy';
import { formatCurrency } from '../utils/currency';
import { currentMonth, monthRange, toMonth } from '../utils/date';
import { getFinanceAPI } from '../data';
import type { Transaction } from '../types';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [month, setMonth] = React.useState(currentMonth());
  const [net, setNet] = React.useState<{ month: string; assets: number; liabilities: number }[]>([]);
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
      const [{ items: txItems }, accts, cats, b, nw] = await Promise.all([
        api.listTransactions({ limit: 500 }),
        api.listAccounts(),
        api.listCategories(),
        api.listBudgets(month),
        api.listNetWorth(),
      ]);
      if (!mounted) return;
      setTxns(txItems);
      setAccounts(accts);
      setCategories(cats);
      setBudgets(b);
      setNet(nw);
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
  const totalAssets = accounts.filter((a) => !a.liability).reduce((s, a) => s + a.balance, 0);
  const totalLiab = accounts.filter((a) => a.liability).reduce((s, a) => s + a.balance, 0);
  const netPoints = net.map((n) => ({ month: n.month, net: n.assets - n.liabilities }));

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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <Card title="Net Worth">
        <ChartLazy data={netPoints.map((p) => ({ month: p.month, net: p.net }))} xKey="month" yKeys={[{ key: 'net', color: '#0f172a', type: 'line' }]} />
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
    </div>
  );
};

export default DashboardPage;
