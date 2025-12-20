/**
 * Log Meal Button Component
 * Button to log a planned meal or recipe to the nutrition tracker
 */

import React, { useState } from 'react';
import { Utensils, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLogFoodMutation } from '@/hooks/useNutritionQuery';
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

  const handleLog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const mealName = recipe?.name || meal.customMeal || 'Meal';
    const calories = recipe?.calories || 0;
    const nutritionInfo = recipe?.nutritionInfo as { protein_g?: number; carbs_g?: number; fat_g?: number } | undefined;
    
    try {
      await logFoodMutation.mutateAsync({
        custom_food_name: mealName,
        quantity: meal.servings || 1,
        meal_type: meal.mealType as MealType,
        logged_date: format(meal.date, 'yyyy-MM-dd'),
        calories: calories * (meal.servings || 1),
        protein_g: (nutritionInfo?.protein_g || 0) * (meal.servings || 1),
        carbs_g: (nutritionInfo?.carbs_g || 0) * (meal.servings || 1),
        fat_g: (nutritionInfo?.fat_g || 0) * (meal.servings || 1),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    } catch (err) {
      console.error('Failed to log meal:', err);
    }
  };

  if (logged) {
    return (
      <span className={`inline-flex items-center gap-1 text-green-600 ${className}`}>
        <Check className="w-3 h-3" />
        {!compact && <span className="text-xs">Logged!</span>}
      </span>
    );
  }

  return (
    <button
      onClick={handleLog}
      disabled={logFoodMutation.isPending}
      className={`inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 transition-colors ${className}`}
      title="Log to nutrition tracker"
    >
      {logFoodMutation.isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Utensils className="w-3 h-3" />
      )}
      {!compact && <span className="text-xs">Log</span>}
    </button>
  );
}

