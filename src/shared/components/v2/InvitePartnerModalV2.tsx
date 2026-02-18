/**
 * Invite Partner Modal V2
 * Form for sending partner connection invitations with permissions
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateInvitationMutation } from '@/hooks/useConnectionsQuery';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { PermissionToggles } from './PermissionToggles';
import type { ConnectionRelationship, ModulePermissionLevel } from '@/shared/types/connections';

interface InvitePartnerModalV2Props {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'shared_invite_partner_draft';

export const InvitePartnerModalV2: React.FC<InvitePartnerModalV2Props> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: sendInvitation, isPending } = useCreateInvitationMutation();

  // Load saved draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error('Shared', error as Error, { context: 'Failed to load draft' });
    }
    return null;
  };

  const savedDraft = loadDraft();

  // Form state
  const [email, setEmail] = useState(savedDraft?.email || '');
  const [name, setName] = useState(savedDraft?.name || '');
  const [message, setMessage] = useState(savedDraft?.message || '');
  const [relationshipType, setRelationshipType] = useState<ConnectionRelationship>(
    savedDraft?.relationshipType || 'partner'
  );
  const [permissions, setPermissions] = useState<Record<string, ModulePermissionLevel>>(
    savedDraft?.permissions || {}
  );

  // Auto-save draft to localStorage whenever form changes
  useEffect(() => {
    if (email || name || message) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        email,
        name,
        message,
        relationshipType,
        permissions,
      }));
    }
  }, [email, name, message, relationshipType, permissions]);

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

    if (!email.trim()) {
      if (showToast) {
        showToast('Please enter an email address', 'error');
      }
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      if (showToast) {
        showToast('Please enter a valid email address', 'error');
      }
      return;
    }

    // Create invitation data matching CreateConnectionInput type
    const invitationData = {
      receiverEmail: email.trim(),
      relationship: relationshipType,
      label: name.trim() || undefined,
      message: message.trim() || undefined,
      proposedPermissions: Object.keys(permissions).length > 0 ? permissions : undefined,
    };

    sendInvitation(invitationData, {
      onSuccess: () => {
        if (showToast) {
          showToast('Invitation sent! 📧', 'success');
        }
        // Clear draft from localStorage
        localStorage.removeItem(STORAGE_KEY);
        // Reset form
        setEmail('');
        setName('');
        setMessage('');
        setRelationshipType('partner');
        setPermissions({});
        onClose();
      },
      onError: (error: Error) => {
        logger.error('Shared', error, { context: 'Failed to send invitation' });
        if (showToast) {
          showToast(`Failed to send invitation: ${error.message}`, 'error');
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
        style={{
          maxHeight: '90vh',
          maxWidth: '600px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Invite Partner</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Partner's Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Partner's Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What do you call them?"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Relationship
              </label>
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as ConnectionRelationship)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="spouse">💍 Spouse</option>
                <option value="partner">💕 Partner</option>
                <option value="friend">👥 Friend</option>
                <option value="family">👨‍👩‍👧‍👦 Family</option>
                <option value="roommate">🏠 Roommate</option>
                <option value="colleague">💼 Colleague</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              />
            </div>

            {/* Permissions Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Choose What to Share</h3>
              <PermissionToggles
                permissions={permissions}
                onChange={setPermissions}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
