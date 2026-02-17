import React from 'react';

interface EmptyConversationStateProps {
  onSuggestionClick: (text: string) => void;
}

/**
 * Empty state with suggestions for starting conversation - Clean design
 */
export function EmptyConversationState({
  onSuggestionClick,
}: EmptyConversationStateProps): React.ReactElement {
  const starterPrompts = [
    "What are my tasks for today?",
    "Help me plan meals for the week",
    "Show my habit streaks",
    "What's my budget status?",
    "Create a quick task"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] py-8 px-6 text-center">
      <div className="text-6xl mb-4">🤖</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        How can I help you?
      </h2>
      <p className="text-sm text-gray-600 mb-6 max-w-md leading-relaxed">
        I can help you manage tasks, plan meals, track habits, and answer questions about your data.
      </p>
      <div className="w-full max-w-md space-y-2">
        {starterPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(prompt)}
            className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-[#D4A574] hover:bg-[#FEF3E8] transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
