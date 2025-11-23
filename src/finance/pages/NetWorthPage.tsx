/**
 * NetWorthPage - Enhanced with account breakdown, growth metrics, and insights
 * Matches Monarch Money / Empower design patterns
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { Card } from '../components/Card';
import { ChartLazy } from '../components/ChartLazy';
import { formatCurrency } from '../utils/currency';
import { useNetWorthQuery, useAccountsQuery } from '../hooks/useFinanceQuery';
import type { Account } from '../types';

const NetWorthPage: React.FC = () => {
  // React Query hooks
  const { data: netWorthData = [], isLoading: netWorthLoading } = useNetWorthQuery();
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();

  const loading = netWorthLoading || accountsLoading;

  // Transform data to include net worth calculation
  const data = React.useMemo(() => {
    return netWorthData.map((p) => ({ ...p, net: p.assets - p.liabilities }));
  }, [netWorthData]);

  // Calculate current metrics
  const last = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : undefined;
  const yearAgo = data.length > 12 ? data[data.length - 13] : undefined;

  // Growth calculations
  const monthDelta = last && prev ? last.net - prev.net : 0;
  const monthPercent = prev && prev.net !== 0 ? ((last.net - prev.net) / Math.abs(prev.net)) * 100 : 0;
  const yearDelta = last && yearAgo ? last.net - yearAgo.net : 0;
  const yearPercent = yearAgo && yearAgo.net !== 0 ? ((last.net - yearAgo.net) / Math.abs(yearAgo.net)) * 100 : 0;

  // Account breakdown
  const assetAccounts = accounts.filter(a => !a.liability);
  const liabilityAccounts = accounts.filter(a => a.liability);
  const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const currentNet = totalAssets - totalLiabilities;

  // Group accounts by type
  const groupByType = (accts: Account[]): Record<string, Account[]> => {
    const groups: Record<string, Account[]> = {};
    accts.forEach(a => {
      if (!groups[a.type]) groups[a.type] = [];
      groups[a.type].push(a);
    });
    return groups;
  };

  const assetGroups = groupByType(assetAccounts);
  const liabilityGroups = groupByType(liabilityAccounts);

  // Account type display names
  const typeNames: Record<string, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit Cards',
    brokerage: 'Brokerage',
    loan: 'Loans',
    investment: 'Investments',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-primary opacity-60">Loading net worth data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Metric Cards */}
      {last && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Assets Card */}
          <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-emerald-500/30 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-medium text-primary opacity-70">Total Assets</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalAssets)}</p>
              <p className="text-xs text-primary opacity-60">{assetAccounts.length} accounts</p>
            </div>
          </div>

          {/* Liabilities Card */}
          <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-rose-500/30 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-500/10 p-2">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>
                <h3 className="text-sm font-medium text-primary opacity-70">Total Liabilities</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalLiabilities)}</p>
              <p className="text-xs text-primary opacity-60">{liabilityAccounts.length} accounts</p>
            </div>
          </div>

          {/* Net Worth Card */}
          <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${currentNet >= 0 ? 'border-blue-500/30' : 'border-amber-500/30'} p-4`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`rounded-lg ${currentNet >= 0 ? 'bg-blue-500/10' : 'bg-amber-500/10'} p-2`}>
                  <DollarSign className={`h-4 w-4 ${currentNet >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
                </div>
                <h3 className="text-sm font-medium text-primary opacity-70">Net Worth</h3>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">{formatCurrency(currentNet)}</p>
              {prev && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={monthDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {monthDelta >= 0 ? '+' : ''}{formatCurrency(monthDelta)}
                  </span>
                  <span className="text-primary opacity-60">
                    ({monthDelta >= 0 ? '+' : ''}{monthPercent.toFixed(1)}% MoM)
                  </span>
                </div>
              )}
              {yearAgo && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={yearDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {yearDelta >= 0 ? '+' : ''}{formatCurrency(yearDelta)}
                  </span>
                  <span className="text-primary opacity-60">
                    ({yearDelta >= 0 ? '+' : ''}{yearPercent.toFixed(1)}% YoY)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      {data.length > 0 && (
        <Card title="Net Worth Over Time">
          <ChartLazy
            data={data}
            xKey="month"
            yKeys={[
              { key: 'assets', color: '#10b981', type: 'area' },
              { key: 'liabilities', color: '#ef4444', type: 'area' },
              { key: 'net', color: '#3b82f6', type: 'line' }
            ]}
          />
        </Card>
      )}

      {/* Account Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Breakdown */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-emerald-500/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-primary">Assets Breakdown</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(assetGroups).map(([type, accts]) => {
              const typeTotal = accts.reduce((sum, a) => sum + a.balance, 0);
              const percentage = totalAssets > 0 ? (typeTotal / totalAssets) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{typeNames[type] || type}</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(typeTotal)}</span>
                  </div>
                  <div className="mb-2 h-2 w-full rounded-full bg-primary/20">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="space-y-1.5 ml-3">
                    {accts.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-xs text-primary opacity-70">
                        <span>{a.name}</span>
                        <span>{formatCurrency(a.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {assetAccounts.length === 0 && (
              <p className="text-sm text-primary opacity-60 text-center py-4">No asset accounts yet</p>
            )}
          </div>
        </div>

        {/* Liabilities Breakdown */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-rose-500/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-primary">Liabilities Breakdown</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(liabilityGroups).map(([type, accts]) => {
              const typeTotal = accts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
              const percentage = totalLiabilities > 0 ? (typeTotal / totalLiabilities) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{typeNames[type] || type}</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(typeTotal)}</span>
                  </div>
                  <div className="mb-2 h-2 w-full rounded-full bg-primary/20">
                    <div
                      className="h-2 rounded-full bg-rose-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="space-y-1.5 ml-3">
                    {accts.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-xs text-primary opacity-70">
                        <span>{a.name}</span>
                        <span>{formatCurrency(Math.abs(a.balance))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {liabilityAccounts.length === 0 && (
              <p className="text-sm text-primary opacity-60 text-center py-4">No liabilities - great job! 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthPage;
