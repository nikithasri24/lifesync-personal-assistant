import React, { type ReactElement } from 'react';
import { Heart, Search, X } from 'lucide-react';
import { logger } from '../../../services/logger';
import type { Recipe } from '../../../types';
import RecipeCard from '../recipe/RecipeCard';

interface SavedRecipesSectionProps {
  recipes: Recipe[];
  allRecipesCount: number;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDeleteAll: () => Promise<unknown>;
  onViewRecipe: (id: string) => void;
  onEditRecipe: (id: string) => void;
  onDeleteRecipe: (id: string) => void;
}

/**
 * Saved recipes section with search and filtering
 */
export function SavedRecipesSection({
  recipes,
  allRecipesCount,
  showFavoritesOnly,
  onToggleFavorites,
  searchQuery,
  onSearchChange,
  onDeleteAll,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
}: SavedRecipesSectionProps): ReactElement {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Saved recipes</h2>
        <div className="flex items-center gap-2">
          {allRecipesCount > 0 && (
            <>
              <button
                type="button"
                onClick={onToggleFavorites}
                className={`text-xs rounded-md px-3 py-1 transition ${
                  showFavoritesOnly
                    ? 'bg-pink-600 text-white hover:bg-pink-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={showFavoritesOnly ? 'Show all recipes' : 'Show favorites only'}
              >
                <Heart className={`inline h-3 w-3 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                {showFavoritesOnly ? 'Favorites' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => {
                  // eslint-disable-next-line no-alert
                  if (window.confirm('Delete ALL saved recipes? This cannot be undone.')) {
                    void onDeleteAll().catch((e: unknown) => {
                      logger.error('MealPlanning', e as Error);
                    });
                  }
                }}
                className="text-xs rounded-md px-3 py-1 bg-rose-600 text-white hover:bg-rose-500"
                title="Delete all saved recipes"
              >
                Delete all
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {allRecipesCount === 0
          ? 'Your clipped recipes.'
          : `${recipes.length} of ${allRecipesCount} recipes${showFavoritesOnly ? ' (favorites)' : ''}`}
      </p>

      {allRecipesCount > 0 && (
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search recipes by name, tags, cuisine, or difficulty..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {allRecipesCount === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          Clip a recipe above to get started.
        </div>
      ) : recipes.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No recipes match your search. Try different keywords.
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onView={() => onViewRecipe(r.id)}
              onEdit={() => onEditRecipe(r.id)}
              onDelete={() => onDeleteRecipe(r.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
