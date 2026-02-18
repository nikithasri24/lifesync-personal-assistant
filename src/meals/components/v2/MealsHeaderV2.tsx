/**
 * MealsHeaderV2 Component
 * Simple page header matching Together tab pattern
 * No gradient text, clean emoji + title design
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

export const MealsHeaderV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">🍽️</span>
        Meal Planning
      </h1>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Plan your meals and generate grocery lists
      </p>
    </div>
  );
};

export default MealsHeaderV2;
