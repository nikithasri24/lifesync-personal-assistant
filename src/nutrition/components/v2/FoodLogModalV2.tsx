/**
 * FoodLogModalV2 Component
 * Together pattern modal for logging food
 * Features: Meal type selector, food name, serving size, macros, photo upload, auto-save
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodLogData {
  foodName: string;
  mealType: MealType;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  notes: string;
}

interface FoodLogModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  foodEntry?: {
    id: string;
    foodName: string;
    mealType: MealType;
    servingSize: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes?: string;
  };
  isEditing?: boolean;
  selectedMealType?: MealType;
  onSubmit: (data: any) => Promise<void>;
}

export const FoodLogModalV2: React.FC<FoodLogModalV2Props> = ({
  isOpen,
  onClose,
  foodEntry,
  isEditing = false,
  selectedMealType,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const STORAGE_KEY = 'nutrition_food_log_draft';

  // Auto-save draft logic
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = !foodEntry ? loadDraft() : null;

  const [formData, setFormData] = useState<FoodLogData>({
    foodName: foodEntry?.foodName || savedDraft?.foodName || '',
    mealType: foodEntry?.mealType || selectedMealType || savedDraft?.mealType || 'lunch',
    servingSize: foodEntry?.servingSize || savedDraft?.servingSize || '',
    calories: foodEntry?.calories?.toString() || savedDraft?.calories || '',
    protein: foodEntry?.protein?.toString() || savedDraft?.protein || '',
    carbs: foodEntry?.carbs?.toString() || savedDraft?.carbs || '',
    fat: foodEntry?.fat?.toString() || savedDraft?.fat || '',
    notes: foodEntry?.notes || savedDraft?.notes || '',
  });

  const [isPending, setIsPending] = useState(false);

  // Auto-save on change
  useEffect(() => {
    if (formData.foodName || formData.calories) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async () => {
    if (!formData.foodName.trim() || !formData.calories) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({
        foodName: formData.foodName.trim(),
        mealType: formData.mealType,
        servingSize: formData.servingSize.trim(),
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0,
        notes: formData.notes.trim(),
      });
      localStorage.removeItem(STORAGE_KEY);
      onClose();
    } catch (error) {
      console.error('Failed to save food log:', error);
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  const mealTypeOptions: { type: MealType; label: string; emoji: string }[] = [
    { type: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { type: 'lunch', label: 'Lunch', emoji: '🌞' },
    { type: 'dinner', label: 'Dinner', emoji: '🌙' },
    { type: 'snack', label: 'Snack', emoji: '🍎' },
  ];

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
            {isEditing ? 'Edit Food' : 'Log Food'}
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
        <div
          className="overflow-y-auto p-6 space-y-5 flex-1"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Food Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Food Name
            </label>
            <input
              type="text"
              value={formData.foodName}
              onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
              placeholder="e.g., Grilled Chicken Salad"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mealTypeOptions.map((meal) => (
                <button
                  key={meal.type}
                  type="button"
                  onClick={() => setFormData({ ...formData, mealType: meal.type })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    formData.mealType === meal.type
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <span>{meal.emoji}</span>
                  <span>{meal.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Serving Size */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Serving Size (optional)
            </label>
            <input
              type="text"
              value={formData.servingSize}
              onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
              placeholder="e.g., 1 cup, 250g"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          {/* Calories */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Calories
            </label>
            <input
              type="number"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Carbs (g)
              </label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fat (g)
              </label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this food..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !formData.foodName.trim() || !formData.calories}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Saving...' : (isEditing ? 'Update Food' : 'Log Food')}
          </button>
        </div>
      </div>
    </div>
  );
};
