/**
 * CircularTimerV2 Component
 * Large circular timer with terracotta gradient ring
 * States: Ready, Active (animated), Paused, Complete
 */

import React from 'react';
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
      {/* Outer Ring - Terracotta Gradient */}
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          boxShadow: '0 8px 24px rgba(212, 165, 116, 0.3)',
        }}
      >
        {/* Inner White Circle */}
        <div
          className="rounded-full bg-white flex flex-col items-center justify-center"
          style={{
            width: size - 20,
            height: size - 20,
          }}
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
        </div>
      </div>
    </div>
  );
};

export default CircularTimerV2;
