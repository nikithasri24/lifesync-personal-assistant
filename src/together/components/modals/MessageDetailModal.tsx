/**
 * Message Detail Modal
 * Display received/sent partner messages
 */

import React, { useEffect, useState } from 'react';
import { X, Heart, Trash2, Edit2 } from 'lucide-react';
import type { PartnerMessage } from '../../types';
import { formatDateLong } from '../../utils/dateHelpers';
import { useDeletePartnerMessage } from '../../hooks/usePartnerMessagesQuery';
import { useToast } from '@/hooks/useToast';

interface MessageDetailModalProps {
  isOpen: boolean;
  message: PartnerMessage;
  onClose: () => void;
  onEdit?: () => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  isOpen,
  message,
  onClose,
  onEdit,
}) => {
  const { showToast } = useToast();
  const { mutate: deleteMessage, isPending: isDeleting } = useDeletePartnerMessage();
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this message? This cannot be undone.')) {
      return;
    }

    deleteMessage(message.id, {
      onSuccess: () => {
        if (showToast) {
          showToast('Message deleted', 'success');
        }
        onClose();
      },
      onError: (error) => {
        if (showToast) {
          showToast(`Failed to delete message: ${error.message}`, 'error');
        }
      },
    });
  };

  const isReceived = message.status === 'revealed';
  const isDraft = message.status === 'draft' || message.status === 'scheduled';
  const sentDate = isReceived && message.revealed_at
    ? formatDateLong(message.revealed_at.split('T')[0])
    : message.sent_at
    ? formatDateLong(message.sent_at.split('T')[0])
    : 'Draft';

  const getRevealTriggerText = () => {
    switch (message.reveal_trigger) {
      case 'first_login':
        return 'Will reveal when partner opens the app';
      case 'specific_date':
        return message.reveal_date
          ? `Scheduled for ${new Date(message.reveal_date).toLocaleString()}`
          : 'Scheduled for specific date';
      case 'achievement':
        return 'Will reveal when partner unlocks achievement';
      case 'manual':
        return 'Sent immediately';
      default:
        return 'Draft';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden lg:mx-4 flex flex-col"
        style={{
          maxHeight: '90vh',
          maxWidth: '600px',
          background: 'linear-gradient(to bottom, #FFFBF7 0%, #FFFFFF 100%)',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="relative px-6 py-8 text-center flex-shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isDraft && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Edit message"
              >
                <Edit2 className="w-5 h-5 text-blue-500" />
              </button>
            )}
            {isDraft && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Delete message"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {isReceived && (
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #D4A574 100%)' }}>
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            {message.title}
          </h2>

          {/* Status Badge */}
          {isDraft && (
            <div className="flex justify-center gap-2 mb-2">
              <div
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: message.status === 'scheduled' ? '#3B82F6' : '#6B7280',
                  color: 'white'
                }}
              >
                {message.status === 'scheduled' ? 'Scheduled' : 'Draft'}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600">
            {sentDate}
          </p>

          {/* Reveal Trigger Info */}
          {isDraft && (
            <p className="text-xs text-gray-500 mt-2">
              {getRevealTriggerText()}
            </p>
          )}
        </div>

        {/* Message Content */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          <div
            className="prose prose-lg max-w-none text-gray-900"
            style={{
              lineHeight: '1.8',
              fontSize: '1.1rem',
            }}
          >
            {message.message_body.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4 last:mb-8">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Photo Gallery (if photos exist) */}
          {message.photo_urls && message.photo_urls.length > 0 && (
            <div className="mt-8 mb-8">
              <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <span className="text-4xl mb-3 block">📷</span>
                  <p className="font-semibold mb-2 text-gray-900">
                    Photo Gallery
                  </p>
                  <p className="text-sm text-gray-600">
                    {message.photo_urls.length} {message.photo_urls.length === 1 ? 'photo' : 'photos'} attached
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Close
          </button>
          {isDraft && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-colors"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              Edit Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
