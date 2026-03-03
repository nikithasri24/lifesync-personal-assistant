/**
 * BenefitsTracker
 * Shows all benefits across all credit cards, grouped by urgency.
 */

import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Account, CardBenefit, CardBenefitInput } from '../../types';
import { useUpsertCardBenefitMutation, useDeleteCardBenefitMutation } from '../../hooks/useCreditCardsQuery';
import { BenefitEditor } from './BenefitEditor';
import { useThemeColors } from '@/hooks/useThemeColors';
import { logger } from '@/services/logger';

interface BenefitsTrackerProps {
  cards: Account[];
  benefitsByCard: Record<string, CardBenefit[]>;
}

type UrgencyGroup = 'expiring' | 'in_progress' | 'available' | 'used';

interface BenefitWithCard extends CardBenefit {
  cardName: string;
}

function getUrgencyGroup(benefit: CardBenefit): UrgencyGroup {
  const value = benefit.value ?? 0;
  const used = benefit.usedAmount ?? 0;
  const pct = value > 0 ? used / value : 0;

  if (pct >= 1) return 'used';

  // Check expiring soon (within 30 days)
  if (benefit.resetDate) {
    const resetMs = new Date(benefit.resetDate).getTime();
    const nowMs = Date.now();
    const daysLeft = (resetMs - nowMs) / (1000 * 60 * 60 * 24);
    if (daysLeft >= 0 && daysLeft <= 30) return 'expiring';
  }

  if (used > 0) return 'in_progress';
  return 'available';
}

function getDaysUntilReset(resetDate: string | undefined): number | null {
  if (!resetDate) return null;
  const resetMs = new Date(resetDate).getTime();
  const nowMs = Date.now();
  return Math.ceil((resetMs - nowMs) / (1000 * 60 * 60 * 24));
}

