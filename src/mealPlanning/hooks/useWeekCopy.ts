import { useState, useCallback, useEffect } from 'react';
import { addDays, isSameWeek } from 'date-fns';
import { ensureDate } from '../utils';
import type { PlannedMeal, MealPlanWeek } from '../../types';
import {
  useCreateMealPlanMutation,
  useCreatePlannedMealMutation,
} from './useMealPlanningQuery';

type WeekStartDay = 0 | 1;

export interface UseWeekCopyReturn {
  copyTargetWeek: Date;
  isCopying: boolean;
  setCopyTargetWeek: (date: Date) => void;
  copyWeek: (
    sourceMeals: PlannedMeal[],
    sourceWeekStart: Date,
    mealPlans: MealPlanWeek[],
    weekStartsOn: WeekStartDay,
    showToast: (message: string, type: 'success' | 'error') => void
  ) => Promise<void>;
}

/**
 * Hook for copying meal plans from one week to another
 */
export function useWeekCopy(initialTargetWeek: Date): UseWeekCopyReturn {
  const [copyTargetWeek, setCopyTargetWeek] = useState<Date>(initialTargetWeek);
  const [isCopying, setIsCopying] = useState(false);

  const createMealPlanMutation = useCreateMealPlanMutation();
  const createPlannedMealMutation = useCreatePlannedMealMutation();

  // Update copy target when initial week changes
  useEffect(() => {
    setCopyTargetWeek(initialTargetWeek);
  }, [initialTargetWeek]);

  const copyWeek = useCallback(
    async (
      sourceMeals: PlannedMeal[],
      sourceWeekStart: Date,
      mealPlans: MealPlanWeek[],
      weekStartsOn: WeekStartDay,
      showToast: (message: string, type: 'success' | 'error') => void
    ) => {
      setIsCopying(true);
      try {
        // Find or create target plan
        let targetPlan = mealPlans.find((p) =>
          isSameWeek(ensureDate(p.weekStartDate), copyTargetWeek, { weekStartsOn })
        );

        if (!targetPlan) {
          const newPlan = await createMealPlanMutation.mutateAsync({
            weekStartDate: copyTargetWeek,
            name: 'Meal plan',
            weekStartsOn,
          });
          targetPlan = newPlan;
        }

        if (!targetPlan) {
          showToast('Failed to create target week plan', 'error');
          return;
        }

        // Calculate day offset
        const daysDiff = Math.floor(
          (copyTargetWeek.getTime() - sourceWeekStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Copy all meals
        const copyPromises = sourceMeals.map((meal) => {
          const originalDate = ensureDate(meal.date);
          const newDate = addDays(originalDate, daysDiff);

          return createPlannedMealMutation.mutateAsync({
            planId: targetPlan.id,
            meal: {
              date: newDate,
              mealType: meal.mealType,
              recipeId: meal.recipeId,
              customMeal: meal.customMeal,
              servings: meal.servings ?? 4,
              peopleCount: meal.peopleCount ?? meal.servings ?? 4,
              status: 'planned',
              notes: meal.notes,
              preparedAt: undefined,
              consumedAt: undefined,
            },
          });
        });

        await Promise.all(copyPromises);
        showToast('Week copied successfully!', 'success');
      } catch (error) {
        showToast('Failed to copy week', 'error');
        throw error;
      } finally {
        setIsCopying(false);
      }
    },
    [copyTargetWeek, createMealPlanMutation, createPlannedMealMutation]
  );

  return {
    copyTargetWeek,
    isCopying,
    setCopyTargetWeek,
    copyWeek,
  };
}
