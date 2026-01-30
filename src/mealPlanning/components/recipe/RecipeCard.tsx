/**
 * Recipe Card Component
 *
 * Displays a recipe with image, metadata, tags, and action buttons
 */

import React from 'react';
import { Clock, Users, Heart, Pencil, Trash2, ChefHat, ExternalLink } from 'lucide-react';
import type { Recipe } from '../../../types';
import { useUndoRedo } from '../../../contexts/UndoRedoContext';
import { UpdateRecipeCommand } from '../../../commands/MealPlanningCommands';

export interface RecipeCardProps {
  recipe: Recipe;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Extract domain from URL (e.g., "https://www.example.com/recipe" -> "example.com")
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function RecipeCard({ recipe, onView, onEdit, onDelete }: RecipeCardProps) {
  const { executeCommand } = useUndoRedo();

  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const displayTags = recipe.tags?.slice(0, 3) ?? [];
  const remainingTagsCount = (recipe.tags?.length ?? 0) - 3;

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recipe.id) return;

    try {
      const command = new UpdateRecipeCommand(
        recipe.id,
        recipe.name,
        { isFavorite: !recipe.isFavorite },
        { isFavorite: recipe.isFavorite }
      );
      await executeCommand(command);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCardClick = () => {
    if (onView) {
      onView();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <li
      className="group relative bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
      role="listitem"
    >
      {/* Image or Gradient Fallback */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-16 h-16 text-white opacity-50" />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 ${
            recipe.isFavorite
              ? 'bg-pink-500 text-white hover:bg-pink-600'
              : 'bg-white text-slate-400 hover:text-pink-500 hover:bg-pink-50'
          }`}
        >
          <Heart
            className={`w-4 h-4 ${recipe.isFavorite ? 'fill-current' : ''}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 text-lg mb-1 line-clamp-1">
          {recipe.name}
        </h3>

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-600">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{recipe.servings}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {remainingTagsCount > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                +{remainingTagsCount}
              </span>
            )}
          </div>
        )}

        {/* Source URL */}
        {recipe.sourceUrl && (
          <div className="mb-3">
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleSourceClick}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {extractDomain(recipe.sourceUrl)}
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          {onEdit && (
            <button
              onClick={handleEditClick}
              aria-label="Edit recipe"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDeleteClick}
              aria-label="Delete recipe"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default RecipeCard;
