/**
 * BudgetFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit budgets with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 279 lines to ~195 lines (30% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Month picker with checkbox for rollover option
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

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

interface BudgetFormState {
  monthYear: string;
  categoryId: string;
  limitAmount: string;
  rollover: boolean;
  notes: string;
}

export const BudgetFormModalV2: React.FC<BudgetFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
  categories = [],
}) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const defaultFormData: BudgetFormState = {
    monthYear: currentMonth,
    categoryId: '',
    limitAmount: '',
    rollover: false,
    notes: '',
  };

  const initialFormData: BudgetFormState | undefined = initialData ? {
    monthYear: initialData.monthYear || currentMonth,
    categoryId: initialData.categoryId || '',
    limitAmount: initialData.limitAmount?.toString() || '',
    rollover: initialData.rollover || false,
    notes: initialData.notes || '',
  } : undefined;

  return (
    <FormModalV2<BudgetFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Budget' : 'Add Budget'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_budget_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Budget'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const budgetData: BudgetFormData = {
          categoryId: formData.categoryId,
          limitAmount: parseFloat(formData.limitAmount) || 0,
          monthYear: formData.monthYear,
          notes: formData.notes.trim() || undefined,
          rollover: formData.rollover,
        };
        await onSave(budgetData);
      }}
      validate={(formData) => {
        if (!formData.categoryId) return 'Please select a category';
        if (!formData.limitAmount || parseFloat(formData.limitAmount) <= 0) {
          return 'Please enter a valid budget limit';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Month/Year */}
          <div>
            <label htmlFor="budget-month" className="block text-sm font-semibold text-gray-900 mb-2">
              Month <span className="text-red-500">*</span>
            </label>
            <input
              id="budget-month"
              type="month"
              value={formState.monthYear}
              onChange={(e) => setFormState({ ...formState, monthYear: e.target.value })}
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
              value={formState.categoryId}
              onChange={(e) => setFormState({ ...formState, categoryId: e.target.value })}
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
              value={formState.limitAmount}
              onChange={(e) => setFormState({ ...formState, limitAmount: e.target.value })}
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
                checked={formState.rollover}
                onChange={(e) => setFormState({ ...formState, rollover: e.target.checked })}
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
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add notes about this budget..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
