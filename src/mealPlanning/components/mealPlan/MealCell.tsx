/**
 * MealCell Component
 * Individual day/meal-type cell in the weekly grid with drag-and-drop support
 */

import React from 'react';
import { ChefHat } from 'lucide-react';
import { isSameDay } from 'date-fns';
import type { PlannedMeal, Recipe, MealPlan } from '../../../types';
import {
  useCreatePlannedMealMutation,
  useUpdatePlannedMealMutation,
} from '../../hooks/useMealPlanningQuery';
import { parseLocalDateKey } from '../../utils/mealPlanHelpers';
import { logger } from '../../../services/logger';

export interface MealCellProps {
  dateKey: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dayMeals: PlannedMeal[];
  recipes: Recipe[];
  plannedMeals: PlannedMeal[];
  activePlan: MealPlan | null;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const MealCell: React.FC<MealCellProps> = ({
  dateKey,
  date,
  mealType,
  dayMeals,
  activePlan,
  plannedMeals,
  isSelected,
  onClick,
  children,
}) => {
  const createPlannedMealMutation = useCreatePlannedMealMutation();
  const updatePlannedMealMutation = useUpdatePlannedMealMutation();

  const hasContent = dayMeals.length > 0;
  const highlight = isSameDay(date, new Date());

  const handleDrop = async (e: React.DragEvent) => {
    if (!activePlan) return;

    // Handle meal option drop
    const optionName = e.dataTransfer.getData('text/meal-option');
    if (optionName) {
      try {
        await createPlannedMealMutation.mutateAsync({
          planId: activePlan.id,
          meal: {
            date: parseLocalDateKey(dateKey),
            mealType,
            recipeId: undefined,
            customMeal: optionName,
            servings: 4,
            peopleCount: 4,
            status: 'planned',
            notes: undefined,
            preparedAt: undefined,
            consumedAt: undefined,
          }
        });
      } catch (error) {
        logger.error('MealCell', 'Failed to create meal from option:', { error });
      }
      return;
    }

    // Handle recipe drop
    const recipeDragged = e.dataTransfer.getData('text/recipe-id');
    if (recipeDragged) {
      try {
        await createPlannedMealMutation.mutateAsync({
          planId: activePlan.id,
          meal: {
            date: parseLocalDateKey(dateKey),
            mealType,
            recipeId: recipeDragged,
            customMeal: undefined,
            servings: 4,
            peopleCount: 4,
            status: 'planned',
            notes: undefined,
            preparedAt: undefined,
            consumedAt: undefined,
          }
        });
      } catch (error) {
        logger.error('MealCell', 'Failed to create meal from recipe:', { error });
      }
      return;
    }

    // Handle meal drag (move or copy)
    const mealId = e.dataTransfer.getData('text/meal-id');
    if (!mealId) return;

    if (e.altKey) {
      // Copy meal
      const source = plannedMeals.find((m) => m.id === mealId);
      if (!source) return;

      try {
        await createPlannedMealMutation.mutateAsync({
          planId: activePlan.id,
          meal: {
            date: parseLocalDateKey(dateKey),
            mealType,
            recipeId: source.recipeId,
            customMeal: source.customMeal,
            servings: source.servings ?? 4,
            peopleCount: source.peopleCount ?? source.servings ?? 4,
            status: 'planned',
            notes: undefined,
            preparedAt: undefined,
            consumedAt: undefined,
          }
        });
      } catch (error) {
        logger.error('MealCell', 'Failed to copy meal:', { error });
      }
    } else {
      // Move meal
      try {
        await updatePlannedMealMutation.mutateAsync({
          mealId,
          updates: { date: parseLocalDateKey(dateKey), mealType }
        });
      } catch (error) {
        logger.error('MealCell', 'Failed to move meal:', { error });
      }
    }
  };

  return (
    <div
      className={`relative p-3 border-b border-l border-r border-slate-200 overflow-hidden cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-400' : ''
      } ${hasContent ? 'bg-amber-50/30' : ''}`}
      onClick={onClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {highlight && (
        <div className="absolute inset-y-0 left-0 w-1 bg-indigo-300" aria-hidden />
      )}
      {/* Chef hat indicator for populated cells */}
      {hasContent && (
        <div className="absolute top-1 right-1 z-10">
          <ChefHat className="w-4 h-4 text-amber-600" />
        </div>
      )}
      <div className="h-full overflow-auto space-y-2 group/cell relative">
        {children}
      </div>
    </div>
  );
};

export default MealCell;
