/**
 * HabitFormModalV2 Component
 * Modal for creating and editing habits following Together tab patterns
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { logger } from '../../../services/logger';
import type { HabitDraft } from '../../types';

export interface HabitFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HabitDraft) => void;
  onDelete?: () => void;
  initialData?: HabitDraft;
  isEditing?: boolean;
  isPending?: boolean;
}

const STORAGE_KEY = 'habit_draft';

const loadDraft = (): Partial<HabitDraft> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    logger.error('Habits', error as Error, { context: 'Failed to load draft' });
  }
  return null;
};

export const HabitFormModalV2: React.FC<HabitFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEditing = false,
  isPending = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetValue, setTargetValue] = useState('1');
  const [category, setCategory] = useState('Health');

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setFrequency(initialData.frequency || 'daily');
      setTargetValue(initialData.targetValue || '1');
      setCategory(initialData.category || 'Health');
    } else if (!isEditing) {
      // Reset to draft or defaults when creating new
      const draft = loadDraft();
      setName(draft?.name || '');
      setDescription(draft?.description || '');
      setFrequency(draft?.frequency || 'daily');
      setTargetValue(draft?.targetValue || '1');
      setCategory(draft?.category || 'Health');
    }
  }, [initialData, isEditing]);

  // Auto-save on change (only when not editing)
  useEffect(() => {
    if (!isEditing && (name || description || targetValue !== '1' || category !== 'Health')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, description, frequency, targetValue, category }));
    }
  }, [name, description, frequency, targetValue, category, isEditing]);

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

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const habitData: HabitDraft = {
      name: name.trim(),
      description: description.trim(),
      frequency,
      targetValue,
      category,
      color: '#D4A574',
    };

    onSubmit(habitData);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!isOpen) return null;

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

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Habit' : 'New Habit'}
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

        {/* Scrollable Content Area */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Habit Name */}
            <div>
              <label htmlFor="habit-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Habit Name
              </label>
              <input
                id="habit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
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
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">
                {frequency === 'daily' && 'Number of times per day'}
                {frequency === 'weekly' && 'Number of times per week'}
                {frequency === 'monthly' && 'Number of times per month'}
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="habit-category" className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                id="habit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
            {/* DELETE BUTTON - Only when editing */}
            {isEditing && onDelete && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this habit? All completion history will be lost. This cannot be undone.')) {
                      onDelete();
                    }
                  }}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl font-semibold text-red-600 transition-colors flex items-center justify-center gap-2"
                  aria-label="Delete habit"
                >
                  <span>🗑️</span>
                  Delete Habit
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
              >
                {isPending ? 'Saving...' : (isEditing ? 'Update Habit' : 'Create Habit')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitFormModalV2;
