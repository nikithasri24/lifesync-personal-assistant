import React from 'react';
import { Card } from '../components/Card';
import { DataTable } from '../components/DataTable';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '../ui/Button';
import { getFinanceAPI } from '../data';
import { formatCurrency } from '../utils/currency';
import useFinanceFilters from '../store/useFinanceFilters';
import type { Transaction } from '../types';
import { toCSV, downloadCSV } from '../utils/csv';

const TransactionsPage: React.FC = () => {
  const [rows, setRows] = React.useState<Transaction[]>([]);
  const [next, setNext] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const filters = useFinanceFilters();

  const load = async (cursor?: string) => {
    setLoading(true);
    const api = await getFinanceAPI();
    const { items, nextCursor } = await api.listTransactions({
      text: filters.text,
      fromISO: filters.fromISO,
      toISO: filters.toISO,
      type: filters.type,
      cursor,
      limit: 100,
    });
    setRows(cursor ? (r) => [...r, ...items] : items);
    setNext(nextCursor);
    setLoading(false);
  };

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.text, filters.fromISO, filters.toISO, filters.type]);

  const total = rows.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0);

  return (
    <div className="space-y-4">
      <Card title="Filters">
        <FiltersBar onApply={() => load()} onReset={() => filters.reset()} />
      </Card>

      <Card title="Transactions" actions={<Button variant="outline" onClick={() => downloadCSV('transactions.csv', toCSV(rows))}>Export CSV</Button>}>
        <div className="mb-2 text-sm text-slate-600">Total: <span className={`font-semibold ${total >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(total)}</span></div>
        <DataTable
          rows={rows}
          columns={[
            { key: 'dateISO', header: 'Date', render: (r) => new Date(r.dateISO).toLocaleDateString() },
            { key: 'description', header: 'Description' },
            { key: 'type', header: 'Type', className: 'capitalize' },
            { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount), className: 'text-right' },
          ]}
        />
        <div className="mt-3 flex justify-center">
          {next && (
            <Button onClick={() => load(next)} disabled={loading}>
              {loading ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TransactionsPage;

