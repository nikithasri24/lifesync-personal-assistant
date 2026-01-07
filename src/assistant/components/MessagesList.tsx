import React from 'react';
import { Bot, User, Zap, CheckCircle2 } from 'lucide-react';

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
 * List of conversation messages with user and assistant bubbles - Redesigned
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
          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
        >
          {/* Avatar for assistant */}
          {msg.role === 'assistant' && (
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                : 'bg-slate-800 border border-slate-600 text-white'
            }`}
          >
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-white" style={{ color: '#ffffff' }}>
              {msg.content}
            </p>

            {/* Function calls */}
            {msg.functionCalls && msg.functionCalls.length > 0 && (
              <div className={`mt-3 pt-3 space-y-2 ${
                msg.role === 'user'
                  ? 'border-t border-white/20'
                  : 'border-t border-slate-600'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white opacity-90">
                  <Zap className="h-3 w-3" />
                  <span>Actions performed:</span>
                </div>
                {msg.functionCalls.map((fc: { name: string }, j: number) => (
                  <div key={j} className="flex items-center gap-1.5 text-xs text-white opacity-90">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{fc.name.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            {msg.timestamp && (
              <div className="text-xs opacity-50 mt-2 text-white" style={{ color: '#ffffff' }}>
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Avatar for user */}
          {msg.role === 'user' && (
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex gap-3 justify-start animate-fadeIn">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
              <Bot className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 shadow-sm">
            <div className="flex gap-1.5">
              <div
                className="w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2.5 h-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2.5 h-2.5 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live transcript */}
      {transcript && (
        <div className="flex gap-3 justify-end animate-fadeIn">
          <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-slate-700 border-2 border-indigo-400 border-dashed shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-white">Recording...</span>
            </div>
            <p className="text-sm text-white italic" style={{ color: '#ffffff' }}>{transcript}</p>
          </div>
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
