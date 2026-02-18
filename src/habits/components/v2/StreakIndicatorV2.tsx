/**
 * StreakIndicatorV2 Component
 * Displays streak information with fire icon and terracotta gradient
 */

import React from 'react';
import { Flame } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export interface StreakIndicatorV2Props {
  currentStreak: number;
  bestStreak?: number;
  size?: 'sm' | 'md' | 'lg';
  showBest?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-2.5 py-1 text-sm gap-1',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'px-3 py-1.5 text-base gap-1.5',
    icon: 'w-5 h-5',
  },
};

export const StreakIndicatorV2: React.FC<StreakIndicatorV2Props> = ({
  currentStreak,
  bestStreak,
  size = 'md',
  showBest = false,
  className = '',
}) => {
  const colors = useThemeColors();
  const styles = sizeStyles[size];

  // Milestone streaks get special treatment
  const isMilestone = currentStreak >= 100 || currentStreak >= 30 || currentStreak >= 7;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`inline-flex items-center rounded-xl font-bold ${styles.container}`}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(245, 124, 0, 0.15) 100%)',
          color: '#F57C00',
        }}
      >
        <Flame className={styles.icon} fill="#F57C00" />
        <span>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
      </div>

      {showBest && bestStreak !== undefined && bestStreak > currentStreak && (
        <span
          className="text-xs"
          style={{ color: colors.text.tertiary }}
        >
          Best: {bestStreak}
        </span>
      )}

      {isMilestone && (
        <span className="text-xs animate-pulse" style={{ color: '#F57C00' }}>
          🎉
        </span>
      )}
    </div>
  );
};

export default StreakIndicatorV2;
