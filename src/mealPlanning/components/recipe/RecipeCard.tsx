/**
 * RecipeCard Component
 * Displays a recipe in a card format with image, metadata, and actions
 */

import React, { useMemo } from 'react';
import { ChefHat, Clock, Users, Heart, Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { Recipe } from '../../../types';
import { useUpdateRecipeMutation } from '../../hooks/useMealPlanningQuery';
import { logger } from '../../../services/logger';

export interface RecipeCardProps {
  recipe: Recipe;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onView,
  onEdit,
  onDelete,
}) => {
  const updateRecipeMutation = useUpdateRecipeMutation();
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const domain = useMemo(() => {
    try {
      return recipe.sourceUrl ? new URL(recipe.sourceUrl).hostname.replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  }, [recipe.sourceUrl]);

  const favicon = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}` : '';

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recipe.id) return;
    try {
      await updateRecipeMutation.mutateAsync({
        recipeId: recipe.id,
        updates: { isFavorite: !recipe.isFavorite }
      });
    } catch (error) {
      logger.error('RecipeCard', 'Failed to toggle favorite:', { error });
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <li
      onClick={onView}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200 cursor-pointer flex flex-col"
    >
      {/* Image Section */}
      <div className="relative w-full h-[180px] overflow-hidden flex-shrink-0">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
            <ChefHat className="h-12 w-12 text-white/80" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        {/* Recipe Name & Meta */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-center gap-2">
            {favicon && <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />}
            <p className="line-clamp-2 text-base md:text-lg font-semibold tracking-tight text-white drop-shadow">
              {recipe.name}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-slate-200">
              {domain && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm hover:bg-black/50"
                  title={domain}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{domain}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-200">
              {totalTime > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm">
                  <Clock className="h-3 w-3" /> {totalTime} min
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm">
                <Users className="h-3 w-3" /> {recipe.servings || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute right-2 top-2 flex gap-2 z-10">
          <button
            type="button"
            onClick={toggleFavorite}
            className={`rounded-md p-1.5 shadow-lg border transition ${
              recipe.isFavorite
                ? 'bg-pink-500 text-white hover:bg-pink-600 border-pink-500'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
            title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleEdit}
            className="rounded-md bg-white p-1.5 text-slate-700 hover:bg-slate-100 shadow-lg border border-slate-200"
            title="Edit recipe"
            aria-label="Edit recipe"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
            title="Delete recipe"
            aria-label="Delete recipe"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Description Section */}
      {recipe.description && (
        <div className="p-3 flex-1 flex flex-col">
          <p className="text-xs text-slate-600 line-clamp-2">
            {recipe.description}
          </p>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                >
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default RecipeCard;
