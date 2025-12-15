/**
 * Recipe Card Component
 *
 * Note: This is a stub implementation. Full implementation pending.
 */

import React from 'react';
import type { Recipe } from '../../../types';

export interface RecipeCardProps {
  recipe: Recipe;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function RecipeCard({ recipe, onView, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="p-4 border rounded hover:bg-gray-50">
      <h3 className="font-semibold">{recipe.name}</h3>
      <p className="text-sm text-gray-600">Recipe card not implemented</p>
      <div className="mt-2 flex gap-2">
        {onView && (
          <button onClick={onView} className="text-xs text-blue-600 hover:underline">
            View
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} className="text-xs text-blue-600 hover:underline">
            Edit
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-xs text-red-600 hover:underline">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default RecipeCard;
