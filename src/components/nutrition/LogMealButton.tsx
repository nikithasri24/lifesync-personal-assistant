/**
 * Log Meal Button Component
 * Button to log a planned meal or recipe to the nutrition tracker
 */

import React, { useState } from 'react';
import { logger } from '@/services/logger';
import { Utensils, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLogFoodMutation } from '@/hooks/useNutritionQuery';
import { useUpdatePlannedMealMutation } from '@/hooks/useMealPlanningQuery';
import type { Recipe, PlannedMeal } from '@/types';
import type { MealType } from '@/api/nutritionAPI';

interface LogMealButtonProps {
  meal: PlannedMeal;
  recipe?: Recipe;
  className?: string;
  compact?: boolean;
}

export function LogMealButton({ meal, recipe, className = '', compact = false }: LogMealButtonProps): React.ReactElement {
  const [logged, setLogged] = useState(false);
  const logFoodMutation = useLogFoodMutation();
  const updateMealMutation = useUpdatePlannedMealMutation();

  const handleLog = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const mealName = recipe?.name || meal.customMeal || 'Meal';
    const calories = recipe?.calories || 0;
    const nutritionInfo = recipe?.nutritionInfo as { protein_g?: number; carbs_g?: number; fat_g?: number } | undefined;

    try {
      // Log to nutrition tracker
      const foodLog = await logFoodMutation.mutateAsync({
        custom_food_name: mealName,
        quantity: meal.servings || 1,
        meal_type: meal.mealType as MealType,
        logged_date: format(meal.date, 'yyyy-MM-dd'),
        calories: calories * (meal.servings || 1),
        protein_g: (nutritionInfo?.protein_g || 0) * (meal.servings || 1),
        carbs_g: (nutritionInfo?.carbs_g || 0) * (meal.servings || 1),
        fat_g: (nutritionInfo?.fat_g || 0) * (meal.servings || 1),
      });

      // Update meal status to 'eaten' and link to food log
      await updateMealMutation.mutateAsync({
        mealId: meal.id,
        updates: {
          status: 'eaten',
          actualFoodLogId: foodLog.id,
        },
      });

      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    } catch (err) {
      logger.error('Nutrition', 'Failed to log meal:', err);
    }
  };

  if (logged) {
    return (
      <span className={`inline-flex items-center gap-1 p-1 ${className || 'text-green-600'}`}>
        <Check className="w-3 h-3" />
        {!compact && <span className="text-xs">Logged!</span>}
      </span>
    );
  }

  return (
    <button
      onClick={handleLog}
      disabled={logFoodMutation.isPending}
      className={`inline-flex items-center gap-1 ${compact ? 'p-1' : 'p-1.5'} rounded transition-colors ${className || (compact ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50')}`}
      title="Log to nutrition tracker"
    >
      {logFoodMutation.isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Utensils className="w-3.5 h-3.5" />
      )}
      {!compact && <span className="text-xs">Log</span>}
    </button>
  );
}

