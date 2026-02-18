/**
 * GoalFormModalV2 Component - MIGRATED to use FormModalV2
 * Create/edit financial goals with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 306 lines to ~210 lines (31% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 8 goal categories with emoji icons
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

interface GoalFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GoalFormData) => void | Promise<void>;
  initialData?: Partial<GoalFormData>;
  isPending?: boolean;
}

export interface GoalFormData {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  notes?: string;
}

interface GoalFormState {
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  category: string;
  notes: string;
}

const GOAL_CATEGORIES = [
  { value: 'vacation', label: 'Vacation', emoji: '✈️' },
  { value: 'home', label: 'Home Purchase', emoji: '🏠' },
  { value: 'car', label: 'Car Purchase', emoji: '🚗' },
  { value: 'education', label: 'Education', emoji: '🎓' },
  { value: 'emergency', label: 'Emergency Fund', emoji: '🛟' },
  { value: 'retirement', label: 'Retirement', emoji: '🌴' },
  { value: 'investment', label: 'Investment', emoji: '📈' },
  { value: 'other', label: 'Other', emoji: '🎯' },
];

export const GoalFormModalV2: React.FC<GoalFormModalV2Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending = false,
}) => {
  const defaultFormData: GoalFormState = {
    name: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    category: 'other',
    notes: '',
  };

  const initialFormData: GoalFormState | undefined = initialData ? {
    name: initialData.name || '',
    targetAmount: initialData.targetAmount?.toString() || '',
    currentAmount: initialData.currentAmount?.toString() || '0',
    deadline: initialData.deadline || '',
    category: initialData.category || 'other',
    notes: initialData.notes || '',
  } : undefined;

  return (
    <FormModalV2<GoalFormState>
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Goal' : 'Add Goal'}
      defaultData={defaultFormData}
      initialData={initialFormData}
      draftKey={initialData ? undefined : 'finance_goal_modal_draft'}
      isPending={isPending}
      submitText={initialData ? 'Save Changes' : 'Add Goal'}
      isEditing={!!initialData}
      onSubmit={async (formData) => {
        const goalData: GoalFormData = {
          name: formData.name.trim(),
          targetAmount: parseFloat(formData.targetAmount) || 0,
          currentAmount: parseFloat(formData.currentAmount) || 0,
          deadline: formData.deadline || undefined,
          category: formData.category,
          notes: formData.notes.trim() || undefined,
        };
        await onSave(goalData);
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Please enter a goal name';
        if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
          return 'Please enter a valid target amount';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Goal Name */}
          <div>
            <label htmlFor="goal-name" className="block text-sm font-semibold text-gray-900 mb-2">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-name"
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Emergency Fund, Vacation to Hawaii"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="goal-category" className="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <select
              id="goal-category"
              value={formState.category}
              onChange={(e) => setFormState({ ...formState, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              {GOAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Amount */}
          <div>
            <label htmlFor="goal-target" className="block text-sm font-semibold text-gray-900 mb-2">
              Target Amount <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-target"
              type="number"
              step="0.01"
              value={formState.targetAmount}
              onChange={(e) => setFormState({ ...formState, targetAmount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="0.00"
              required
            />
          </div>

          {/* Current Amount */}
          <div>
            <label htmlFor="goal-current" className="block text-sm font-semibold text-gray-900 mb-2">
              Current Amount
            </label>
            <input
              id="goal-current"
              type="number"
              step="0.01"
              value={formState.currentAmount}
              onChange={(e) => setFormState({ ...formState, currentAmount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="0.00"
            />
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="goal-deadline" className="block text-sm font-semibold text-gray-900 mb-2">
              Target Date
            </label>
            <input
              id="goal-deadline"
              type="date"
              value={formState.deadline}
              onChange={(e) => setFormState({ ...formState, deadline: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="goal-notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <textarea
              id="goal-notes"
              rows={3}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add notes about this goal..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
