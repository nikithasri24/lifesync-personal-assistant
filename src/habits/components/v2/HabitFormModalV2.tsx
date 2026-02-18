/**
 * HabitFormModalV2 Component - MIGRATED to use FormModalV2
 * Modal for creating and editing habits
 *
 * MIGRATION COMPLETE:
 * - Reduced from 294 lines to ~165 lines (44% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Auto-save with draftKey
 */

import React from 'react';
import type { HabitDraft } from '../../types';
import { FormModalV2 } from '@/components/v2';

export interface HabitFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitDraft) => void;
  onDelete?: () => void;
  initialData?: HabitDraft;
  isEditing?: boolean;
  isPending?: boolean;
}

interface HabitFormData {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetValue: string;
  category: string;
}

export const HabitFormModalV2: React.FC<HabitFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEditing = false,
  isPending = false,
}) => {
  const defaultFormData: HabitFormData = {
    name: '',
    description: '',
    frequency: 'daily',
    targetValue: '1',
    category: 'Health',
  };

  return (
    <FormModalV2<HabitFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Habit' : 'New Habit'}
      defaultData={defaultFormData}
      initialData={initialData ? {
        name: initialData.name || '',
        description: initialData.description || '',
        frequency: initialData.frequency || 'daily',
        targetValue: initialData.targetValue || '1',
        category: initialData.category || 'Health',
      } : undefined}
      draftKey={isEditing ? undefined : 'habit_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Update Habit' : 'Create Habit'}
      isEditing={isEditing}
      showDelete={isEditing && !!onDelete}
      onDelete={onDelete ? async () => { onDelete(); } : undefined}
      onSubmit={async (formData) => {
        const habitData: HabitDraft = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          frequency: formData.frequency,
          targetValue: formData.targetValue,
          category: formData.category,
          color: '#D4A574',
        };
        onSubmit(habitData);
      }}
      validate={(formData) => {
        if (!formData.name.trim()) return 'Habit name is required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
            {/* Habit Name */}
            <div>
              <label htmlFor="habit-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Habit Name
              </label>
              <input
                id="habit-name"
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="Exercise, Read, Meditate..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="habit-description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="habit-description"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Add more details about this habit..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              />
            </div>

            {/* Frequency */}
            <div>
              <label htmlFor="habit-frequency" className="block text-sm font-semibold text-gray-700 mb-2">
                Frequency
              </label>
              <select
                id="habit-frequency"
                value={formState.frequency}
                onChange={(e) => setFormState({ ...formState, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="daily">📅 Daily</option>
                <option value="weekly">📆 Weekly</option>
                <option value="monthly">🗓️ Monthly</option>
              </select>
            </div>

            {/* Target */}
            <div>
              <label htmlFor="habit-target" className="block text-sm font-semibold text-gray-700 mb-2">
                Target (optional)
              </label>
              <input
                id="habit-target"
                type="number"
                value={formState.targetValue}
                onChange={(e) => setFormState({ ...formState, targetValue: e.target.value })}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formState.frequency === 'daily' && 'Number of times per day'}
                {formState.frequency === 'weekly' && 'Number of times per week'}
                {formState.frequency === 'monthly' && 'Number of times per month'}
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="habit-category" className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                id="habit-category"
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="Health">🧘 Health</option>
                <option value="Fitness">💪 Fitness</option>
                <option value="Learning">📚 Learning</option>
                <option value="Personal">✍️ Personal</option>
                <option value="Productivity">💼 Productivity</option>
                <option value="Social">🤝 Social</option>
                <option value="Other">📌 Other</option>
              </select>
            </div>
          </>
        )}
    </FormModalV2>
  );
};

export default HabitFormModalV2;
