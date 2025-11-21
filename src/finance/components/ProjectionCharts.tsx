/**
 * ProjectionCharts - Lazy-loadable chart components
 * Separates Recharts imports to enable code splitting
 */

import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/currency';

interface NetWorthChartProps {
  data: Array<{
    year: string;
    value: number;
    optimistic: number;
    pessimistic: number;
    contributions?: number;
  }>;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPessimistic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" stroke="#6b7280" />
        <YAxis
          stroke="#6b7280"
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="optimistic"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorOptimistic)"
          name="Optimistic (+3%)"
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorBase)"
          strokeWidth={3}
          name="Base Case"
        />
        <Area
          type="monotone"
          dataKey="pessimistic"
          stroke="#f59e0b"
          fillOpacity={1}
          fill="url(#colorPessimistic)"
          name="Pessimistic (-3%)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

interface CompoundInterestChartProps {
  data: Array<{
    year: string;
    totalValue: number;
    contributions: number;
    gains: number;
  }>;
}

export const CompoundInterestChart: React.FC<CompoundInterestChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="year" stroke="#6b7280" />
        <YAxis
          stroke="#6b7280"
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
        <Legend />
        <Bar dataKey="contributions" stackId="a" fill="#3b82f6" name="Contributions" />
        <Bar dataKey="gains" stackId="a" fill="#10b981" name="Investment Gains" />
      </BarChart>
    </ResponsiveContainer>
  );
};
