/**
 * Compose Message Modal
 * Write and schedule partner messages with reveal triggers
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreatePartnerMessage, useUpdatePartnerMessage } from '../../hooks/usePartnerMessagesQuery';
import type { PartnerLink, RevealTrigger, PartnerMessage } from '../../types';
import { useToast } from '@/hooks/useToast';

interface ComposeMessageModalProps {
  isOpen: boolean;
  partnerLink: PartnerLink | null;
  onClose: () => void;
  editingMessage?: PartnerMessage | null;
}

const STORAGE_KEY = 'together_compose_message_draft';

export const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  partnerLink,
  onClose,
  editingMessage,
}) => {
  const { toast } = useToast();
  const { mutate: createMessage, isPending: isCreating } = useCreatePartnerMessage();
  const { mutate: updateMessage, isPending: isUpdating } = useUpdatePartnerMessage();
  const isPending = isCreating || isUpdating;

  // Load saved draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = !editingMessage ? loadDraft() : null;

  // Form state - restore from editingMessage, then localStorage, then defaults
  const [title, setTitle] = useState(editingMessage?.title || savedDraft?.title || '');
  const [messageBody, setMessageBody] = useState(editingMessage?.message_body || savedDraft?.messageBody || '');
  const [revealTrigger, setRevealTrigger] = useState<RevealTrigger>(
    editingMessage?.reveal_trigger || savedDraft?.revealTrigger || 'first_login'
  );
  const [scheduledDate, setScheduledDate] = useState(
    editingMessage?.reveal_date?.split('T')[0] || savedDraft?.scheduledDate || ''
  );
  const [scheduledTime, setScheduledTime] = useState(
    editingMessage?.reveal_date?.split('T')[1]?.substring(0, 5) || savedDraft?.scheduledTime || '09:00'
  );

  // Update form when editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setTitle(editingMessage.title);
      setMessageBody(editingMessage.message_body);
      setRevealTrigger(editingMessage.reveal_trigger);
      setScheduledDate(editingMessage.reveal_date?.split('T')[0] || '');
      setScheduledTime(editingMessage.reveal_date?.split('T')[1]?.substring(0, 5) || '09:00');
    }
  }, [editingMessage]);

  // Auto-save draft to localStorage whenever form changes
  useEffect(() => {
    if (title || messageBody) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title,
        messageBody,
        revealTrigger,
        scheduledDate,
        scheduledTime,
      }));
    }
  }, [title, messageBody, revealTrigger, scheduledDate, scheduledTime]);

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

  const handleSaveDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!partnerLink) {
      if (toast) {
        toast('Please connect with a partner first', 'error');
      }
      return;
    }

    if (!title.trim() || !messageBody.trim()) {
      const missingFields = [];
      if (!title.trim()) missingFields.push('Title');
      if (!messageBody.trim()) missingFields.push('Message');

      const errorMsg = `Please enter: ${missingFields.join(' and ')}`;

      if (toast) {
        toast(errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
      return;
    }

    // Build reveal_date timestamp if applicable
    let revealDate: string | null = null;
    if (revealTrigger === 'specific_date' && scheduledDate) {
      revealDate = `${scheduledDate}T${scheduledTime}:00`;
    }

    const messageData = {
      title,
      message_body: messageBody,
      reveal_trigger: revealTrigger,
      reveal_date: revealDate,
      achievement_id: null,
      status: 'draft' as const,
    };

    const onSuccessCallback = () => {
      if (toast) {
        toast(editingMessage ? 'Draft updated! 💾' : 'Draft saved! 💾', 'success');
      }
      // Clear draft from localStorage
      localStorage.removeItem(STORAGE_KEY);
      onClose();
      // Reset form
      setTitle('');
      setMessageBody('');
      setRevealTrigger('first_login');
      setScheduledDate('');
      setScheduledTime('09:00');
    };

    const onErrorCallback = (error: Error) => {
      if (toast) {
        toast(`Failed to save draft: ${error.message}`, 'error');
      }
    };

    if (editingMessage) {
      // Update existing message
      updateMessage(
        {
          id: editingMessage.id,
          ...messageData,
        },
        {
          onSuccess: onSuccessCallback,
          onError: onErrorCallback,
        }
      );
    } else {
      // Create new message
      createMessage(
        {
          ...messageData,
          connection_id: partnerLink.id,
          recipient_id: partnerLink.partner_id,
        },
        {
          onSuccess: onSuccessCallback,
          onError: onErrorCallback,
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerLink) {
      if (toast) {
        toast('Please connect with a partner first', 'error');
      }
      return;
    }

    if (!title.trim() || !messageBody.trim()) {
      if (toast) {
        toast('Please enter both title and message', 'error');
      }
      return;
    }

    // Build reveal_date timestamp if applicable
    let revealDate: string | null = null;
    if (revealTrigger === 'specific_date' && scheduledDate) {
      revealDate = `${scheduledDate}T${scheduledTime}:00`;
    }

    // Determine status based on trigger
    const status = revealTrigger === 'manual' ? 'revealed' : 'scheduled';

    const messageData = {
      title,
      message_body: messageBody,
      reveal_trigger: revealTrigger,
      reveal_date: revealDate,
      achievement_id: null,
      status,
    };

    const onSuccessCallback = () => {
      if (toast) {
        toast(editingMessage ? 'Message updated! 💌' : 'Message created successfully! 💌', 'success');
      }
      // Clear draft from localStorage
      localStorage.removeItem(STORAGE_KEY);
      onClose();
      // Reset form
      setTitle('');
      setMessageBody('');
      setRevealTrigger('first_login');
      setScheduledDate('');
      setScheduledTime('09:00');
    };

    const onErrorCallback = (error: Error) => {
      if (toast) {
        toast(`Failed to ${editingMessage ? 'update' : 'create'} message: ${error.message}`, 'error');
      }
    };

    if (editingMessage) {
      // Update existing message
      updateMessage(
        {
          id: editingMessage.id,
          ...messageData,
        },
        {
          onSuccess: onSuccessCallback,
          onError: onErrorCallback,
        }
      );
    } else {
      // Create new message
      createMessage(
        {
          ...messageData,
          connection_id: partnerLink.id,
          recipient_id: partnerLink.partner_id,
        },
        {
          onSuccess: onSuccessCallback,
          onError: onErrorCallback,
        }
      );
    }
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
      case 'specific_date':
        return 'Message will reveal at the specific date and time you choose';
      case 'achievement':
        return 'Message will reveal when your partner completes a challenge';
      case 'manual':
        return 'Message will be sent and visible immediately';
      default:
        return '';
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          maxWidth: '600px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingMessage ? 'Edit Message' : 'Write Message'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
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
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              To
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
              {partnerLink?.partner_email || 'Connect with partner first'}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Happy Birthday & 10 Years Together"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Message
            </label>
            <textarea
              rows={10}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="My dearest love,&#10;&#10;It's hard to believe it's been 10 years since we first met...&#10;&#10;With all my love,&#10;[Your name]"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              required
            />
          </div>

          {/* Reveal Settings */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              When should this message reveal?
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="reveal-trigger"
                  value="first_login"
                  checked={revealTrigger === 'first_login'}
                  onChange={(e) => setRevealTrigger(e.target.value as RevealTrigger)}
                  className="w-5 h-5 mt-0.5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    First time partner opens the app
                  </span>
                  <p className="text-sm mt-1 text-gray-600">
                    Perfect for birthday surprises! 🎂
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="reveal-trigger"
                  value="specific_date"
                  checked={revealTrigger === 'specific_date'}
                  onChange={(e) => setRevealTrigger(e.target.value as RevealTrigger)}
                  className="w-5 h-5 mt-0.5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    On a specific date/time
                  </span>
                  <p className="text-sm mt-1 text-gray-600">
                    Schedule for anniversaries or special moments
                  </p>
                  {revealTrigger === 'specific_date' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-300 outline-none transition-all"
                        required
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-300 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="reveal-trigger"
                  value="manual"
                  checked={revealTrigger === 'manual'}
                  onChange={(e) => setRevealTrigger(e.target.value as RevealTrigger)}
                  className="w-5 h-5 mt-0.5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Send now
                  </span>
                  <p className="text-sm mt-1 text-gray-600">
                    Message will be visible immediately
                  </p>
                </div>
              </label>
            </div>

            <p className="text-xs mt-2 px-3 text-gray-500">
              💡 {getRevealDescription()}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 relative z-10 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSaveDraft();
            }}
            disabled={isPending}
            className="flex-1 px-4 py-3 bg-blue-100 hover:bg-blue-200 rounded-xl font-semibold text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? 'Saving...' : 'Save Draft 💾'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }}
            disabled={isPending}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
