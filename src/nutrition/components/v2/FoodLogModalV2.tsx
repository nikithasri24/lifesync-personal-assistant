/**
 * FoodLogModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for logging food
 *
 * MIGRATION COMPLETE:
 * - Reduced from 329 lines to ~240 lines (27% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Meal type selector with emoji buttons
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';

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
  isPending?: boolean;
}

const mealTypeOptions: { type: MealType; label: string; emoji: string }[] = [
  { type: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { type: 'lunch', label: 'Lunch', emoji: '🌞' },
  { type: 'dinner', label: 'Dinner', emoji: '🌙' },
  { type: 'snack', label: 'Snack', emoji: '🍎' },
];

export const FoodLogModalV2: React.FC<FoodLogModalV2Props> = ({
  isOpen,
  onClose,
  foodEntry,
  isEditing = false,
  selectedMealType,
  onSubmit,
  isPending = false,
}) => {
  const defaultFormData: FoodLogData = {
    foodName: '',
    mealType: selectedMealType || 'lunch',
    servingSize: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
  };

  const initialData = foodEntry ? {
    foodName: foodEntry.foodName || '',
    mealType: foodEntry.mealType || 'lunch',
    servingSize: foodEntry.servingSize || '',
    calories: foodEntry.calories?.toString() || '',
    protein: foodEntry.protein?.toString() || '',
    carbs: foodEntry.carbs?.toString() || '',
    fat: foodEntry.fat?.toString() || '',
    notes: foodEntry.notes || '',
  } : undefined;

  return (
    <FormModalV2<FoodLogData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Food' : 'Log Food'}
      defaultData={defaultFormData}
      initialData={initialData}
      draftKey={isEditing ? undefined : 'nutrition_food_log_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Update Food' : 'Log Food'}
      isEditing={isEditing}
      onSubmit={async (formData) => {
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
      }}
      validate={(formData) => {
        if (!formData.foodName.trim()) return 'Food name is required';
        if (!formData.calories) return 'Calories are required';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Food Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Food Name
            </label>
            <input
              type="text"
              value={formState.foodName}
              onChange={(e) => setFormState({ ...formState, foodName: e.target.value })}
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
                  onClick={() => setFormState({ ...formState, mealType: meal.type })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    formState.mealType === meal.type
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                  aria-label={`Select ${meal.label} meal type`}
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
              value={formState.servingSize}
              onChange={(e) => setFormState({ ...formState, servingSize: e.target.value })}
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
              value={formState.calories}
              onChange={(e) => setFormState({ ...formState, calories: e.target.value })}
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
                value={formState.protein}
                onChange={(e) => setFormState({ ...formState, protein: e.target.value })}
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
                value={formState.carbs}
                onChange={(e) => setFormState({ ...formState, carbs: e.target.value })}
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
                value={formState.fat}
                onChange={(e) => setFormState({ ...formState, fat: e.target.value })}
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
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Add any notes about this food..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
