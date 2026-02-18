/**
 * Compose Message Modal - MIGRATED to use FormModalV2
 * Write and schedule partner messages with reveal triggers
 *
 * MIGRATION COMPLETE:
 * - Reduced from 526 lines to ~300 lines (43% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Auto-save handled by FormModalV2/useDraftStorage
 */

import React from 'react';
import { useCreatePartnerMessage, useUpdatePartnerMessage } from '../../hooks/usePartnerMessagesQuery';
import type { PartnerLink, RevealTrigger, PartnerMessage } from '../../types';
import { useToast } from '@/hooks/useToast';
import { validatePartnerMessage, sanitizeMessageBody } from '../../utils/validation';
import { FormModalV2 } from '@/components/v2';

interface ComposeMessageModalProps {
  isOpen: boolean;
  partnerLink: PartnerLink | null;
  onClose: () => void;
  editingMessage?: PartnerMessage | null;
}

interface MessageFormData {
  title: string;
  messageBody: string;
  revealTrigger: RevealTrigger;
  scheduledDate: string;
  scheduledTime: string;
}

export const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  partnerLink,
  onClose,
  editingMessage,
}) => {
  const { showToast } = useToast();
  const { mutate: createMessage, isPending: isCreating } = useCreatePartnerMessage();
  const { mutate: updateMessage, isPending: isUpdating } = useUpdatePartnerMessage();
  const isPending = isCreating || isUpdating;

  // Convert editingMessage to form format
  const initialFormData: MessageFormData | undefined = editingMessage ? {
    title: editingMessage.title,
    messageBody: editingMessage.message_body,
    revealTrigger: editingMessage.reveal_trigger,
    scheduledDate: editingMessage.reveal_date?.split('T')[0] || '',
    scheduledTime: editingMessage.reveal_date?.split('T')[1]?.substring(0, 5) || '09:00',
  } : undefined;

  // Default form data
  const defaultFormData: MessageFormData = {
    title: '',
    messageBody: '',
    revealTrigger: 'first_login',
    scheduledDate: '',
    scheduledTime: '09:00',
  };

  const getRevealDescription = (trigger: RevealTrigger) => {
    switch (trigger) {
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

  const handleMessageSubmit = async (formData: MessageFormData, isDraft: boolean) => {
    if (!partnerLink) {
      showToast?.('Please connect with a partner first', 'error');
      throw new Error('No partner connection');
    }

    // Build reveal_date timestamp if applicable
    let revealDate: string | null = null;
    if (formData.revealTrigger === 'specific_date' && formData.scheduledDate) {
      revealDate = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
    }

    // Validate form data
    const validation = validatePartnerMessage({
      title: formData.title,
      message_body: formData.messageBody,
      reveal_trigger: formData.revealTrigger,
      reveal_date: revealDate,
    });

    if (!validation.valid) {
      const errorMessage = Object.values(validation.errors)[0] || 'Please check your input';
      showToast?.(errorMessage, 'error');
      throw new Error(errorMessage);
    }

    // Sanitize message body to prevent XSS
    const sanitizedBody = sanitizeMessageBody(formData.messageBody);

    // Determine status
    const status = isDraft ? 'draft' : (formData.revealTrigger === 'manual' ? 'revealed' : 'scheduled');

    const messageData = {
      title: formData.title.trim(),
      message_body: sanitizedBody,
      reveal_trigger: formData.revealTrigger,
      reveal_date: revealDate,
      achievement_id: null,
      status: status as 'draft' | 'revealed' | 'scheduled',
    };

    return new Promise<void>((resolve, reject) => {
      const onSuccessCallback = () => {
        const successMsg = editingMessage
          ? (isDraft ? 'Draft updated! 💾' : 'Message updated! 💌')
          : (isDraft ? 'Draft saved! 💾' : 'Message created successfully! 💌');
        showToast?.(successMsg, 'success');
        resolve();
      };

      const onErrorCallback = (error: Error) => {
        const action = editingMessage ? 'update' : 'create';
        const type = isDraft ? 'draft' : 'message';
        showToast?.(`Failed to ${action} ${type}: ${error.message}`, 'error');
        reject(error);
      };

      if (editingMessage) {
        updateMessage(
          { id: editingMessage.id, ...messageData },
          { onSuccess: onSuccessCallback, onError: onErrorCallback }
        );
      } else {
        createMessage(
          {
            ...messageData,
            connection_id: partnerLink.id,
            recipient_id: partnerLink.partner_id,
          },
          { onSuccess: onSuccessCallback, onError: onErrorCallback }
        );
      }
    });
  };

  return (
    <FormModalV2<MessageFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={editingMessage ? 'Edit Message' : 'Write Message'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey="together_compose_message_draft"
      isPending={isPending}
      submitText="Send Message 💌"
      isEditing={!!editingMessage}
      onSubmit={async (formData) => {
        await handleMessageSubmit(formData, false);
        onClose();
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Title is required';
        if (!formData.messageBody.trim()) return 'Message is required';
        if (formData.revealTrigger === 'specific_date' && !formData.scheduledDate) {
          return 'Please select a date for scheduled messages';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
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
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
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
              value={formState.messageBody}
              onChange={(e) => setFormState({ ...formState, messageBody: e.target.value })}
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
                  checked={formState.revealTrigger === 'first_login'}
                  onChange={(e) => setFormState({ ...formState, revealTrigger: e.target.value as RevealTrigger })}
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
                  checked={formState.revealTrigger === 'specific_date'}
                  onChange={(e) => setFormState({ ...formState, revealTrigger: e.target.value as RevealTrigger })}
                  className="w-5 h-5 mt-0.5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    On a specific date/time
                  </span>
                  <p className="text-sm mt-1 text-gray-600">
                    Schedule for anniversaries or special moments
                  </p>
                  {formState.revealTrigger === 'specific_date' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <input
                        type="date"
                        value={formState.scheduledDate}
                        onChange={(e) => setFormState({ ...formState, scheduledDate: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terracotta-300 outline-none transition-all"
                        required
                      />
                      <input
                        type="time"
                        value={formState.scheduledTime}
                        onChange={(e) => setFormState({ ...formState, scheduledTime: e.target.value })}
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
                  checked={formState.revealTrigger === 'manual'}
                  onChange={(e) => setFormState({ ...formState, revealTrigger: e.target.value as RevealTrigger })}
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
              💡 {getRevealDescription(formState.revealTrigger)}
            </p>
          </div>

          {/* Save Draft Button - placed before footer */}
          <div className="pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={async () => {
                try {
                  await handleMessageSubmit(formState, true);
                  onClose();
                } catch (error) {
                  // Error already handled in handleMessageSubmit
                }
              }}
              disabled={isPending || !formState.title.trim() || !formState.messageBody.trim()}
              className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 rounded-xl font-semibold text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Saving...' : 'Save Draft 💾'}
            </button>
          </div>
        </>
      )}
    </FormModalV2>
  );
};
