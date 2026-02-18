/**
 * EmptyConversationStateV2 Component
 * Empty state with starter prompts for new conversations
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface EmptyConversationStateV2Props {
  onSuggestionClick: (text: string) => void;
}

const STARTER_PROMPTS = [
  'What are my tasks for today?',
  'Help me plan meals for the week',
  'Show my habit streaks',
  "What's my budget status?",
  'Create a quick task',
];

export const EmptyConversationStateV2: React.FC<EmptyConversationStateV2Props> = ({
  onSuggestionClick,
}) => {
  const colors = useThemeColors();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4" style={{ opacity: 0.6 }}>🤖</div>

      {/* Title */}
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: colors.text.primary }}
      >
        How can I help you?
      </h2>

      {/* Subtitle */}
      <p
        className="text-sm mb-6 max-w-md leading-relaxed"
        style={{ color: colors.text.tertiary }}
      >
        I can help you manage tasks, plan meals, track habits, and answer
        questions about your data.
      </p>

      {/* Starter Prompts */}
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggestionClick(prompt)}
            className="px-4 py-3 rounded-xl text-left text-sm transition-all"
            style={{
              backgroundColor: colors.bg.card,
              color: colors.text.primary,
              border: `1px solid ${colors.border.light}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.card;
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyConversationStateV2;
