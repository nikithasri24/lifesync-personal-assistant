/**
 * Swap Meal Modal Component
 * Allows user to log what they actually ate and decide what to do with the planned meal
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Package, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { PlannedMeal, Recipe } from '../../../types';
import type { MealType } from '../../../api/nutritionAPI';
import { useLogFoodMutation } from '../../../hooks/useNutritionQuery';
import { usePostponePlannedMealMutation, useUpdatePlannedMealMutation } from '../../../hooks/useMealPlanningQuery';

interface SwapMealModalProps {
  meal: PlannedMeal;
  recipe?: Recipe;
  onClose: () => void;
  onSuccess?: () => void;
}

type SwapAction = 'save_for_later' | 'forget_it';

export function SwapMealModal({ meal, recipe, onClose, onSuccess }: SwapMealModalProps): React.ReactElement {
  const [actualFood, setActualFood] = useState('');
  const [swapAction, setSwapAction] = useState<SwapAction>('forget_it');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const logFoodMutation = useLogFoodMutation();
  const postponeMealMutation = usePostponePlannedMealMutation();
  const updateMealMutation = useUpdatePlannedMealMutation();

  const mealName = recipe?.name || meal.customMeal || 'Unnamed meal';
  const calories = recipe?.calories ? recipe.calories * (meal.servings || 1) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualFood.trim()) return;

    setIsSubmitting(true);

    try {
      // 1. Log what was actually eaten to nutrition tracker
      const foodLogEntry = await logFoodMutation.mutateAsync({
        custom_food_name: actualFood.trim(),
        quantity: 1,
        meal_type: meal.mealType as MealType,
        logged_date: format(meal.date, 'yyyy-MM-dd'),
        calories: 0, // User can update this later in nutrition tracker
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        notes: `Substituted for planned meal: ${mealName}`,
      });

      // 2. Handle the planned meal based on selected action
      if (swapAction === 'save_for_later') {
        // Move original meal to backlog - it will disappear from the grid
        // The actual food is already logged to nutrition tracker above
        await postponeMealMutation.mutateAsync({
          mealId: meal.id,
          reason: `Ate "${actualFood.trim()}" instead`,
        });
      } else {
        // "Forget it" - delete the planned meal entirely
        // The actual food is already logged to nutrition tracker above
        await updateMealMutation.mutateAsync({
          mealId: meal.id,
          updates: {
            status: 'eaten',
            customMeal: actualFood.trim(),
            recipeId: undefined, // Clear the recipe link
            substitutedWith: actualFood.trim(),
            actualFoodLogId: foodLogEntry.id,
          },
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('[SwapMealModal] Failed to swap meal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ position: 'relative', zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Swap Meal</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Planned Meal Info */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-xs font-medium text-slate-500 uppercase mb-1">Planned</div>
              <div className="font-bold text-slate-900">{mealName}</div>
              <div className="text-sm text-slate-600 mt-1">
                {format(meal.date, 'EEE, MMM d')} • {meal.mealType}
                {calories > 0 && ` • ${calories} cal`}
              </div>
            </div>

            {/* What did you actually eat? */}
            <div>
              <label htmlFor="actualFood" className="block text-sm font-medium text-slate-900 mb-2">
                What did you actually eat? <span className="text-red-500">*</span>
              </label>
              <input
                id="actualFood"
                type="text"
                value={actualFood}
                onChange={(e) => setActualFood(e.target.value)}
                placeholder="e.g., Restaurant burger"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isSubmitting}
                required
                autoFocus
              />
              <div className="text-xs text-slate-500 mt-1.5">
                Will be logged to nutrition tracker
              </div>
            </div>

            {/* What to do with planned meal */}
            <div>
              <div className="text-sm font-medium text-slate-900 mb-3">
                What about "{mealName}"?
              </div>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${swapAction === 'forget_it' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="swapAction"
                    value="forget_it"
                    checked={swapAction === 'forget_it'}
                    onChange={(e) => setSwapAction(e.target.value as SwapAction)}
                    className="mt-0.5 shrink-0"
                    disabled={isSubmitting}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-sm text-slate-900">Forget it</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Replace with what I ate. I won't make the planned meal.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 border rounded-md cursor-pointer transition-colors ${swapAction === 'save_for_later' ? 'border-amber-500 bg-amber-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="swapAction"
                    value="save_for_later"
                    checked={swapAction === 'save_for_later'}
                    onChange={(e) => setSwapAction(e.target.value as SwapAction)}
                    className="mt-0.5 shrink-0"
                    disabled={isSubmitting}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-sm text-slate-900">Save for later</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Move to backlog so I can reschedule it another day.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !actualFood.trim()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

