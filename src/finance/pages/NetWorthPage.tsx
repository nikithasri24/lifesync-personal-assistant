import React from 'react';
import { Card } from '../components/Card';
import { ChartLazy } from '../components/ChartLazy';
import { formatCurrency } from '../utils/currency';
import { getFinanceAPI } from '../data';

const NetWorthPage: React.FC = () => {
  const [data, setData] = React.useState<{ month: string; assets: number; liabilities: number; net: number }[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const api = await getFinanceAPI();
      const points = await api.listNetWorth();
      const rows = points.map((p) => ({ ...p, net: p.assets - p.liabilities }));
      if (!mounted) return;
      setData(rows);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const last = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : undefined;
  const delta = last && prev ? last.net - prev.net : 0;

  return (
    <div className="space-y-4">
      <Card title="Net Worth">
        <ChartLazy data={data} xKey="month" yKeys={[{ key: 'assets', color: '#0ea5e9', type: 'area' }, { key: 'liabilities', color: '#ef4444', type: 'area' }, { key: 'net', color: '#0f172a', type: 'line' }]} />
      </Card>
      {last && (
        <Card>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-slate-600">Assets</div><div className="text-lg font-semibold">{formatCurrency(last.assets)}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-slate-600">Liabilities</div><div className="text-lg font-semibold">{formatCurrency(last.liabilities)}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-slate-600">Net</div><div className="text-lg font-semibold">{formatCurrency(last.net)} <span className={`ml-2 text-xs ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>({delta >= 0 ? '+' : ''}{formatCurrency(delta)})</span></div></div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NetWorthPage;

