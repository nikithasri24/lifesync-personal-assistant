/**
 * Messages View Component
 * Shows partner messages inbox and memory box
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Check, Star, Trash2 } from 'lucide-react';
import { usePartnerMessages, useDeletePartnerMessage } from '../hooks';
import { useMergedMessagesConnection } from '../hooks/useTogetherMergedMode';
import { useCurrentUserId } from '@/hooks/useOwnerInfo';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';
import { OwnerBadge } from '@/components/common/OwnerBadge';
import type { PartnerLink, PartnerMessage } from '../types';
import { isPartnerMessage } from '../types/guards';
import { ComposeMessageModal } from './modals/ComposeMessageModal';
import { MessageDetailModal } from './modals/MessageDetailModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useModalState } from '@/hooks/useModalState';
import { formatDateLong } from '../utils/dateHelpers';
import { useToast } from '@/hooks/useToast';

interface MessagesViewProps {
  partnerLink: PartnerLink | null | undefined;
}

const STORAGE_KEY_COMPOSE = 'together_messages_compose_open';
const STORAGE_KEY_VIEWING = 'together_messages_viewing_id';

export const MessagesView: React.FC<MessagesViewProps> = ({ partnerLink }) => {
  const colors = useThemeColors();
  const { showToast } = useToast();

  // Owner filter state (for merged mode) - default to both selected
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>(['mine', 'partner']);

  // Merged mode support
  const { data: mergedConnection } = useMergedMessagesConnection();
  const { data: currentUserId } = useCurrentUserId();

  // Modal state management
  const modals = useModalState({
    compose: (() => {
      const saved = localStorage.getItem(STORAGE_KEY_COMPOSE);
      return saved === 'true';
    })(),
    viewingMessageId: localStorage.getItem(STORAGE_KEY_VIEWING) as string | null,
    editingMessage: null as PartnerMessage | null,
  });

  const { data: allMessages = [], isLoading } = usePartnerMessages();
  const { mutate: deleteMessage, isPending: isDeleting } = useDeletePartnerMessage();

  // Get partner name for display
  const partnerName = mergedConnection?.partnerName ?? 'Partner';

  // Filter messages by sender if in merged mode
  const messages = useMemo(() => {
    if (!mergedConnection || !currentUserId) {
      return allMessages;
    }

    // If both selected, show all
    const showMine = ownerFilter.includes('mine');
    const showPartner = ownerFilter.includes('partner');

    if (showMine && showPartner) {
      return allMessages;
    }
    if (showMine) {
      return allMessages.filter(m => m.sender_id === currentUserId);
    }
    if (showPartner) {
      return allMessages.filter(m => m.sender_id === mergedConnection.partnerId);
    }
    return allMessages;
  }, [allMessages, ownerFilter, currentUserId, mergedConnection]);

  // Find the viewing message from the ID with type guard validation
  const viewingMessage = modals.state.viewingMessageId
    ? messages.find(m => m.id === modals.state.viewingMessageId)
    : undefined;

  // Validate viewing message with type guard
  const validViewingMessage = viewingMessage && isPartnerMessage(viewingMessage) ? viewingMessage : null;

  // Clear viewing message ID if message not found after loading completes
  useEffect(() => {
    if (!isLoading && modals.state.viewingMessageId && !validViewingMessage) {
      modals.set('viewingMessageId', null);
    }
  }, [isLoading, modals.state.viewingMessageId, validViewingMessage]);

  // Save compose state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPOSE, modals.state.compose.toString());
  }, [modals.state.compose]);

  // Save viewing message ID to localStorage whenever it changes
  useEffect(() => {
    if (modals.state.viewingMessageId) {
      localStorage.setItem(STORAGE_KEY_VIEWING, modals.state.viewingMessageId);
    } else {
      localStorage.removeItem(STORAGE_KEY_VIEWING);
    }
  }, [modals.state.viewingMessageId]);

  const handleOpenCompose = () => modals.open('compose');
  const handleCloseCompose = () => modals.close('compose');

  const handleViewMessage = (message: PartnerMessage) => {
    modals.set('viewingMessageId', message.id);
  };

  const handleCloseViewMessage = () => {
    modals.set('viewingMessageId', null);
  };

  const handleDeleteMessage = (e: React.MouseEvent, messageId: string, messageTitle: string) => {
    e.stopPropagation(); // Prevent opening the message

    if (!confirm(`Are you sure you want to delete "${messageTitle}"? This cannot be undone.`)) {
      return;
    }

    deleteMessage(messageId, {
      onSuccess: () => {
        showToast('Message deleted', 'success');
      },
      onError: (error) => {
        showToast(`Failed to delete message: ${error.message}`, 'error');
      },
    });
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
        <div className="flex items-center gap-3">
          {/* Owner filter (only show in merged mode) */}
          {mergedConnection && (
            <OwnerFilter
              value={ownerFilter}
              onChange={setOwnerFilter}
              partnerName={partnerName}
            />
          )}
          <button
            onClick={handleOpenCompose}
            className="px-4 py-2 rounded-lg font-semibold transition-colors text-white hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #D4A574 100%)' }}
            aria-label="Write new message"
          >
            Write
          </button>
        </div>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                          💌 {message.title}
                        </h4>
                        {mergedConnection && currentUserId && (
                          <OwnerBadge
                            userId={message.sender_id}
                            currentUserId={currentUserId}
                            partnerName={partnerName}
                            size="sm"
                          />
                        )}
                      </div>
                      {getStatusBadge(message)}
                    </div>
                    <p className="text-sm mb-2" style={{ color: colors.text.secondary }}>
                      {getRevealText(message)}
                    </p>
                    <p className="text-sm mb-2 line-clamp-2" style={{ color: colors.text.tertiary }}>
                      {message.message_body.substring(0, 100)}...
                    </p>
                    {/* Delete button - only show for own messages */}
                    {currentUserId && message.sender_id === currentUserId && (
                      <button
                        onClick={(e) => handleDeleteMessage(e, message.id, message.title)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isDeleting}
                        aria-label="Delete message"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revealed Messages (Sent or Received) */}
          {revealed.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                {currentUserId && revealed.some(m => m.sender_id !== currentUserId)
                  ? 'Received Messages'
                  : 'Sent Messages'}
              </h3>
              <div className="space-y-3">
                {revealed.map((message) => {
                  const isReceiver = currentUserId && message.sender_id !== currentUserId;
                  return (
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                            ❤️ {message.title}
                          </h4>
                          {mergedConnection && currentUserId && (
                            <OwnerBadge
                              userId={message.sender_id}
                              currentUserId={currentUserId}
                              partnerName={partnerName}
                              size="sm"
                            />
                          )}
                        </div>
                        {getStatusBadge(message)}
                      </div>
                      <p className="text-sm mb-2" style={{ color: colors.text.secondary }}>
                        {isReceiver ? 'Received' : 'Delivered'}: {message.revealed_at ? formatDateLong(message.revealed_at.split('T')[0]) : 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-sm underline"
                            style={{ color: '#D4A574' }}
                            aria-label="Read message again"
                          >
                            Read Again
                          </button>
                          <Star className="w-4 h-4" style={{ color: '#FFD700' }} />
                        </div>
                        {/* Delete button - only show for own messages */}
                        {currentUserId && message.sender_id === currentUserId && (
                          <button
                            onClick={(e) => handleDeleteMessage(e, message.id, message.title)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isDeleting}
                            aria-label="Delete message"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg" style={{ color: colors.text.primary }}>
                          📝 {message.title}
                        </h4>
                        {mergedConnection && currentUserId && (
                          <OwnerBadge
                            userId={message.sender_id}
                            currentUserId={currentUserId}
                            partnerName={partnerName}
                            size="sm"
                          />
                        )}
                      </div>
                      {/* Delete button - only show for own messages */}
                      {currentUserId && message.sender_id === currentUserId && (
                        <button
                          onClick={(e) => handleDeleteMessage(e, message.id, message.title)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isDeleting}
                          aria-label="Delete message"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
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
      {modals.state.compose && (
        <ComposeMessageModal
          isOpen={modals.state.compose}
          partnerLink={partnerLink}
          onClose={() => {
            handleCloseCompose();
            modals.set('editingMessage', null); // Clear editing state
          }}
          editingMessage={modals.state.editingMessage}
        />
      )}

      {/* Message Detail Modal - only show if message is loaded and valid */}
      {validViewingMessage && !isLoading && (
        <MessageDetailModal
          isOpen={true}
          message={validViewingMessage}
          onClose={handleCloseViewMessage}
          onEdit={() => {
            // Set editing message and open compose modal
            modals.batch({
              editingMessage: validViewingMessage,
              viewingMessageId: null,
              compose: true,
            });
          }}
        />
      )}
    </div>
  );
};
