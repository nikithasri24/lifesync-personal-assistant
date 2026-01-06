import React from 'react';
import { Sparkles, DollarSign, Plane, Calendar, CheckCircle, MessageSquare, Zap } from 'lucide-react';

interface EmptyConversationStateProps {
  onSuggestionClick: (text: string) => void;
}

/**
 * Empty state with suggestions for starting conversation - Redesigned
 */
export function EmptyConversationState({
  onSuggestionClick,
}: EmptyConversationStateProps): React.ReactElement {
  const suggestions = [
    {
      text: "I spent $45 at Whole Foods",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-500",
      category: "Finance"
    },
    {
      text: "I want to save $10k for Japan",
      icon: Plane,
      gradient: "from-blue-500 to-cyan-500",
      category: "Goals"
    },
    {
      text: "What's my week look like?",
      icon: Calendar,
      gradient: "from-purple-500 to-pink-500",
      category: "Schedule"
    },
    {
      text: "Remind me to call mom tomorrow",
      icon: CheckCircle,
      gradient: "from-orange-500 to-red-500",
      category: "Tasks"
    }
  ];

  const capabilities = [
    { icon: DollarSign, text: "Track expenses & budgets" },
    { icon: CheckCircle, text: "Manage tasks & habits" },
    { icon: Calendar, text: "Plan your schedule" },
    { icon: Zap, text: "Quick voice commands" }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] py-8">
      <div className="text-center space-y-8 max-w-4xl w-full px-4">
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full blur-3xl opacity-30 animate-pulse" />
          </div>
          <div className="relative inline-block p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl">
            <Sparkles className="h-16 w-16 text-white animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-white" style={{ color: '#ffffff' }}>
            How can I help you today?
          </h2>
          <p className="text-lg text-white max-w-2xl mx-auto" style={{ color: '#ffffff', opacity: 0.9 }}>
            Your personal AI assistant for managing tasks, finances, habits, and more.
            Just talk to me naturally!
          </p>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {capabilities.map((cap, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 backdrop-blur-sm rounded-full border border-slate-500 shadow-sm"
            >
              <cap.icon className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-white font-medium" style={{ color: '#ffffff' }}>{cap.text}</span>
            </div>
          ))}
        </div>

        {/* Suggestion Cards */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-4">
          {suggestions.map((suggestion, i) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={i}
                onClick={() => onSuggestionClick(suggestion.text)}
                className="group relative p-6 text-left bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-600 hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-gradient-to-br ${suggestion.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-indigo-400 mb-1" style={{ color: '#a5b4fc' }}>
                      {suggestion.category}
                    </div>
                    <div className="text-sm text-white font-medium leading-relaxed" style={{ color: '#ffffff' }}>
                      "{suggestion.text}"
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <div className="pt-4">
          <p className="text-sm text-white" style={{ color: '#ffffff', opacity: 0.7 }}>
            💡 <span className="font-medium">Pro tip:</span> Click the microphone to use voice commands, or type your message below
          </p>
        </div>
      </div>
    </div>
  );
}
