/**
 * ChatMessageV2 Component
 * Message bubble for user and AI messages matching app theme
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ConversationMessage } from '@/types/infrastructure';

interface ChatMessageV2Props {
  message: ConversationMessage;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onSuggestionClick?: (text: string) => void;
}

export const ChatMessageV2: React.FC<ChatMessageV2Props> = ({
  message,
  showAvatar = true,
  showTimestamp = false,
  onSuggestionClick,
}) => {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const userInitials = 'S'; // TODO: Get from auth context

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex gap-2 max-w-[85%] ${
          isUser ? 'self-end flex-row-reverse' : 'self-start'
        }`}
      >
        {/* Avatar */}
        {showAvatar && (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isUser ? colors.accent.start : colors.bg.secondary,
              color: isUser ? 'white' : colors.text.secondary,
              fontSize: isUser ? '0.875rem' : '1rem',
              fontWeight: isUser ? 600 : 400,
            }}
          >
            {isUser ? userInitials : '🤖'}
          </div>
        )}

        {/* Message Bubble */}
        <div className="flex flex-col gap-2">
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
            }`}
            style={{
              backgroundColor: isUser ? colors.accent.start : colors.bg.white,
              color: isUser ? 'white' : colors.text.primary,
              boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {/* Context Badge */}
            {message.contextBadge && !isUser && (
              <div
                className="inline-block px-2 py-1 rounded-md text-xs font-semibold mb-2"
                style={{
                  backgroundColor: '#E0E7FF',
                  color: '#4F46E5',
                }}
              >
                {message.contextBadge}
              </div>
            )}

            {/* Message Content */}
            <div>{message.content}</div>

            {/* Suggestion Chips */}
            {message.suggestions && message.suggestions.length > 0 && !isUser && onSuggestionClick && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSuggestionClick(suggestion)}
                    className="px-3 py-1.5 rounded-2xl text-xs font-medium border transition-colors hover:border-terracotta-400 hover:bg-terracotta-50"
                    style={{
                      backgroundColor: colors.bg.white,
                      borderColor: colors.border.light,
                      color: colors.text.primary,
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          {showTimestamp && (
            <div
              className={`text-xs px-1 ${isUser ? 'text-right' : 'text-left'}`}
              style={{ color: colors.text.tertiary }}
            >
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageV2;
