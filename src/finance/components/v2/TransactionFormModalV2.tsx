/**
 * TransactionFormModalV2 Component
 * Create/edit transactions with Together pattern
 * Auto-save, category selector, ESC key support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
}

const STORAGE_KEY = 'finance_transaction_modal_draft';

export const TransactionFormModalV2: React.FC<TransactionFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
  accounts = [],
  categories = [],
}) => {
  // Load saved draft
  const loadDraft = () => {
    if (initialData) return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = loadDraft();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(savedDraft?.dateISO?.split('T')[0] || initialData?.dateISO?.split('T')[0] || today);
  const [description, setDescription] = useState(savedDraft?.description || initialData?.description || '');
  const [amount, setAmount] = useState(savedDraft?.amount?.toString() || initialData?.amount?.toString() || '');
  const [type, setType] = useState<'debit' | 'credit'>(savedDraft?.type || initialData?.type || 'debit');
  const [accountId, setAccountId] = useState(savedDraft?.accountId || initialData?.accountId || '');
  const [categoryId, setCategoryId] = useState(savedDraft?.categoryId || initialData?.categoryId || '');
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');
  const [merchantName, setMerchantName] = useState(savedDraft?.merchantName || initialData?.merchantName || '');

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dateISO: date,
        description,
        amount: parseFloat(amount) || 0,
        type,
        accountId,
        categoryId,
        notes,
        merchantName,
      }));
    }
  }, [date, description, amount, type, accountId, categoryId, notes, merchantName, initialData]);

  // ESC key support
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

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (!accountId) {
      alert('Please select an account');
      return;
    }

    const formData: TransactionFormData = {
      dateISO: `${date}T12:00:00`,
      description: description.trim(),
      amount: parseFloat(amount) || 0,
      type,
      accountId,
      categoryId: categoryId || undefined,
      notes: notes.trim() || undefined,
      merchantName: merchantName.trim() || undefined,
    };

    await onSave(formData);

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
            {initialData ? 'Edit Transaction' : 'Add Transaction'}
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
            {/* Date */}
            <div>
              <label htmlFor="txn-date" className="block text-sm font-semibold text-gray-900 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                    type === 'debit'
                      ? 'border-terracotta-400 bg-terracotta-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="debit"
                    checked={type === 'debit'}
                    onChange={(e) => setType(e.target.value as 'debit' | 'credit')}
                    className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                  />
                  <span className="font-medium text-gray-900">Expense</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                    type === 'credit'
                      ? 'border-terracotta-400 bg-terracotta-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="credit"
                    checked={type === 'credit'}
                    onChange={(e) => setType(e.target.value as 'debit' | 'credit')}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
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
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Whole Foods, Amazon"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="txn-notes" className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                id="txn-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes about this transaction..."
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
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
