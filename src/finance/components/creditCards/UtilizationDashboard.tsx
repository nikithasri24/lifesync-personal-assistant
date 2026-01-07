/**
 * UtilizationDashboard Component
 * Track credit utilization across all cards with alerts and recommendations
 */

import React, { useMemo } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAccountsQuery } from '@/hooks/useFinanceQuery';
import { formatCurrency } from '../../utils/currency';
import type { Account } from '../../types';

interface CardUtilization {
  card: Account;
  utilization: number;
  available: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export const UtilizationDashboard: React.FC = () => {
  const { data: accounts = [] } = useAccountsQuery();
  const creditCards = accounts.filter(a => a.type === 'credit' && a.creditLimit);

  // Calculate utilization for each card
  const cardUtilizations = useMemo(() => {
    return creditCards.map(card => {
      const balance = Math.abs(card.balance);
      const limit = card.creditLimit || 0;
      const utilization = limit > 0 ? (balance / limit) * 100 : 0;
      const available = limit - balance;

      let status: CardUtilization['status'];
      if (utilization <= 10) status = 'excellent';
      else if (utilization <= 30) status = 'good';
      else if (utilization <= 50) status = 'fair';
      else status = 'poor';

      return { card, utilization, available, status };
    }).sort((a, b) => b.utilization - a.utilization);
  }, [creditCards]);

  // Calculate overall utilization
  const overallStats = useMemo(() => {
    const totalLimit = creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
    const totalBalance = creditCards.reduce((sum, card) => sum + Math.abs(card.balance), 0);
    const totalAvailable = totalLimit - totalBalance;
    const overallUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

    const highUtilization = cardUtilizations.filter(c => c.utilization > 30).length;
    const excellentCards = cardUtilizations.filter(c => c.status === 'excellent').length;

    return {
      totalLimit,
      totalBalance,
      totalAvailable,
      overallUtilization,
      highUtilization,
      excellentCards,
    };
  }, [creditCards, cardUtilizations]);

  const getStatusColor = (status: CardUtilization['status']) => {
    switch (status) {
      case 'excellent': return 'text-emerald-600 bg-emerald-500/20';
      case 'good': return 'text-blue-600 bg-blue-500/20';
      case 'fair': return 'text-amber-600 bg-amber-500/20';
      case 'poor': return 'text-red-600 bg-red-500/20';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 10) return 'bg-emerald-500';
    if (utilization <= 30) return 'bg-blue-500';
    if (utilization <= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (creditCards.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 text-primary opacity-30 mx-auto mb-4" />
        <p className="text-primary opacity-60">No credit cards found</p>
        <p className="text-sm text-primary opacity-40 mt-2">Add credit cards to track utilization</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-primary/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Overall Utilization</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Total Credit</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(overallStats.totalLimit)}</p>
          </div>
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Used</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(overallStats.totalBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Available</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(overallStats.totalAvailable)}</p>
          </div>
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Utilization</p>
            <p className={`text-xl font-bold ${
              overallStats.overallUtilization <= 30 ? 'text-emerald-600' : 
              overallStats.overallUtilization <= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {overallStats.overallUtilization.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-primary/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${getUtilizationColor(overallStats.overallUtilization)}`}
            style={{ width: `${Math.min(100, overallStats.overallUtilization)}%` }}
          />
        </div>

        {/* Recommendations */}
        {overallStats.overallUtilization > 30 && (
          <div className="mt-4 flex items-start gap-2 text-sm text-amber-600 bg-amber-500/10 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">High Utilization Alert</p>
              <p className="text-xs opacity-80 mt-1">
                Consider paying down {formatCurrency(overallStats.totalBalance - (overallStats.totalLimit * 0.3))} to reach 30% utilization
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Per-Card Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">Per-Card Utilization</h3>
        <div className="space-y-3">
          {cardUtilizations.map(({ card, utilization, available, status }) => (
            <div key={card.id} className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-primary">{card.name}</h4>
                  <p className="text-sm text-primary opacity-60">
                    {formatCurrency(Math.abs(card.balance))} / {formatCurrency(card.creditLimit || 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                    {status.toUpperCase()}
                  </span>
                  <span className="text-lg font-bold text-primary">{utilization.toFixed(1)}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${getUtilizationColor(utilization)}`}
                  style={{ width: `${Math.min(100, utilization)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-primary opacity-60">
                <span>Available: {formatCurrency(available)}</span>
                {utilization > 30 && (
                  <span className="text-amber-600 font-medium">Pay {formatCurrency(Math.abs(card.balance) - ((card.creditLimit || 0) * 0.3))} to reach 30%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
        <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-blue-500" />
          Tips for Better Credit Utilization
        </h4>
        <ul className="text-sm text-primary opacity-80 space-y-1">
          <li>• Keep utilization below 30% for optimal credit score</li>
          <li>• Pay balances before statement closing date</li>
          <li>• Request credit limit increases to lower utilization</li>
          <li>• Spread purchases across multiple cards</li>
        </ul>
      </div>
    </div>
  );
};

