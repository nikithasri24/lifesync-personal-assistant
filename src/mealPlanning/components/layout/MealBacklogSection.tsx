/**
 * Meal Backlog Section Component
 * Shows postponed meals that can be rescheduled or deleted
 */

import React from 'react';
import { Package, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { PlannedMeal, Recipe } from '../../../types';
import { useUndoRedo } from '../../../contexts/UndoRedoContext';
import { DeletePlannedMealCommand } from '../../../commands/MealPlanningCommands';

interface MealBacklogSectionProps {
  postponedMeals: PlannedMeal[];
  recipes: Recipe[];
  onReschedule?: (meal: PlannedMeal) => void;
}

export function MealBacklogSection({ postponedMeals, recipes, onReschedule }: MealBacklogSectionProps): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { executeCommand } = useUndoRedo();

  if (postponedMeals.length === 0) {
    return null;
  }

  const handleDelete = async (meal: PlannedMeal, mealName: string) => {
    // Use command pattern for undo support - no confirmation needed
    try {
      const command = new DeletePlannedMealCommand(meal, meal.mealPlanId);
      await executeCommand(command);
    } catch (error) {
      console.error('[MealBacklog] Failed to delete meal:', error);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-slate-900">
            Meal Backlog
            <span className="ml-2 text-sm font-normal text-slate-600">
              ({postponedMeals.length} {postponedMeals.length === 1 ? 'meal' : 'meals'})
            </span>
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* Postponed Meals List */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {postponedMeals.map((meal) => {
            const recipe = recipes.find((r) => r.id === meal.recipeId);
            const mealName = recipe?.name || meal.customMeal || 'Unnamed meal';
            const calories = recipe?.calories ? recipe.calories * (meal.servings || 1) : null;

            return (
              <div
                key={meal.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/meal-id', meal.id);
                  e.dataTransfer.setData('text/from-backlog', 'true');
                }}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md hover:border-amber-300 hover:shadow-sm transition-all group cursor-move"
              >
                {/* Meal Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{mealName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {meal.originalDate && (
                      <span>
                        Originally: {format(meal.originalDate, 'MMM d')} • {meal.mealType}
                      </span>
                    )}
                    {meal.postponedReason && (
                      <span className="text-amber-600">• {meal.postponedReason}</span>
                    )}
                    {calories && (
                      <span>• {calories} cal</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onReschedule?.(meal)}
                    disabled={!onReschedule}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Reschedule to another day"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(meal, mealName)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete from backlog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Help Text */}
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <p className="text-xs text-slate-600">
              💡 <strong>Tip:</strong> Drag meals from here onto the table above to reschedule them.
              Or delete them if you no longer want to make them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

