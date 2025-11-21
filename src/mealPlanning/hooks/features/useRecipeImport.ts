/**
 * useRecipeImport Hook
 * Handles importing recipes from various sources (YouTube, URL, text)
 */

import { useState } from 'react';
import type { Recipe } from '../../../types';
import { fetchYoutubeRecipe } from '../../services/parsers/youtubeParser';
import { parseTextToRecipe } from '../../services/parsers/textParser';
import { logger } from '../../../services/logger';

export interface RecipeImportState {
  isImporting: boolean;
  error: string | null;
  draft: Omit<Recipe, 'id' | 'createdAt'> | null;
}

export interface RecipeImportActions {
  importFromVideo: (url: string, lang?: string) => Promise<void>;
  importFromText: (text: string, title?: string) => Promise<void>;
  importFromUrl: (url: string) => Promise<void>;
  clearDraft: () => void;
  clearError: () => void;
}

export type UseRecipeImportReturn = RecipeImportState & RecipeImportActions;

/**
 * Hook for importing recipes from various sources
 */
export function useRecipeImport(): UseRecipeImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  /**
   * Import recipe from YouTube video
   */
  const importFromVideo = async (url: string, lang: string = 'en'): Promise<void> => {
    try {
      setIsImporting(true);
      setError(null);

      const recipe = await fetchYoutubeRecipe(url, lang);
      setDraft(recipe);

      logger.info('RecipeImport', 'Successfully imported recipe from YouTube:', { url });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import from video';
      setError(errorMessage);
      logger.error('RecipeImport', 'Failed to import from YouTube:', { error: err });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Import recipe from pasted text
   */
  const importFromText = async (text: string, title?: string): Promise<void> => {
    try {
      setIsImporting(true);
      setError(null);

      const recipe = parseTextToRecipe(text, title);
      setDraft(recipe);

      logger.info('RecipeImport', 'Successfully parsed recipe from text');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse text';
      setError(errorMessage);
      logger.error('RecipeImport', 'Failed to parse text:', { error: err });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Import recipe from URL (website scraping)
   * TODO: Implement website scraping service
   */
  const importFromUrl = async (url: string): Promise<void> => {
    try {
      setIsImporting(true);
      setError(null);

      // For now, use a simple fetch approach
      // In the future, this can use a dedicated scraping service
      const response = await fetch(`/api/recipe/scrape?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipe from URL');
      }

      const recipe = await response.json();
      setDraft(recipe);

      logger.info('RecipeImport', 'Successfully imported recipe from URL:', { url });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import from URL';
      setError(errorMessage);
      logger.error('RecipeImport', 'Failed to import from URL:', { error: err });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Clear the current draft
   */
  const clearDraft = (): void => {
    setDraft(null);
    setError(null);
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setError(null);
  };

  return {
    // State
    isImporting,
    error,
    draft,

    // Actions
    importFromVideo,
    importFromText,
    importFromUrl,
    clearDraft,
    clearError,
  };
}
