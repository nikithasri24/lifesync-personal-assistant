/**
 * YouTube Parser Service
 * Extracts recipe information from YouTube videos
 */

import type { Recipe } from '../../../types';
import { logger } from '../../../services/logger';

// TypeScript interfaces for API responses
interface YouTubeThumbnail {
  url?: string;
  width?: number;
  height?: number;
}

interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
}

interface YouTubeSnippet {
  title?: string;
  description?: string;
  channelTitle?: string;
  thumbnails?: YouTubeThumbnails;
}

interface YouTubeVideoData {
  items?: Array<{
    snippet?: YouTubeSnippet;
  }>;
}

interface TranscriptEntry {
  start: number;
  dur: number;
  text: string;
}

interface TranscriptResponse {
  transcript?: TranscriptEntry[];
}

interface AIExtractionResponse {
  name?: string;
  description?: string;
  ingredients?: Array<{ name: string }>;
  instructions?: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  cuisine?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
    const v = parsed.searchParams.get('v');
    if (v) return v;
    const match = url.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/);
    return match ? (match[1] || match[2]) ?? null : null;
  } catch {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  }
}

/**
 * Parse timecode (e.g., "1:30" or "[2:45]") to seconds
 */
export function parseTimecodeToSeconds(text: string): number | null {
  const bracket = text.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
  const plain = text.match(/(?<!\d)(\d{1,2}):(\d{2})(?::(\d{2}))?(?!\d)/);
  const match = bracket ?? plain;
  if (!match) return null;
  const h = match[3] ? Number(match[1]) : 0;
  const m = match[3] ? Number(match[2]) : Number(match[1]);
  const s = match[3] ? Number(match[3]) : Number(match[2]);
  if ([h, m, s].some((n) => Number.isNaN(n))) return null;
  return h * 3600 + m * 60 + s;
}

/**
 * Extract timestamped sections from video description
 */
export function extractFlowFromDescription(description: string): { titles: string[] } | null {
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const timecoded: Array<{ t: number; text: string }> = [];
  for (const line of lines) {
    const t = parseTimecodeToSeconds(line);
    if (t != null) {
      const text = line.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–—:]?\s*/i, '').trim();
      if (text) timecoded.push({ t, text });
    }
  }
  if (timecoded.length >= 2) {
    timecoded.sort((a, b) => a.t - b.t);
    return { titles: timecoded.map((e) => e.text) };
  }
  return null;
}

/**
 * Parse description text into ingredients and instructions
 */
export function parseDescriptionToLists(description: string): { ingredients: string[]; instructions: string[] } {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let inIngredients = false;
  let inInstructions = false;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/ingredient/.test(lower)) { inIngredients = true; inInstructions = false; continue; }
    if (/instruction|direction|method/.test(lower)) { inInstructions = true; inIngredients = false; continue; }
    if (inIngredients) ingredients.push(line.replace(/^[-*•]\s*/, ''));
    else if (inInstructions) instructions.push(line.replace(/^\d+\.|^[-*•]\s*/, ''));
  }
  // Fallback: if no explicit sections, try heuristics
  if (ingredients.length === 0) {
    const ingCandidates = lines.filter((l) => /\d|tsp|tbsp|cup|g|ml|kg|lb|oz|teaspoon|tablespoon|clove|slice|pinch/i.test(l));
    ingredients.push(...ingCandidates.slice(0, 12));
  }
  if (instructions.length === 0) {
    const flow = extractFlowFromDescription(description);
    if (flow?.titles?.length) instructions.push(...flow.titles);
  }
  return { ingredients, instructions };
}

/**
 * Normalize fraction characters
 */
export function normalizeFractions(text: string): string {
  return text
    .replace(/½/g, ' 1/2')
    .replace(/¼/g, ' 1/4')
    .replace(/¾/g, ' 3/4')
    .replace(/⅓/g, ' 1/3')
    .replace(/⅔/g, ' 2/3')
    .replace(/⅛/g, ' 1/8')
    .replace(/⅜/g, ' 3/8')
    .replace(/⅝/g, ' 5/8')
    .replace(/⅞/g, ' 7/8');
}

/**
 * Parse transcript into ingredients and instructions
 */
