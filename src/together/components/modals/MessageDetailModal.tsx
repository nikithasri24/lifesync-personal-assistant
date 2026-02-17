/**
 * Message Detail Modal
 * Display received/sent partner messages
 */

import React, { useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import type { PartnerMessage } from '../../types';
import { formatDateLong } from '../../utils/dateHelpers';

interface MessageDetailModalProps {
  isOpen: boolean;
  message: PartnerMessage;
  onClose: () => void;
}

export const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
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

  const isReceived = message.status === 'revealed';
  const sentDate = message.sent_at ? formatDateLong(message.sent_at.split('T')[0]) : 'Draft';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-3xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
          background: 'linear-gradient(to bottom, #FFFBF7 0%, #FFFFFF 100%)',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="relative px-6 py-8 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

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
          <p className="text-sm text-gray-600">
            {sentDate}
          </p>
        </div>

        {/* Message Content */}
        <div
          className="overflow-y-auto px-6 pb-6"
          style={{ maxHeight: 'calc(90vh - 220px)' }}
        >
          <div
            className="prose prose-lg max-w-none text-gray-900"
            style={{
              lineHeight: '1.8',
              fontSize: '1.1rem',
            }}
          >
            {message.message_body.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Photo Gallery (if photos exist) */}
          {message.photo_urls && message.photo_urls.length > 0 && (
            <div className="mt-8">
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-semibold text-white transition-colors"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
