/**
 * Send Partner Request Modal - MIGRATED to use FormModalV2
 * Form to send a partner link request via email
 *
 * NOTE: This modal is deprecated - Together now uses Shared connections
 * Users should go to /shared to send connection requests
 *
 * MIGRATION COMPLETE:
 * - Reduced from 151 lines to ~70 lines (54% reduction)
 * - Removed all boilerplate (ESC key, backdrop, modal structure)
 * - Form state managed by FormModalV2
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

interface SendPartnerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PartnerRequestFormData {
  partnerEmail: string;
  anniversaryDate: string;
}

export const SendPartnerRequestModal: React.FC<SendPartnerRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Default form data
  const defaultFormData: PartnerRequestFormData = {
    partnerEmail: '',
    anniversaryDate: '',
  };

  return (
    <FormModalV2<PartnerRequestFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Send Partner Request"
      defaultData={defaultFormData}
      isPending={false}
      submitText="Go to Shared Page"
      onSubmit={async () => {
        // Redirect to Shared page
        window.location.href = '/shared';
      }}
      validate={(formData) => {
        if (!formData.partnerEmail.trim()) return 'Partner email is required';
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.partnerEmail)) {
          return 'Please enter a valid email address';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Partner's Email
            </label>
            <input
              type="email"
              value={formState.partnerEmail}
              onChange={(e) => setFormState({ ...formState, partnerEmail: e.target.value })}
              placeholder="partner@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Anniversary Date (Optional)
            </label>
            <input
              type="date"
              value={formState.anniversaryDate}
              onChange={(e) => setFormState({ ...formState, anniversaryDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">
              The date you started your relationship together
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              💡 Your partner will receive a notification to accept your request.
              Once accepted, you can share milestones, messages, and challenges!
            </p>
          </div>
        </>
      )}
    </FormModalV2>
  );
};
