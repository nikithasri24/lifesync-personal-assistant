import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyConversationStateProps {
  onSuggestionClick: (text: string) => void;
}

/**
 * Empty state with suggestions for starting conversation
 */
export function EmptyConversationState({
  onSuggestionClick,
}: EmptyConversationStateProps): React.ReactElement {
  const suggestions = [
    { text: "I spent $45 at Whole Foods", icon: "💰" },
    { text: "I want to save $10k for Japan", icon: "✈️" },
    { text: "What's my week look like?", icon: "📅" },
    { text: "Remind me to call mom tomorrow", icon: "✅" }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-16rem)]">
      <div className="text-center space-y-6 max-w-3xl w-full px-4">
        <div className="inline-block p-4 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full">
          <Sparkles className="h-12 w-12 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            How can I help you today?
          </h2>
          <p className="text-slate-600">
            Talk to me naturally - I can manage your life
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-8">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="p-4 text-left bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-sm hover:shadow"
            >
              <span className="text-2xl mb-2 block">{suggestion.icon}</span>
              <span className="text-sm text-slate-700">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
