import React from 'react';
import { Flame } from 'lucide-react';
import type { PlannedMeal, Recipe } from '../../../types';
import { LogMealButton } from '../../../components/nutrition/LogMealButton';

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

  return (
    <li
      className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1 group/meal py-0.5"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/meal-id', meal.id);
      }}
    >
      <span className="truncate flex-1" title={mealName}>{mealName}</span>
      <div className="flex items-center gap-1.5 opacity-0 group-hover/meal:opacity-100 transition-opacity">
        {calories && (
          <span className="text-[10px] text-orange-600 flex items-center gap-0.5" title={`${calories} calories`}>
            <Flame className="w-2.5 h-2.5" />
            {calories}
          </span>
        )}
        <LogMealButton meal={meal} recipe={recipe} compact />
      </div>
    </li>
  );
};
