/**
 * CategoryFormModal - Add/Edit personal care category
 */

import React from 'react';
import { X, Save } from 'lucide-react';
import type { PersonalCareCategory, PersonalCareCategoryInput, FrequencyType } from '../types';
import { getFrequencyDisplayName } from '../templates';

// Common emoji icons for categories
const CATEGORY_ICONS = [
  '✨', '💆', '💇', '🧴', '🪒', '💅', '🧖', '🌸', '🌿', '💎',
  '🧼', '🪥', '💄', '👁️', '💪', '🦷', '🧘', '🌙', '☀️', '💧',
];

// Frequency types for category organization
const FREQUENCY_TYPES: FrequencyType[] = ['daily', 'weekly', 'biweekly_monthly', 'every_2_8_weeks', 'custom'];

type CategoryFormModalProps = {
  category?: PersonalCareCategory;
  onSave: (category: PersonalCareCategoryInput) => void;
  onClose: () => void;
  isLoading?: boolean;
};

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  category,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState<PersonalCareCategoryInput>({
    name: category?.name ?? '',
    frequencyType: category?.frequencyType ?? 'custom',
    icon: category?.icon ?? '✨',
    color: category?.color ?? '#6366f1',
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder ?? 0,
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Hair Removal, Skincare AM, Hair Care"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* Frequency Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequencyType}
              onChange={(e) => setFormData({ ...formData, frequencyType: e.target.value as FrequencyType })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {FREQUENCY_TYPES.map((freq) => (
                <option key={freq} value={freq}>
                  {getFrequencyDisplayName(freq)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Helps organize items by how often they&apos;re done
            </p>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                    formData.icon === icon
                      ? 'bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded-lg cursor-pointer border-0"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formData.color}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;

