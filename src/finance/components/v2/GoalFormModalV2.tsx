/**
 * GoalFormModalV2 Component
 * Create/edit financial goals with Together pattern
 * Auto-save, category selector, deadline picker, ESC key support
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

const STORAGE_KEY = 'finance_goal_modal_draft';

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

  const [name, setName] = useState(savedDraft?.name || initialData?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    savedDraft?.targetAmount?.toString() || initialData?.targetAmount?.toString() || ''
  );
  const [currentAmount, setCurrentAmount] = useState(
    savedDraft?.currentAmount?.toString() || initialData?.currentAmount?.toString() || '0'
  );
  const [deadline, setDeadline] = useState(savedDraft?.deadline || initialData?.deadline || '');
  const [category, setCategory] = useState(savedDraft?.category || initialData?.category || 'other');
  const [notes, setNotes] = useState(savedDraft?.notes || initialData?.notes || '');

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name,
          targetAmount: parseFloat(targetAmount) || 0,
          currentAmount: parseFloat(currentAmount) || 0,
          deadline,
          category,
          notes,
        })
      );
    }
  }, [name, targetAmount, currentAmount, deadline, category, notes, initialData]);

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

    if (!name.trim()) {
      alert('Please enter a goal name');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    const formData: GoalFormData = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline || undefined,
      category,
      notes: notes.trim() || undefined,
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
            {initialData ? 'Edit Goal' : 'Add Goal'}
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
            {/* Goal Name */}
            <div>
              <label htmlFor="goal-name" className="block text-sm font-semibold text-gray-900 mb-2">
                Goal Name <span className="text-red-500">*</span>
              </label>
              <input
                id="goal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
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
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
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
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes about this goal..."
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
              {isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
