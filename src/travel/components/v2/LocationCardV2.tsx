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
      className="cursor-pointer transition-transform active:scale-[0.98]"
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '28px' }}>{icon}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#C18B5E' }}>
          {total ? `${count}/${total}` : count}
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#5C4A3A', marginBottom: total ? '8px' : 0 }}>
        {title}
      </div>

      {/* Progress Bar */}
      {total && (
        <div
          style={{
            background: '#E8DCC8',
            height: '6px',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
              height: '100%',
              borderRadius: '3px',
              width: `${progress}%`,
              transition: 'width 0.3s',
            }}
          />
        </div>
      )}
    </div>
  );
};
