/**
 * WeeklyChartV2 Component
 * Bar chart showing 7 days of calorie data with terracotta gradient bars
 * Matches nutrition-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface DayData {
  day: string; // e.g., "Mon", "Tue", etc.
  calories: number;
}

interface WeeklyChartV2Props {
  weekData: DayData[];
  maxCalories?: number; // Maximum calories for scaling (defaults to highest value)
}

export const WeeklyChartV2: React.FC<WeeklyChartV2Props> = ({
  weekData,
  maxCalories,
}) => {
  const colors = useThemeColors();

  const max = maxCalories || Math.max(...weekData.map(d => d.calories), 2000);

  return (
    <div
      style={{
        background: 'white',
        margin: '0 20px 16px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: '700', color: '#5C4A3A', marginBottom: '16px' }}>
        Weekly Calories
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '8px',
          height: '120px',
        }}
      >
        {weekData.map((data, index) => {
          const heightPercentage = max > 0 ? (data.calories / max) * 100 : 0;

          return (
            <div key={index} style={{ flex: 1, textAlign: 'center' }}>
              {/* Bar */}
              <div
                style={{
                  background: 'linear-gradient(180deg, #D4A574 0%, #C18B5E 100%)',
                  borderRadius: '6px 6px 0 0',
                  height: `${heightPercentage}%`,
                  position: 'relative',
                  minHeight: data.calories > 0 ? '4px' : 0,
                  transition: 'height 0.3s ease',
                }}
                title={`${data.calories} cal`}
              />
              {/* Day Label */}
              <div style={{ fontSize: '11px', color: '#9B8B7A', marginTop: '6px' }}>
                {data.day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
