/**
 * ChatMessageV2 Component
 * Message bubble for user and AI messages matching app theme
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ConversationMessage } from '@/types/infrastructure';

interface ChatMessageV2Props {
  message: ConversationMessage;
  showAvatar?: boolean;
}

export const ChatMessageV2: React.FC<ChatMessageV2Props> = ({
  message,
  showAvatar = true,
}) => {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const userInitials = 'U'; // Would come from auth in real app

  return (
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
            backgroundColor: isUser ? colors.accent.primary : colors.bg.secondary,
            color: isUser ? 'white' : colors.text.secondary,
            fontSize: isUser ? '0.875rem' : '1rem',
            fontWeight: isUser ? 600 : 400,
          }}
        >
          {isUser ? userInitials : '🤖'}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isUser ? colors.accent.primary : colors.bg.card,
          color: isUser ? 'white' : colors.text.primary,
          boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessageV2;
