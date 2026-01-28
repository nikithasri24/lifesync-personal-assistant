/**
 * Meal Plan Nutrition Summary
 * Shows daily and weekly nutrition totals based on planned meals
 */

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Flame, Beef, Wheat, Droplet, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { MacroProgressBar } from '@/components/nutrition/MacroProgressBar';
import { useNutritionGoalQuery } from '@/hooks/useNutritionQuery';
import type { PlannedMeal, Recipe } from '@/types';

interface MealPlanNutritionSummaryProps {
  weekDays: Date[];
  plannedMeals: PlannedMeal[];
  recipes: Recipe[];
}

interface DailyNutrition {
  date: Date;
  dayName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

/**
 * Calculate nutrition for a single planned meal
 */
function getMealNutrition(meal: PlannedMeal, recipes: Recipe[]): { calories: number; protein: number; carbs: number; fat: number } {
  const recipe = recipes.find(r => r.id === meal.recipeId);
  if (!recipe) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const servings = meal.servings || 1;
  const nutritionInfo = recipe.nutritionInfo as { protein_g?: number; carbs_g?: number; fat_g?: number } | undefined;

  return {
    calories: (recipe.calories || 0) * servings,
    protein: (nutritionInfo?.protein_g || 0) * servings,
    carbs: (nutritionInfo?.carbs_g || 0) * servings,
    fat: (nutritionInfo?.fat_g || 0) * servings,
  };
}

export function MealPlanNutritionSummary({
  weekDays,
  plannedMeals,
  recipes,
}: MealPlanNutritionSummaryProps): React.ReactElement {
  const { data: goal } = useNutritionGoalQuery();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Calculate daily nutrition for each day
  const dailyNutrition = useMemo((): DailyNutrition[] => {
    return weekDays.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayMeals = plannedMeals.filter(m => {
        const mealDate = m.date instanceof Date ? m.date : new Date(m.date);
        return format(mealDate, 'yyyy-MM-dd') === dateKey && !m.isPostponed;
      });

      const totals = dayMeals.reduce(
        (acc, meal) => {
          const nutrition = getMealNutrition(meal, recipes);
          return {
            calories: acc.calories + nutrition.calories,
            protein: acc.protein + nutrition.protein,
            carbs: acc.carbs + nutrition.carbs,
            fat: acc.fat + nutrition.fat,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return {
        date,
        dayName: format(date, 'EEE'),
        ...totals,
        mealCount: dayMeals.length,
      };
    });
  }, [weekDays, plannedMeals, recipes]);

  // Calculate weekly totals
  const weeklyTotals = useMemo(() => {
    return dailyNutrition.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        protein: acc.protein + day.protein,
        carbs: acc.carbs + day.carbs,
        fat: acc.fat + day.fat,
        mealCount: acc.mealCount + day.mealCount,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
    );
  }, [dailyNutrition]);

  // Weekly targets (goal × 7 days)
  const weeklyTargets = useMemo(() => ({
    calories: (goal?.calories_target || 2000) * 7,
    protein: (goal?.protein_target_g || 150) * 7,
    carbs: (goal?.carbs_target_g || 200) * 7,
    fat: (goal?.fat_target_g || 65) * 7,
  }), [goal]);

  // Daily average
  const dailyAverage = useMemo(() => ({
    calories: Math.round(weeklyTotals.calories / 7),
    protein: Math.round(weeklyTotals.protein / 7),
    carbs: Math.round(weeklyTotals.carbs / 7),
    fat: Math.round(weeklyTotals.fat / 7),
  }), [weeklyTotals]);

  // If no meals have nutrition data, show a placeholder
  if (weeklyTotals.calories === 0) {
    return (
      <section className="rounded-lg border border-slate-200 p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <span className="text-sm">Add meals with recipes to see nutrition summary</span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900 dark:text-white">Weekly Nutrition</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {weeklyTotals.mealCount} meals planned • ~{dailyAverage.calories} cal/day avg
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(weeklyTotals.calories).toLocaleString()}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">/ {weeklyTargets.calories.toLocaleString()} cal</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-6">
          {/* Weekly macro progress bars */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Weekly Totals</h4>
            <MacroProgressBar
              label="Calories"
              current={weeklyTotals.calories}
              target={weeklyTargets.calories}
              unit="cal"
              color="#f97316"
              icon={<Flame className="w-4 h-4 text-orange-500" />}
            />
            <MacroProgressBar
              label="Protein"
              current={weeklyTotals.protein}
              target={weeklyTargets.protein}
              unit="g"
              color="#ef4444"
              icon={<Beef className="w-4 h-4 text-red-500" />}
            />
            <MacroProgressBar
              label="Carbs"
              current={weeklyTotals.carbs}
              target={weeklyTargets.carbs}
              unit="g"
              color="#3b82f6"
              icon={<Wheat className="w-4 h-4 text-blue-500" />}
            />
            <MacroProgressBar
              label="Fat"
              current={weeklyTotals.fat}
              target={weeklyTargets.fat}
              unit="g"
              color="#eab308"
              icon={<Droplet className="w-4 h-4 text-yellow-500" />}
            />
          </div>

          {/* Daily breakdown chart */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Daily Breakdown</h4>
            <div className="flex items-end gap-1 h-24">
              {dailyNutrition.map((day) => {
                const dailyTarget = goal?.calories_target || 2000;
                const heightPercent = Math.min((day.calories / dailyTarget) * 100, 150);
                const isOver = day.calories > dailyTarget;

                return (
                  <div key={day.dayName} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all duration-300 relative group"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: day.calories > 0 ? '4px' : '0',
                        backgroundColor: isOver ? '#ef4444' : '#f97316',
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {Math.round(day.calories)} cal
                        {day.mealCount > 0 && ` • ${day.mealCount} meals`}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{day.dayName}</span>
                  </div>
                );
              })}
            </div>
            {/* Target line indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-3 h-0.5 bg-slate-300 dark:bg-slate-600" />
              <span>Daily target: {goal?.calories_target || 2000} cal</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

