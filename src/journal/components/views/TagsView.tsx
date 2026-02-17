/**
 * Tags View Component
 * Tag cloud with entry counts and filtering (Coming Soon)
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export function TagsView() {
  const colors = useThemeColors();

  return (
    <div className="py-8 px-6 text-center">
      <div className="text-6xl mb-4">🏷️</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
        Tags Coming Soon
      </h3>
      <p className="text-sm mb-4" style={{ color: colors.text.tertiary }}>
        Browse all your tags with entry counts and quick filtering
      </p>
      <div className="max-w-md mx-auto mt-8">
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: colors.bg.white,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {['Work', 'Personal', 'Goals', 'Gratitude', 'Reflection'].map((tag) => (
              <div
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: colors.badge.bg,
                  color: colors.badge.text,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: colors.text.tertiary }}>
            Preview - Full functionality coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
