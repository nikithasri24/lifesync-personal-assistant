/**
 * ItemFormModal - Add/Edit personal care item
 */

import React from 'react';
import { X, Save } from 'lucide-react';
import type { PersonalCareItem, PersonalCareItemInput, TrackingMode } from '../types';

// Common emoji icons for items
const ITEM_ICONS = [
  '✨', '💆', '💇', '🧴', '🪒', '💅', '🧖', '🌸', '🌿', '💎',
  '🧼', '🪥', '💄', '👁️', '💪', '🦷', '🧘', '🌙', '☀️', '💧',
  '🦵', '🦶', '👃', '👂', '🫦', '🦴', '🧠', '❤️', '🩹', '🏃',
];

const TRACKING_MODES: { value: TrackingMode; label: string; description: string }[] = [
  { value: 'none', label: "Don't Track", description: 'Hide this item, not tracked' },
  { value: 'manual', label: 'Manual', description: 'Check off when done, app learns patterns' },
  { value: 'scheduled', label: 'Scheduled', description: 'Auto-adds to schedule at set interval' },
];

type ItemFormModalProps = {
  item?: PersonalCareItem;
  categoryId: string;
  categoryName: string;
  onSave: (item: PersonalCareItemInput) => void;
  onClose: () => void;
  isLoading?: boolean;
};

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  categoryId,
  categoryName,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState<PersonalCareItemInput>({
    categoryId,
    name: item?.name ?? '',
    icon: item?.icon ?? '',
    trackingMode: item?.trackingMode ?? 'manual',
    scheduleIntervalDays: item?.scheduleIntervalDays,
    goalIntervalDays: item?.goalIntervalDays,
    isActive: item?.isActive ?? true,
    sortOrder: item?.sortOrder ?? 0,
    notes: item?.notes ?? '',
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {item ? 'Edit Item' : 'Add Item'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">in {categoryName}</p>
          </div>
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
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Underarms, Bikini, Hair Wash"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: '' })}
                className={`w-10 h-10 text-sm rounded-lg flex items-center justify-center transition-all ${
                  !formData.icon
                    ? 'bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                None
              </button>
              {ITEM_ICONS.map((icon) => (
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

          {/* Tracking Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tracking Mode
            </label>
            <div className="space-y-2">
              {TRACKING_MODES.map((mode) => (
                <label
                  key={mode.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    formData.trackingMode === mode.value
                      ? 'bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="trackingMode"
                    value={mode.value}
                    checked={formData.trackingMode === mode.value}
                    onChange={() => setFormData({ ...formData, trackingMode: mode.value })}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{mode.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule Interval (only for scheduled mode) */}
          {formData.trackingMode === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repeat Every (days) *
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.scheduleIntervalDays ?? ''}
                onChange={(e) => setFormData({
                  ...formData,
                  scheduleIntervalDays: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="e.g., 14 for every 2 weeks"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required={formData.trackingMode === 'scheduled'}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This item will automatically appear on your schedule every {formData.scheduleIntervalDays || 'X'} days
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
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
              disabled={isLoading || !formData.name.trim() || (formData.trackingMode === 'scheduled' && !formData.scheduleIntervalDays)}
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

export default ItemFormModal;

