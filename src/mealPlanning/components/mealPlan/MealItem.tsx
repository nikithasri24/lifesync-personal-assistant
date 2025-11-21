/**
 * MealItem Component
 * Displays a single planned meal with inline editing and actions
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChefHat, Trash2 } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import {
  useUpdatePlannedMealMutation,
  useDeletePlannedMealMutation,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useMealPlansQuery,
} from '../../hooks/useMealPlanningQuery';
import { useAppStore } from '../../../stores';
import { ensureDate } from '../../utils/mealPlanHelpers';
import { logger } from '../../../services/logger';

export interface MealItemProps {
  meal: PlannedMeal;
  recipes: Recipe[];
  onShowRecipeForm: (initialName: string, onSave: (recipe: Recipe) => void) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
}

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
  type: 'custom' | 'option' | 'recipe';
  count?: number;
}

/**
 * Score a text match for fuzzy search
 */
function scoreMatch(text: string, query: string): number {
  const lower = text.toLowerCase();
  if (lower === query) return 1000;
  if (lower.startsWith(query)) return 900;
  const words = lower.split(/\s+/);
  if (words.some(w => w.startsWith(query))) return 800;
  if (lower.includes(query)) return 700;

  // Fuzzy match
  let fuzzyScore = 0;
  let queryIdx = 0;
  for (let i = 0; i < lower.length && queryIdx < query.length; i++) {
    if (lower[i] === query[queryIdx]) {
      fuzzyScore += (100 - i);
      queryIdx++;
    }
  }
  if (queryIdx === query.length) return fuzzyScore;
  return 0;
}

