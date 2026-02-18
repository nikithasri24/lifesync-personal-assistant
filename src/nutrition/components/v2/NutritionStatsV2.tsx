/**
 * NutritionStatsV2 Component
 * 2x2 stats grid for dashboard: Day Streak, Avg Calories, Avg Protein, Goal Hit Rate
 * Matches nutrition-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface NutritionStatsV2Props {
  dayStreak: number;
  avgCalories: number;
  avgProtein: number;
  goalHitRate: number; // Percentage (0-100)
}

export const NutritionStatsV2: React.FC<NutritionStatsV2Props> = ({
  dayStreak,
  avgCalories,
  avgProtein,
  goalHitRate,
}) => {
  const colors = useThemeColors();

  const stats = [
    { icon: '🔥', value: dayStreak.toString(), label: 'Day Streak' },
    { icon: '📈', value: avgCalories.toLocaleString(), label: 'Avg Calories' },
    { icon: '🥩', value: `${Math.round(avgProtein)}g`, label: 'Avg Protein' },
    { icon: '🎯', value: `${Math.round(goalHitRate)}%`, label: 'Goal Hit Rate' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '0 20px 16px',
      }}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            {stat.icon}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#C18B5E', marginBottom: '4px' }}>
            {stat.value}
          </div>
          <div style={{ fontSize: '12px', color: '#9B8B7A' }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
