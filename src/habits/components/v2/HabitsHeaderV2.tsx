/**
 * HabitsHeaderV2 Component
 * Simple page header matching Together tab style
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { OwnerFilterValue } from '../../../components/common/OwnerFilter';
import { OwnerFilter } from '../../../components/common/OwnerFilter';
import type { MergedConnectionResult } from '../../../shared/api/SharedDataProvider';

export interface HabitsHeaderV2Props {
  totalHabits: number;
  completionPercentage: number;
  currentStreak: number;
  onAddHabit: () => void;
  onToggleFilter?: () => void;
  mergedConnection?: MergedConnectionResult | null;
  ownerFilter?: OwnerFilterValue;
  onOwnerFilterChange?: (value: OwnerFilterValue) => void;
  partnerName?: string;
}

export const HabitsHeaderV2: React.FC<HabitsHeaderV2Props> = ({
  mergedConnection,
  ownerFilter = 'all',
  onOwnerFilterChange,
  partnerName = 'Partner',
}) => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">🎯</span>
        Habits
      </h1>

      {/* Owner Filter for merged mode */}
      {mergedConnection && onOwnerFilterChange && (
        <div className="mb-4">
          <OwnerFilter
            value={ownerFilter}
            onChange={onOwnerFilterChange}
            partnerName={partnerName}
          />
        </div>
      )}
    </div>
  );
};

export default HabitsHeaderV2;
