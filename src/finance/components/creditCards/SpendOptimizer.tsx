/**
 * SpendOptimizer
 * "Use this card for X" — select a spending category and see which card earns the most.
 */

import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import type { Account, CardCategoryBonus, SpendingCategory } from '../../types';
import { getPointValuation, earnRateDisplay, getProgramName } from '../../utils/pointValuations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SpendOptimizerProps {
  cards: Account[];
  bonusesByCard: Record<string, CardCategoryBonus[]>;
}

// Map UI category labels to DB SpendingCategory values
type UICategory = {
  label: string;
  emoji: string;
  dbCategories: SpendingCategory[];
};

const UI_CATEGORIES: UICategory[] = [
  { label: 'Dining', emoji: '🍽️', dbCategories: ['dining'] },
  { label: 'Groceries', emoji: '🛒', dbCategories: ['groceries'] },
  { label: 'Gas', emoji: '⛽', dbCategories: ['gas'] },
  { label: 'Travel', emoji: '✈️', dbCategories: ['travel'] },
  { label: 'Online Shopping', emoji: '🛍️', dbCategories: ['online'] },
  { label: 'Everything Else', emoji: '💳', dbCategories: ['all_other'] },
];

interface CardRanking {
  card: Account;
  rate: number;
  centsPerDollar: number;
  programName: string;
  earnDisplay: string;
  isBonus: boolean;
}

function getBestRateForCategory(
  card: Account,
  uiCategory: UICategory,
  bonuses: CardCategoryBonus[]
): { rate: number; isBonus: boolean } {
  // Find highest bonus for any matching DB category
  let bestRate = 0;
  let isBonus = false;
  for (const bonus of bonuses) {
    if (
      uiCategory.dbCategories.includes(bonus.category) &&
      bonus.rewardsRate > bestRate
    ) {
      bestRate = bonus.rewardsRate;
      isBonus = true;
    }
  }
  // Fall back to base rewards rate
  if (bestRate === 0) {
    bestRate = card.baseRewardsRate ?? 1.0;
  }
  return { rate: bestRate, isBonus };
}

export const SpendOptimizer: React.FC<SpendOptimizerProps> = ({ cards, bonusesByCard }) => {
  const colors = useThemeColors();
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number | null>(null);

  const selectedCategory = selectedCategoryIdx !== null ? UI_CATEGORIES[selectedCategoryIdx] : null;

  const rankings: CardRanking[] = selectedCategory
    ? cards
        .map((card) => {
          const bonuses = bonusesByCard[card.id] ?? [];
          const { rate, isBonus } = getBestRateForCategory(card, selectedCategory, bonuses);
          const centsPerDollar = rate * getPointValuation(card);
          return {
            card,
            rate,
            centsPerDollar,
            programName: getProgramName(card),
            earnDisplay: earnRateDisplay(rate, card),
            isBonus,
          };
        })
        .sort((a, b) => b.centsPerDollar - a.centsPerDollar)
    : [];

  const best = rankings[0];

  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: colors.bg.white, borderColor: colors.border.light }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5" style={{ color: '#C18B5E' }} />
        <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
          Spend Optimizer
        </h2>
        {best && selectedCategory && (
          <span
            className="ml-auto text-sm font-semibold px-3 py-1 rounded-full"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)', color: '#fff' }}
          >
            ★ {best.card.name} · {best.rate}× · {best.earnDisplay}
          </span>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {UI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.label}
            onClick={() => setSelectedCategoryIdx(selectedCategoryIdx === idx ? null : idx)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedCategoryIdx === idx
                ? 'text-white border-transparent'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={
              selectedCategoryIdx === idx
                ? { background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)', color: '#fff' }
                : { color: colors.text.secondary, backgroundColor: colors.bg.secondary }
            }
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Ranked list */}
      {selectedCategory && rankings.length > 0 && (
        <div className="space-y-2">
          {rankings.map((item, idx) => {
            const utilization = item.card.creditLimit
              ? (Math.abs(item.card.balance) / item.card.creditLimit) * 100
              : 0;
            return (
              <div
                key={item.card.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? 'ring-2' : 'border'}`}
                style={
                  idx === 0
                    ? { backgroundColor: '#FFF8F0', ringColor: '#D4A574', borderColor: '#D4A574' }
                    : { backgroundColor: colors.bg.secondary, borderColor: colors.border.light }
                }
              >
                {/* Rank badge */}
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={
                    idx === 0
                      ? { background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)', color: '#fff' }
                      : { backgroundColor: colors.border.light, color: colors.text.secondary }
                  }
                >
                  {idx + 1}
                </span>

                {/* Card name + program */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: colors.text.primary }}>
                    {item.card.name}
                  </p>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    {item.programName} · {utilization.toFixed(0)}% util
                  </p>
                </div>

                {/* Earn rate */}
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: idx === 0 ? '#C18B5E' : colors.text.primary }}
                  >
                    {item.rate}× = {item.earnDisplay}
                  </p>
                  {item.isBonus && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-100 text-green-700">
                      bonus
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!selectedCategory && (
        <p className="text-sm text-center py-2" style={{ color: colors.text.secondary }}>
          Select a category above to see which card earns the most
        </p>
      )}
    </div>
  );
};
