import React, { type ReactElement, useRef, useMemo, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on resize
  useEffect(() => {
    if (!parentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate columns based on container width (Tailwind breakpoints: sm=640px, lg=1024px)
  const columns = useMemo(() => {
    if (containerWidth >= 1024) return 3; // lg: 3 columns
    if (containerWidth >= 640) return 2; // sm: 2 columns
    return 1; // default: 1 column
  }, [containerWidth]);

  // Group recipes into rows
  const rows = useMemo(() => {
    const result: Recipe[][] = [];
    for (let i = 0; i < recipes.length; i += columns) {
      result.push(recipes.slice(i, i + columns));
    }
    return result;
  }, [recipes, columns]);

  // Only virtualize if we have many recipes (100+)
  const shouldVirtualize = recipes.length > 100;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 380, // Estimated height of RecipeCard (h-40 image + content padding)
    overscan: 2, // Render 2 extra rows above and below viewport
    enabled: shouldVirtualize,
  });

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
      ) : shouldVirtualize ? (
        <div
          ref={parentRef}
          className="mt-4 overflow-y-auto"
          style={{ height: '600px' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {row.map((r) => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        onView={() => onViewRecipe(r.id)}
                        onEdit={() => onEditRecipe(r.id)}
                        onDelete={() => onDeleteRecipe(r.id)}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
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
