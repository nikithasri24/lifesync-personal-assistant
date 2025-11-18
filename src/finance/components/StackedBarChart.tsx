import React from 'react';

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

  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {stackKeys.map((s) => (
            <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} name={s.label} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
