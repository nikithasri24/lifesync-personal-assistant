/**
 * StatsCardsV2 Component
 * 2x2 grid of shopping statistics cards
 * Shows total items, completed, total cost, and remaining cost
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export interface StatsCardsV2Props {
  totalItems: number;
  completedItems: number;
  totalCost: number;
  remainingCost: number;
  className?: string;
}

export const StatsCardsV2: React.FC<StatsCardsV2Props> = ({
  totalItems,
  completedItems,
  totalCost,
  remainingCost,
  className = '',
}) => {
  const colors = useThemeColors();

  return (
    <div className={`grid grid-cols-2 gap-3 mb-6 ${className}`}>
      {/* Total Items Card */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">📋</span>
          <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            {totalItems}
          </div>
        </div>
        <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Total Items
        </div>
      </div>

      {/* Completed Items Card */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">✅</span>
          <div className="text-2xl font-bold" style={{ color: '#10B981' }}>
            {completedItems}
          </div>
        </div>
        <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Completed
        </div>
      </div>

      {/* Total Cost Card */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">💰</span>
          <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            ${totalCost.toFixed(2)}
          </div>
        </div>
        <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Total Cost
        </div>
      </div>

      {/* Remaining Cost Card */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">📊</span>
          <div className="text-2xl font-bold" style={{ color: '#C18B5E' }}>
            ${remainingCost.toFixed(2)}
          </div>
        </div>
        <div className="text-xs font-medium" style={{ color: colors.text.secondary }}>
          Remaining
        </div>
      </div>
    </div>
  );
};

export default StatsCardsV2;
