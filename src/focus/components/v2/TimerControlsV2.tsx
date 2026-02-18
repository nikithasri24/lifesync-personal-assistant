/**
 * TimerControlsV2 Component
 * Play/Pause/Reset buttons with terracotta gradient
 * Large circular buttons with proper aria-labels
 */

import React from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { gradients } from '@/styles/colors';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface TimerControlsV2Props {
  isActive: boolean;
  isPaused: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onSettings?: () => void;
  disabled?: boolean;
}

export const TimerControlsV2: React.FC<TimerControlsV2Props> = ({
  isActive,
  isPaused,
  onPlayPause,
  onReset,
  onSettings,
  disabled = false,
}) => {
  const colors = useThemeColors();

  const getPlayPauseIcon = () => {
    if (isActive && !isPaused) {
      return <Pause className="w-8 h-8" />;
    }
    return <Play className="w-8 h-8" />;
  };

  const getPlayPauseLabel = () => {
    if (isActive && !isPaused) {
      return 'Pause timer';
    } else if (isPaused) {
      return 'Resume timer';
    }
    return 'Start timer';
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {/* Reset Button */}
      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        className="
          w-16 h-16 rounded-full
          flex items-center justify-center
          shadow-md
          transition-transform duration-200
          hover:scale-105 active:scale-95
          disabled:hover:scale-100
        "
        style={{
          backgroundColor: colors.bg.card,
          color: '#D4A574',
        }}
        aria-label="Reset timer"
      >
        <RotateCcw className="w-6 h-6" />
      </button>

      {/* Play/Pause Button (Primary) */}
      <button
        type="button"
        onClick={onPlayPause}
        disabled={disabled}
        className="
          w-20 h-20 rounded-full
          flex items-center justify-center
          text-white
          shadow-lg
          transition-transform duration-200
          hover:scale-110 active:scale-90
          disabled:hover:scale-100
        "
        style={{
          background: gradients.primary,
          boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)',
        }}
        aria-label={getPlayPauseLabel()}
      >
        {getPlayPauseIcon()}
      </button>

      {/* Settings Button */}
      {onSettings && (
        <button
          type="button"
          onClick={onSettings}
          disabled={disabled}
          className="
            w-16 h-16 rounded-full
            flex items-center justify-center
            shadow-md
            transition-transform duration-200
            hover:scale-105 active:scale-95
            disabled:hover:scale-100
          "
          style={{
            backgroundColor: colors.bg.card,
            color: '#D4A574',
          }}
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default TimerControlsV2;
