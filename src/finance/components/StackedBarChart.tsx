import React from 'react';
import { formatCurrency } from '../utils/currency';

type AnyObj = Record<string, any>;

type StackedBarProps = {
  data: AnyObj[];
  xKey: string;
  stackKeys: { key: string; color: string; label: string }[];
  height?: number;
};

export const StackedBarChart: React.FC<StackedBarProps> = ({ data, xKey, stackKeys, height = 300 }) => {
  const [lib, setLib] = React.useState<AnyObj | null>(null);
  React.useEffect(() => {
    let mounted = true;
    import('recharts')
      .then((m) => mounted && setLib(m as AnyObj))
      .catch(() => mounted && setLib(null));
    return () => {
      mounted = false;
    };
  }, []);
  if (!lib) return <div className="text-sm text-slate-500">Charts unavailable (install recharts).</div>;
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } = lib;

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 font-semibold text-slate-900">{label}</p>
          {payload.reverse().map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600">{entry.name}</span>
              </div>
              <span className="font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-slate-200 pt-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(payload.reduce((sum: number, p: any) => sum + p.value, 0))}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 16, right: 16, top: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={{ stroke: '#cbd5e1' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span className="text-sm text-slate-700">{value}</span>}
          />
          {stackKeys.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="a"
              fill={s.color}
              name={s.label}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
