/**
 * Meal Plan Nutrition Summary
 * Shows daily nutrition tracking with day selector
 */

import React, { useMemo, useState } from 'react';
import { format, isToday } from 'date-fns';
import { Flame, Beef, Wheat, Droplet, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
  fullDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  isToday: boolean;
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

  // Find today's index in weekDays, default to 0 if not found
  const todayIndex = useMemo(() => {
    const idx = weekDays.findIndex(d => isToday(d));
    return idx >= 0 ? idx : 0;
  }, [weekDays]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

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
        fullDate: format(date, 'MMM d'),
        ...totals,
        mealCount: dayMeals.length,
        isToday: isToday(date),
      };
    });
  }, [weekDays, plannedMeals, recipes]);

  // Get selected day's nutrition
  const selectedDay = dailyNutrition[selectedDayIndex] || dailyNutrition[0];

  // Daily targets from goals
  const dailyTargets = useMemo(() => ({
    calories: goal?.calories_target || 2000,
    protein: goal?.protein_target_g || 150,
    carbs: goal?.carbs_target_g || 200,
    fat: goal?.fat_target_g || 65,
  }), [goal]);

  // Calculate weekly totals for the placeholder check
  const weeklyTotals = useMemo(() => {
    return dailyNutrition.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        mealCount: acc.mealCount + day.mealCount,
      }),
      { calories: 0, mealCount: 0 }
    );
  }, [dailyNutrition]);

  // Navigation handlers
  const goToPreviousDay = () => {
    setSelectedDayIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextDay = () => {
    setSelectedDayIndex(prev => Math.min(weekDays.length - 1, prev + 1));
  };

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
      {/* Header with day selector */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Daily Nutrition</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedDay.mealCount} meal{selectedDay.mealCount !== 1 ? 's' : ''} planned
              </p>
            </div>
          </div>

          {/* Day selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              disabled={selectedDayIndex === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="min-w-[100px] text-center">
              <span className="font-medium text-slate-900 dark:text-white">
                {selectedDay.dayName}, {selectedDay.fullDate}
              </span>
              {selectedDay.isToday && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  Today
                </span>
              )}
            </div>
            <button
              onClick={goToNextDay}
              disabled={selectedDayIndex === weekDays.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Daily macro progress bars */}
        <div className="space-y-3">
          <MacroProgressBar
            label="Calories"
            current={selectedDay.calories}
            target={dailyTargets.calories}
            unit="cal"
            color="#f97316"
            icon={<Flame className="w-4 h-4 text-orange-500" />}
          />
          <MacroProgressBar
            label="Protein"
            current={selectedDay.protein}
            target={dailyTargets.protein}
            unit="g"
            color="#ef4444"
            icon={<Beef className="w-4 h-4 text-red-500" />}
          />
          <MacroProgressBar
            label="Carbs"
            current={selectedDay.carbs}
            target={dailyTargets.carbs}
            unit="g"
            color="#3b82f6"
            icon={<Wheat className="w-4 h-4 text-blue-500" />}
          />
          <MacroProgressBar
            label="Fat"
            current={selectedDay.fat}
            target={dailyTargets.fat}
            unit="g"
            color="#eab308"
            icon={<Droplet className="w-4 h-4 text-yellow-500" />}
          />
        </div>

        {/* Week overview mini chart */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Week Overview</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {weeklyTotals.mealCount} meals total
            </span>
          </div>
          <div className="flex items-end gap-1 h-12">
            {dailyNutrition.map((day, idx) => {
              const heightPercent = Math.min((day.calories / dailyTargets.calories) * 100, 100);
              const isSelected = idx === selectedDayIndex;
              const isOver = day.calories > dailyTargets.calories;

              return (
                <button
                  key={day.dayName}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-1 flex flex-col items-center gap-1 transition-all ${
                    isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isSelected ? 'ring-2 ring-orange-400 ring-offset-1 dark:ring-offset-slate-800' : ''
                    }`}
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: day.calories > 0 ? '4px' : '2px',
                      backgroundColor: day.calories === 0
                        ? '#e2e8f0'
                        : isOver
                          ? '#ef4444'
                          : '#f97316',
                    }}
                  />
                  <span className={`text-[10px] ${
                    isSelected
                      ? 'font-semibold text-orange-600 dark:text-orange-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {day.dayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

