import React from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  functionCalls?: Array<{ name: string; [key: string]: unknown }>;
  timestamp?: Date;
}

interface MessagesListProps {
  messages: ConversationMessage[];
  isThinking: boolean;
  transcript: string;
}

/**
 * List of conversation messages with user and assistant bubbles
 */
export function MessagesList({
  messages,
  isThinking,
  transcript,
}: MessagesListProps): React.ReactElement {
  return (
    <>
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'
                : 'bg-white border border-slate-200 text-slate-900'
            }`}
          >
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>

            {msg.functionCalls && msg.functionCalls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-1">
                {msg.functionCalls.map((fc: { name: string }, j: number) => (
                  <div key={j} className="text-xs opacity-75">
                    ✓ {fc.name.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs opacity-50 mt-2">
              {msg.timestamp?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      {transcript && (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-orange-100 border border-orange-200 text-orange-900">
            <p className="text-sm italic">{transcript}...</p>
          </div>
        </div>
      )}
    </>
  );
}
