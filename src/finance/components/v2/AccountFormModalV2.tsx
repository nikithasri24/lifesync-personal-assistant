/**
 * AccountFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit financial accounts
 *
 * MIGRATION COMPLETE:
 * - Reduced from 313 lines to ~235 lines (25% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Conditional credit card fields based on account type
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

interface AccountFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AccountFormData) => void | Promise<void>;
  initialData?: Partial<AccountFormData>;
  isPending?: boolean;
}

export interface AccountFormData {
  name: string;
  type: string;
  institutionId?: string;
  balance: number;
  creditLimit?: number;
  apr?: number;
  notes?: string;
}

interface AccountFormState {
  name: string;
  type: string;
  balance: string;
  creditLimit: string;
  apr: string;
  notes: string;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking', emoji: '💳' },
  { value: 'savings', label: 'Savings', emoji: '🏦' },
  { value: 'credit', label: 'Credit Card', emoji: '💳' },
  { value: 'brokerage', label: 'Brokerage', emoji: '📈' },
  { value: 'investment', label: 'Investment', emoji: '📊' },
  { value: '401k', label: '401(k)', emoji: '🏢' },
  { value: 'traditional_ira', label: 'Traditional IRA', emoji: '🎯' },
  { value: 'roth_ira', label: 'Roth IRA', emoji: '🎯' },
  { value: 'hsa', label: 'HSA', emoji: '🏥' },
];

export const AccountFormModalV2: React.FC<AccountFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
}) => {
  const defaultFormData: AccountFormState = {
    name: '',
    type: 'checking',
    balance: '0',
    creditLimit: '',
    apr: '',
    notes: '',
  };

  const initialFormData: AccountFormState | undefined = initialData ? {
    name: initialData.name || '',
    type: initialData.type || 'checking',
    balance: initialData.balance?.toString() || '0',
    creditLimit: initialData.creditLimit?.toString() || '',
    apr: initialData.apr?.toString() || '',
    notes: initialData.notes || '',
  } : undefined;

  return (
    <FormModalV2<AccountFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Account' : 'Add Account'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_account_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Account'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const accountData: AccountFormData = {
          name: formData.name.trim(),
          type: formData.type,
          balance: parseFloat(formData.balance) || 0,
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
          apr: formData.apr ? parseFloat(formData.apr) : undefined,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(accountData);
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Please enter an account name';
        return null;
      }}
    >
      {(formState, setFormState) => {
        const isCreditCard = formState.type === 'credit';

        return (
          <>
            {/* Account Name */}
            <div>
              <label htmlFor="account-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                id="account-name"
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Chase Checking, Savings Account"
                required
              />
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="account-type" className="block text-sm font-semibold text-gray-900 mb-2">
                Account Type
              </label>
              <select
                id="account-type"
                value={formState.type}
                onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                {ACCOUNT_TYPES.map((accountType) => (
                  <option key={accountType.value} value={accountType.value}>
                    {accountType.emoji} {accountType.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial/Current Balance */}
            <div>
              <label htmlFor="balance" className="block text-sm font-semibold text-gray-900 mb-2">
                {initialData ? 'Current Balance' : 'Initial Balance'}
              </label>
              <input
                id="balance"
                type="number"
                step="0.01"
                value={formState.balance}
                onChange={(e) => setFormState({ ...formState, balance: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Credit Card Fields */}
            {isCreditCard && (
              <>
                <div>
                  <label htmlFor="credit-limit" className="block text-sm font-semibold text-gray-900 mb-2">
                    Credit Limit
                  </label>
                  <input
                    id="credit-limit"
                    type="number"
                    step="0.01"
                    value={formState.creditLimit}
                    onChange={(e) => setFormState({ ...formState, creditLimit: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="apr" className="block text-sm font-semibold text-gray-900 mb-2">
                    APR (%)
                  </label>
                  <input
                    id="apr"
                    type="number"
                    step="0.01"
                    value={formState.apr}
                    onChange={(e) => setFormState({ ...formState, apr: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes or details about this account..."
              />
            </div>
          </>
        );
      }}
    </FormModalV2>
  );
};
