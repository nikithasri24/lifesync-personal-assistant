import React, { useState, useRef, useEffect } from 'react';
import { Flame, Pencil, Trash2, Check, X, RefreshCw } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { LogMealButton } from '../../../components/nutrition/LogMealButton';
import { useUpdatePlannedMealMutation, useDeletePlannedMealMutation } from '../../../hooks/useMealPlanningQuery';
import { SwapMealModal } from './SwapMealModal';

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
        <div className="flex items-center gap-1.5 p-2 bg-white border-2 border-indigo-400 rounded-md shadow-sm animate-in fade-in duration-200">
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
            className="flex-1 min-w-0 px-2 py-1 text-sm border-0 bg-slate-50 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-50"
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

  return (
    <li
      className="group/meal mb-1"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/meal-id', meal.id);
      }}
    >
      <div className="relative flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group-hover/meal:bg-slate-50">
        {/* Meal Name */}
        <button
          type="button"
          onClick={(e) => {
            // Prevent cell selection when clicking to edit
            if (!e.metaKey && !e.ctrlKey) {
              e.stopPropagation();
            }
            setIsEditing(true);
          }}
          className="flex-1 min-w-0 text-left group/name"
          title="Click to edit"
        >
          <span className="text-sm font-medium text-slate-800 group-hover/name:text-indigo-700 line-clamp-2 break-words">
            {mealName}
          </span>
        </button>

        {/* Calories - Always visible */}
        {calories && (
          <span className="text-[10px] font-medium text-orange-600 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 rounded shrink-0" title={`${calories} calories`}>
            <Flame className="w-2.5 h-2.5" />
            {calories}
          </span>
        )}

        {/* Actions - Always visible */}
        <div className="flex items-center gap-1 shrink-0">
          <LogMealButton meal={meal} recipe={recipe} compact />
          <button
            type="button"
            onClick={(e) => {
              // Allow Cmd/Ctrl+click to bubble up for multi-cell selection
              if (!e.metaKey && !e.ctrlKey) {
                e.stopPropagation();
              }
              setShowSwapModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
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
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete meal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
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
