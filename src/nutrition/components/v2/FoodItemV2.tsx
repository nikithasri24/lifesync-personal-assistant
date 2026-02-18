/**
 * FoodItemV2 Component
 * Individual food item card with photo/emoji, name, serving info, calories
 * Matches nutrition-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface FoodItemV2Props {
  id: string;
  name: string;
  servingInfo: string; // e.g., "1 bowl · 250g"
  calories: number;
  photoUrl?: string;
  emoji?: string; // Default emoji if no photo
  onClick: () => void;
}

export const FoodItemV2: React.FC<FoodItemV2Props> = ({
  id,
  name,
  servingInfo,
  calories,
  photoUrl,
  emoji = '🍽️',
  onClick,
}) => {
  const colors = useThemeColors();

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all hover:bg-gray-50"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: '#FAFAFA',
        borderRadius: '12px',
        marginBottom: '8px',
      }}
    >
      {/* Photo or Emoji */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: photoUrl
            ? `url(${photoUrl}) center/cover`
            : 'linear-gradient(135deg, #E8DCC8 0%, #D4C5B3 100%)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}
      >
        {!photoUrl && emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#5C4A3A', marginBottom: '2px' }}>
          {name}
        </div>
        <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
          {servingInfo}
        </div>
      </div>

      {/* Calories */}
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#C18B5E' }}>
        {Math.round(calories)} cal
      </div>
    </div>
  );
};
