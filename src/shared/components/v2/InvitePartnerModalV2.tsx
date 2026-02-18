/**
 * Invite Partner Modal V2 - MIGRATED to use FormModalV2
 * Form for sending partner connection invitations with permissions
 *
 * MIGRATION COMPLETE:
 * - Reduced from 282 lines to ~205 lines (27% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Integrated PermissionToggles component with form state
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';
import { useCreateInvitationMutation } from '@/hooks/useConnectionsQuery';
import { PermissionToggles } from './PermissionToggles';
import type { ConnectionRelationship, ModulePermissionLevel } from '@/shared/types/connections';

interface InvitePartnerModalV2Props {
  isOpen: boolean;
  onClose: () => void;
}

interface InviteFormData {
  email: string;
  name: string;
  relationshipType: ConnectionRelationship;
  message: string;
  permissions: Record<string, ModulePermissionLevel>;
}

export const InvitePartnerModalV2: React.FC<InvitePartnerModalV2Props> = ({
  isOpen,
  onClose,
}) => {
  const { mutate: sendInvitation, isPending } = useCreateInvitationMutation();

  const defaultFormData: InviteFormData = {
    email: '',
    name: '',
    relationshipType: 'partner',
    message: '',
    permissions: {},
  };

  return (
    <FormModalV2<InviteFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Partner"
      defaultData={defaultFormData}
      draftKey="shared_invite_partner_draft"
      isPending={isPending}
      submitText="Send Invitation"
      onSubmit={async (formData) => {
        // Use mutation with promise wrapper for FormModalV2 compatibility
        return new Promise<void>((resolve, reject) => {
          const invitationData = {
            receiverEmail: formData.email.trim(),
            relationship: formData.relationshipType,
            label: formData.name.trim() || undefined,
            message: formData.message.trim() || undefined,
            proposedPermissions: Object.keys(formData.permissions).length > 0 ? formData.permissions : undefined,
          };

          sendInvitation(invitationData, {
            onSuccess: () => resolve(),
            onError: (error: Error) => reject(error),
          });
        });
      }}
      validate={(formData) => {
        if (!formData.email.trim()) return 'Please enter an email address';

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          return 'Please enter a valid email address';
        }

        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Partner's Email Address *
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
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
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
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
              value={formState.relationshipType}
              onChange={(e) => setFormState({ ...formState, relationshipType: e.target.value as ConnectionRelationship })}
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
              value={formState.message}
              onChange={(e) => setFormState({ ...formState, message: e.target.value })}
              placeholder="Add a personal message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Permissions Section */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Choose What to Share</h3>
            <PermissionToggles
              permissions={formState.permissions}
              onChange={(newPermissions) => setFormState({ ...formState, permissions: newPermissions })}
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