function formatResetDate(resetDate: string | undefined): string {
  if (!resetDate) return '';
  return new Date(resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const GROUP_LABELS: Record<UrgencyGroup, { label: string; emoji: string; color: string }> = {
  expiring: { label: 'Expiring Soon', emoji: '⚠️', color: '#EF4444' },
  in_progress: { label: 'In Progress', emoji: '🔄', color: '#F59E0B' },
  available: { label: 'Available', emoji: '✅', color: '#10B981' },
  used: { label: 'Fully Used', emoji: '✔️', color: '#9CA3AF' },
};

const GROUP_ORDER: UrgencyGroup[] = ['expiring', 'in_progress', 'available', 'used'];

export const BenefitsTracker: React.FC<BenefitsTrackerProps> = ({ cards, benefitsByCard }) => {
  const colors = useThemeColors();
  const [addingToCard, setAddingToCard] = useState<Account | null>(null);
  const [editingBenefit, setEditingBenefit] = useState<BenefitWithCard | null>(null);
  const [collapsed, setCollapsed] = useState<Record<UrgencyGroup, boolean>>({ expiring: false, in_progress: false, available: false, used: true });

  const upsertMutation = useUpsertCardBenefitMutation();
  const deleteMutation = useDeleteCardBenefitMutation();

  // Flatten all benefits with card name attached
  const allBenefits: BenefitWithCard[] = cards.flatMap((card) =>
    (benefitsByCard[card.id] ?? []).map((b) => ({ ...b, cardName: card.name }))
  );

  // Group by urgency
  const groups: Record<UrgencyGroup, BenefitWithCard[]> = {
    expiring: [],
    in_progress: [],
    available: [],
    used: [],
  };
  for (const b of allBenefits) {
    groups[getUrgencyGroup(b)].push(b);
  }

  const handleSaveBenefit = async (benefit: CardBenefitInput) => {
    const targetCard = addingToCard ?? (editingBenefit ? cards.find((c) => c.id === editingBenefit.accountId) ?? null : null);
    if (!targetCard) return;
    try {
      await upsertMutation.mutateAsync({ accountId: targetCard.id, benefit: { ...benefit, accountId: targetCard.id } });
    } catch (err) {
      logger.error('Finance', err as Error, { context: 'Failed to save benefit' });
    }
    setAddingToCard(null);
    setEditingBenefit(null);
  };

  const handleDeleteBenefit = async (benefit: BenefitWithCard) => {
    try {
      await deleteMutation.mutateAsync({ benefitId: benefit.id, accountId: benefit.accountId });
    } catch (err) {
      logger.error('Finance', err as Error, { context: 'Failed to delete benefit' });
    }
  };

  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: colors.bg.white, borderColor: colors.border.light }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎁</span>
          <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            Benefits Tracker
          </h2>
        </div>
        {cards.length > 0 && (
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
              aria-label="Add benefit"
              onClick={() => setAddingToCard(cards[0])}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Select which card to add benefit for (if multiple cards) */}
      {addingToCard && cards.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <p className="w-full text-sm font-medium" style={{ color: colors.text.secondary }}>
            Add benefit to:
          </p>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setAddingToCard(card)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                addingToCard.id === card.id ? 'border-transparent text-white' : 'border-gray-200'
              }`}
              style={
                addingToCard.id === card.id
                  ? { background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }
                  : { color: colors.text.secondary }
              }
            >
              {card.name}
            </button>
          ))}
        </div>
      )}

      {allBenefits.length === 0 ? (
        <div
          className="p-6 rounded-xl border-2 border-dashed text-center"
          style={{ borderColor: colors.border.medium }}
        >
          <div className="text-3xl mb-2">🎁</div>
          <p className="font-medium mb-1" style={{ color: colors.text.primary }}>
            No benefits tracked
          </p>
          <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
            Add your card benefits to track usage and reset dates
          </p>
          {cards.length > 0 && (
            <button
              onClick={() => setAddingToCard(cards[0])}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            >
              Add First Benefit
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {GROUP_ORDER.map((group) => {
            const items = groups[group];
            if (items.length === 0) return null;
            const meta = GROUP_LABELS[group];
            const isCollapsed = collapsed[group];

            return (
              <div key={group}>
                {/* Group header */}
                <button
                  className="w-full flex items-center justify-between py-2 px-1"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))}
                  aria-label={`Toggle ${meta.label}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: colors.bg.secondary, color: colors.text.secondary }}
                    >
                      {items.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" style={{ color: colors.text.secondary }} />
                  ) : (
                    <ChevronUp className="w-4 h-4" style={{ color: colors.text.secondary }} />
                  )}
                </button>

                {/* Benefit rows */}
                {!isCollapsed && (
                  <div className="space-y-2 mt-1">
                    {items.map((benefit) => {
                      const value = benefit.value ?? 0;
                      const used = benefit.usedAmount ?? 0;
                      const pct = value > 0 ? Math.min((used / value) * 100, 100) : 0;
                      const daysLeft = getDaysUntilReset(benefit.resetDate);

                      return (
                        <div
                          key={benefit.id}
                          className="p-3 rounded-xl border"
                          style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border.light }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>
                                {benefit.cardName} — {benefit.name}
                              </p>
                              {benefit.description && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: colors.text.secondary }}>
                                  {benefit.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteBenefit(benefit)}
                              disabled={deleteMutation.isPending}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                              aria-label="Delete benefit"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </div>

                          {value > 0 && (
                            <>
                              <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: colors.text.secondary }}>
                                <span>
                                  ${used.toFixed(0)} / ${value.toFixed(0)} used
                                </span>
                                <div className="flex items-center gap-2">
                                  {daysLeft !== null && daysLeft >= 0 && (
                                    <span style={{ color: daysLeft <= 30 ? '#EF4444' : colors.text.secondary }}>
                                      {daysLeft === 0 ? 'Resets today' : `${daysLeft}d left`}
                                    </span>
                                  )}
                                  {benefit.resetDate && (
                                    <span>Resets {formatResetDate(benefit.resetDate)}</span>
                                  )}
                                  <span className="font-medium" style={{ color: pct >= 100 ? '#10B981' : colors.text.primary }}>
                                    {pct.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.border.light }}>
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${pct}%`,
                                    background:
                                      pct >= 100
                                        ? '#10B981'
                                        : daysLeft !== null && daysLeft <= 30
                                        ? '#EF4444'
                                        : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor modal */}
      {(addingToCard || editingBenefit) && (
        <BenefitEditor
          benefit={editingBenefit ?? undefined}
          onSave={handleSaveBenefit}
          onCancel={() => {
            setAddingToCard(null);
            setEditingBenefit(null);
          }}
        />
      )}
    </div>
  );
};
