/**
 * MealCardV2 Component
 * Display planned meal in calendar cell or list
 * Supports compact mode for calendar grid
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MealCardV2Props {
  meal: {
    id: string;
    recipeName?: string;
    customName?: string;
    servings?: number;
    status?: 'planned' | 'logged' | 'skipped';
  };
  onClick: () => void;
  compact?: boolean;
}

export const MealCardV2: React.FC<MealCardV2Props> = ({
  meal,
  onClick,
  compact = false,
}) => {
  const colors = useThemeColors();
  const displayName = meal.recipeName || meal.customName || 'Unnamed Meal';

  const statusColors = {
    planned: colors.text.secondary,
    logged: '#10B981',
    skipped: '#9CA3AF',
  };

  const statusColor = statusColors[meal.status || 'planned'];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="text-xs px-2 py-1 rounded cursor-pointer hover:bg-gray-50 transition-colors truncate"
        style={{
          backgroundColor: colors.bg.tertiary,
          color: statusColor,
          borderLeft: `2px solid ${statusColor}`,
        }}
      >
        {displayName}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all"
      style={{
        backgroundColor: colors.bg.white,
        borderColor: colors.border.light,
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
      <h4 className="font-semibold mb-1" style={{ color: colors.text.primary }}>
        {displayName}
      </h4>
      {meal.servings && (
        <p className="text-xs" style={{ color: colors.text.tertiary }}>
          {meal.servings} servings
        </p>
      )}
    </div>
  );
};

export default MealCardV2;
