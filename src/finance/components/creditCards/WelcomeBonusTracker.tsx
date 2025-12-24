/**
 * WelcomeBonusTracker Component
 * Track welcome bonus requirements and progress across all credit cards
 */

import React, { useMemo } from 'react';
import { Gift, TrendingUp, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccountsQuery, useWelcomeBonusesQuery } from '@/hooks/useFinanceQuery';
import { formatCurrency } from '../../utils/currency';
import { format, differenceInDays, isPast } from 'date-fns';
import type { WelcomeBonus, Account } from '../../types';

interface WelcomeBonusWithCard extends WelcomeBonus {
  card?: Account;
  daysRemaining: number;
  progressPercent: number;
  isExpired: boolean;
}

export const WelcomeBonusTracker: React.FC = () => {
  const { data: accounts = [] } = useAccountsQuery();
  const creditCards = accounts.filter(a => a.type === 'credit');

  // Fetch welcome bonuses for all credit cards
  const bonusQueries = creditCards.map(card => 
    useWelcomeBonusesQuery(card.id)
  );

  // Combine all bonuses with card info
  const allBonuses = useMemo(() => {
    const bonuses: WelcomeBonusWithCard[] = [];

    bonusQueries.forEach((query, index) => {
      const card = creditCards[index];
      const cardBonuses = query.data || [];

      cardBonuses.forEach(bonus => {
        const deadline = new Date(bonus.deadline);
        const daysRemaining = differenceInDays(deadline, new Date());
        const progressPercent = (bonus.currentSpend / bonus.requiredSpend) * 100;
        const isExpired = isPast(deadline);

        bonuses.push({
          ...bonus,
          card,
          daysRemaining,
          progressPercent,
          isExpired,
        });
      });
    });

    // Sort: active first, then by days remaining
    return bonuses.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [bonusQueries, creditCards]);

  const stats = useMemo(() => {
    const active = allBonuses.filter(b => !b.completed && !b.isExpired);
    const completed = allBonuses.filter(b => b.completed);
    const totalValue = completed.reduce((sum, b) => sum + b.bonusAmount, 0);
    const potentialValue = active.reduce((sum, b) => sum + b.bonusAmount, 0);

    return { active: active.length, completed: completed.length, totalValue, potentialValue };
  }, [allBonuses]);

  if (allBonuses.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift className="h-12 w-12 text-primary opacity-30 mx-auto mb-4" />
        <p className="text-primary opacity-60">No welcome bonuses tracked</p>
        <p className="text-sm text-primary opacity-40 mt-2">Add welcome bonuses to your credit cards to track progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <p className="text-xs text-primary opacity-60">Active Bonuses</p>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.active}</p>
        </div>

        <div className="bg-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-primary opacity-60">Completed</p>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.completed}</p>
        </div>

        <div className="bg-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-4 w-4 text-purple-400" />
            <p className="text-xs text-primary opacity-60">Earned Value</p>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
        </div>

        <div className="bg-amber-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-primary opacity-60">Potential Value</p>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(stats.potentialValue)}</p>
        </div>
      </div>

      {/* Bonus Cards */}
      <div className="space-y-4">
        {allBonuses.map((bonus) => (
          <div
            key={bonus.id}
            className={`rounded-lg p-4 border ${
              bonus.completed
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : bonus.isExpired
                ? 'bg-red-500/10 border-red-500/30'
                : bonus.daysRemaining <= 30
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-primary/10 border-primary/20'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-primary">{bonus.card?.name || 'Unknown Card'}</h4>
                <p className="text-sm text-primary opacity-60">
                  {formatCurrency(bonus.bonusAmount)} bonus
                </p>
              </div>
              {bonus.completed ? (
                <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                </div>
              ) : bonus.isExpired ? (
                <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Expired
                </div>
              ) : (
                <div className="flex items-center gap-1 text-primary opacity-60 text-sm">
                  <Calendar className="h-4 w-4" />
                  {bonus.daysRemaining} days left
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-primary opacity-60">
                  {formatCurrency(bonus.currentSpend)} / {formatCurrency(bonus.requiredSpend)}
                </span>
                <span className="font-medium text-primary">{Math.min(100, bonus.progressPercent).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    bonus.completed
                      ? 'bg-emerald-500'
                      : bonus.isExpired
                      ? 'bg-red-500'
                      : bonus.progressPercent >= 80
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, bonus.progressPercent)}%` }}
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="text-xs text-primary opacity-60">
              Deadline: {format(new Date(bonus.deadline), 'MMM d, yyyy')}
              {bonus.completedDate && ` • Completed: ${format(new Date(bonus.completedDate), 'MMM d, yyyy')}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

