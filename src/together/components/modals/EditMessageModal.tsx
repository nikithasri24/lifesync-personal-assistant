/**
 * Edit Message Modal
 * Form to edit existing partner messages
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useUpdatePartnerMessage, useDeletePartnerMessage } from '../../hooks/usePartnerMessagesQuery';
import type { PartnerMessage, RevealTrigger } from '../../types';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { validatePartnerMessage, sanitizeMessageBody } from '../../utils/validation';

interface EditMessageModalProps {
  isOpen: boolean;
  message: PartnerMessage;
  onClose: () => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: updateMessage, isPending: isUpdating } = useUpdatePartnerMessage();
  const { mutate: deleteMessage, isPending: isDeleting } = useDeletePartnerMessage();

  // Form state - initialize from message
  const [title, setTitle] = useState(message.title);
  const [messageBody, setMessageBody] = useState(message.message_body);
  const [revealTrigger, setRevealTrigger] = useState<RevealTrigger>(message.reveal_trigger);
  const [revealDate, setRevealDate] = useState(() => {
    if (message.reveal_date) {
      // Convert ISO datetime to datetime-local format
      const date = new Date(message.reveal_date);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    }
    return '';
  });

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

    // Validate form data
    const validation = validatePartnerMessage({
      title,
      message_body: messageBody,
      reveal_trigger: revealTrigger,
      reveal_date: revealTrigger === 'specific_date' ? revealDate : undefined,
    });

    if (!validation.valid) {
      const errorMessage = Object.values(validation.errors)[0] || 'Please check your input';
      if (showToast) {
        showToast(errorMessage, 'error');
      }
      return;
    }

    // Sanitize message body
    const cleanBody = sanitizeMessageBody(messageBody);

    updateMessage(
      {
        id: message.id,
        title,
        message_body: cleanBody,
        reveal_trigger: revealTrigger,
        reveal_date: revealTrigger === 'specific_date' ? new Date(revealDate).toISOString() : undefined,
        achievement_id: undefined, // Keep existing
        status: message.status, // Keep current status
      },
      {
        onSuccess: () => {
          if (showToast) {
            showToast('Message updated successfully!', 'success');
          }
          onClose();
        },
        onError: (error) => {
          if (showToast) {
            showToast(`Failed to update message: ${error.message}`, 'error');
          }
        },
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    deleteMessage(message.id, {
      onSuccess: () => {
        if (showToast) {
          showToast('Message deleted successfully', 'success');
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Edit Message</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Happy Anniversary!"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              rows={6}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write your heartfelt message here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              required
            />
            <p className="text-xs mt-1 text-gray-500">
              {messageBody.length} characters
            </p>
          </div>

          {/* Reveal Trigger */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              When to Reveal
            </label>
            <select
              value={revealTrigger}
              onChange={(e) => setRevealTrigger(e.target.value as RevealTrigger)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              <option value="first_login">First Login (Immediately)</option>
              <option value="specific_date">Specific Date & Time</option>
              <option value="achievement">Achievement Unlock</option>
              <option value="manual">Manual Reveal</option>
            </select>
          </div>

          {/* Reveal Date (conditional) */}
          {revealTrigger === 'specific_date' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reveal Date & Time
              </label>
              <input
                type="datetime-local"
                value={revealDate}
                onChange={(e) => setRevealDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required={revealTrigger === 'specific_date'}
              />
            </div>
          )}

          {/* Status Info */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Status:</span>{' '}
              <span className="capitalize">{message.status}</span>
            </div>
            {message.revealed_at && (
              <div className="text-sm text-gray-600 mt-1">
                Revealed: {new Date(message.revealed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Always visible */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl font-semibold text-red-600 transition-colors flex items-center gap-2"
            aria-label="Delete message"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUpdating}
            className="px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