export function parseTranscriptToLists(transcript: Array<{ start: number; dur: number; text: string }>): { ingredients: Array<{ name: string }>; instructions: string[] } {
  const fillers = /\b(uh|um|erm|like|okay|ok|so|you know|i mean)\b/gi;
  const cleaned = transcript
    .map(t => normalizeFractions(t.text.replace(/\n/g, ' ')))
    .map(t => t.replace(fillers, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const full = cleaned.join(' ');
  const sentences = full.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);

  const unitRe = new RegExp(
    String.raw`(\b\d+(?:[\s-]?\d\/\d)?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b)\s*(?:x\s*)?(cup|cups|tsp|tbsp|teaspoon|tablespoon|g|gram|grams|kg|ml|l|liter|liters|ounce|ounces|oz|lb|pound|pounds|clove|cloves|slice|slices|pinch|dash|stick|sticks|can|cans|package|packages|bunch|bunches|head|heads|piece|pieces|quart|pint|sprig|sprigs)\b`,
    'i'
  );
  const ingredientsLex = /(salt|pepper|oil|olive oil|flour|sugar|egg|eggs|onion|garlic|butter|milk|water|tomato|tomatoes|cheese|chicken|beef|pork|rice|pasta|noodles|cilantro|coriander|cumin|turmeric|ginger|chili|chilli|carrot|potato|yogurt|cream|basil|oregano|thyme|paprika|vinegar|soy sauce|sauce)/i;
  const likelyIngredient = (s: string): boolean => unitRe.test(s) || ingredientsLex.test(s);
  const cookingVerb = /(add|mix|stir|whisk|heat|cook|bake|boil|simmer|fry|saute|sauté|blend|combine|pour|serve|marinate|season|preheat|chop|dice|slice|grate|peel|toast|roast|grill|stir-fry|reduce|simmer|fold)/i;

  const ingredientCandidates = sentences.filter(s => likelyIngredient(s));
  const ingredients = ingredientCandidates
    .slice(0, 24)
    .map(s => s.replace(/^[-*•]\s*/, ''))
    .map(s => ({ name: s }));

  const stepsRaw = sentences.filter(s => cookingVerb.test(s) && s.split(/\s+/).length >= 3);
  const merged: string[] = [];
  for (const s of stepsRaw) {
    if (merged.length === 0) { merged.push(s); continue; }
    const last = merged[merged.length - 1];
    if (s.split(/\s+/).length < 5) merged[merged.length - 1] = `${last} ${s}`;
    else merged.push(s);
  }
  const dedup = new Set<string>();
  const instructions: string[] = [];
  for (const s of merged) {
    const k = s.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!dedup.has(k)) { instructions.push(s); dedup.add(k); }
    if (instructions.length >= 18) break;
  }
  if (instructions.length === 0 && sentences.length) instructions.push(...sentences.slice(0, 6));
  return { ingredients, instructions };
}

/**
 * Fetch and parse YouTube video into recipe
 */
