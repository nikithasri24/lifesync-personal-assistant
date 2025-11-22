import { useState } from 'react';
import type { Recipe } from '../../types';
import { fetchYoutubeRecipe } from '../services/parsers/youtubeParser';
import { parseTextToRecipe } from '../services/parsers/textParser';

export function useRecipeImport() {
  // URL Import
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  // Video Import (YouTube)
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLang, setVideoLang] = useState('en');
  const [isVideoImporting, setIsVideoImporting] = useState(false);
  const [videoImportError, setVideoImportError] = useState<string | null>(null);
  const [videoDraft, setVideoDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  // Text Import
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textImageUrl, setTextImageUrl] = useState('');
  const [isTextParsing, setIsTextParsing] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  const importFromVideo = async () => {
    if (!videoUrl.trim()) return;
    setIsVideoImporting(true);
    setVideoImportError(null);
    try {
      const recipe = await fetchYoutubeRecipe(videoUrl.trim(), videoLang);
      setVideoDraft(recipe);
      setVideoUrl('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to import from video.';
      setVideoImportError(msg);
    } finally {
      setIsVideoImporting(false);
    }
  };

  const parseFromText = async () => {
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

  const clearTextImport = () => {
    setTextInput('');
    setTextTitle('');
    setTextImageUrl('');
    setTextError(null);
    setTextDraft(null);
  };

  const clearVideoImport = () => {
    setVideoDraft(null);
  };

  const clearUrlImport = () => {
    setImportDraft(null);
  };

  return {
    // URL Import
    importUrl,
    setImportUrl,
    isImporting,
    setIsImporting,
    importError,
    setImportError,
    importDraft,
    setImportDraft,
    clearUrlImport,

    // Video Import
    videoUrl,
    setVideoUrl,
    videoLang,
    setVideoLang,
    isVideoImporting,
    videoImportError,
    videoDraft,
    importFromVideo,
    clearVideoImport,

    // Text Import
    textInput,
    setTextInput,
    textTitle,
    setTextTitle,
    textImageUrl,
    setTextImageUrl,
    isTextParsing,
    textError,
    textDraft,
    parseFromText,
    clearTextImport,
  };
}
