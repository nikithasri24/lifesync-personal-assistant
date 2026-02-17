/**
 * Stats Grid Component
 * Displays key metrics for shared connections
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { SharedStats } from '../types';

interface StatsGridProps {
  stats: SharedStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const colors = useThemeColors();

  return (
    <div
      className="grid grid-cols-3 gap-3 px-5 py-4 mx-5 mb-4 rounded-2xl"
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      <div className="text-center">
        <span
          className="block text-3xl font-extrabold"
          style={{ color: colors.accent.end }}
        >
          {stats.partner_count}
        </span>
        <span
          className="block text-xs font-semibold uppercase tracking-wide mt-1"
          style={{ color: colors.text.tertiary }}
        >
          Partner
        </span>
      </div>

      <div className="text-center">
        <span
          className="block text-3xl font-extrabold"
          style={{ color: colors.accent.end }}
        >
          {stats.shared_modules_count}
        </span>
        <span
          className="block text-xs font-semibold uppercase tracking-wide mt-1"
          style={{ color: colors.text.tertiary }}
        >
          Modules
        </span>
      </div>

      <div className="text-center">
        <span
          className="block text-3xl font-extrabold"
          style={{ color: colors.accent.end }}
        >
          {stats.shared_items_count}
        </span>
        <span
          className="block text-xs font-semibold uppercase tracking-wide mt-1"
          style={{ color: colors.text.tertiary }}
        >
          Shared
        </span>
      </div>
    </div>
  );
}
