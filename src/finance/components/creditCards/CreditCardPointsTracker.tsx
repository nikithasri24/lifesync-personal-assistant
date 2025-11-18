/**
 * CreditCardPointsTracker Component
 * Displays a comprehensive overview of all credit card rewards across multiple cards
 * Tracks points, miles, and cashback from all cards in one place
 */

import React from 'react';
import { TrendingUp, Award, CreditCard, Plus, Edit2 } from 'lucide-react';
import type { Account, RewardsHistory } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CreditCardPointsTrackerProps {
  cards: Account[];
  rewardsHistory?: RewardsHistory[];
  onUpdatePoints?: (accountId: string, newBalance: number) => void;
  className?: string;
}

export const CreditCardPointsTracker: React.FC<CreditCardPointsTrackerProps> = ({
  cards,
  rewardsHistory = [],
  onUpdatePoints,
  className = '',
}) => {
  const [editingCardId, setEditingCardId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');

  // Filter only cards with rewards programs
  const rewardsCards = cards.filter(card =>
    card.type === 'credit' && card.rewardsType && card.rewardsBalance !== undefined
  );

  // Group cards by reward type
  const cardsByType = rewardsCards.reduce((acc, card) => {
    const type = card.rewardsType || 'points';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(card);
    return acc;
  }, {} as Record<string, Account[]>);

  // Calculate totals by type
  const totalsByType = Object.entries(cardsByType).map(([type, typeCards]) => ({
    type,
    total: typeCards.reduce((sum, card) => sum + (card.rewardsBalance || 0), 0),
    cardCount: typeCards.length,
    cards: typeCards,
  }));

  // Calculate total rewards value (estimate)
  const estimateTotalValue = () => {
    return totalsByType.reduce((sum, { type, total }) => {
      if (type === 'cashback') {
        return sum + total;
      } else if (type === 'points') {
        // Estimate 1 point = $0.01
        return sum + (total * 0.01);
      } else if (type === 'miles') {
        // Estimate 1 mile = $0.015
        return sum + (total * 0.015);
      }
      return sum;
    }, 0);
  };

  const handleStartEdit = (card: Account) => {
    setEditingCardId(card.id);
    setEditValue((card.rewardsBalance || 0).toString());
  };

  const handleSaveEdit = (card: Account) => {
    const newBalance = parseFloat(editValue);
    if (!isNaN(newBalance) && onUpdatePoints) {
      onUpdatePoints(card.id, newBalance);
    }
    setEditingCardId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
    setEditValue('');
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'points':
        return { singular: 'Point', plural: 'Points', icon: '🌟' };
      case 'miles':
        return { singular: 'Mile', plural: 'Miles', icon: '✈️' };
      case 'cashback':
        return { singular: 'Cash Back', plural: 'Cash Back', icon: '💰' };
      default:
        return { singular: 'Reward', plural: 'Rewards', icon: '🎁' };
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'points':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'miles':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'cashback':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (rewardsCards.length === 0) {
    return (
      <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-8 ${className}`}>
        <div className="text-center">
          <Award className="h-16 w-16 text-primary opacity-30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Rewards Cards Yet</h3>
          <p className="text-sm text-primary opacity-70 mb-4">
            Add rewards tracking to your credit cards to see your points, miles, and cashback in one place.
          </p>
          <p className="text-xs text-primary opacity-60">
            You can add rewards info when creating or editing a credit card account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm shadow-sm ring-1 border-blue-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-white/50 p-2.5">
            <Award className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Total Rewards Portfolio</h2>
            <p className="text-sm text-primary opacity-70">Across {rewardsCards.length} cards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Estimated Value */}
          <div className="rounded-xl bg-white/50 p-4">
            <p className="text-xs font-medium text-primary opacity-70 mb-1">Est. Total Value</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(estimateTotalValue())}
            </p>
            <p className="text-xs text-primary opacity-60 mt-1">Approximate worth</p>
          </div>

          {/* Totals by type */}
          {totalsByType.map(({ type, total, cardCount }) => {
            const label = getRewardTypeLabel(type);
            return (
              <div key={type} className="rounded-xl bg-white/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{label.icon}</span>
                  <p className="text-xs font-medium text-primary opacity-70">{label.plural}</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {type === 'cashback' ? formatCurrency(total) : total.toLocaleString()}
                </p>
                <p className="text-xs text-primary opacity-60 mt-1">{cardCount} {cardCount === 1 ? 'card' : 'cards'}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white/30 rounded-lg p-3">
          <p className="text-xs text-primary opacity-70">
            💡 <strong>Tip:</strong> Points and miles values are estimates. Actual value depends on how you redeem them.
          </p>
        </div>
      </div>

      {/* Cards by Type */}
      {Object.entries(cardsByType).map(([type, typeCards]) => {
        const label = getRewardTypeLabel(type);
        const colorClass = getRewardTypeColor(type);

        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{label.icon}</span>
              <h3 className="text-lg font-semibold text-primary">{label.plural}</h3>
              <span className="text-sm text-primary opacity-60">
                ({typeCards.length} {typeCards.length === 1 ? 'card' : 'cards'})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeCards.map((card) => (
                <div
                  key={card.id}
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${colorClass}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 opacity-70" />
                      <div>
                        <h4 className="font-semibold text-primary">{card.name}</h4>
                        {card.baseRewardsRate && (
                          <p className="text-xs opacity-70">
                            {card.baseRewardsRate}x base rate
                          </p>
                        )}
                      </div>
                    </div>
                    {onUpdatePoints && (
                      <button
                        onClick={() => handleStartEdit(card)}
                        className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                        title="Update balance"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {editingCardId === card.id ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-primary/20 bg-white/50 text-primary"
                        placeholder="Enter new balance"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(card)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <p className="text-3xl font-bold">
                          {type === 'cashback'
                            ? formatCurrency(card.rewardsBalance || 0)
                            : (card.rewardsBalance || 0).toLocaleString()}
                        </p>
                        <p className="text-xs opacity-70">{label.plural}</p>
                      </div>

                      {type !== 'cashback' && (
                        <div className="pt-2 border-t border-current/20">
                          <p className="text-xs opacity-70">
                            Est. value:{' '}
                            <span className="font-semibold">
                              {formatCurrency(
                                (card.rewardsBalance || 0) * (type === 'miles' ? 0.015 : 0.01)
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CreditCardPointsTracker;
