/**
 * EmptyConversationStateV2 Component
 * Empty state with starter prompts for new conversations
 */

import React from 'react';

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
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4">🤖</div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>
        How can I help you?
      </h2>

      {/* Subtitle */}
      <p className="text-sm mb-6 max-w-md leading-relaxed" style={{ color: '#6B7280' }}>
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
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #E5E7EB',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#D4A574';
              e.currentTarget.style.backgroundColor = '#FEF3E8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.backgroundColor = 'white';
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
