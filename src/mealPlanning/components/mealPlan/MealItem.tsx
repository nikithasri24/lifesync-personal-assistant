import React, { useState, useRef, useEffect } from 'react';
import { Flame, Pencil, Trash2, Check, X, RefreshCw, Undo2 } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { LogMealButton } from '../../../components/nutrition/LogMealButton';
import { useUpdatePlannedMealMutation, useDeletePlannedMealMutation } from '../../../hooks/useMealPlanningQuery';
import { SwapMealModal } from './SwapMealModal';

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

  // Get color based on meal type
  const mealType = meal.mealType as keyof typeof MEAL_TYPE_COLORS;
  const colors = MEAL_TYPE_COLORS[mealType] || MEAL_TYPE_COLORS.breakfast;

  // Debug: Log meal data if showing "Unnamed meal"
  if (mealName === 'Unnamed meal') {
    console.log('[MealItem] Unnamed meal detected:', {
      mealId: meal.id,
      recipeId: meal.recipeId,
      customMeal: meal.customMeal,
      customMealType: typeof meal.customMeal,
      customMealValue: JSON.stringify(meal.customMeal),
      hasRecipe: !!recipe,
      recipeName: recipe?.name,
      allMealKeys: Object.keys(meal),
      fullMeal: meal
    });
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(mealName);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMealMutation = useUpdatePlannedMealMutation();
  const deleteMealMutation = useDeletePlannedMealMutation();

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

    console.log('[MealItem] Saving meal:', {
      mealId: meal.id,
      oldName: mealName,
      newName: editedName.trim(),
      customMeal: meal.customMeal,
      recipeId: meal.recipeId,
    });

    try {
      await updateMealMutation.mutateAsync({
        mealId: meal.id,
        updates: { customMeal: editedName.trim() },
      });
      console.log('[MealItem] Meal updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('[MealItem] Failed to update meal:', error);
      setEditedName(mealName);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(mealName);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${mealName}"?`)) {
      try {
        await deleteMealMutation.mutateAsync(meal.id);
      } catch (error) {
        console.error('[MealItem] Failed to delete meal:', error);
      }
    }
  };

  const handleUndoLog = async () => {
    try {
      await updateMealMutation.mutateAsync({
        mealId: meal.id,
        updates: {
          status: 'planned',
          actualFoodLogId: undefined,
        },
      });
    } catch (error) {
      console.error('[MealItem] Failed to undo log:', error);
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

  return (
    <li
      className="group/meal mb-1"
      draggable={!isEaten}
      onDragStart={(e) => {
        if (isEaten) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('text/meal-id', meal.id);
      }}
    >
      <div className="relative flex items-center gap-2 py-1 px-1">
        {/* Meal Name */}
        <button
          type="button"
          onClick={(e) => {
            if (isEaten) return; // Don't allow editing eaten meals
            // Prevent cell selection when clicking to edit
            if (!e.metaKey && !e.ctrlKey) {
              e.stopPropagation();
            }
            setIsEditing(true);
          }}
          className="flex-1 min-w-0 text-left"
          title={isEaten ? 'Meal logged' : 'Click to edit'}
          disabled={isEaten}
        >
          <span className={`text-sm font-medium ${isEaten ? 'text-green-600 line-through' : 'text-slate-900'}`}>
            {mealName}
          </span>
        </button>

        {/* Calories - Always visible */}
        {calories && (
          <span className="text-xs font-medium flex items-center gap-1 shrink-0 text-slate-600" title={`${calories} calories`}>
            <Flame className="w-3 h-3" />
            {calories}
          </span>
        )}

        {/* Actions - Hidden when eaten */}
        {!isEaten && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/meal:opacity-100 transition-opacity">
            <LogMealButton meal={meal} recipe={recipe} compact className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" />
            <button
              type="button"
              onClick={(e) => {
                // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
                if (!e.metaKey && !e.ctrlKey) {
                  e.stopPropagation();
                }
                setShowSwapModal(true);
              }}
              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="Swap meal - Log what you actually ate"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
                if (!e.metaKey && !e.ctrlKey) {
                  e.stopPropagation();
                }
                void handleDelete();
              }}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete meal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Undo button - Shown when eaten, visible on hover */}
        {isEaten && (
          <button
            type="button"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey) {
                e.stopPropagation();
              }
              void handleUndoLog();
            }}
            className="shrink-0 p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-all opacity-0 group-hover/meal:opacity-100"
            title="Undo food log"
          >
            <Undo2 className="w-3.5 h-3.5" />
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
