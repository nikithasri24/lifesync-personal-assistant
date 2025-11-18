/**
 * RewardsHistoryChart Component
 * Visualizes rewards earning and redemption history over time
 */

import React from 'react';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { RewardsHistory } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface RewardsHistoryChartProps {
  history: RewardsHistory[];
  rewardsType: 'points' | 'miles' | 'cashback';
  className?: string;
}

export const RewardsHistoryChart: React.FC<RewardsHistoryChartProps> = ({
  history,
  rewardsType,
  className = '',
}) => {
  const [timeRange, setTimeRange] = React.useState<'30d' | '90d' | '1y' | 'all'>('90d');

  // Filter history based on time range
  const getFilteredHistory = () => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return history;
    }

    return history.filter(h => new Date(h.dateISO) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();

  // Calculate summary stats
  const totalEarned = filteredHistory.reduce((sum, h) => sum + h.pointsEarned, 0);
  const totalRedeemed = filteredHistory.reduce((sum, h) => sum + h.pointsRedeemed, 0);
  const netChange = totalEarned - totalRedeemed;
  const currentBalance = filteredHistory.length > 0
    ? filteredHistory[filteredHistory.length - 1].balance
    : 0;

  const formatValue = (value: number) => {
    if (rewardsType === 'cashback') {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  };

  const getRewardLabel = () => {
    switch (rewardsType) {
      case 'points':
        return 'Points';
      case 'miles':
        return 'Miles';
      case 'cashback':
        return 'Cash Back';
      default:
        return 'Rewards';
    }
  };

  if (filteredHistory.length === 0) {
    return (
      <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-8 ${className}`}>
        <div className="text-center">
          <Calendar className="h-12 w-12 text-primary opacity-30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-primary mb-2">No History Yet</h3>
          <p className="text-sm text-primary opacity-70">
            Start earning rewards and they'll appear here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-primary">Rewards History</h3>
        <div className="flex gap-2">
          {(['30d', '90d', '1y', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-primary/20 text-primary hover:bg-primary/30'
              }`}
            >
              {range === 'all' ? 'All' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-700">Earned</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">
            {formatValue(totalEarned)}
          </p>
        </div>

        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <p className="text-xs font-medium text-rose-700">Redeemed</p>
          </div>
          <p className="text-xl font-bold text-rose-600">
            {formatValue(totalRedeemed)}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-700">Net Change</p>
          </div>
          <p className={`text-xl font-bold ${netChange >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {netChange >= 0 ? '+' : ''}{formatValue(netChange)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-primary mb-3">Recent Activity</h4>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredHistory.slice().reverse().map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg bg-primary/10 border border-primary/20 p-3 hover:bg-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {entry.pointsEarned > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-rose-600" />
                    )}
                    <p className="text-sm font-medium text-primary">
                      {entry.description || (entry.pointsEarned > 0 ? 'Earned' : 'Redeemed')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-primary opacity-60">
                    <span>{new Date(entry.dateISO).toLocaleDateString()}</span>
                    {entry.category && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{entry.category}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`text-sm font-bold ${
                    entry.pointsEarned > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {entry.pointsEarned > 0 ? '+' : '-'}
                    {formatValue(entry.pointsEarned || entry.pointsRedeemed)}
                  </p>
                  <p className="text-xs text-primary opacity-60">
                    Balance: {formatValue(entry.balance)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Balance Highlight */}
      <div className="mt-4 pt-4 border-t border-primary/20">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary opacity-70">Current Balance</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatValue(currentBalance)} {getRewardLabel()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardsHistoryChart;
