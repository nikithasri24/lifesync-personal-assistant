import React from 'react';
import { Card } from '../components/Card';
import { Progress } from '../components/Progress';
import { formatCurrency } from '../utils/currency';
import { currentMonth, monthRange } from '../utils/date';
import { getFinanceAPI } from '../data';
import type { Budget, Transaction } from '../types';
import { MonthPicker } from '../components/MonthPicker';

const BudgetsPage: React.FC = () => {
  const [month, setMonth] = React.useState(currentMonth());
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [txns, setTxns] = React.useState<Transaction[]>([]);
  const [months, setMonths] = React.useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const api = await getFinanceAPI();
      const [{ items }, b, c] = await Promise.all([
        api.listTransactions({ limit: 500 }),
        api.listBudgets(month),
        api.listCategories(),
      ]);
      if (!mounted) return;
      setTxns(items);
      setBudgets(b);
      setCategories(c);
      setMonths(Array.from(new Set(items.map((t) => t.dateISO.slice(0, 7)))).sort());
    })();
    return () => {
      mounted = false;
    };
  }, [month]);

  const { from, to } = monthRange(month);
  const monthTxns = txns.filter((t) => t.dateISO >= from && t.dateISO <= to && t.type === 'debit');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Budgets</h2>
        <div className="w-40">
          <MonthPicker value={month} onChange={setMonth} months={months} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((b) => {
          const spent = monthTxns
            .filter((t) => t.categoryId === b.categoryId)
            .reduce((s, t) => s + t.amount, 0);
          const pct = b.limit ? Math.min(100, (spent / b.limit) * 100) : 0;
          const over = spent > b.limit;
          const catName = categories.find((c) => c.id === b.categoryId)?.name ?? 'Unknown';
          return (
            <Card key={b.id} title={catName}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <div className="text-slate-600">Limit: {formatCurrency(b.limit)}</div>
                  <div className={over ? 'text-rose-700 font-semibold' : 'text-slate-700 font-semibold'}>
                    {formatCurrency(spent)} {over ? '(over)' : ''}
                  </div>
                </div>
                <Progress value={pct} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetsPage;