export const MealItem: React.FC<MealItemProps> = ({
  meal,
  recipes,
  onShowRecipeForm,
  onShowSimpleEdit,
}) => {
  const { mealOptions } = useAppStore();
  const { data: mealPlans = [] } = useMealPlansQuery();
  const updatePlannedMealMutation = useUpdatePlannedMealMutation();
  const deletePlannedMealMutation = useDeletePlannedMealMutation();
  const createRecipeMutation = useCreateRecipeMutation();
  const updateRecipeMutation = useUpdateRecipeMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showList, setShowList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const recipe = recipes.find((item) => item.id === meal.recipeId);
  const displayName = recipe?.name ?? meal.customMeal ?? 'Meal';

  // Extract all historical custom meals from all meal plans
  const historicalMeals = useMemo(() => {
    const customMeals = new Map<string, { name: string; count: number; lastUsed: Date }>();

    mealPlans.forEach(plan => {
      plan.meals?.forEach(m => {
        if (m.customMeal && !m.recipeId) {
          const key = m.customMeal.toLowerCase();
          const existing = customMeals.get(key);
          const mealDate = ensureDate(m.date);

          if (existing) {
            existing.count++;
            if (mealDate > existing.lastUsed) {
              existing.lastUsed = mealDate;
            }
          } else {
            customMeals.set(key, {
              name: m.customMeal,
              count: 1,
              lastUsed: mealDate
            });
          }
        }
      });
    });

    return Array.from(customMeals.values())
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .map(item => ({ id: `__custom__:${item.name}`, name: item.name, count: item.count }));
  }, [mealPlans]);

  // Find matches based on edit value
  const matches = useMemo(() => {
    const q = editValue.trim().toLowerCase();

    if (!q) {
      return [];
    }

    const candidates: MatchCandidate[] = [];

    // Historical custom meals
    historicalMeals.forEach(item => {
      const score = scoreMatch(item.name, q);
      if (score > 0) {
        candidates.push({ id: `__custom__:${item.name}`, name: item.name, score, type: 'custom', count: item.count });
      }
    });

    // Meal options
    const opts = mealOptions[meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack'] || [];
    opts.forEach(name => {
      const score = scoreMatch(name, q);
      if (score > 0) {
        candidates.push({ id: `__opt__:${name}`, name, score, type: 'option' });
      }
    });

    // Recipes
    recipes.forEach(recipe => {
      const score = scoreMatch(recipe.name, q);
      if (score > 0) {
        candidates.push({ id: recipe.id!, name: recipe.name, score, type: 'recipe' });
      }
    });

    // Deduplicate by name (case-insensitive), keeping highest score
    const deduped = new Map<string, MatchCandidate>();
    candidates.forEach(candidate => {
      const key = candidate.name.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || candidate.score > existing.score) {
        deduped.set(key, candidate);
      }
    });

    return Array.from(deduped.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [editValue, recipes, mealOptions, meal.mealType, historicalMeals]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset selected index when edit value changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [editValue]);

  const startEdit = () => {
    setEditValue(displayName);
    setIsEditing(true);
    setShowList(true);
  };

  const saveEdit = async (newValue?: string) => {
    const trimmed = (newValue ?? editValue).trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    const originalName = meal.customMeal ?? recipe?.name ?? '';
    if (trimmed === originalName) {
      // No change
      setIsEditing(false);
      setShowList(false);
      return;
    }

    try {
      if (meal.recipeId) {
        // Convert recipe meal to custom meal
        await updatePlannedMealMutation.mutateAsync({
          mealId: meal.id,
          updates: {
            customMeal: trimmed,
            recipeId: undefined
          }
        });
      } else {
        // Update custom meal name
        await updatePlannedMealMutation.mutateAsync({
          mealId: meal.id,
          updates: { customMeal: trimmed }
        });
      }
    } catch (error) {
      logger.error('MealItem', 'Failed to update meal:', { error });
      // Revert on error
      setEditValue(originalName);
    }
    setIsEditing(false);
    setShowList(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowList(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        const selected = matches[selectedIndex];
        saveEdit(selected.name);
      } else {
        saveEdit();
      }
      setSelectedIndex(0);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleRecipeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (meal.recipeId && recipe) {
      onShowSimpleEdit(recipe, async (updates) => {
        await updateRecipeMutation.mutateAsync({ recipeId: recipe.id!, updates });
      });
    } else {
      onShowRecipeForm(meal.customMeal ?? '', async (recipeData) => {
        const newRecipe = await createRecipeMutation.mutateAsync(recipeData);
        if (newRecipe?.id) {
          await updatePlannedMealMutation.mutateAsync({
            mealId: meal.id,
            updates: { recipeId: newRecipe.id, customMeal: undefined }
          });
        }
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deletePlannedMealMutation.mutate(meal.id);
  };

  return (
    <li
      className={`group text-xs rounded border px-2 py-1 flex items-center justify-between gap-2 ${
        !isEditing
          ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer'
          : 'border-slate-200 bg-white'
      }`}
      draggable={!isEditing}
      onDoubleClick={(e) => {
        if (!isEditing) {
          e.preventDefault();
          e.stopPropagation();
          startEdit();
        }
      }}
      onDragStart={(e) => {
        if (!isEditing) {
          e.dataTransfer.setData('text/meal-id', meal.id);
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      title={meal.recipeId ? "Double-click or click pencil to edit (converts to custom meal), drag to move (hold Alt to copy)" : "Double-click to edit, drag to move (hold Alt to copy)"}
    >
      {isEditing ? (
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => { setEditValue(e.target.value); setShowList(true); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => saveEdit(), 200)}
            className="w-full bg-transparent border-none outline-none text-xs"
          />
          {showList && editValue.trim().length > 0 && inputRef.current && createPortal(
            <div className="fixed z-[100] min-w-[240px] max-w-[320px] rounded-lg border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5" style={{
              left: inputRef.current.getBoundingClientRect().left,
              top: inputRef.current.getBoundingClientRect().bottom + 4,
            }}>
              {matches.length === 0 ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-indigo-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => saveEdit(editValue.trim())}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-semibold text-indigo-700">+</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">Add "{editValue.trim()}"</div>
                    <div className="text-xs text-slate-500">Create new meal</div>
                  </div>
                </button>
              ) : (
                <div className="max-h-[280px] overflow-auto py-1">
                  {matches.map((r, idx) => {
                    const isSelected = idx === selectedIndex;
                    const isRecipe = r.type === 'recipe';
                    const isCustom = r.type === 'custom';
                    return (
                      <button
                        key={`${r.id}-${idx}`}
                        type="button"
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => saveEdit(r.name)}
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${
                          isRecipe ? 'bg-emerald-100 text-emerald-700' : isCustom ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isRecipe ? '📖' : isCustom ? '⭐' : '🍽️'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{r.name}</div>
                          <div className="text-xs text-slate-500">
                            {isRecipe ? 'Recipe' : isCustom ? `Used ${r.count || 1}x` : 'Meal option'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>,
            document.body
          )}
        </div>
      ) : (
        <span className="truncate flex-1" title={displayName}>
          {displayName}
        </span>
      )}
      {!isEditing && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRecipeClick}
            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
            aria-label={meal.recipeId ? "View recipe" : "Save as recipe"}
            title={meal.recipeId ? "View recipe" : "Save as recipe"}
          >
            <ChefHat className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Remove meal"
            title="Remove"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </li>
  );
};

export default MealItem;
