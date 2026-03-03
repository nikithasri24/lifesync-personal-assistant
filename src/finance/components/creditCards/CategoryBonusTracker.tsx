/**
 * CategoryBonusTracker
 * Shows rotating bonuses and welcome bonus progress for all credit cards.
 */

import React from 'react';
import type { Account, CardCategoryBonus, WelcomeBonus } from '../../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CategoryBonusTrackerProps {
  cards: Account[];
  bonusesByCard: Record<string, CardCategoryBonus[]>;
  welcomeBonusesByCard: Record<string, WelcomeBonus[]>;
}

function getDaysLeft(endDate: string | undefined): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDateRange(startDate: string | undefined, endDate: string | undefined): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (endDate) return `Ends ${fmt(endDate)}`;
  return '';
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    dining: '🍽️ Dining',
    travel: '✈️ Travel',
    groceries: '🛒 Groceries',
    gas: '⛽ Gas',
    online: '🛍️ Online',
    all_other: '💳 Everything Else',
  };
  return labels[category] ?? category;
}

export const CategoryBonusTracker: React.FC<CategoryBonusTrackerProps> = ({
  cards,
  bonusesByCard,
  welcomeBonusesByCard,
}) => {
  const colors = useThemeColors();

  // Collect rotating bonuses across all cards
  interface RotatingBonus extends CardCategoryBonus {
    cardName: string;
  }
  const rotatingBonuses: RotatingBonus[] = cards.flatMap((card) =>
    (bonusesByCard[card.id] ?? [])
      .filter((b) => b.isRotating)
      .map((b) => ({ ...b, cardName: card.name }))
  );

  // Collect static bonuses, grouped by category label
  interface StaticBonus extends CardCategoryBonus {
    cardName: string;
  }
  const staticBonuses: StaticBonus[] = cards.flatMap((card) =>
    (bonusesByCard[card.id] ?? [])
      .filter((b) => !b.isRotating && b.category !== 'all_other')
      .map((b) => ({ ...b, cardName: card.name }))
  );

  // Group static bonuses by category
  const staticByCategory: Record<string, StaticBonus[]> = {};
  for (const bonus of staticBonuses) {
    if (!staticByCategory[bonus.category]) staticByCategory[bonus.category] = [];
    staticByCategory[bonus.category].push(bonus);
  }
  // Sort each category by rewardsRate descending
  for (const cat of Object.keys(staticByCategory)) {
    staticByCategory[cat].sort((a, b) => b.rewardsRate - a.rewardsRate);
  }

  // Collect active welcome bonuses
  interface WelcomeBonusWithCard extends WelcomeBonus {
    cardName: string;
  }
  const activeWelcomeBonuses: WelcomeBonusWithCard[] = cards.flatMap((card) =>
    (welcomeBonusesByCard[card.id] ?? [])
      .filter((wb) => !wb.completed)
      .map((wb) => ({ ...wb, cardName: card.name }))
  );

  const hasContent =
    rotatingBonuses.length > 0 ||
    staticBonuses.length > 0 ||
    activeWelcomeBonuses.length > 0;

  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: colors.bg.white, borderColor: colors.border.light }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎯</span>
        <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
          Active Bonuses
        </h2>
      </div>

      {!hasContent ? (
        <p className="text-sm text-center py-4" style={{ color: colors.text.secondary }}>
          No category bonuses or welcome bonuses tracked yet.
          <br />
          Add category bonuses to your cards from the My Cards section.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Rotating bonuses */}
          {rotatingBonuses.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.text.secondary }}>
                Rotating Bonuses
              </p>
              <div className="space-y-2">
                {rotatingBonuses.map((bonus) => {
                  const daysLeft = getDaysLeft(bonus.endDate);
                  const dateRange = formatDateRange(bonus.startDate, bonus.endDate);

                  return (
                    <div
                      key={bonus.id}
                      className="p-3 rounded-xl border"
                      style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border.light }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div>
                          <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                            {bonus.cardName}
                          </span>
                          <span className="mx-1 text-xs" style={{ color: colors.text.secondary }}>
                            —
                          </span>
                          <span className="text-sm" style={{ color: colors.text.primary }}>
                            {categoryLabel(bonus.category)}
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)', color: '#fff' }}
                        >
                          {bonus.rewardsRate}×
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.text.secondary }}>
                        <span>{dateRange}</span>
                        {daysLeft !== null && daysLeft >= 0 && (
                          <span style={{ color: daysLeft <= 14 ? '#EF4444' : colors.text.secondary }}>
                            {daysLeft === 0 ? 'Ends today' : `${daysLeft} days left`}
                          </span>
                        )}
                        {daysLeft !== null && daysLeft < 0 && (
                          <span className="text-gray-400">Expired</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Welcome bonuses */}
          {activeWelcomeBonuses.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.text.secondary }}>
                Welcome Bonus Progress
              </p>
              <div className="space-y-2">
                {activeWelcomeBonuses.map((wb) => {
                  const pct = wb.requiredSpend > 0
                    ? Math.min((wb.currentSpend / wb.requiredSpend) * 100, 100)
                    : 0;
                  const daysLeft = getDaysLeft(wb.deadline);

                  return (
                    <div
                      key={wb.id}
                      className="p-3 rounded-xl border"
                      style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border.light }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                            {wb.cardName}
                          </span>
                          <span className="ml-2 text-xs font-medium" style={{ color: '#C18B5E' }}>
                            {wb.bonusAmount.toLocaleString()} pts/miles
                          </span>
                        </div>
                        {daysLeft !== null && daysLeft >= 0 && (
                          <span
                            className="text-xs"
                            style={{ color: daysLeft <= 14 ? '#EF4444' : colors.text.secondary }}
                          >
                            {daysLeft}d left
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: colors.text.secondary }}>
                        <span>
                          ${wb.currentSpend.toLocaleString()} / ${wb.requiredSpend.toLocaleString()} spent
                        </span>
                        <span className="font-medium" style={{ color: colors.text.primary }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border.light }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Static bonuses by category */}
          {staticBonuses.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.text.secondary }}>
                Permanent Category Bonuses
              </p>
              <div className="space-y-2">
                {Object.entries(staticByCategory).map(([cat, bonuses]) => (
                  <div
                    key={cat}
                    className="p-3 rounded-xl border"
                    style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border.light }}
                  >
                    <p className="text-sm font-medium mb-1.5" style={{ color: colors.text.primary }}>
                      {categoryLabel(cat)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bonuses.map((b) => (
                        <span
                          key={b.id}
                          className="text-xs px-2 py-1 rounded-lg font-medium"
                          style={{ backgroundColor: '#FFF8F0', color: '#C18B5E', border: '1px solid #D4A574' }}
                        >
                          {b.rewardsRate}× {b.cardName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
