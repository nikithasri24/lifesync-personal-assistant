import React from 'react';
import type { PlannedMeal, Recipe } from '../../../types';

interface MealItemProps {
  meal: PlannedMeal;
  recipes: Recipe[];
  onShowRecipeForm: (initialName: string, onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void) => void;
  onShowSimpleEdit: (recipe: Recipe, onSave: (updates: Partial<Recipe>) => void) => void;
}

export const MealItem: React.FC<MealItemProps> = ({ meal, recipes, onShowRecipeForm, onShowSimpleEdit }) => {
  const recipe = recipes.find(r => r.id === meal.recipeId);

  return (
    <li className="text-xs text-slate-700 dark:text-slate-300">
      {recipe?.name || meal.customMeal || 'Unnamed meal'}
    </li>
  );
};
