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
 * List of conversation messages with user and assistant bubbles - Clean terracotta design
 */
export function MessagesList({
  messages,
  isThinking,
  transcript,
}: MessagesListProps): React.ReactElement {
  // Get user initials (would be from auth in real app)
  const userInitials = 'S';

  return (
    <>
      {/* Timestamp divider */}
      {messages.length > 0 && (
        <div className="text-center text-xs text-gray-500 my-3">
          Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
        >
          {/* Avatar for assistant */}
          {msg.role === 'assistant' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-base">
              🤖
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-[#D4A574] text-white rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>

            {/* Function calls badge */}
            {msg.functionCalls && msg.functionCalls.length > 0 && (
              <div className="mt-2">
                <span className="inline-block bg-[#F5EBE0] text-[#8B6F47] px-2 py-1 rounded-md text-xs font-semibold">
                  Task Created
                </span>
              </div>
            )}

            {/* Timestamp */}
            {msg.timestamp && (
              <div className="text-[11px] text-gray-400 mt-1">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Avatar for user */}
          {msg.role === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center text-white text-sm font-semibold">
              {userInitials}
            </div>
          )}
        </div>
      ))}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex gap-2 justify-start max-w-[85%]">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-base">
            🤖
          </div>
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '200ms' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '400ms' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live transcript */}
      {transcript && (
        <div className="flex gap-2 justify-end max-w-[85%] ml-auto">
          <div className="bg-gray-100 border-2 border-[#D4A574] border-dashed rounded-2xl rounded-br-sm px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gray-700">Recording...</span>
            </div>
            <p className="text-sm text-gray-700 italic">{transcript}</p>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D4A574] flex items-center justify-center text-white text-sm font-semibold">
            {userInitials}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
