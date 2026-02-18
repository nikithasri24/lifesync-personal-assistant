/**
 * TypingIndicatorV2 Component
 * Animated typing indicator for AI responses
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

export const TypingIndicatorV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="flex gap-2 max-w-[85%] self-start">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
        style={{
          backgroundColor: colors.bg.secondary,
          color: colors.text.secondary,
        }}
      >
        🤖
      </div>

      {/* Typing Bubble */}
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{
          backgroundColor: colors.bg.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: colors.text.tertiary,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.4s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicatorV2;