export async function fetchYoutubeRecipe(url: string, lang: string = 'en'): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const videoId = extractYoutubeId(url);
  if (!videoId) throw new Error('Unable to extract YouTube video ID.');
  const envProxyUrl = import.meta.env.VITE_YOUTUBE_SNIPPET_PROXY_URL as string | undefined;
  const proxyBaseUrl = (envProxyUrl?.trim() ?? '') || '/api/youtube/snippet';
  const apiUrl = `${proxyBaseUrl}${proxyBaseUrl.includes('?') ? '&' : '?'}videoId=${encodeURIComponent(videoId)}`;

  const [snippetResp, transcriptResp] = await Promise.all([
    fetch(apiUrl, { headers: { Accept: 'application/json' } }),
    fetch(`/api/youtube/transcript?videoId=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`, { headers: { Accept: 'application/json' } })
  ]);
  if (!snippetResp.ok) throw new Error('Failed to fetch video metadata.');
  const data = (await snippetResp.json()) as YouTubeVideoData;
  const snippet = data?.items?.[0]?.snippet;
  if (!snippet) throw new Error('Video metadata not available.');

  // Get transcript data
  let transcriptText = '';
  if (transcriptResp.ok) {
    const tr = (await transcriptResp.json()) as TranscriptResponse;
    const transcript = Array.isArray(tr.transcript) ? tr.transcript : [];
    transcriptText = transcript.map((t: TranscriptEntry) => t.text).join(' ');
  }

  // Try AI-powered extraction first
  try {
    const aiResp = await fetch('/api/youtube/extract-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: snippet.title ?? '',
        transcript: transcriptText,
        description: snippet.description ?? ''
      })
    });

    if (aiResp.ok) {
      const aiData = (await aiResp.json()) as AIExtractionResponse;
      // Merge AI results with video metadata
      const recipeName: string = aiData.name ?? snippet.title ?? 'YouTube Recipe';
      const recipeDescription: string = aiData.description ?? snippet.description?.split('\n')[0] ?? '';
      const recipeIngredients: Array<{ name: string }> = aiData.ingredients ?? [];
      const recipeInstructions: string[] = aiData.instructions ?? [];
      const recipePrepTime: number | undefined = aiData.prepTime;
      const recipeCookTime: number | undefined = aiData.cookTime;
      const recipeServings: number | undefined = aiData.servings;
      const recipeDifficulty: 'easy' | 'medium' | 'hard' | undefined = aiData.difficulty;
      const recipeTags: string[] = [...(aiData.tags ?? []), 'video', 'youtube', 'ai-extracted'];
      const recipeImage: string | undefined = snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? undefined;
      const recipeCuisine: string = aiData.cuisine ?? 'other';
      const recipeAuthorName: string | undefined = snippet.channelTitle;
      const recipeVideoThumbnail: string | undefined = snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url;

      return {
        name: recipeName,
        description: recipeDescription,
        ingredients: recipeIngredients,
        instructions: recipeInstructions,
        prepTime: recipePrepTime,
        cookTime: recipeCookTime,
        servings: recipeServings,
        difficulty: recipeDifficulty,
        tags: recipeTags,
        rating: undefined,
        notes: undefined,
        image: recipeImage,
        isFavorite: false,
        calories: undefined,
        cuisine: recipeCuisine,
        dietaryRestrictions: [],
        nutritionInfo: undefined,
        flowChart: undefined,
        sourceType: 'video',
        sourceUrl: url,
        authorName: recipeAuthorName,
        videoThumbnail: recipeVideoThumbnail,
      };
    }
  } catch (aiError) {
    logger.warn('YouTubeParser', 'AI extraction failed, falling back to regex parser:', { aiError });
  }

  // Fallback to original regex-based parsing
  let ingredients: { name: string }[] = [];
  let instructions: string[] = [];
  if (transcriptResp.ok) {
    const tr = (await transcriptResp.json()) as TranscriptResponse;
    const parsed = parseTranscriptToLists(Array.isArray(tr.transcript) ? tr.transcript : []);
    ingredients = parsed.ingredients;
    instructions = parsed.instructions;
  }
  // Fallbacks if transcript missing
  if (ingredients.length === 0 || instructions.length === 0) {
    const back = parseDescriptionToLists(snippet.description ?? '');
    if (ingredients.length === 0) ingredients = back.ingredients.map(s => ({ name: s }));
    if (instructions.length === 0) instructions = back.instructions;
  }
  if (ingredients.length === 0) ingredients = [{ name: 'Ingredient 1' }, { name: 'Ingredient 2' }];
  if (instructions.length === 0) instructions = [];

  const prepTime = Math.max(10, Math.min(30, ingredients.length * 2));
  const cookTime = Math.max(15, Math.min(45, instructions.length * 3));

  const fallbackName: string = snippet.title ?? 'YouTube Recipe';
  const fallbackDescription: string = snippet.description?.split('\n')[0] ?? '';
  const fallbackImage: string | undefined = snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? undefined;
  const fallbackAuthorName: string | undefined = snippet.channelTitle;
  const fallbackVideoThumbnail: string | undefined = snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url;

  return {
    name: fallbackName,
    description: fallbackDescription,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings: 4,
    difficulty: 'medium',
    tags: ['video', 'youtube'],
    rating: undefined,
    notes: undefined,
    image: fallbackImage,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
    flowChart: undefined,
    sourceType: 'video',
    sourceUrl: url,
    authorName: fallbackAuthorName,
    videoThumbnail: fallbackVideoThumbnail,
  };
}
