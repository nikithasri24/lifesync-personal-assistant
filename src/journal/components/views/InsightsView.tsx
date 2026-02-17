/**
 * Insights View Component
 * Analytics, mood tracking, and statistics (Coming Soon)
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export function InsightsView() {
  const colors = useThemeColors();

  return (
    <div className="py-8 px-6 text-center">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
        Insights Coming Soon
      </h3>
      <p className="text-sm mb-4" style={{ color: colors.text.tertiary }}>
        View your journaling streaks, mood analytics, and writing statistics
      </p>
      <div className="max-w-md mx-auto space-y-3 mt-8">
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: colors.bg.white,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔥</div>
            <div className="text-left">
              <div className="text-xs" style={{ color: colors.text.tertiary }}>
                Current Streak
              </div>
              <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                Coming soon
              </div>
            </div>
          </div>
        </div>
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: colors.bg.white,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">😊</div>
            <div className="text-left">
              <div className="text-xs" style={{ color: colors.text.tertiary }}>
                Mood Analytics
              </div>
              <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                Coming soon
              </div>
            </div>
          </div>
        </div>
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: colors.bg.white,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">📝</div>
            <div className="text-left">
              <div className="text-xs" style={{ color: colors.text.tertiary }}>
                Total Entries
              </div>
              <div className="text-lg font-bold" style={{ color: colors.text.primary }}>
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
