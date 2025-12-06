import React from 'react';
import type {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

type AnyObj = Record<string, unknown>;

type AreaLineProps = {
  data: AnyObj[];
  xKey: string;
  yKeys: { key: string; color: string; type?: 'line' | 'area' }[];
  height?: number;
};

type RechartsModule = {
  ResponsiveContainer: typeof ResponsiveContainer;
  AreaChart: typeof AreaChart;
  Area: typeof Area;
  LineChart: typeof LineChart;
  Line: typeof Line;
  XAxis: typeof XAxis;
  YAxis: typeof YAxis;
  Tooltip: typeof Tooltip;
  Legend: typeof Legend;
  CartesianGrid: typeof CartesianGrid;
};

export const ChartLazy: React.FC<AreaLineProps> = ({ data, xKey, yKeys, height = 220 }) => {
  const [lib, setLib] = React.useState<RechartsModule | null>(null);
  React.useEffect(() => {
    let mounted = true;
    import('recharts')
      .then((m) => mounted && setLib(m as RechartsModule))
      .catch(() => mounted && setLib(null));
    return () => {
      mounted = false;
    };
  }, []);
  if (!lib) return <div className="text-sm text-slate-500">Charts unavailable (install recharts).</div>;
  const { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } = lib;
  const hasArea = yKeys.some((y) => y.type === 'area');
  const ChartComp = hasArea ? AreaChart : LineChart;
  const SeriesComp = hasArea ? Area : Line;
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ChartComp data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((y) => (
            <SeriesComp key={y.key} type="monotone" dataKey={y.key} stroke={y.color} fill={y.color} dot={false} />
          ))}
        </ChartComp>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartLazy;

