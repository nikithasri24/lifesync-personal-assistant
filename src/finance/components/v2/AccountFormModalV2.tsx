/**
 * AccountFormModalV2 Component
 * Create/edit financial accounts with Together pattern
 * Auto-save, ESC key, backdrop support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

const STORAGE_KEY = 'finance_account_modal_draft';

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
  // Load saved draft from localStorage
  const loadDraft = () => {
    if (initialData) return null; // Don't load draft when editing
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = loadDraft();

  // Form state - restore from localStorage if available
  const [name, setName] = useState(savedDraft?.name || initialData?.name || '');
  const [type, setType] = useState(savedDraft?.type || initialData?.type || 'checking');
  const [balance, setBalance] = useState(
    savedDraft?.balance?.toString() || initialData?.balance?.toString() || '0'
  );
  const [creditLimit, setCreditLimit] = useState(
    savedDraft?.creditLimit?.toString() || initialData?.creditLimit?.toString() || ''
  );
  const [apr, setApr] = useState(savedDraft?.apr?.toString() || initialData?.apr?.toString() || '');
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');

  // Auto-save draft to localStorage whenever form changes
  useEffect(() => {
    if (!initialData) {
      // Only auto-save for new accounts, not when editing
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name,
          type,
          balance: parseFloat(balance) || 0,
          creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
          apr: apr ? parseFloat(apr) : undefined,
          notes,
        })
      );
    }
  }, [name, type, balance, creditLimit, apr, notes, initialData]);

  // Keyboard navigation - ESC to close
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter an account name');
      return;
    }

    const formData: AccountFormData = {
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      apr: apr ? parseFloat(apr) : undefined,
      notes: notes.trim() || undefined,
    };

    await onSave(formData);

    // Clear draft after successful save
    if (!initialData) {
      localStorage.removeItem(STORAGE_KEY);
    }

    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isCreditCard = type === 'credit';

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
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Account' : 'Add Account'}
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

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Account Name */}
            <div>
              <label htmlFor="account-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                id="account-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
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
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
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
                    value={apr}
                    onChange={(e) => setApr(e.target.value)}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes or details about this account..."
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
