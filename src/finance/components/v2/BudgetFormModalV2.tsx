/**
 * BudgetFormModalV2 Component
 * Create/edit budgets with Together pattern
 * Auto-save, category selector, month picker, ESC key support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BudgetFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetFormData) => void | Promise<void>;
  initialData?: Partial<BudgetFormData>;
  isPending?: boolean;
  categories?: Array<{ id: string; name: string; icon?: string }>;
}

export interface BudgetFormData {
  categoryId: string;
  limitAmount: number;
  monthYear: string; // Format: YYYY-MM
  notes?: string;
  rollover?: boolean;
}

const STORAGE_KEY = 'finance_budget_modal_draft';

export const BudgetFormModalV2: React.FC<BudgetFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
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
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [categoryId, setCategoryId] = useState(savedDraft?.categoryId || initialData?.categoryId || '');
  const [limitAmount, setLimitAmount] = useState(
    savedDraft?.limitAmount?.toString() || initialData?.limitAmount?.toString() || ''
  );
  const [monthYear, setMonthYear] = useState(savedDraft?.monthYear || initialData?.monthYear || currentMonth);
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');
  const [rollover, setRollover] = useState(savedDraft?.rollover || initialData?.rollover || false);

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          categoryId,
          limitAmount: parseFloat(limitAmount) || 0,
          monthYear,
          notes,
          rollover,
        })
      );
    }
  }, [categoryId, limitAmount, monthYear, notes, rollover, initialData]);

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

    if (!categoryId) {
      alert('Please select a category');
      return;
    }

    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      alert('Please enter a valid budget limit');
      return;
    }

    const formData: BudgetFormData = {
      categoryId,
      limitAmount: parseFloat(limitAmount),
      monthYear,
      notes: notes.trim() || undefined,
      rollover,
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
            {initialData ? 'Edit Budget' : 'Add Budget'}
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
            {/* Month/Year */}
            <div>
              <label htmlFor="budget-month" className="block text-sm font-semibold text-gray-900 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <input
                id="budget-month"
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="budget-category" className="block text-sm font-semibold text-gray-900 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="budget-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Amount */}
            <div>
              <label htmlFor="budget-limit" className="block text-sm font-semibold text-gray-900 mb-2">
                Budget Limit <span className="text-red-500">*</span>
              </label>
              <input
                id="budget-limit"
                type="number"
                step="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="0.00"
                required
              />
            </div>

            {/* Rollover Option */}
            <div>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={rollover}
                  onChange={(e) => setRollover(e.target.checked)}
                  className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
                />
                <div>
                  <span className="font-medium text-gray-900">Rollover unused budget</span>
                  <p className="text-sm text-gray-600">Carry over unspent amount to next month</p>
                </div>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="budget-notes" className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                id="budget-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes about this budget..."
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
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
