import { useState, useMemo } from 'react';
import type { Recipe } from '../../types';
import { fetchYoutubeRecipe } from '../services/parsers/youtubeParser';
import { parseTextToRecipe } from '../services/parsers/textParser';
import { fetchClippedRecipe } from '../utils/recipeUtils';

/** Check if URL is a YouTube video */
function isYoutubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtu.be' ||
      parsed.hostname === 'm.youtube.com'
    );
  } catch {
    return false;
  }
}

export interface RecipeImportState {
  // Unified URL Import (auto-detects YouTube vs recipe site)
  importUrl: string;
  setImportUrl: (value: string) => void;
  isYoutube: boolean;
  lang: string;
  setLang: (value: string) => void;
  isImporting: boolean;
  importError: string | null;
  setImportError: (value: string | null) => void;
  importDraft: Omit<Recipe, 'id' | 'createdAt'> | null;
  importFromUrl: () => Promise<void>;
  clearImport: () => void;

  // Text Import
  textInput: string;
  setTextInput: (value: string) => void;
  textTitle: string;
  setTextTitle: (value: string) => void;
  textImageUrl: string;
  setTextImageUrl: (value: string) => void;
  isTextParsing: boolean;
  textError: string | null;
  setTextError: (value: string | null) => void;
  textDraft: Omit<Recipe, 'id' | 'createdAt'> | null;
  parseFromText: () => Promise<void>;
  clearTextImport: () => void;
}

export function useRecipeImport(): RecipeImportState {
  // Unified URL Import (handles both YouTube and recipe websites)
  const [importUrl, setImportUrl] = useState('');
  const [lang, setLang] = useState('en');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  // Text Import
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textImageUrl, setTextImageUrl] = useState('');
  const [isTextParsing, setIsTextParsing] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  // Auto-detect if current URL is YouTube
  const isYoutube = useMemo(() => isYoutubeUrl(importUrl.trim()), [importUrl]);

  /** Unified import - auto-detects YouTube vs recipe website */
  const importFromUrl = async (): Promise<void> => {
    const url = importUrl.trim();
    if (!url) return;

    setIsImporting(true);
    setImportError(null);

    try {
      let recipe: Omit<Recipe, 'id' | 'createdAt'>;

      if (isYoutubeUrl(url)) {
        // YouTube video - use transcript + AI extraction
        recipe = await fetchYoutubeRecipe(url, lang);
      } else {
        // Recipe website - use JSON-LD clipper
        recipe = await fetchClippedRecipe(url);
      }

      setImportDraft(recipe);
      setImportUrl('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to import recipe.';
      setImportError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const clearImport = (): void => {
    setImportDraft(null);
    setImportError(null);
  };

  const parseFromText = async (): Promise<void> => {
    if (!textInput.trim()) return;
    setIsTextParsing(true);
    setTextError(null);
    try {
      const draft = parseTextToRecipe(textInput.trim(), textTitle.trim());
      setTextDraft(draft);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to parse text.';
      setTextError(msg);
    } finally {
      setIsTextParsing(false);
    }
  };

  const clearTextImport = (): void => {
    setTextInput('');
    setTextTitle('');
    setTextImageUrl('');
    setTextError(null);
    setTextDraft(null);
  };

  return {
    // Unified URL Import
    importUrl,
    setImportUrl,
    isYoutube,
    lang,
    setLang,
    isImporting,
    importError,
    setImportError,
    importDraft,
    importFromUrl,
    clearImport,

    // Text Import
    textInput,
    setTextInput,
    textTitle,
    setTextTitle,
    textImageUrl,
    setTextImageUrl,
    isTextParsing,
    textError,
    setTextError,
    textDraft,
    parseFromText,
    clearTextImport,
  };
}
