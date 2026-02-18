/**
 * LocationCardV2 Component
 * Display country/location cards in grid view
 * Shows emoji icon, count, and progress bar
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LocationCardV2Props {
  icon: string; // Emoji
  title: string;
  count: number;
  total?: number;
  onClick: () => void;
}

export const LocationCardV2: React.FC<LocationCardV2Props> = ({
  icon,
  title,
  count,
  total,
  onClick,
}) => {
  const colors = useThemeColors();
  const progress = total ? (count / total) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform active:scale-[0.98] p-4 rounded-xl shadow-sm"
      style={{
        backgroundColor: colors.bg.white,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl">{icon}</div>
        <div className="text-lg font-extrabold" style={{ color: colors.accent.end }}>
          {total ? `${count}/${total}` : count}
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-semibold" style={{ color: colors.text.primary, marginBottom: total ? '8px' : 0 }}>
        {title}
      </div>

      {/* Progress Bar */}
      {total && (
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{
            backgroundColor: colors.border.light,
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
              width: `${progress}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
