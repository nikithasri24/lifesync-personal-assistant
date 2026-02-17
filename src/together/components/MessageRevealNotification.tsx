/**
 * Message Reveal Notification
 * Full-screen celebration when a message is revealed
 */

import React, { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import type { PartnerMessage } from '../types';
import { useRevealMessage } from '../hooks/usePartnerMessagesQuery';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatDateLong } from '../utils/dateHelpers';

interface MessageRevealNotificationProps {
  message: PartnerMessage;
  onClose: () => void;
}

export const MessageRevealNotification: React.FC<MessageRevealNotificationProps> = ({
  message,
  onClose,
}) => {
  const colors = useThemeColors();
  const { mutate: revealMessage } = useRevealMessage();
  const [isRevealed, setIsRevealed] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Add confetti animation or celebration effect here
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenMessage = () => {
    // Mark message as revealed in database
    revealMessage(message.id);
    setShowMessage(true);
  };

  const handleClose = () => {
    setShowMessage(false);
    onClose();
  };

  if (showMessage) {
    // Full message display
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="w-full max-w-3xl mx-4 bg-white rounded-3xl overflow-hidden shadow-2xl"
          style={{
            maxHeight: '90vh',
            background: 'linear-gradient(to bottom, #FFFBF7 0%, #FFFFFF 100%)',
          }}
        >
          {/* Header */}
          <div className="relative px-8 py-12 text-center">
            <div className="mb-6">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #FF6B9D 0%, #D4A574 100%)',
                }}
              >
                <Heart className="w-10 h-10 text-white fill-white" />
              </div>
            </div>

            <h2
              className="text-4xl font-bold mb-3"
              style={{ color: colors.text.primary }}
            >
              {message.title}
            </h2>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {message.revealed_at ? formatDateLong(message.revealed_at.split('T')[0]) : 'Today'}
            </p>
          </div>

          {/* Message Content */}
          <div
            className="overflow-y-auto px-8 pb-8"
            style={{ maxHeight: 'calc(90vh - 280px)' }}
          >
            <div
              className="prose prose-lg max-w-none"
              style={{
                color: colors.text.primary,
                lineHeight: '1.9',
                fontSize: '1.15rem',
              }}
            >
              {message.message_body.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-5">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Photo Gallery */}
            {message.photo_urls && message.photo_urls.length > 0 && (
              <div className="mt-8">
                <div
                  className="p-6 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: colors.border.medium }}
                >
                  <div className="text-center">
                    <span className="text-4xl mb-3 block">📷</span>
                    <p className="font-semibold mb-2" style={{ color: colors.text.primary }}>
                      Photo Gallery
                    </p>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      {message.photo_urls.length}{' '}
                      {message.photo_urls.length === 1 ? 'photo' : 'photos'} attached
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-8 py-6 border-t flex justify-center gap-3"
            style={{ borderColor: colors.border.light }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-3 rounded-xl font-semibold transition-colors hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                color: 'white',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial reveal animation
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="text-center animate-fadeIn">
        {/* Celebration Icon */}
        <div className="mb-8">
          <div
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${
              isRevealed ? 'animate-bounce' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #D4A574 100%)',
              boxShadow: '0 0 60px rgba(255, 107, 157, 0.6)',
            }}
          >
            <Heart className="w-16 h-16 text-white fill-white" />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Sparkles
                key={i}
                className="w-6 h-6 text-yellow-400 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Text */}
        <h2
          className="text-5xl font-bold mb-4 text-white"
          style={{ textShadow: '0 2px 20px rgba(0, 0, 0, 0.3)' }}
        >
          💌 You have a message
        </h2>
        <p
          className="text-2xl mb-8 text-white opacity-90"
          style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}
        >
          from your love
        </p>

        {/* Open Button */}
        <button
          onClick={handleOpenMessage}
          className="px-12 py-4 rounded-2xl font-bold text-xl text-white transition-all hover:scale-105 hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            boxShadow: '0 4px 30px rgba(212, 165, 116, 0.5)',
          }}
        >
          Open Message ❤️
        </button>
      </div>
    </div>
  );
};
