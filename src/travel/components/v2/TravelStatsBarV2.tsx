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
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        padding: '16px 20px',
        background: 'white',
        margin: '0 20px 16px',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {stats.map((stat, index) => (
        <div key={index} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#C18B5E' }}>
            {stat.number}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#9B8B7A',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.3px',
              marginTop: '4px',
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
