/**
 * Meal Backlog Section Component
 * Shows postponed meals and shared backlog items that can be rescheduled or deleted
 */

import React from 'react';
import { Package, Calendar, Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '../../../services/logger';
import type { PlannedMeal, Recipe } from '../../../types';
import { useUndoRedo } from '../../../contexts/UndoRedoContext';
import { DeletePlannedMealCommand } from '../../../commands/MealPlanningCommands';
import {
  useBacklogQuery,
  useRemoveFromBacklogMutation,
  type MealBacklogItem,
} from '../../../hooks/useMealPlanningQuery';

interface MealBacklogSectionProps {
  postponedMeals: PlannedMeal[];
  recipes: Recipe[];
  isMerged?: boolean;
  onReschedule?: (meal: PlannedMeal) => void;
}

export function MealBacklogSection({ postponedMeals, recipes, isMerged = false, onReschedule }: MealBacklogSectionProps): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { executeCommand } = useUndoRedo();

  // Fetch shared backlog items when in merged mode
  const { data: sharedBacklogItems = [] } = useBacklogQuery({ enabled: isMerged });
  const removeFromBacklogMutation = useRemoveFromBacklogMutation();

  const totalItems = postponedMeals.length + sharedBacklogItems.length;

  if (totalItems === 0) {
    return null;
  }

  const handleDeletePostponed = async (meal: PlannedMeal) => {
    // Use command pattern for undo support - no confirmation needed
    try {
      const command = new DeletePlannedMealCommand(meal, meal.mealPlanId);
      await executeCommand(command);
    } catch (error) {
      logger.error('MealPlanning', error instanceof Error ? error : new Error(String(error)), { context: 'deletePostponedMeal' });
    }
  };

  const handleDeleteSharedBacklog = async (item: MealBacklogItem) => {
    try {
      await removeFromBacklogMutation.mutateAsync(item.id);
    } catch (error) {
      logger.error('MealPlanning', error instanceof Error ? error : new Error(String(error)), { context: 'deleteSharedBacklogItem' });
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
              ({totalItems} {totalItems === 1 ? 'meal' : 'meals'})
            </span>
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* Backlog Items List */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {/* Shared Backlog Items (from merged mode) */}
          {sharedBacklogItems.map((item) => {
            const recipe = recipes.find((r) => r.id === item.recipeId);
            const calories = recipe?.calories ? recipe.calories * (item.servings || 1) : null;

            return (
              <div
                key={`shared-${item.id}`}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/backlog-id', item.id);
                  e.dataTransfer.setData('text/from-shared-backlog', 'true');
                  // Include full item data for the drop handler
                  e.dataTransfer.setData('text/backlog-item', JSON.stringify({
                    id: item.id,
                    mealName: item.mealName,
                    recipeId: item.recipeId,
                    servings: item.servings,
                    peopleCount: item.peopleCount,
                  }));
                }}
                className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md hover:border-indigo-300 hover:shadow-sm transition-all group cursor-move"
              >
                {/* Shared Badge */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  <Users className="w-3 h-3" />
                  <span>Shared</span>
                </div>

                {/* Meal Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{item.mealName}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {item.originalDate && (
                      <span>
                        Originally: {format(item.originalDate, 'MMM d')}
                        {item.originalMealType && ` • ${item.originalMealType}`}
                      </span>
                    )}
                    {item.reason && (
                      <span className="text-indigo-600">• {item.reason}</span>
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
                    onClick={() => handleDeleteSharedBacklog(item)}
                    disabled={removeFromBacklogMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Remove from shared backlog"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Postponed Meals (personal) */}
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
                    onClick={() => handleDeletePostponed(meal)}
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
              {isMerged && ' Shared items can be used by either partner.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

