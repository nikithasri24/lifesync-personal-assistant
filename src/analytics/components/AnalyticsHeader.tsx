import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { gradients } from '../../styles/colors';

/**
 * Header for Analytics page - V2 Design
 */
export function AnalyticsHeader(): React.ReactElement {
  const colors = useThemeColors();

  return (
    <div className="sticky top-0 z-10 px-6 pt-4 pb-3" style={{ background: gradients.primary }}>
      <div className="flex items-center gap-3 mb-1">
        <BarChart3 className="w-8 h-8 text-white" />
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
      </div>
      <p className="text-sm text-white/90">Track your productivity and habit performance</p>
    </div>
  );
}
