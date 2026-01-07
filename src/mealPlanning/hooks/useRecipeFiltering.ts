import { useMemo, useState, useCallback } from 'react';
import type { Recipe } from '../../types';

export interface UseRecipeFilteringReturn {
  searchQuery: string;
  showFavoritesOnly: boolean;
  filteredRecipes: Recipe[];
  setSearchQuery: (query: string) => void;
  toggleFavoritesOnly: () => void;
  clearFilters: () => void;
}

/**
 * Hook for filtering recipes by search query and favorites
 */
export function useRecipeFiltering(recipes: Recipe[]): UseRecipeFilteringReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((recipe) => recipe.isFavorite === true);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((recipe) => {
        if (recipe.name.toLowerCase().includes(query)) return true;
        if (recipe.tags?.some((tag: string) => tag.toLowerCase().includes(query))) return true;
        if (recipe.cuisine?.toLowerCase().includes(query)) return true;
        if (recipe.difficulty?.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    return result;
  }, [recipes, searchQuery, showFavoritesOnly]);

  const toggleFavoritesOnly = useCallback(() => {
    setShowFavoritesOnly(prev => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setShowFavoritesOnly(false);
  }, []);

  return {
    searchQuery,
    showFavoritesOnly,
    filteredRecipes,
    setSearchQuery,
    toggleFavoritesOnly,
    clearFilters,
  };
}
