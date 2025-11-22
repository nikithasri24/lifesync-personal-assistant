/**
 * RewardsSummaryCard Component
 * Compact summary card showing total rewards across all credit cards
 * Perfect for displaying on the main dashboard
 */

import React from 'react';
import { Award, ChevronRight } from 'lucide-react';
import type { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface RewardsSummaryCardProps {
  cards: Account[];
  onClick?: () => void;
  className?: string;
}

export const RewardsSummaryCard: React.FC<RewardsSummaryCardProps> = ({
  cards,
  onClick,
  className = '',
}) => {
  // Filter only cards with rewards
  const rewardsCards = cards.filter(card =>
    card.type === 'credit' && card.rewardsType && card.rewardsBalance !== undefined
  );

  if (rewardsCards.length === 0) {
    return null;
  }

  // Group and calculate totals by type
  const totals = rewardsCards.reduce((acc, card) => {
    const type = card.rewardsType!;
    const balance = card.rewardsBalance || 0;

    if (!acc[type]) {
      acc[type] = { total: 0, count: 0 };
    }

    acc[type].total += balance;
    acc[type].count += 1;

    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Calculate estimated total value
  const estimatedValue = Object.entries(totals).reduce((sum, [type, { total }]) => {
    if (type === 'cashback') {
      return sum + total;
    } else if (type === 'points') {
      return sum + (total * 0.01);
    } else if (type === 'miles') {
      return sum + (total * 0.015);
    }
    return sum;
  }, 0);

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points':
        return '🌟';
      case 'miles':
        return '✈️';
      case 'cashback':
        return '💰';
      default:
        return '🎁';
    }
  };

  const formatRewardValue = (type: string, value: number) => {
    if (type === 'cashback') {
      return formatCurrency(value);
    }
    return value.toLocaleString();
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm shadow-sm ring-1 border-blue-500/30 p-5 ${
        onClick ? 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/50 p-2">
            <Award className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-primary opacity-70">Total Rewards</h3>
            <p className="text-xs text-primary opacity-60">{rewardsCards.length} cards</p>
          </div>
        </div>
        {onClick && <ChevronRight className="h-5 w-5 text-primary opacity-40" />}
      </div>

      {/* Estimated Value */}
      <div className="mb-4">
        <p className="text-xs text-primary opacity-70 mb-1">Estimated Value</p>
        <p className="text-3xl font-bold text-emerald-600">
          {formatCurrency(estimatedValue)}
        </p>
      </div>

      {/* Breakdown by Type */}
      <div className="space-y-2">
        {Object.entries(totals).map(([type, { total, count }]) => (
          <div
            key={type}
            className="flex items-center justify-between p-2 rounded-lg bg-white/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getRewardIcon(type)}</span>
              <div>
                <p className="text-xs font-medium text-primary capitalize">{type}</p>
                <p className="text-xs text-primary opacity-60">{count} {count === 1 ? 'card' : 'cards'}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-primary">
              {formatRewardValue(type, total)}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="mt-3 pt-3 border-t border-white/30">
        <p className="text-xs text-primary opacity-60">
          💡 Track and update your points anytime
        </p>
      </div>
    </div>
  );
};

export default RewardsSummaryCard;
