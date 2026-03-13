/**
 * ConversationHistoryDrawer
 * Collapsible panel showing past conversations.
 * The conversation data is already fetched in Assistant.tsx — this just renders it.
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Conversation {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  createdAt?: string;
  updatedAt?: string;
}

interface ConversationHistoryDrawerProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

const STORAGE_KEY = 'assistant_history_expanded';

function getRelativeTime(conversation: Conversation): string {
  const raw = conversation.messages.at(-1)?.timestamp ?? conversation.createdAt;
  if (!raw) return '';
  try {
    return formatDistanceToNow(new Date(raw), { addSuffix: true });
  } catch {
    return '';
  }
}

export const ConversationHistoryDrawer: React.FC<ConversationHistoryDrawerProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
}) => {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(isExpanded)); } catch { /* ignore */ }
  }, [isExpanded]);

  // Hide when there are no past conversations yet
  if (conversations.length === 0) return null;

  return (
    <div
      className="rounded-xl mb-4 overflow-hidden"
      style={{ backgroundColor: colors.bg.white, border: `1px solid ${colors.border.light}` }}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
        aria-label={isExpanded ? 'Collapse chat history' : 'Expand chat history'}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: '#C18B5E' }} />
          <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Recent Chats
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#C18B5E' }}
          >
            {conversations.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" style={{ color: colors.text.tertiary }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: colors.text.tertiary }} />
        )}
      </button>

      {isExpanded && (
        <div style={{ borderTop: `1px solid ${colors.border.light}` }}>
          {conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                style={{
                  borderLeft: isActive ? '3px solid #C18B5E' : '3px solid transparent',
                  backgroundColor: isActive ? 'rgba(212,165,116,0.06)' : undefined,
                }}
                aria-label={`Open conversation: ${conv.title || 'Untitled'}`}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: isActive ? '#C18B5E' : colors.text.primary }}
                  >
                    {conv.title || 'Untitled conversation'}
                  </p>
                  {conv.messages.length > 0 && (
                    <p className="text-xs truncate mt-0.5" style={{ color: colors.text.tertiary }}>
                      {conv.messages.at(-1)?.content.slice(0, 60)}
                    </p>
                  )}
                </div>
                <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: colors.text.tertiary }}>
                  {getRelativeTime(conv)}
                </span>
              </button>
            );
          })}

          {/* New Chat button at bottom */}
          <div style={{ borderTop: `1px solid ${colors.border.light}` }}>
            <button
              type="button"
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ color: '#C18B5E' }}
              aria-label="Start new chat"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationHistoryDrawer;
