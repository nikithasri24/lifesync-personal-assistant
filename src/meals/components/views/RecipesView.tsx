/**
 * Recipes View Component
 * Recipe library with search and favorites
 */

import React, { useState } from 'react';
import { Search, Heart, Plus, Edit, Trash } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { Recipe } from '../../../types';
import { PaginationV2 } from '../../../components/ui/PaginationV2';

const RECIPES_PAGE_SIZE = 25;

interface RecipesViewProps {
  recipes: Recipe[];
  searchQuery: string;
  showFavoritesOnly: boolean;
  onSearchChange: (query: string) => void;
  onToggleFavorites: () => void;
  onViewRecipe: (recipeId: string) => void;
  onEditRecipe: (recipeId: string) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onAddRecipe: () => void;
}

export function RecipesView({
  recipes,
  searchQuery,
  showFavoritesOnly,
  onSearchChange,
  onToggleFavorites,
  onViewRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onAddRecipe,
}: RecipesViewProps) {
  const colors = useThemeColors();
  const [page, setPage] = useState(1);

  // Reset to page 1 when search/favorites filter changes
  React.useEffect(() => { setPage(1); }, [searchQuery, showFavoritesOnly]);

  const totalPages = Math.ceil(recipes.length / RECIPES_PAGE_SIZE);
  const pagedRecipes = recipes.slice((page - 1) * RECIPES_PAGE_SIZE, page * RECIPES_PAGE_SIZE);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Search Bar */}
      <div className="px-6 pt-4 pb-3">
        <div className="relative">
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.text.tertiary,
            }}
          />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            style={{
              backgroundColor: colors.bg.white,
              color: colors.text.primary,
              border: `1px solid ${colors.border.light}`,
            }}
          />
        </div>
      </div>

      {/* Stats and Filter */}
      <div className="px-6 pb-4 flex items-center justify-between">
        <p style={{ fontSize: '14px', color: colors.text.tertiary }}>
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </p>

        <button
          type="button"
          onClick={onToggleFavorites}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: showFavoritesOnly ? colors.badge.bg : 'transparent',
            color: showFavoritesOnly ? colors.accent.start : colors.text.secondary,
          }}
        >
          <Heart size={16} fill={showFavoritesOnly ? colors.accent.start : 'none'} />
          <span className="text-sm font-medium">Favorites</span>
        </button>
      </div>

      {/* Recipes Grid */}
      <div className="px-6">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
              {searchQuery || showFavoritesOnly ? 'No recipes found' : 'No recipes yet'}
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: colors.text.tertiary }}>
              {searchQuery || showFavoritesOnly
                ? 'Try adjusting your search or filters'
                : 'Add your first recipe to get started'}
            </p>
            {!searchQuery && !showFavoritesOnly && (
              <button
                type="button"
                onClick={onAddRecipe}
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: 'white',
                }}
              >
                Add Recipe
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-98"
                style={{
                  backgroundColor: colors.bg.white,
                  boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
                }}
                onClick={() => onViewRecipe(recipe.id)}
              >
                {/* Recipe Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-base flex-1 mr-2" style={{ color: colors.text.primary }}>
                      {recipe.name}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle favorite (would need to add this mutation)
                      }}
                      className="p-1"
                      aria-label="Toggle favorite"
                    >
                      <Heart
                        size={18}
                        style={{ color: colors.accent.start }}
                        fill={recipe.isFavorite ? colors.accent.start : 'none'}
                      />
                    </button>
                  </div>

                  {/* Recipe Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    {recipe.cuisine && (
                      <span
                        className="text-xs px-2 py-1 rounded-md"
                        style={{
                          backgroundColor: colors.badge.bg,
                          color: colors.badge.text,
                        }}
                      >
                        {recipe.cuisine}
                      </span>
                    )}
                    {recipe.difficulty && (
                      <span className="text-xs" style={{ color: colors.text.tertiary }}>
                        {recipe.difficulty}
                      </span>
                    )}
                  </div>

                  {/* Time and Calories */}
                  <div className="flex items-center gap-4 text-xs" style={{ color: colors.text.tertiary }}>
                    {recipe.prepTime && <span>Prep: {recipe.prepTime}m</span>}
                    {recipe.cookTime && <span>Cook: {recipe.cookTime}m</span>}
                    {recipe.nutritionInfo?.calories && (
                      <span className="font-medium" style={{ color: colors.accent.end }}>
                        {recipe.nutritionInfo.calories} cal
                      </span>
                    )}
                  </div>
                </div>

                {/* Recipe Actions */}
                <div
                  className="flex items-center border-t"
                  style={{
                    backgroundColor: colors.bg.primary,
                    borderColor: colors.border.light,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRecipe(recipe.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors duration-200"
                    style={{ color: colors.text.secondary }}
                    aria-label="Edit recipe"
                  >
                    <Edit size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <div
                    style={{
                      width: '1px',
                      height: '20px',
                      backgroundColor: colors.border.light,
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecipe(recipe.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 transition-colors duration-200"
                    style={{ color: '#EF4444' }}
                    aria-label="Delete recipe"
                  >
                    <Trash size={16} />
                    <span className="text-sm font-medium">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 pb-4">
          <PaginationV2
            currentPage={page}
            totalPages={totalPages}
            totalItems={recipes.length}
            pageSize={RECIPES_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* FAB for adding recipe */}
      <button
        type="button"
        onClick={onAddRecipe}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
          boxShadow: '0 4px 16px rgba(212, 165, 116, 0.35)',
          color: 'white',
        }}
        aria-label="Add recipe"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
