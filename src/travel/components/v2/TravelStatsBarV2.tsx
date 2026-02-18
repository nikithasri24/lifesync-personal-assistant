/**
 * TravelStatsBarV2 Component
 * 4-column stats grid showing travel achievements
 * Matches travel-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TravelStatsBarV2Props {
  countriesVisited: number;
  statesVisited: number;
  parksVisited: number;
  islandsVisited: number;
}

export const TravelStatsBarV2: React.FC<TravelStatsBarV2Props> = ({
  countriesVisited,
  statesVisited,
  parksVisited,
  islandsVisited,
}) => {
  const colors = useThemeColors();

  const stats = [
    { number: countriesVisited, label: 'Countries' },
    { number: statesVisited, label: 'States' },
    { number: parksVisited, label: 'Parks' },
    { number: islandsVisited, label: 'Islands' },
  ];

  return (
    <div
      className="grid gap-3 p-4 rounded-2xl shadow-sm"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        backgroundColor: colors.bg.white,
      }}
    >
      {stats.map((stat, index) => (
        <div key={index} style={{ textAlign: 'center' }}>
          <div className="text-2xl font-extrabold" style={{ color: colors.accent.end }}>
            {stat.number}
          </div>
          <div
            className="text-xs uppercase font-semibold tracking-wide mt-1"
            style={{
              color: colors.text.secondary,
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
