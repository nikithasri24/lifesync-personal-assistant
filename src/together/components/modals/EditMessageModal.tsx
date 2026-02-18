/**
 * Edit Message Modal - MIGRATED to use FormModalV2
 * Form to edit existing partner messages
 *
 * MIGRATION COMPLETE:
 * - Reduced from 285 lines to ~200 lines (30% reduction)
 * - Removed all boilerplate (ESC key, backdrop, modal structure)
 * - Form state managed by FormModalV2
 * - Delete button integrated with FormModalV2
 */

import React from 'react';
import { useUpdatePartnerMessage, useDeletePartnerMessage } from '../../hooks/usePartnerMessagesQuery';
import type { PartnerMessage, RevealTrigger } from '../../types';
import { useToast } from '@/hooks/useToast';
import { validatePartnerMessage, sanitizeMessageBody } from '../../utils/validation';
import { FormModalV2 } from '@/components/v2';

interface EditMessageModalProps {
  isOpen: boolean;
  message: PartnerMessage;
  onClose: () => void;
}

interface MessageFormData {
  title: string;
  messageBody: string;
  revealTrigger: RevealTrigger;
  revealDate: string;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: updateMessage, isPending: isUpdating } = useUpdatePartnerMessage();
  const { mutate: deleteMessage, isPending: isDeleting } = useDeletePartnerMessage();

  // Initialize form data from message
  const initialFormData: MessageFormData = {
    title: message.title,
    messageBody: message.message_body,
    revealTrigger: message.reveal_trigger,
    revealDate: (() => {
      if (message.reveal_date) {
        // Convert ISO datetime to datetime-local format
        const date = new Date(message.reveal_date);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
      }
      return '';
    })(),
  };

  // Not used for edit mode, but required by FormModalV2
  const defaultFormData: MessageFormData = initialFormData;

  return (
    <FormModalV2<MessageFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Message"
      defaultData={defaultFormData}
      initialData={initialFormData}
      isPending={isUpdating || isDeleting}
      submitText="Save Changes"
      isEditing={true}
      showDelete={true}
      onDelete={() => {
        return new Promise<void>((resolve, reject) => {
          deleteMessage(message.id, {
            onSuccess: () => {
              showToast?.('Message deleted successfully', 'success');
              resolve();
            },
            onError: (error) => {
              showToast?.(`Failed to delete message: ${error.message}`, 'error');
              reject(error);
            },
          });
        });
      }}
      onSubmit={async (formData) => {
        // Validate form data
        const validation = validatePartnerMessage({
          title: formData.title,
          message_body: formData.messageBody,
          reveal_trigger: formData.revealTrigger,
          reveal_date: formData.revealTrigger === 'specific_date' ? formData.revealDate : undefined,
        });

        if (!validation.valid) {
          const errorMessage = Object.values(validation.errors)[0] || 'Please check your input';
          showToast?.(errorMessage, 'error');
          throw new Error(errorMessage);
        }

        // Sanitize message body
        const cleanBody = sanitizeMessageBody(formData.messageBody);

        return new Promise<void>((resolve, reject) => {
          updateMessage(
            {
              id: message.id,
              title: formData.title,
              message_body: cleanBody,
              reveal_trigger: formData.revealTrigger,
              reveal_date: formData.revealTrigger === 'specific_date' ? new Date(formData.revealDate).toISOString() : undefined,
              achievement_id: undefined, // Keep existing
              status: message.status, // Keep current status
            },
            {
              onSuccess: () => {
                showToast?.('Message updated successfully!', 'success');
                resolve();
              },
              onError: (error) => {
                showToast?.(`Failed to update message: ${error.message}`, 'error');
                reject(error);
              },
            }
          );
        });
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Title is required';
        if (!formData.messageBody.trim()) return 'Message is required';
        if (formData.revealTrigger === 'specific_date' && !formData.revealDate) {
          return 'Please select a date for scheduled messages';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
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
              value={formState.messageBody}
              onChange={(e) => setFormState({ ...formState, messageBody: e.target.value })}
              placeholder="Write your heartfelt message here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              required
            />
            <p className="text-xs mt-1 text-gray-500">
              {formState.messageBody.length} characters
            </p>
          </div>

          {/* Reveal Trigger */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              When to Reveal
            </label>
            <select
              value={formState.revealTrigger}
              onChange={(e) => setFormState({ ...formState, revealTrigger: e.target.value as RevealTrigger })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              <option value="first_login">First Login (Immediately)</option>
              <option value="specific_date">Specific Date & Time</option>
              <option value="achievement">Achievement Unlock</option>
              <option value="manual">Manual Reveal</option>
            </select>
          </div>

          {/* Reveal Date (conditional) */}
          {formState.revealTrigger === 'specific_date' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reveal Date & Time
              </label>
              <input
                type="datetime-local"
                value={formState.revealDate}
                onChange={(e) => setFormState({ ...formState, revealDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required={formState.revealTrigger === 'specific_date'}
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
        </>
      )}
    </FormModalV2>
  );
};
