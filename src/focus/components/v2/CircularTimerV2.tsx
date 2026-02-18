/**
 * CircularTimerV2 Component
 * Large circular timer with animated progress ring
 * States: Ready, Active (animated), Paused, Complete
 */

import React from 'react';
import { ProgressRingV2 } from '@/components/v2';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface CircularTimerV2Props {
  seconds: number;
  totalSeconds: number;
  state: 'ready' | 'active' | 'paused' | 'complete';
  label?: string;
  size?: number;
}

export const CircularTimerV2: React.FC<CircularTimerV2Props> = ({
  seconds,
  totalSeconds,
  state,
  label,
  size = 240,
}) => {
  const colors = useThemeColors();

  // Format time as MM:SS
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0;

  // Determine color based on state
  const getStateColor = () => {
    switch (state) {
      case 'ready':
        return colors.text.tertiary; // Gray
      case 'active':
        return '#D4A574'; // Terracotta (animated)
      case 'paused':
        return '#F59E0B'; // Orange
      case 'complete':
        return '#22C55E'; // Green
      default:
        return colors.text.tertiary;
    }
  };

  const getStateLabel = () => {
    if (label) return label;
    switch (state) {
      case 'ready':
        return 'Ready';
      case 'active':
        return 'Focus Time';
      case 'paused':
        return 'Paused';
      case 'complete':
        return 'Complete!';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Progress Ring */}
        <ProgressRingV2
          progress={progress}
          size={size}
          strokeWidth={10}
          color={getStateColor()}
          animated={state === 'active'}
          showPercentage={false}
        >
          {/* Timer Display */}
          <div className="flex flex-col items-center justify-center animate-fadeIn">
            <div
              className="text-5xl font-bold tracking-tight"
              style={{ color: colors.text.primary }}
            >
              {formatTime(seconds)}
            </div>
            <div
              className="text-sm mt-1"
              style={{ color: colors.text.secondary }}
            >
              {getStateLabel()}
            </div>
          </div>
        </ProgressRingV2>
      </div>
    </div>
  );
};

export default CircularTimerV2;
