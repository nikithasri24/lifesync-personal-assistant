/**
 * TransactionFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit transactions with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 366 lines to ~240 lines (34% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Radio button type selector (debit/credit)
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

interface TransactionFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionFormData) => void | Promise<void>;
  initialData?: Partial<TransactionFormData>;
  isPending?: boolean;
  accounts?: Array<{ id: string; name: string }>;
  categories?: Array<{ id: string; name: string; icon?: string }>;
}

export interface TransactionFormData {
  dateISO: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  accountId: string;
  categoryId?: string;
  notes?: string;
  merchantName?: string;
  tags?: string[];
}

interface TransactionFormState {
  date: string;
  description: string;
  amount: string;
  type: 'debit' | 'credit';
  accountId: string;
  categoryId: string;
  notes: string;
  merchantName: string;
  tagsRaw: string; // comma-separated input string
}

export const TransactionFormModalV2: React.FC<TransactionFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
  accounts = [],
  categories = [],
}) => {
  const today = new Date().toISOString().split('T')[0];

  const defaultFormData: TransactionFormState = {
    date: today,
    description: '',
    amount: '',
    type: 'debit',
    accountId: '',
    categoryId: '',
    notes: '',
    merchantName: '',
    tagsRaw: '',
  };

  const initialFormData: TransactionFormState | undefined = initialData ? {
    date: initialData.dateISO?.split('T')[0] || today,
    description: initialData.description || '',
    amount: initialData.amount?.toString() || '',
    type: initialData.type || 'debit',
    accountId: initialData.accountId || '',
    categoryId: initialData.categoryId || '',
    notes: initialData.notes || '',
    merchantName: initialData.merchantName || '',
    tagsRaw: initialData.tags?.join(', ') || '',
  } : undefined;

  return (
    <FormModalV2<TransactionFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Add Transaction'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_transaction_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Transaction'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const transactionData: TransactionFormData = {
          dateISO: `${formData.date}T12:00:00`,
          description: formData.description.trim(),
          amount: parseFloat(formData.amount) || 0,
          type: formData.type,
          accountId: formData.accountId,
          categoryId: formData.categoryId || undefined,
          notes: formData.notes.trim() || undefined,
          merchantName: formData.merchantName.trim() || undefined,
          tags: formData.tagsRaw
            ? formData.tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
            : undefined,
        };
        await onSave(transactionData);
      }}
      validate={(formData) => {
        if (!formData.description.trim()) return 'Please enter a description';
        if (!formData.accountId) return 'Please select an account';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Date */}
          <div>
            <label htmlFor="txn-date" className="block text-sm font-semibold text-gray-900 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="txn-date"
              type="date"
              value={formState.date}
              onChange={(e) => setFormState({ ...formState, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="txn-description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              id="txn-description"
              type="text"
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Grocery shopping, Salary deposit"
              required
            />
          </div>

          {/* Type - Radio Cards */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                  formState.type === 'debit'
                    ? 'border-terracotta-400 bg-terracotta-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="debit"
                  checked={formState.type === 'debit'}
                  onChange={(e) => setFormState({ ...formState, type: e.target.value as 'debit' | 'credit' })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Expense</span>
              </label>
              <label
                className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                  formState.type === 'credit'
                    ? 'border-terracotta-400 bg-terracotta-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="credit"
                  checked={formState.type === 'credit'}
                  onChange={(e) => setFormState({ ...formState, type: e.target.value as 'debit' | 'credit' })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Income</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="txn-amount" className="block text-sm font-semibold text-gray-900 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              id="txn-amount"
              type="number"
              step="0.01"
              value={formState.amount}
              onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="0.00"
              required
            />
          </div>

          {/* Account */}
          <div>
            <label htmlFor="txn-account" className="block text-sm font-semibold text-gray-900 mb-2">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              id="txn-account"
              value={formState.accountId}
              onChange={(e) => setFormState({ ...formState, accountId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="txn-category" className="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <select
              id="txn-category"
              value={formState.categoryId}
              onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant Name */}
          <div>
            <label htmlFor="merchant-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Merchant Name
            </label>
            <input
              id="merchant-name"
              type="text"
              value={formState.merchantName}
              onChange={(e) => setFormState({ ...formState, merchantName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Whole Foods, Amazon"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="txn-tags" className="block text-sm font-semibold text-gray-900 mb-2">
              Tags
              <span className="ml-1.5 text-xs font-normal text-gray-400">comma-separated</span>
            </label>
            <input
              id="txn-tags"
              type="text"
              value={formState.tagsRaw}
              onChange={(e) => setFormState({ ...formState, tagsRaw: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g. channel trip, vacation"
            />
            {formState.tagsRaw && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formState.tagsRaw.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="txn-notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              id="txn-notes"
              rows={3}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add notes about this transaction..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
