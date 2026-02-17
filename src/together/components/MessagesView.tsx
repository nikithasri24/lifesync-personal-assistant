/**
 * Messages View Component
 * Shows partner messages inbox and memory box
 */

import React, { useState, useEffect } from 'react';
import { Clock, Check, Star } from 'lucide-react';
import { usePartnerMessages } from '../hooks';
import type { PartnerLink, PartnerMessage } from '../types';
import { ComposeMessageModal } from './modals/ComposeMessageModal';
import { MessageDetailModal } from './modals/MessageDetailModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatDateLong } from '../utils/dateHelpers';

interface MessagesViewProps {
  partnerLink: PartnerLink | null | undefined;
}

const STORAGE_KEY_COMPOSE = 'together_messages_compose_open';
const STORAGE_KEY_VIEWING = 'together_messages_viewing_id';

export const MessagesView: React.FC<MessagesViewProps> = ({ partnerLink }) => {
  const colors = useThemeColors();

  // Restore compose modal state from localStorage
  const [composeOpen, setComposeOpen] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COMPOSE);
    return saved === 'true';
  });

  // Restore viewing message ID from localStorage
  const [viewingMessageId, setViewingMessageId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_VIEWING);
  });

  // Track which message is being edited
  const [editingMessage, setEditingMessage] = useState<PartnerMessage | null>(null);

  const { data: messages = [], isLoading } = usePartnerMessages();

  // Find the viewing message from the ID
  const viewingMessage = viewingMessageId
    ? messages.find(m => m.id === viewingMessageId) || null
    : null;

  // Clear viewing message ID if message not found after loading completes
  useEffect(() => {
    if (!isLoading && viewingMessageId && !viewingMessage) {
      setViewingMessageId(null);
    }
  }, [isLoading, viewingMessageId, viewingMessage]);

  // Save compose state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPOSE, composeOpen.toString());
  }, [composeOpen]);

  // Save viewing message ID to localStorage whenever it changes
  useEffect(() => {
    if (viewingMessageId) {
      localStorage.setItem(STORAGE_KEY_VIEWING, viewingMessageId);
    } else {
      localStorage.removeItem(STORAGE_KEY_VIEWING);
    }
  }, [viewingMessageId]);

  const handleOpenCompose = () => setComposeOpen(true);
  const handleCloseCompose = () => setComposeOpen(false);

  const handleViewMessage = (message: PartnerMessage) => {
    setViewingMessageId(message.id);
  };

  const handleCloseViewMessage = () => {
    setViewingMessageId(null);
  };

  const hasPartner = partnerLink?.status === 'accepted';

  if (!hasPartner) {
    return (
      <div
        className="p-8 rounded-xl border-2 border-dashed text-center"
        style={{ borderColor: colors.border.medium }}
      >
        <div className="text-4xl mb-3">💌</div>
        <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
          Link with your partner to send messages
        </p>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Go to <a href="/shared" className="underline hover:opacity-80" style={{ color: '#D4A574' }}>Shared</a> to connect with your partner first
        </p>
      </div>
    );
  }

  // Categorize messages (only if we have messages loaded)
  const scheduled = messages.filter(m => m.status === 'scheduled');
  const revealed = messages.filter(m => m.status === 'revealed');
  const drafts = messages.filter(m => m.status === 'draft');

  const getStatusBadge = (message: PartnerMessage) => {
    if (message.status === 'scheduled') {
      return (
        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
          <Clock className="w-3 h-3" />
          <span>Scheduled</span>
        </div>
      );
    }
    if (message.status === 'revealed') {
      return (
        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
          <Check className="w-3 h-3" />
          <span>Delivered</span>
        </div>
      );
    }
    return null;
  };

  const getRevealText = (message: PartnerMessage) => {
    if (message.reveal_trigger === 'first_login') {
      return 'First login trigger';
    }
    if (message.reveal_trigger === 'specific_date' && message.reveal_date) {
      const date = formatDateLong(message.reveal_date.split('T')[0]);
      return `Scheduled: ${date}`;
    }
    if (message.reveal_trigger === 'achievement' && message.achievement_id) {
      return 'Achievement unlock trigger';
    }
    if (message.reveal_trigger === 'manual') {
      return 'Manual reveal';
    }
    return 'Draft';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          Compose New Message
        </h2>
        <button
          onClick={handleOpenCompose}
          className="px-4 py-2 rounded-lg font-semibold transition-colors text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #D4A574 100%)' }}
        >
          Write
        </button>
      </div>

      <hr style={{ borderColor: colors.border.light }} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border animate-pulse"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.light,
              }}
            >
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div
          className="p-8 rounded-xl border-2 border-dashed text-center"
          style={{ borderColor: colors.border.medium }}
        >
          <div className="text-4xl mb-3">💌</div>
          <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
            No messages yet
          </p>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            Write a surprise birthday letter or anniversary message
          </p>
          <button
            onClick={handleOpenCompose}
            className="px-4 py-2 rounded-lg font-semibold transition-colors text-white"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            Write Your First Message
          </button>
        </div>
      ) : (
        <>
          {/* Scheduled Messages */}
          {scheduled.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Scheduled Messages
              </h3>
              <div className="space-y-3">
                {scheduled.map((message) => (
                  <div
                    key={message.id}
                    className="p-5 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
                    style={{
                      backgroundColor: colors.bg.white,
                      borderColor: colors.border.light,
                    }}
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                        💌 {message.title}
                      </h4>
                      {getStatusBadge(message)}
                    </div>
                    <p className="text-sm mb-2" style={{ color: colors.text.secondary }}>
                      {getRevealText(message)}
                    </p>
                    <p className="text-sm line-clamp-2" style={{ color: colors.text.tertiary }}>
                      {message.message_body.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivered Messages */}
          {revealed.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Delivered Messages
              </h3>
              <div className="space-y-3">
                {revealed.map((message) => (
                  <div
                    key={message.id}
                    className="p-5 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
                    style={{
                      backgroundColor: colors.bg.white,
                      borderColor: colors.border.light,
                    }}
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                        ❤️ {message.title}
                      </h4>
                      {getStatusBadge(message)}
                    </div>
                    <p className="text-sm mb-2" style={{ color: colors.text.secondary }}>
                      Delivered: {message.revealed_at ? formatDateLong(message.revealed_at.split('T')[0]) : 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm underline"
                        style={{ color: '#D4A574' }}
                      >
                        Read Again
                      </button>
                      <Star className="w-4 h-4" style={{ color: '#FFD700' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drafts */}
          {drafts.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Drafts
              </h3>
              <div className="space-y-3">
                {drafts.map((message) => (
                  <div
                    key={message.id}
                    className="p-5 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
                    style={{
                      backgroundColor: colors.bg.secondary,
                      borderColor: colors.border.light,
                    }}
                    onClick={() => handleViewMessage(message)}
                  >
                    <h4 className="font-bold text-lg mb-2" style={{ color: colors.text.primary }}>
                      📝 {message.title}
                    </h4>
                    <p className="text-sm" style={{ color: colors.text.tertiary }}>
                      Draft - Not sent yet
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Compose Modal */}
      {composeOpen && (
        <ComposeMessageModal
          isOpen={composeOpen}
          partnerLink={partnerLink}
          onClose={() => {
            handleCloseCompose();
            setEditingMessage(null); // Clear editing state
          }}
          editingMessage={editingMessage}
        />
      )}

      {/* Message Detail Modal - only show if message is loaded */}
      {viewingMessage && !isLoading && (
        <MessageDetailModal
          isOpen={!!viewingMessage}
          message={viewingMessage}
          onClose={handleCloseViewMessage}
          onEdit={() => {
            // Set editing message and open compose modal
            setEditingMessage(viewingMessage);
            handleCloseViewMessage();
            setComposeOpen(true);
          }}
        />
      )}
    </div>
  );
};
