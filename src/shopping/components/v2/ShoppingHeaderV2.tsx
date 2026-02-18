/**
 * ShoppingHeaderV2 Component
 * Simple page header matching Together tab pattern
 * No gradient text, clean emoji + title design
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export interface ShoppingHeaderV2Props {
  title?: string;
  subtitle?: string;
  itemsCount?: number;
  completedCount?: number;
  totalCost?: number;
  onVoiceClick?: () => void;
  onBarcodeClick?: () => void;
  onFilterClick?: () => void;
  className?: string;
}

export const ShoppingHeaderV2: React.FC<ShoppingHeaderV2Props> = ({
  className = '',
}) => {
  const colors = useThemeColors();

  return (
    <div className={`mb-6 ${className}`}>
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">🛒</span>
        Shopping
      </h1>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Track your shopping lists and pantry
      </p>
    </div>
  );
};

export default ShoppingHeaderV2;
