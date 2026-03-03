/**
 * CardsList
 * Compact list of credit cards sorted by utilization (highest first).
 * Click ✏️ to edit. Shows balance, limit, utilization, and estimated rewards value.
 */

import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { estimateRewardsValue, getProgramName } from '../../utils/pointValuations';
import { AccountFormModalV2, type AccountFormData } from '../v2';
import { useUpsertAccountMutation, useDeleteAccountMutation } from '@/hooks/useFinanceQuery';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/hooks/useAuth';
import { OwnerBadge } from '@/components/common/OwnerBadge';
import { logger } from '@/services/logger';

interface CardsListProps {
  cards: Account[];
  partnerName?: string;
}

export const CardsList: React.FC<CardsListProps> = ({ cards, partnerName }) => {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [editingCard, setEditingCard] = useState<Account | null>(null);

  const upsertMutation = useUpsertAccountMutation();
  const deleteMutation = useDeleteAccountMutation();

  // Sort by utilization descending
  const sorted = [...cards].sort((a, b) => {
    const ua = a.creditLimit ? Math.abs(a.balance) / a.creditLimit : 0;
    const ub = b.creditLimit ? Math.abs(b.balance) / b.creditLimit : 0;
    return ub - ua;
  });

  const handleSave = async (data: AccountFormData) => {
    if (!editingCard) return;
    try {
      await upsertMutation.mutateAsync({
        id: editingCard.id,
        ...data,
      });
    } catch (err) {
      logger.error('Finance', err as Error, { context: 'Failed to update account' });
    }
    setEditingCard(null);
  };

  const handleDelete = async () => {
    if (!editingCard) return;
    try {
      await deleteMutation.mutateAsync(editingCard.id);
    } catch (err) {
      logger.error('Finance', err as Error, { context: 'Failed to delete account' });
    }
    setEditingCard(null);
  };

  if (cards.length === 0) {
    return (
      <div
        className="p-5 rounded-xl border"
        style={{ backgroundColor: colors.bg.white, borderColor: colors.border.light }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💳</span>
          <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            My Cards
          </h2>
        </div>
        <div
          className="p-6 rounded-xl border-2 border-dashed text-center"
          style={{ borderColor: colors.border.medium }}
        >
          <div className="text-3xl mb-2">💳</div>
          <p className="font-medium" style={{ color: colors.text.primary }}>
            No credit cards yet
          </p>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            Add your credit cards via the Accounts page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-5 rounded-xl border"
      style={{ backgroundColor: colors.bg.white, borderColor: colors.border.light }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💳</span>
        <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
          My Cards
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: colors.bg.secondary, color: colors.text.secondary }}
        >
          sorted by utilization
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((card) => {
          const balance = Math.abs(card.balance);
          const limit = card.creditLimit ?? 0;
          const util = limit > 0 ? (balance / limit) * 100 : 0;
          const available = limit - balance;
          const rewardsValueCents = estimateRewardsValue(card);
          const rewardsValueDollars = rewardsValueCents / 100;

          const utilColor =
            util >= 75 ? '#EF4444' : util >= 30 ? '#F59E0B' : '#10B981';

          return (
            <div
              key={card.id}
              className="p-3 rounded-xl border transition-shadow hover:shadow-sm"
              style={{ backgroundColor: colors.bg.secondary, borderColor: colors.border.light }}
            >
              <div className="flex items-center gap-3">
                {/* Card name + owner badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>
                      {card.name}
                    </p>
                    {user && (
                      <OwnerBadge
                        userId={card.userId}
                        currentUserId={user.id}
                        partnerName={partnerName}
                        size="sm"
                      />
                    )}
                    {util >= 75 && (
                      <span className="text-xs text-red-500 font-medium">⚠️ High</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>
                    {getProgramName(card)}
                    {card.apr ? ` · ${card.apr}% APR` : ''}
                    {card.annualFee ? ` · $${card.annualFee}/yr` : ''}
                  </p>
                </div>

                {/* Balance / Limit */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: colors.text.primary }}>
                    {formatCurrency(balance)}
                    {limit > 0 && (
                      <span className="font-normal text-xs" style={{ color: colors.text.secondary }}>
                        {' '}/ {formatCurrency(limit)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: utilColor }}>
                    {util.toFixed(0)}% used
                    {limit > 0 && (
                      <span style={{ color: colors.text.secondary }}>
                        {' '}· {formatCurrency(available)} avail
                      </span>
                    )}
                  </p>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditingCard(card)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label={`Edit ${card.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" style={{ color: colors.text.secondary }} />
                </button>
              </div>

              {/* Utilization bar */}
              {limit > 0 && (
                <div className="mt-2 w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: colors.border.light }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(util, 100)}%`,
                      backgroundColor: utilColor,
                    }}
                  />
                </div>
              )}

              {/* Rewards value */}
              {card.rewardsBalance && card.rewardsBalance > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#C18B5E' }}>
                  {card.rewardsBalance.toLocaleString()} {card.rewardsType} ≈ {formatCurrency(rewardsValueDollars)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editingCard && (
        <AccountFormModalV2
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          initialData={{
            name: editingCard.name,
            type: editingCard.type,
            balance: editingCard.balance,
            creditLimit: editingCard.creditLimit,
            apr: editingCard.apr,
            promoAprEndDate: editingCard.promoAprEndDate,
            isArchived: editingCard.isArchived,
          }}
          isPending={upsertMutation.isPending}
          deletePending={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
