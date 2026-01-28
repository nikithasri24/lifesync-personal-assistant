import React, { useState, useRef, useEffect } from 'react';
import { Flame, Trash2, Check, X, RefreshCw, Undo2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { PlannedMeal, Recipe } from '../../../types';
import { useLogFoodMutation } from '../../../hooks/useNutritionQuery';
import { useUpdatePlannedMealMutation, useDeletePlannedMealMutation } from '../../../hooks/useMealPlanningQuery';
import { SwapMealModal } from './SwapMealModal';
import { logger } from '../../../services/logger';
import type { MealType } from '../../../api/nutritionAPI';
import { useUndoRedo } from '../../../contexts/UndoRedoContext';
import { DeletePlannedMealCommand, UpdatePlannedMealCommand } from '../../../commands/MealPlanningCommands';

// Meal type color mapping
const MEAL_TYPE_COLORS = {
  breakfast: { bg: 'bg-amber-600', hover: 'hover:bg-amber-500', eaten: 'bg-amber-700' },
  lunch: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', eaten: 'bg-emerald-700' },
  dinner: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-500', eaten: 'bg-indigo-700' },
  snack: { bg: 'bg-pink-600', hover: 'hover:bg-pink-500', eaten: 'bg-pink-700' },
};

interface MealItemProps {
  meal: PlannedMeal;
  recipes: Recipe[];
  onShowRecipeForm: (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
}

export const MealItem: React.FC<MealItemProps> = ({ meal, recipes, onShowRecipeForm: _onShowRecipeForm, onShowSimpleEdit: _onShowSimpleEdit }) => {
  const recipe = recipes.find(r => r.id === meal.recipeId);
  const mealName = recipe?.name || meal.customMeal || 'Unnamed meal';
  const calories = recipe?.calories ? recipe.calories * (meal.servings || 1) : null;
  const isRecipeMeal = !!(recipe && meal.recipeId);

  // Get color based on meal type
  const mealType = meal.mealType as keyof typeof MEAL_TYPE_COLORS;
  const colors = MEAL_TYPE_COLORS[mealType] || MEAL_TYPE_COLORS.breakfast;

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(mealName);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMealMutation = useUpdatePlannedMealMutation();
  const deleteMealMutation = useDeletePlannedMealMutation();
  const logFoodMutation = useLogFoodMutation();
  const { executeCommand } = useUndoRedo();

  // Quick log handler for checkbox
  const handleQuickLog = async (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (isLogging) return;

    setIsLogging(true);
    const mealDisplayName = recipe?.name || meal.customMeal || 'Meal';
    const mealCalories = recipe?.calories || 0;
    const nutritionInfo = recipe?.nutritionInfo as { protein_g?: number; carbs_g?: number; fat_g?: number } | undefined;

    try {
      // Log to nutrition tracker
      const foodLog = await logFoodMutation.mutateAsync({
        custom_food_name: mealDisplayName,
        quantity: meal.servings || 1,
        meal_type: meal.mealType as MealType,
        logged_date: format(meal.date, 'yyyy-MM-dd'),
        calories: mealCalories * (meal.servings || 1),
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
    } catch (err) {
      logger.error('MealItem', 'Failed to log meal', { error: err });
    } finally {
      setIsLogging(false);
    }
  };

  // Update editedName when mealName changes (after successful update)
  useEffect(() => {
    setEditedName(mealName);
  }, [mealName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!editedName.trim()) {
      setIsEditing(false);
      setEditedName(mealName);
      return;
    }

    try {
      await updateMealMutation.mutateAsync({
        mealId: meal.id,
        updates: { customMeal: editedName.trim() },
      });
      setIsEditing(false);
    } catch (error) {
      setEditedName(mealName);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(mealName);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    // Use command pattern for undo support - no confirmation needed since we can undo
    try {
      const command = new DeletePlannedMealCommand(meal, meal.mealPlanId);
      await executeCommand(command);
    } catch (error) {
      logger.error('MealItem', 'Failed to delete meal', { error });
    }
  };

  const handleUndoLog = async () => {
    try {
      // Use command pattern for undo support
      const previousState = {
        status: meal.status,
        actualFoodLogId: meal.actualFoodLogId,
      };
      const command = new UpdatePlannedMealCommand(
        meal.id,
        mealName,
        { status: 'planned', actualFoodLogId: undefined },
        previousState
      );
      await executeCommand(command);
    } catch (error) {
      logger.error('MealItem', 'Failed to undo log', { error });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <li className="group/meal mb-1">
        <div className="flex items-center gap-1.5 p-2 bg-slate-100 border-2 border-indigo-400 rounded-md animate-in fade-in duration-200">
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                if (isEditing) void handleSave();
              }, 200);
            }}
            disabled={updateMealMutation.isPending}
            className="flex-1 min-w-0 px-2 py-1 text-sm border-0 bg-slate-50 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-100 disabled:opacity-50"
            placeholder="Meal name..."
          />
          <button
            type="button"
            onClick={(e) => {
              // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
              if (!e.metaKey && !e.ctrlKey) {
                e.stopPropagation();
              }
              void handleSave();
            }}
            disabled={!editedName.trim() || updateMealMutation.isPending}
            className="p-1 text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded transition-colors"
            title="Save (Enter)"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
              if (!e.metaKey && !e.ctrlKey) {
                e.stopPropagation();
              }
              handleCancel();
            }}
            disabled={updateMealMutation.isPending}
            className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </li>
    );
  }

  const isEaten = meal.status === 'eaten';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <li
      style={{ listStyle: 'none', background: 'transparent', border: 'none', margin: 0, padding: 0 }}
      draggable={!isEaten}
      onDragStart={(e) => {
        if (isEaten) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/meal-id', meal.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center gap-2 py-1" style={{ background: 'transparent', border: 'none' }}>
        {/* Checkbox for quick logging */}
        <div className="shrink-0 flex items-center">
          {isLogging ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : isEaten ? (
            <button
              type="button"
              onClick={(e) => {
                if (!e.metaKey && !e.ctrlKey) {
                  e.stopPropagation();
                }
                void handleUndoLog();
              }}
              className="w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center hover:bg-green-600 hover:border-green-600 transition-colors cursor-pointer"
              title="Click to undo"
            >
              <Check className="w-3 h-3 text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickLog}
              className="w-4 h-4 rounded border-2 border-slate-400 hover:border-green-500 hover:bg-green-500/20 transition-colors cursor-pointer"
              title="Click to mark as eaten"
            />
          )}
        </div>

        {/* Meal Name */}
        <span
          onClick={(e) => {
            if (isEaten || isRecipeMeal) return;
            if (!e.metaKey && !e.ctrlKey) {
              e.stopPropagation();
            }
            setIsEditing(true);
          }}
          className={`flex-1 min-w-0 text-left text-sm cursor-pointer ${isEaten ? 'line-through' : ''}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: isEaten ? '#16a34a' : '#e2e8f0'
          }}
          title={isEaten ? 'Meal logged' : isRecipeMeal ? 'Edit the recipe in Saved Recipes' : 'Click to edit'}
        >
          {mealName}
        </span>

        {/* Calories */}
        {calories && (
          <span
            className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0"
            title={`${calories} calories`}
          >
            <Flame className="w-3 h-3" />
            {calories}
          </span>
        )}

        {/* Swap button - Always visible when not eaten */}
        {!isEaten && (
          <button
            type="button"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.stopPropagation();
              }
              setShowSwapModal(true);
            }}
            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
            title="I ate something different"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Swap</span>
          </button>
        )}

        {/* Delete - Visible on hover */}
        {isHovered && (
          <button
            type="button"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.stopPropagation();
              }
              void handleDelete();
            }}
            className="shrink-0 p-1 text-slate-500 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Swap Meal Modal */}
      {showSwapModal && (
        <SwapMealModal
          meal={meal}
          recipe={recipe}
          onClose={() => setShowSwapModal(false)}
          onSuccess={() => {
            setShowSwapModal(false);
          }}
        />
      )}
    </li>
  );
};
