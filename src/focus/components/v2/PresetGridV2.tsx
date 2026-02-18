/**
 * PresetGridV2 Component
 * 2x2 grid of preset timer buttons
 * Active preset highlighted with terracotta gradient
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeColors } from '@/hooks/useThemeColors';
import { gradients } from '@/styles/colors';

export interface TimerPreset {
  id: string;
  name: string;
  emoji: string;
  minutes: number;
}

export interface PresetGridV2Props {
  presets: TimerPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: TimerPreset) => void;
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: 'pomodoro', name: 'Pomodoro', emoji: '🍅', minutes: 25 },
  { id: 'short-break', name: 'Short Break', emoji: '☕', minutes: 5 },
  { id: 'deep-work', name: 'Deep Work', emoji: '🧠', minutes: 90 },
  { id: 'long-break', name: 'Long Break', emoji: '🌟', minutes: 15 },
];

export const PresetGridV2: React.FC<PresetGridV2Props> = ({
  presets = DEFAULT_PRESETS,
  activePresetId,
  onSelectPreset,
}) => {
  const colors = useThemeColors();

  return (
    <div className="mt-8">
      <div
        className="text-sm font-semibold text-center mb-3"
        style={{ color: colors.text.secondary }}
      >
        Quick Start
      </div>

      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;

          return (
            <motion.button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                p-4 rounded-xl
                text-center
                transition-all duration-200
              "
              style={{
                backgroundColor: isActive ? '#FEF3E8' : colors.bg.card,
                border: `2px solid ${isActive ? '#D4A574' : colors.border.light}`,
                boxShadow: isActive
                  ? '0 4px 12px rgba(212, 165, 116, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="text-2xl mb-1">{preset.emoji}</div>
              <div
                className="text-base font-semibold"
                style={{ color: colors.text.primary }}
              >
                {preset.name}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: colors.text.secondary }}
              >
                {preset.minutes} {preset.minutes === 1 ? 'minute' : 'minutes'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetGridV2;
