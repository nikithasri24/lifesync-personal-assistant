/**
 * Goals Header V2
 * Simple header following Together tab pattern
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

export const GoalsHeaderV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">🎯</span>
        Life Goals
      </h1>
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        Track your aspirations and celebrate achievements
      </p>
    </div>
  );
};
