/**
 * Compose Message Modal
 * Write and schedule partner messages with reveal triggers
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreatePartnerMessage } from '../../hooks/usePartnerMessagesQuery';
import type { PartnerLink, MessageRevealTrigger } from '../../types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';

interface ComposeMessageModalProps {
  isOpen: boolean;
  partnerLink: PartnerLink | null;
  onClose: () => void;
}

export const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  partnerLink,
  onClose,
}) => {
  const colors = useThemeColors();
  const { toast } = useToast();
  const { mutate: createMessage, isPending } = useCreatePartnerMessage();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [revealTrigger, setRevealTrigger] = useState<MessageRevealTrigger>('first_login');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerLink) {
      if (toast) {
        toast('Please connect with a partner first', 'error');
      }
      return;
    }

    if (!title.trim() || !content.trim()) {
      if (toast) {
        toast('Please enter both title and message', 'error');
      }
      return;
    }

    // Build scheduled_for timestamp if applicable
    let scheduledFor: string | null = null;
    if (revealTrigger === 'scheduled_date' && scheduledDate) {
      scheduledFor = `${scheduledDate}T${scheduledTime}:00`;
    }

    // Determine status based on trigger
    const status = revealTrigger === 'immediate' ? 'revealed' : 'scheduled';

    createMessage(
      {
        title,
        content,
        reveal_trigger: revealTrigger,
        scheduled_for: scheduledFor,
        connection_id: partnerLink.id,
        partner_id: partnerLink.partner_id,
        status,
        recipient_id: partnerLink.partner_id,
      },
      {
        onSuccess: () => {
          if (toast) {
            toast('Message created successfully! 💌', 'success');
          }
          onClose();
          // Reset form
          setTitle('');
          setContent('');
          setRevealTrigger('first_login');
          setScheduledDate('');
          setScheduledTime('09:00');
        },
        onError: (error) => {
          if (toast) {
            toast(`Failed to create message: ${error.message}`, 'error');
          }
        },
      }
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getRevealDescription = () => {
    switch (revealTrigger) {
      case 'first_login':
        return 'Message will reveal the next time your partner logs into LifeSync';
      case 'scheduled_date':
        return 'Message will reveal at the specific date and time you choose';
      case 'achievement_unlock':
        return 'Message will reveal when your partner completes a challenge';
      case 'immediate':
        return 'Message will be sent and visible immediately';
      default:
        return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Write Message
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-6 space-y-5"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* To */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              To
            </label>
            <div
              className="px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.bg.secondary,
                color: colors.text.primary,
              }}
            >
              {partnerLink?.partner_email || 'Connect with partner first'}
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Happy Birthday & 10 Years Together"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              style={{ borderColor: colors.border.medium }}
              required
            />
          </div>

          {/* Message Content */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Message
            </label>
            <textarea
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="My dearest love,&#10;&#10;It's hard to believe it's been 10 years since we first met...&#10;&#10;With all my love,&#10;[Your name]"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none"
              style={{ borderColor: colors.border.medium }}
              required
            />
          </div>

          {/* Reveal Settings */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              When should this message reveal?
            </label>
            <div className="space-y-2">
              <label
                className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reveal-trigger"
                  value="first_login"
                  checked={revealTrigger === 'first_login'}
                  onChange={(e) => setRevealTrigger(e.target.value as MessageRevealTrigger)}
                  className="w-5 h-5 mt-0.5"
                  style={{ accentColor: '#D4A574' }}
                />
                <div>
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    First time partner opens the app
                  </span>
                  <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                    Perfect for birthday surprises! 🎂
                  </p>
                </div>
              </label>

              <label
                className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reveal-trigger"
                  value="scheduled_date"
                  checked={revealTrigger === 'scheduled_date'}
                  onChange={(e) => setRevealTrigger(e.target.value as MessageRevealTrigger)}
                  className="w-5 h-5 mt-0.5"
                  style={{ accentColor: '#D4A574' }}
                />
                <div className="flex-1">
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    On a specific date/time
                  </span>
                  <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                    Schedule for anniversaries or special moments
                  </p>
                  {revealTrigger === 'scheduled_date' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-300 outline-none"
                        style={{ borderColor: colors.border.medium }}
                        required
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-terracotta-300 outline-none"
                        style={{ borderColor: colors.border.medium }}
                      />
                    </div>
                  )}
                </div>
              </label>

              <label
                className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reveal-trigger"
                  value="immediate"
                  checked={revealTrigger === 'immediate'}
                  onChange={(e) => setRevealTrigger(e.target.value as MessageRevealTrigger)}
                  className="w-5 h-5 mt-0.5"
                  style={{ accentColor: '#D4A574' }}
                />
                <div>
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    Send now
                  </span>
                  <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                    Message will be visible immediately
                  </p>
                </div>
              </label>
            </div>

            <p
              className="text-xs mt-2 px-3"
              style={{ color: colors.text.tertiary }}
            >
              💡 {getRevealDescription()}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex gap-3"
          style={{ borderColor: colors.border.light }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
            style={{ color: colors.text.primary }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Sending...' : 'Send Message 💌'}
          </button>
        </div>
      </div>
    </div>
  );
};
