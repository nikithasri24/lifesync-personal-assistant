import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface StatsCardsProps {
  goalStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  dreamStats: {
    total: number;
    achieved: number;
  };
  activeTab: 'goals' | 'dreams';
}

/**
 * Stats cards showing goal and dream statistics with terracotta gradient numbers
 */
export function StatsCards({ goalStats, dreamStats, activeTab }: StatsCardsProps): React.ReactElement {
  const colors = useThemeColors();

  const gradientTextStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  // Different stats based on active tab
  const stats = activeTab === 'goals'
    ? [
        { label: 'TOTAL GOALS', value: goalStats.total },
        { label: 'IN PROGRESS', value: goalStats.inProgress },
        { label: 'COMPLETED', value: goalStats.completed },
      ]
    : [
        { label: 'TOTAL DREAMS', value: dreamStats.total },
        { label: 'ACHIEVED', value: dreamStats.achieved },
        { label: 'IN PROGRESS', value: dreamStats.total - dreamStats.achieved },
      ];

  return (
    <section className="grid grid-cols-3 gap-3">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white p-4 text-center shadow-sm"
          style={{ borderColor: colors.border.light, borderWidth: '1px' }}
        >
          <div
            className="text-3xl font-bold mb-1"
            style={gradientTextStyle}
          >
            {stat.value}
          </div>
          <div
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: colors.text.tertiary }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </section>
  );
}
