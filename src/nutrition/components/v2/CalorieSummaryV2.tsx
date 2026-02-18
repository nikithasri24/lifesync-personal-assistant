/**
 * CalorieSummaryV2 Component
 * Circular progress showing calories consumed/remaining
 * Matches nutrition-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CalorieSummaryV2Props {
  consumed: number;
  goal: number;
}

export const CalorieSummaryV2: React.FC<CalorieSummaryV2Props> = ({
  consumed,
  goal,
}) => {
  const colors = useThemeColors();

  const remaining = Math.max(0, goal - consumed);
  const percentage = goal > 0 ? (consumed / goal) * 100 : 0;
  const circumference = 2 * Math.PI * 50; // radius = 50
  const strokeDashoffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        margin: '16px 20px',
        borderRadius: '16px',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
      }}
    >
      {/* Circular Progress */}
      <div style={{ width: '120px', height: '120px', margin: '0 auto 16px', position: 'relative' }}>
        <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="white"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', fontWeight: '800' }}>
            {consumed.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
            calories
          </div>
        </div>
      </div>

      {/* Remaining text */}
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        {remaining.toLocaleString()} remaining
      </div>
    </div>
  );
};
