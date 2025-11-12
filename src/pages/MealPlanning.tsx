import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FormEvent } from 'react';
import { addDays, format, isSameWeek, startOfWeek, isSameDay } from 'date-fns';
import { CalendarDays, ChefHat, Loader2, Plus, Trash2, Save, Pencil, ExternalLink, Heart, Clock, Users, Youtube, Search, X } from 'lucide-react';
import DatePickerPopover from '../components/DatePickerPopover';
import { useAppStore } from '../stores/useAppStore';
import type { MealPlanWeek, PlannedMeal, Recipe } from '../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');
const ensureDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

// Cleanup old meal drafts from localStorage (older than 7 days)
const cleanupOldDrafts = () => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('meal-draft-')) {
        // Extract date from key: "meal-draft-2025-01-14-breakfast"
        const match = key.match(/meal-draft-(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const draftDate = new Date(match[1]);
          if (draftDate < sevenDaysAgo) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old meal drafts`);
    }
  } catch (error) {
    console.error('Failed to cleanup old drafts:', error);
  }
};

// ==== Video → Recipe helpers (YouTube) ====
function extractYoutubeId(url: string): string | null {
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

function parseTimecodeToSeconds(text: string): number | null {
  const bracket = text.match(/\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/);
  const plain = text.match(/(?<!\d)(\d{1,2}):(\d{2})(?::(\d{2}))?(?!\d)/);
  const match = bracket || plain;
  if (!match) return null;
  const h = match[3] ? Number(match[1]) : 0;
  const m = match[3] ? Number(match[2]) : Number(match[1]);
  const s = match[3] ? Number(match[3]) : Number(match[2]);
  if ([h, m, s].some((n) => Number.isNaN(n))) return null;
  return h * 3600 + m * 60 + s;
}

function extractFlowFromDescription(description: string): { titles: string[] } | null {
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

function parseDescriptionToLists(description: string) {
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

function parseTextToRecipe(text: string, title?: string): Omit<Recipe, 'id' | 'createdAt'> {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => l.trim()).filter(Boolean);
  // Detect sections
  const idxIng = lines.findIndex(l => /^ingredients?\b/i.test(l));
  const idxEqp = lines.findIndex(l => /^(equipment|tools?)\b/i.test(l));
  const idxTip = lines.findIndex(l => /^tips?\b|^notes?\b/i.test(l));
  const idxDir = lines.findIndex(l => /^(directions?|instructions?|method)\b/i.test(l));
  let ingredients: string[] = [];
  let equipment: string[] = [];
  let tips: string[] = [];
  let instructions: string[] = [];
  const endOf = (...idx: number[]) => {
    const positive = idx.filter(i => i !== -1).sort((a,b)=>a-b);
    return (start: number) => positive.find(i => i > start) ?? lines.length;
  };
  if (idxIng !== -1 || idxDir !== -1 || idxEqp !== -1 || idxTip !== -1) {
    const nextAfter = endOf(idxIng, idxDir, idxEqp, idxTip);
    if (idxIng !== -1) ingredients = lines.slice(idxIng + 1, nextAfter(idxIng));
    if (idxDir !== -1) instructions = lines.slice(idxDir + 1, nextAfter(idxDir));
    if (idxEqp !== -1) equipment = lines.slice(idxEqp + 1, nextAfter(idxEqp));
    if (idxTip !== -1) tips = lines.slice(idxTip + 1, nextAfter(idxTip));
  }
  // Try to pull servings from headings like "Ingredients (for ~2–3 servings)"
  let inferredServings: number | undefined;
  const servingsRe = /for\s*~?\s*(\d+)(?:\s*[–-]\s*|\s*to\s*)(\d+)\s*servings?|for\s*(\d+)\s*servings?/i;
  for (const l of lines.slice(Math.max(0, idxIng - 2), Math.min(lines.length, idxIng + 3))) {
    const m = l.match(servingsRe);
    if (m) {
      if (m[1] && m[2]) {
        const a = parseInt(m[1], 10); const b = parseInt(m[2], 10);
        inferredServings = Math.max(a, b);
      } else if (m[3]) {
        inferredServings = parseInt(m[3], 10);
      }
      break;
    }
  }

  // Helper: parse markdown ingredient tables within the ingredient section
  const parseMarkdownTable = (rows: string[]): Array<{ name: string; amount?: string }> => {
    const out: Array<{ name: string; amount?: string }> = [];
    let i = 0;
    while (i < rows.length) {
      if (!/^\|/.test(rows[i])) { i++; continue; }
      // collect contiguous table block
      const block: string[] = [];
      while (i < rows.length && /^\|.*\|$/.test(rows[i])) { block.push(rows[i]); i++; }
      if (block.length < 2) continue;
      const cells = (r: string) => r.split('|').slice(1, -1).map(c => c.trim());
      const header = cells(block[0]);
      const sep = block[1];
      if (!/^-/.test(sep.replace(/\|/g, '').trim())) {
        // no separator, treat as simple rows with 2 columns fallback
      }
      const idxName = header.findIndex(h => /ingredient/i.test(h));
      const idxAmt = header.findIndex(h => /amount|notes/i.test(h));
      for (let j = 1; j < block.length; j++) {
        const row = cells(block[j]);
        if (!row.length) continue;
        if (row.every(col => /^-+$/.test(col))) continue; // separator
        const name = (idxName !== -1 ? row[idxName] : row[0] || '').trim();
        const amount = (idxAmt !== -1 ? row[idxAmt] : row[1] || '').trim();
        if (name) out.push({ name, amount: amount || undefined });
      }
    }
    return out;
  };

  // Extract table-based ingredients, if any
  let tableIngs: Array<{ name: string; amount?: string }> = [];
  if (ingredients.length) {
    tableIngs = parseMarkdownTable(ingredients.filter(l => l));
  }
  // Heuristics if headings are missing
  if (ingredients.length === 0 || instructions.length === 0) {
    const joined = lines.join('\n');
    const parsed = parseDescriptionToLists(joined);
    if (ingredients.length === 0) ingredients = parsed.ingredients;
    if (instructions.length === 0) instructions = parsed.instructions;
  }
  // Final normalization + ingredient structuring
  const unitList = ['cup','cups','tsp','tbsp','teaspoon','tablespoon','g','gram','grams','kg','ml','l','liter','liters','ounce','ounces','oz','lb','pound','pounds','clove','cloves','slice','slices','pinch','dash','stick','sticks','can','cans','package','packages','bunch','bunches','head','heads','piece','pieces','quart','pint','sprig','sprigs'];
  const unitRe = new RegExp(`^((?:\\d+(?:[\\s-]\\d/\\d)?|\\d+/\\d+|\\d+(?:\\.\\d+)?)(?:\\s*x)?)?\\s*(?:(${unitList.join('|')}))?\\s*(.*)$`, 'i');
  const cleanBullet = (s: string) => s.replace(/^[-*•]\s*/, '').trim();
  const lineIngs = ingredients
    .filter(l => !/^\|/.test(l)) // skip table rows, already parsed
    .map(cleanBullet)
    .filter(Boolean)
    .slice(0, 100)
    .map(raw => {
      const m = raw.match(unitRe);
      if (!m) return { name: raw };
      const amount = (m[1] || '').trim();
      const unit = (m[2] || '').trim();
      const name = (m[3] || raw).trim();
      return { name, amount: amount || undefined, unit: unit || undefined };
    });
  const ingOut = [
    ...tableIngs.map(t => ({ name: t.name, amount: t.amount })),
    ...lineIngs,
  ].slice(0, 100);
  const stepsOut = instructions
    .map(s => s.replace(/^\d+\.|^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 50);

  // Basic time estimates
  const prepTime = Math.max(5, Math.min(30, ingOut.length * 2));
  const cookTime = Math.max(10, Math.min(60, stepsOut.length * 3));

  // Equipment tags + tips
  const equipTags = equipment
    .map(cleanBullet)
    .filter(Boolean)
    .slice(0, 30)
    .map(t => `equip:${t.toLowerCase()}`);
  const notes = tips.map(cleanBullet).join('\n');

  // Build description from the first paragraph before any heading or rule
  let description = '';
  {
    const firstParaLines: string[] = [];
    for (const r of rawLines) {
      if (/^\s*#/.test(r) || /^\s*---/.test(r)) break;
      if (r.trim().length === 0 && firstParaLines.length > 0) break;
      if (r.trim().length > 0) firstParaLines.push(r.trim());
    }
    description = firstParaLines.join(' ').trim();
  }

  return {
    name: title || (lines[0] || 'Pasted Recipe'),
    description,
    ingredients: ingOut,
    instructions: stepsOut,
    prepTime,
    cookTime,
    servings: inferredServings ?? 2,
    difficulty: 'medium',
    tags: ['pasted', ...equipTags],
    rating: undefined,
    notes: notes || undefined,
    image: undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
    flowChart: undefined,
    sourceType: 'manual',
    sourceUrl: undefined,
    authorName: undefined,
    videoThumbnail: undefined,
  };
}

function normalizeFractions(text: string): string {
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

function parseTranscriptToLists(transcript: Array<{ start: number; dur: number; text: string }>) {
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
  const likelyIngredient = (s: string) => unitRe.test(s) || ingredientsLex.test(s);
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

async function fetchYoutubeRecipe(url: string, lang: string = 'en'): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const videoId = extractYoutubeId(url);
  if (!videoId) throw new Error('Unable to extract YouTube video ID.');
  const proxyBaseUrl = import.meta.env.VITE_YOUTUBE_SNIPPET_PROXY_URL?.trim() || '/api/youtube/snippet';
  const apiUrl = `${proxyBaseUrl}${proxyBaseUrl.includes('?') ? '&' : '?'}videoId=${encodeURIComponent(videoId)}`;

  const [snippetResp, transcriptResp] = await Promise.all([
    fetch(apiUrl, { headers: { Accept: 'application/json' } }),
    fetch(`/api/youtube/transcript?videoId=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}`, { headers: { Accept: 'application/json' } })
  ]);
  if (!snippetResp.ok) throw new Error('Failed to fetch video metadata.');
  const data = await snippetResp.json();
  const snippet = data?.items?.[0]?.snippet;
  if (!snippet) throw new Error('Video metadata not available.');

  // Get transcript data
  let transcriptText = '';
  if (transcriptResp.ok) {
    const tr = await transcriptResp.json();
    const transcript = Array.isArray(tr.transcript) ? tr.transcript : [];
    transcriptText = transcript.map((t: any) => t.text).join(' ');
  }

  // Try AI-powered extraction first
  try {
    const aiResp = await fetch('/api/youtube/extract-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: snippet.title,
        transcript: transcriptText,
        description: snippet.description
      })
    });

    if (aiResp.ok) {
      const aiData = await aiResp.json();
      // Merge AI results with video metadata
      return {
        name: aiData.name || snippet.title || 'YouTube Recipe',
        description: aiData.description || snippet.description?.split('\n')[0] || '',
        ingredients: aiData.ingredients || [],
        instructions: aiData.instructions || [],
        prepTime: aiData.prepTime,
        cookTime: aiData.cookTime,
        servings: aiData.servings,
        difficulty: aiData.difficulty,
        tags: [...(aiData.tags || []), 'video', 'youtube', 'ai-extracted'],
        rating: undefined,
        notes: undefined,
        image: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? undefined,
        isFavorite: false,
        calories: undefined,
        cuisine: aiData.cuisine || 'other',
        dietaryRestrictions: [],
        nutritionInfo: undefined,
      };
    }
  } catch (aiError) {
    console.warn('AI extraction failed, falling back to regex parser:', aiError);
  }

  // Fallback to original regex-based parsing
  let ingredients: { name: string }[] = [];
  let instructions: string[] = [];
  if (transcriptResp.ok) {
    const tr = await transcriptResp.json();
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
  return {
    name: snippet.title ?? 'YouTube Recipe',
    description: snippet.description?.split('\n')[0] ?? '',
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings: 4,
    difficulty: 'medium',
    tags: ['video', 'youtube'],
    rating: undefined,
    notes: undefined,
    image: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
  };
}

// Parse a yyyy-MM-dd key into a local Date at midnight (avoid UTC shift)
function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((s) => Number(s));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function MealItem({ meal, recipes }: { meal: PlannedMeal; recipes: Recipe[] }) {
  const { updatePlannedMeal, deletePlannedMeal, mealPlans, mealOptions, addRecipe, updateRecipe } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showList, setShowList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showSimpleEdit, setShowSimpleEdit] = useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const recipe = recipes.find((item) => item.id === meal.recipeId);
  const displayName = recipe?.name ?? meal.customMeal ?? 'Meal';

  // Extract all historical custom meals from all meal plans (same logic as AddMealControl)
  const historicalMeals = React.useMemo(() => {
    const customMeals = new Map<string, { name: string; count: number; lastUsed: Date }>();

    mealPlans.forEach(plan => {
      plan.meals?.forEach(m => {
        if (m.customMeal && !m.recipeId) {
          const key = m.customMeal.toLowerCase();
          const existing = customMeals.get(key);
          const mealDate = ensureDate(m.date);

          if (existing) {
            existing.count++;
            if (mealDate > existing.lastUsed) {
              existing.lastUsed = mealDate;
            }
          } else {
            customMeals.set(key, {
              name: m.customMeal,
              count: 1,
              lastUsed: mealDate
            });
          }
        }
      });
    });

    return Array.from(customMeals.values())
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .map(item => ({ id: `__custom__:${item.name}`, name: item.name, count: item.count }));
  }, [mealPlans]);

  const matches = React.useMemo(() => {
    const q = editValue.trim().toLowerCase();

    if (!q) {
      return [];
    }

    const scoreMatch = (text: string, query: string): number => {
      const lower = text.toLowerCase();
      if (lower === query) return 1000;
      if (lower.startsWith(query)) return 900;
      const words = lower.split(/\s+/);
      if (words.some(w => w.startsWith(query))) return 800;
      if (lower.includes(query)) return 700;
      let fuzzyScore = 0;
      let queryIdx = 0;
      for (let i = 0; i < lower.length && queryIdx < query.length; i++) {
        if (lower[i] === query[queryIdx]) {
          fuzzyScore += (100 - i);
          queryIdx++;
        }
      }
      if (queryIdx === query.length) return fuzzyScore;
      return 0;
    };

    const candidates: Array<{ id: string; name: string; score: number; type: 'custom' | 'option' | 'recipe' }> = [];

    historicalMeals.forEach(item => {
      const score = scoreMatch(item.name, q);
      if (score > 0) {
        candidates.push({ id: `__custom__:${item.name}`, name: item.name, score, type: 'custom' });
      }
    });

    const opts = mealOptions[meal.mealType as 'breakfast'|'lunch'|'dinner'|'snack'] || [];
    opts.forEach(name => {
      const score = scoreMatch(name, q);
      if (score > 0) {
        candidates.push({ id: `__opt__:${name}`, name, score, type: 'option' });
      }
    });

    recipes.forEach(recipe => {
      const score = scoreMatch(recipe.name, q);
      if (score > 0) {
        candidates.push({ id: recipe.id!, name: recipe.name, score, type: 'recipe' });
      }
    });

    // Deduplicate by name (case-insensitive), keeping highest score
    const deduped = new Map<string, typeof candidates[0]>();
    candidates.forEach(candidate => {
      const key = candidate.name.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || candidate.score > existing.score) {
        deduped.set(key, candidate);
      }
    });

    return Array.from(deduped.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [editValue, recipes, mealOptions, meal.mealType, historicalMeals]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [editValue]);

  const startEdit = () => {
    // For custom meals, edit the custom name
    // For recipe meals, edit the display name (will convert to custom meal on save)
    setEditValue(displayName);
    setIsEditing(true);
    setShowList(true);
  };

  const saveEdit = async (newValue?: string) => {
    const trimmed = (newValue ?? editValue).trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    const originalName = meal.customMeal ?? recipe?.name ?? '';
    if (trimmed === originalName) {
      // No change
      setIsEditing(false);
      setShowList(false);
      return;
    }

    try {
      if (meal.recipeId) {
        // Convert recipe meal to custom meal
        await updatePlannedMeal(meal.id, {
          customMeal: trimmed,
          recipeId: undefined
        });
      } else {
        // Update custom meal name
        await updatePlannedMeal(meal.id, { customMeal: trimmed });
      }
    } catch (error) {
      console.error('Failed to update meal:', error);
      // Revert on error
      setEditValue(originalName);
    }
    setIsEditing(false);
    setShowList(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowList(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        const selected = matches[selectedIndex];
        saveEdit(selected.name);
      } else {
        saveEdit();
      }
      setSelectedIndex(0);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <>
      <li
        className={`group text-xs rounded border px-2 py-1 flex items-center justify-between gap-2 ${
          !isEditing
            ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer'
            : 'border-slate-200 bg-white'
        }`}
        draggable={!isEditing}
        onDoubleClick={(e) => {
          if (!isEditing) {
            e.preventDefault();
            e.stopPropagation();
            startEdit();
          }
        }}
        onDragStart={(e) => {
          if (!isEditing) {
            e.dataTransfer.setData('text/meal-id', meal.id);
            e.dataTransfer.effectAllowed = 'move';
          }
        }}
        title={meal.recipeId ? "Double-click or click pencil to edit (converts to custom meal), drag to move (hold Alt to copy)" : "Double-click to edit, drag to move (hold Alt to copy)"}
      >
        {isEditing ? (
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => { setEditValue(e.target.value); setShowList(true); }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => saveEdit(), 200)}
              className="w-full bg-transparent border-none outline-none text-xs"
            />
            {showList && editValue.trim().length > 0 && inputRef.current && createPortal(
              <div className="fixed z-[100] w-[200px] rounded-lg border border-slate-300 bg-white shadow-xl" style={{
                left: inputRef.current.getBoundingClientRect().left,
                top: inputRef.current.getBoundingClientRect().bottom + 4,
              }}>
                {matches.length === 0 ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => saveEdit(editValue.trim())}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-xs font-medium text-indigo-700">+</span>
                    <span className="truncate">Add "<span className="font-medium">{editValue.trim()}</span>"</span>
                  </button>
                ) : (
                  <div className="max-h-[300px] overflow-auto py-1">
                    {matches.map((r: any, idx: number) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={`${r.id}-${idx}`}
                          type="button"
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                            isSelected ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => saveEdit(r.name)}
                        >
                          <span className="truncate font-medium">{r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>
        ) : (
          <span className="truncate flex-1" title={displayName}>
            {displayName}
          </span>
        )}
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (meal.recipeId && recipe) {
                  setShowSimpleEdit(true);
                } else {
                  setShowRecipeForm(true);
                }
              }}
              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
              aria-label={meal.recipeId ? "View recipe" : "Save as recipe"}
              title={meal.recipeId ? "View recipe" : "Save as recipe"}
            >
              <ChefHat className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deletePlannedMeal(meal.id);
              }}
              className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label="Remove meal"
              title="Remove"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </li>

      {showRecipeForm && (
        <QuickRecipeModal
          initialName={meal.customMeal ?? ''}
          onSave={async (recipeData) => {
            const newRecipe = await addRecipe(recipeData);
            if (newRecipe?.id) {
              await updatePlannedMeal(meal.id, { recipeId: newRecipe.id, customMeal: undefined });
            }
            setShowRecipeForm(false);
          }}
          onClose={() => setShowRecipeForm(false)}
        />
      )}

      {showSimpleEdit && recipe && (
        <SimpleRecipeEditModal
          recipe={recipe}
          onSave={async (updates) => {
            await updateRecipe(recipe.id!, updates);
            setShowSimpleEdit(false);
          }}
          onClose={() => setShowSimpleEdit(false)}
        />
      )}
    </>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  maxWidthClass = 'max-w-2xl',
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidthClass?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        style={{height: '350px'}}
        className={`w-full ${maxWidthClass} rounded-xl border-4 border-indigo-500/30 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-4 ring-white flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 flex-shrink-0">
          <div>
            <h3 id="modal-title" className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function QuickRecipeModal({ initialName, onSave, onClose }: {
  initialName: string;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');
  const [saving, setSaving] = useState(false);
  const titleId = 'quick-recipe-modal-title';

  // Lock background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Parse ingredients from comma-separated or line-separated text
    const ingredientLines = ingredientsText
      .split(/[,\n]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const ingredients = ingredientLines.map(line => {
      // Try to parse "amount unit name" format (e.g., "2 cups flour")
      const match = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
      if (match) {
        return { amount: match[1], unit: match[2], name: match[3] };
      }
      // Try "amount name" format (e.g., "2 onions")
      const match2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (match2) {
        return { amount: match2[1], unit: undefined, name: match2[2] };
      }
      // Just the name
      return { amount: undefined, unit: undefined, name: line };
    });

    // Parse instructions from line-separated text
    const instructions = instructionsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const recipeData: Omit<Recipe, 'id' | 'createdAt'> = {
      name: name.trim(),
      description: undefined,
      ingredients,
      instructions,
      prepTime: undefined,
      cookTime: undefined,
      servings: 4,
      tags: [],
      imageUrl: undefined,
      sourceUrl: undefined,
      videoUrl: undefined,
      videoThumbnail: undefined,
      notes: undefined,
    };

    await onSave(recipeData);
    setSaving(false);
  };

  return (
    <ModalShell title="Recipe" subtitle={`Quick recipe for "${initialName}"`} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
          <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g., Bagel with Cream Cheese"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ingredients <span className="text-slate-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="2 bagels&#10;4 oz cream cheese&#10;1 tomato&#10;salt, pepper"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Instructions <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Toast bagels, spread cream cheese..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
          </div>
        </form>
    </ModalShell>
  );
}

function SimpleRecipeEditModal({ recipe, onSave, onClose }: {
  recipe: Recipe;
  onSave: (updates: Partial<Recipe>) => void | Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(recipe.name || '');
  const [ingredientsText, setIngredientsText] = useState(
    (recipe.ingredients || [])
      .map(ing => [ing.amount, ing.unit, ing.name].filter(Boolean).join(' '))
      .join('\n')
  );
  const [instructionsText, setInstructionsText] = useState((recipe.instructions || []).join('\n'));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ingredientLines = ingredientsText
      .split(/[\n,]/)
      .map(l => l.trim())
      .filter(Boolean);
    const ingredients = ingredientLines.map(line => {
      const m1 = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
      if (m1) return { amount: m1[1], unit: m1[2], name: m1[3] };
      const m2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
      if (m2) return { amount: m2[1], unit: undefined, name: m2[2] };
      return { name: line } as any;
    });
    const instructions = instructionsText.split('\n').map(l => l.trim()).filter(Boolean);
    await onSave({
      name: name.trim() || 'Untitled',
      ingredients,
      instructions,
    });
    setSaving(false);
  };

  return (
    <ModalShell title="Recipe" subtitle={recipe.name} onClose={onClose} maxWidthClass="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Recipe Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g., Veg Pulao"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ingredients <span className="text-slate-400 font-normal">(one per line)</span></label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="2 cups rice\n1 onion\nspices"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Instructions <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Rinse rice..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

// Component for cells that already have meals - shows compact view with hover overlay
function CellWithMeals({ dateKey, mealType, dayMeals, recipes }: {
  dateKey: string;
  mealType: string;
  dayMeals: PlannedMeal[];
  recipes: Recipe[];
}) {
  const triggerRef = React.useRef<(() => void) | null>(null);

  return (
    <>
      <div className="space-y-1 relative" style={{ zIndex: 10 }}>
        <ul className="space-y-1">
          {dayMeals.map((meal) => (
            <MealItem key={meal.id} meal={meal} recipes={recipes} />
          ))}
        </ul>
        <AddMealControl
          dateKey={dateKey}
          mealType={mealType}
          showByDefault={false}
          compact={true}
          triggerRef={triggerRef}
        />
      </div>
      {/* Hover overlay to add more meals */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none group-hover/cell:pointer-events-auto" style={{ zIndex: 1 }}>
        <div className="absolute bottom-2 left-2 right-2 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerRef.current?.();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-slate-200"
          >
            <Plus className="w-3 h-3" />
            <span className="text-[10px] font-medium">Add</span>
          </button>
        </div>
      </div>
    </>
  );
}

function AddMealControl({ dateKey, mealType, onAdded, showByDefault = true, compact = false, triggerRef }: {
  dateKey: string;
  mealType: string;
  onAdded?: () => void;
  showByDefault?: boolean;
  compact?: boolean;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const { recipes, addPlannedMeal, mealPlans, ensureMealPlanForWeek, mealOptions, weekStartsOn, addRecipe } = useAppStore();

  // Unique key for this input slot
  const slotKey = `${dateKey}-${mealType}`;
  const storageKey = `meal-draft-${slotKey}`;

  // Load persisted draft from localStorage
  const [query, setQuery] = React.useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved || '';
    } catch {
      return '';
    }
  });

  const [showInput, setShowInput] = React.useState(showByDefault);
  const [showList, setShowList] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [showDraftIndicator, setShowDraftIndicator] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const draftTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Expose trigger function via ref
  React.useEffect(() => {
    if (triggerRef) {
      triggerRef.current = () => setShowInput(true);
    }
  }, [triggerRef]);

  // Persist query to localStorage whenever it changes
  React.useEffect(() => {
    try {
      if (query.trim()) {
        localStorage.setItem(storageKey, query);
        // Show "Draft saved" indicator briefly
        setShowDraftIndicator(true);
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => setShowDraftIndicator(false), 1500);
      } else {
        localStorage.removeItem(storageKey);
        setShowDraftIndicator(false);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [query, storageKey]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  // Extract all historical custom meals from all meal plans
  const historicalMeals = React.useMemo(() => {
    const customMeals = new Map<string, { name: string; count: number; lastUsed: Date }>();

    mealPlans.forEach(plan => {
      plan.meals?.forEach(meal => {
        if (meal.customMeal && !meal.recipeId) {
          const key = meal.customMeal.toLowerCase();
          const existing = customMeals.get(key);
          const mealDate = ensureDate(meal.date);

          if (existing) {
            existing.count++;
            if (mealDate > existing.lastUsed) {
              existing.lastUsed = mealDate;
            }
          } else {
            customMeals.set(key, {
              name: meal.customMeal,
              count: 1,
              lastUsed: mealDate
            });
          }
        }
      });
    });

    // Sort by frequency (count) and recency
    return Array.from(customMeals.values())
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .map(item => ({ id: `__custom__:${item.name}`, name: item.name, count: item.count }));
  }, [mealPlans]);

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return [];
    }

    // Scoring function for elastic search
    const scoreMatch = (text: string, query: string): number => {
      const lower = text.toLowerCase();

      // Exact match (highest priority)
      if (lower === query) return 1000;

      // Starts with query
      if (lower.startsWith(query)) return 900;

      // Word starts with query
      const words = lower.split(/\s+/);
      if (words.some(w => w.startsWith(query))) return 800;

      // Contains query
      if (lower.includes(query)) return 700;

      // Fuzzy match - calculate similarity
      let fuzzyScore = 0;
      let queryIdx = 0;
      for (let i = 0; i < lower.length && queryIdx < query.length; i++) {
        if (lower[i] === query[queryIdx]) {
          fuzzyScore += (100 - i); // Earlier matches score higher
          queryIdx++;
        }
      }
      if (queryIdx === query.length) return fuzzyScore;

      return 0; // No match
    };

    // Collect all candidates
    const candidates: Array<{ id: string; name: string; score: number; type: 'custom' | 'option' | 'recipe' }> = [];

    // Add historical custom meals
    historicalMeals.forEach(item => {
      const score = scoreMatch(item.name, q);
      if (score > 0) {
        candidates.push({ id: `__custom__:${item.name}`, name: item.name, score, type: 'custom' });
      }
    });

    // Add meal options
    const opts = mealOptions[mealType as 'breakfast'|'lunch'|'dinner'|'snack'] || [];
    opts.forEach(name => {
      const score = scoreMatch(name, q);
      if (score > 0) {
        candidates.push({ id: `__opt__:${name}`, name, score, type: 'option' });
      }
    });

    // Add recipes
    recipes.forEach(recipe => {
      const score = scoreMatch(recipe.name, q);
      if (score > 0) {
        candidates.push({ id: recipe.id!, name: recipe.name, score, type: 'recipe' });
      }
    });

    // Deduplicate by name (case-insensitive), keeping highest score
    const deduped = new Map<string, typeof candidates[0]>();
    candidates.forEach(candidate => {
      const key = candidate.name.toLowerCase();
      const existing = deduped.get(key);
      if (!existing || candidate.score > existing.score) {
        deduped.set(key, candidate);
      }
    });

    // Sort by score descending, then alphabetically
    return Array.from(deduped.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 12);
  }, [query, recipes, mealOptions, mealType, historicalMeals]);

  const add = async (recipeId?: string, customMeal?: string) => {
    try {
      const plan = mealPlans.find(p => isSameWeek(ensureDate(p.weekStartDate), startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn })))
        || await ensureMealPlanForWeek(startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn }));
      if (!plan) {
        console.error('Failed to create or find meal plan');
        return;
      }

      // Auto-link to existing recipe if one exists with the same name
      let finalRecipeId = recipeId;
      let finalCustomMeal = customMeal;

      if (!recipeId && customMeal) {
        // Check if a recipe exists with this name (case-insensitive)
        const existingRecipe = recipes.find(
          r => r.name.toLowerCase() === customMeal.toLowerCase()
        );

        if (existingRecipe) {
          // Auto-link to existing recipe
          finalRecipeId = existingRecipe.id;
          finalCustomMeal = undefined;
          console.log(`Auto-linked meal "${customMeal}" to existing recipe`);
        } else {
          // Try to auto-fetch recipe from Google
          try {
            const fetchedRecipe = await fetchRecipeFromGoogle(customMeal);
            if (fetchedRecipe) {
              const newRecipe = await addRecipe(fetchedRecipe);
              if (newRecipe?.id) {
                finalRecipeId = newRecipe.id;
                finalCustomMeal = undefined;
                console.log(`Auto-created recipe for "${customMeal}" from Google`);
              }
            }
          } catch (error) {
            console.warn('Failed to auto-fetch recipe, using custom meal:', error);
            // Will fall back to custom meal
          }
        }
      }

      await addPlannedMeal(plan.id, {
        date: parseLocalDateKey(dateKey),
        mealType,
        recipeId: finalRecipeId,
        customMeal: finalCustomMeal,
        servings: 4,
        peopleCount: 4,
        status: 'planned',
        notes: undefined,
        preparedAt: undefined,
        consumedAt: undefined,
      });

      // Clear the input and persisted draft
      setQuery('');
      setShowList(false);
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Failed to clear draft:', error);
      }
      // Hide input if it wasn't shown by default
      if (!showByDefault) {
        setShowInput(false);
      }
      onAdded?.();
    } catch (error) {
      console.error('Failed to add meal:', error);
      // Keep the input open so user can try again
      setShowList(true);
    }
  };

  // Enrich a custom meal by linking an existing recipe or auto-fetching one
  const enrichAndAdd = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      // 1) If an existing recipe matches exactly (case-insensitive), link it
      const existing = recipes.find(r => r.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (existing?.id) {
        await add(existing.id, undefined);
        return;
      }
      // 2) Else, try to fetch a draft from Google and save it, then link
      const draft = await fetchRecipeFromGoogle(trimmed).catch(() => null);
      if (draft) {
        const created = await addRecipe({ ...draft, name: trimmed });
        if (created?.id) {
          await add(created.id, undefined);
          return;
        }
      }
      // 3) Fallback: add as plain custom meal
      await add(undefined, trimmed);
    } catch (e) {
      console.warn('Enrich add failed; falling back to custom meal', e);
      await add(undefined, trimmed);
    }
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0) {
        const selected = matches[selectedIndex] as any;
        const idStr = String(selected.id);
        if (idStr.startsWith('__opt__:') || idStr.startsWith('__custom__:')) {
          await enrichAndAdd(selected.name);
        } else {
          await add(selected.id);
        }
      } else if (query.trim()) {
        await enrichAndAdd(query.trim());
      }
      setSelectedIndex(0);
    } else if (e.key === 'Escape') {
      setShowList(false);
      setSelectedIndex(0);
      inputRef.current?.blur();
    }
  };

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // If input is hidden, show a "+" button
  if (!showInput) {
    if (compact) {
      // Compact version: don't render anything, use CSS overlay on cell hover
      return null;
    }

    // Full version: regular button for empty slots
    return (
      <button
        type="button"
        onClick={() => setShowInput(true)}
        className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-400 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add meal</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        onKeyDown={onKeyDown}
        placeholder="Type to add…"
        className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoFocus
      />
      {showDraftIndicator && query.trim() && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium pointer-events-none">
          Draft saved
        </div>
      )}
      {showList && query.trim().length > 0 && inputRef.current && createPortal(
        <div className="fixed z-[100] w-[200px] rounded-lg border border-slate-300 bg-white shadow-xl" style={{
          left: inputRef.current.getBoundingClientRect().left,
          top: inputRef.current.getBoundingClientRect().bottom + 4,
        }}>
          {matches.length === 0 ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => enrichAndAdd(query.trim())}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-xs font-medium text-indigo-700">+</span>
              <span className="truncate">Add "<span className="font-medium">{query.trim()}</span>"</span>
            </button>
          ) : (
            <div className="max-h-[300px] overflow-auto py-1">
              {matches.map((r: any, idx: number) => {
                const idStr = String(r.id);
                const isCustom = idStr.startsWith('__custom__:');
                const isOption = idStr.startsWith('__opt__:');
                const isRecipe = !isCustom && !isOption;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={`${r.id}-${idx}`}
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                      isSelected ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      if (isCustom || isOption) {
                        add(undefined, r.name);
                      } else {
                        add(r.id);
                      }
                    }}
                  >
                    <span className="truncate font-medium">{r.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// (YouTube helpers removed for v1 Clip flow)

// Auto-fetch recipe from Google search
async function fetchRecipeFromGoogle(mealName: string): Promise<Omit<Recipe, 'id' | 'createdAt'> | null> {
  const scaffold = (name: string): Omit<Recipe, 'id' | 'createdAt'> => ({
    name,
    description: '',
    ingredients: [
      { name: name },
      { name: '1 tbsp oil' },
      { name: 'salt to taste' },
    ],
    instructions: [
      `Prepare ${name.toLowerCase()}.`,
      `Cook ${name.toLowerCase()} to desired doneness.`,
      'Adjust seasoning and serve.',
    ],
    prepTime: undefined,
    cookTime: undefined,
    servings: 4,
    difficulty: 'medium',
    tags: ['auto-scaffold'],
    rating: undefined,
    notes: undefined,
    image: undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
  });
  try {
    // Use our backend recipe search endpoint
    const apiUrl = `/api/recipe/search?q=${encodeURIComponent(mealName)}`;

    const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      console.warn('Recipe search failed (non-OK). Using scaffold.');
      return scaffold(mealName);
    }

    const data = await response.json();
    const ingredients = Array.isArray(data.ingredients) && data.ingredients.length
      ? data.ingredients
      : [{ name: 'Add ingredients...' }];
    const instructions: string[] = Array.isArray(data.instructions) && data.instructions.length
      ? data.instructions
      : ['Add instructions...'];

    return {
      name: data.name || mealName,
      description: data.description || '',
      ingredients,
      instructions,
      prepTime: Number.isFinite(Number(data.prepTime)) ? Number(data.prepTime) : undefined,
      cookTime: Number.isFinite(Number(data.cookTime)) ? Number(data.cookTime) : undefined,
      servings: Number.isFinite(Number(data.servings)) ? Number(data.servings) : 4,
      difficulty: 'medium',
      tags: Array.isArray(data.tags) ? data.tags : ['auto-fetched'],
      rating: undefined,
      notes: undefined,
      image: data.image || undefined,
      isFavorite: false,
      calories: undefined,
      cuisine: 'other',
      dietaryRestrictions: [],
      nutritionInfo: undefined,
    };
  } catch (error) {
    console.warn('Failed to fetch recipe from Google. Using scaffold:', error);
    return scaffold(mealName);
  }
}

// Generic clipper: fetch via server-side endpoint that parses JSON-LD/OG tags
async function fetchClippedRecipe(url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const clipperBase = import.meta.env.VITE_RECIPE_CLIPPER_URL?.trim() || '/api/clip/recipe';
  const apiUrl = `${clipperBase}${clipperBase.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`;
  let response: Response;
  try {
    response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new Error('Unable to reach the recipe clipper service.');
  }
  if (!response.ok) throw new Error('Failed to clip recipe.');
  const data = await response.json();
  const ingredients = Array.isArray(data.ingredients) && data.ingredients.length
    ? data.ingredients
    : [{ name: 'Ingredient 1' }, { name: 'Ingredient 2' }];
  const instructions: string[] = Array.isArray(data.instructions) && data.instructions.length
    ? data.instructions
    : ['Follow the steps on the source page.'];
  return {
    name: data.name || 'Clipped Recipe',
    description: data.description || '',
    ingredients,
    instructions,
    prepTime: Number.isFinite(Number(data.prepTime)) ? Number(data.prepTime) : 10,
    cookTime: Number.isFinite(Number(data.cookTime)) ? Number(data.cookTime) : 20,
    servings: Number.isFinite(Number(data.servings)) ? Number(data.servings) : 2,
    difficulty: 'medium',
    tags: Array.isArray(data.tags) ? data.tags : ['clipped'],
    rating: undefined,
    notes: undefined,
    image: data.image || undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
    flowChart: undefined,
    sourceType: 'manual',
    sourceUrl: url,
    authorName: data.authorName || undefined,
    videoThumbnail: undefined,
  };
}

// (Legacy YouTube import removed in v1)

function MealOptionsManager() {
  const { mealOptions, addMealOption, removeMealOption } = useAppStore();
  const [inputs, setInputs] = useState({ breakfast: '', lunch: '', dinner: '', snack: '' });
  const sections: Array<{ key: keyof typeof mealOptions; label: string; color: string }> = [
    { key: 'breakfast', label: 'Breakfast', color: 'text-amber-600' },
    { key: 'lunch', label: 'Lunch', color: 'text-emerald-600' },
    { key: 'dinner', label: 'Dinner', color: 'text-indigo-600' },
    { key: 'snack', label: 'Snacks', color: 'text-pink-600' },
  ];
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {sections.map(({ key, label, color }) => (
        <div key={key} className="rounded-md border border-slate-200 p-3">
          <h3 className={`text-sm font-semibold ${color}`}>{label}</h3>
          <div className="mt-2 flex gap-2">
            <input
              value={inputs[key]}
              onChange={(e) => setInputs((s) => ({ ...s, [key]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = inputs[key].trim();
                  if (v) { addMealOption(key as any, v); setInputs((s) => ({ ...s, [key]: '' })); }
                }
              }}
              placeholder={`Add ${label.toLowerCase()} option…`}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => { const v = inputs[key].trim(); if (v) { addMealOption(key as any, v); setInputs((s) => ({ ...s, [key]: '' })); } }}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Add
            </button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(mealOptions[key] || []).map((name) => (
              <li
                key={name}
                className="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/meal-option', name);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                title="Drag into the weekly planner to add"
              >
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeMealOption(key as any, name)}
                  className="text-slate-400 hover:text-rose-600"
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RecipeMealTypeChips({ recipe }: { recipe: Recipe }) {
  const { updateRecipe } = useAppStore();
  const types: Array<{ key: 'breakfast'|'lunch'|'dinner'|'snack'; label: string; color: string }> = [
    { key: 'breakfast', label: 'Breakfast', color: '' },
    { key: 'lunch', label: 'Lunch', color: '' },
    { key: 'dinner', label: 'Dinner', color: '' },
    { key: 'snack', label: 'Snack', color: '' },
  ];
  const tags = recipe.tags || [];
  const toggle = async (k: 'breakfast'|'lunch'|'dinner'|'snack') => {
    const token = `meal:${k}`;
    const has = tags.includes(token);
    const next = has ? tags.filter(t => t !== token) : [...tags, token];
    await updateRecipe(recipe.id!, { tags: next });
  };
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {types.map(t => {
        const active = tags.includes(`meal:${t.key}`);
        const activeMap: Record<typeof t.key, string> = {
          breakfast: 'bg-amber-600 text-white border-amber-600',
          lunch: 'bg-emerald-600 text-white border-emerald-600',
          dinner: 'bg-indigo-600 text-white border-indigo-600',
          snack: 'bg-pink-600 text-white border-pink-600',
        } as const;
        const inactiveMap: Record<typeof t.key, string> = {
          breakfast: 'text-amber-700 border-amber-300 bg-white hover:bg-amber-50',
          lunch: 'text-emerald-700 border-emerald-300 bg-white hover:bg-emerald-50',
          dinner: 'text-indigo-700 border-indigo-300 bg-white hover:bg-indigo-50',
          snack: 'text-pink-700 border-pink-300 bg-white hover:bg-pink-50',
        } as const;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => toggle(t.key)}
            className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${active ? activeMap[t.key] : inactiveMap[t.key]}`}
            title={`Label as ${t.label}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function RecipeEditModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { updateRecipe } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState({
    name: recipe.name || '',
    description: recipe.description || '',
    servings: String(recipe.servings ?? 1),
    prepTime: String(recipe.prepTime ?? 0),
    cookTime: String(recipe.cookTime ?? 0),
    difficulty: recipe.difficulty || 'medium',
    tags: (recipe.tags || []).join(', '),
    instructions: (recipe.instructions || []).join('\n'),
    ingredients: (recipe.ingredients || []).map(ing => {
      const parts = [ing.amount, ing.unit, ing.name].filter(Boolean);
      return parts.join(' ');
    }).join('\n'),
  });

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Auto-save functionality - debounced by 2 seconds
  React.useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        setError(null);

        // Parse ingredients from text
        const ingredientLines = form.ingredients
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        const parsedIngredients = ingredientLines.map((line) => {
          const match1 = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
          if (match1) {
            return { amount: match1[1], unit: match1[2], name: match1[3] };
          }
          const match2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
          if (match2) {
            return { amount: match2[1], unit: undefined, name: match2[2] };
          }
          return { amount: undefined, unit: undefined, name: line };
        });

        const updates: Partial<Recipe> = {
          name: form.name.trim() || 'Untitled',
          description: form.description.trim(),
          servings: Number.isFinite(Number(form.servings)) ? Number(form.servings) : recipe.servings,
          prepTime: Number.isFinite(Number(form.prepTime)) ? Number(form.prepTime) : recipe.prepTime,
          cookTime: Number.isFinite(Number(form.cookTime)) ? Number(form.cookTime) : recipe.cookTime,
          difficulty: (form.difficulty as Recipe['difficulty']) || recipe.difficulty,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          instructions: form.instructions.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
          ingredients: parsedIngredients,
        };

        await updateRecipe(recipe.id!, updates);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
        setError('Auto-save failed');
      } finally {
        setSaving(false);
      }
    }, 2000); // 2 second debounce

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, recipe.id, updateRecipe]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Parse ingredients from text
      const ingredientLines = form.ingredients
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const parsedIngredients = ingredientLines.map((line) => {
        // Try to parse "amount unit name" format (e.g., "2 cups flour")
        const match1 = line.match(/^(\d+(?:\.\d+)?)\s+(\w+)\s+(.+)$/);
        if (match1) {
          return { amount: match1[1], unit: match1[2], name: match1[3] };
        }
        // Try "amount name" format (e.g., "2 onions")
        const match2 = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
        if (match2) {
          return { amount: match2[1], unit: undefined, name: match2[2] };
        }
        // Just the name
        return { amount: undefined, unit: undefined, name: line };
      });

      const updates: Partial<Recipe> = {
        name: form.name.trim() || 'Untitled',
        description: form.description.trim(),
        servings: Number.isFinite(Number(form.servings)) ? Number(form.servings) : recipe.servings,
        prepTime: Number.isFinite(Number(form.prepTime)) ? Number(form.prepTime) : recipe.prepTime,
        cookTime: Number.isFinite(Number(form.cookTime)) ? Number(form.cookTime) : recipe.cookTime,
        difficulty: (form.difficulty as Recipe['difficulty']) || recipe.difficulty,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        instructions: form.instructions
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean),
        ingredients: parsedIngredients,
      };
      await updateRecipe(recipe.id!, updates);
      onClose();
    } catch (err) {
      console.error('Failed to update recipe', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div style={{height: '350px'}} className="w-full max-w-2xl rounded-xl border-4 border-indigo-500/30 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-4 ring-white flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">Edit recipe</h3>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="text-emerald-600">Auto-saved</span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex-1 overflow-auto p-3">
          <div className="grid gap-4">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Difficulty</span>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((s) => ({ ...s, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Servings</span>
              <input
                type="number"
                min={1}
                value={form.servings}
                onChange={(e) => setForm((s) => ({ ...s, servings: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Prep time (min)</span>
              <input
                type="number"
                min={0}
                value={form.prepTime}
                onChange={(e) => setForm((s) => ({ ...s, prepTime: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Cook time (min)</span>
              <input
                type="number"
                min={0}
                value={form.cookTime}
                onChange={(e) => setForm((s) => ({ ...s, cookTime: e.target.value }))}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tags (comma separated)</span>
            <input
              value={form.tags}
              onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. meal:breakfast, quick, vegetarian"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Ingredients (one per line)</span>
            <textarea
              rows={6}
              value={form.ingredients}
              onChange={(e) => setForm((s) => ({ ...s, ingredients: e.target.value }))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Instructions (one per line)</span>
            <textarea
              rows={6}
              value={form.instructions}
              onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              disabled={saving}
            >
              Close
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Multi-cell selection types
type CellKey = string; // format: "yyyy-MM-dd:mealType"

const MealPlanning: React.FC = () => {
  const {
    recipes,
    mealPlans,
    mealPlansLoading,
    loadRecipes,
    loadMealPlans,
    addRecipe,
    ensureMealPlanForWeek,
    addPlannedMeal,
    updatePlannedMeal,
    deletePlannedMeal,
    addNote,
    showGlobalToast,
  } = useAppStore();

  const { weekStartsOn, setWeekStartsOn } = useAppStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn }));
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isEnsuringPlan, setIsEnsuringPlan] = useState(false);

  // Multi-cell selection state
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string>(MEAL_TYPES[2]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toKey(startOfWeek(new Date(), { weekStartsOn }))); // Based on setting
  const [servings, setServings] = useState(4);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDraft, setImportDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);
  const [importScheduleType, setImportScheduleType] = useState<string>(MEAL_TYPES[2]);
  const [importScheduleDateKey, setImportScheduleDateKey] = useState<string>(() => toKey(startOfWeek(new Date(), { weekStartsOn })));

  // Video import state (YouTube)
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLang, setVideoLang] = useState('en');
  const [isVideoImporting, setIsVideoImporting] = useState(false);
  const [videoImportError, setVideoImportError] = useState<string | null>(null);
  const [videoDraft, setVideoDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);

  // Paste Text extractor state
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isTextParsing, setIsTextParsing] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<Omit<Recipe, 'id' | 'createdAt'> | null>(null);
  const [textImageUrl, setTextImageUrl] = useState('');

  // Grocery list state
  const [showGroceryList, setShowGroceryList] = useState(false);

  // Recipe search/filter state
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    void loadRecipes();
    void loadMealPlans();
    // Cleanup old drafts on component mount
    cleanupOldDrafts();
  }, [loadRecipes, loadMealPlans]);

  useEffect(() => {
    setSelectedDateKey(toKey(currentWeekStart));
  }, [currentWeekStart]);

  // Re-align current week when weekStartsOn changes
  useEffect(() => {
    setCurrentWeekStart((prev) => startOfWeek(prev, { weekStartsOn }));
    setSelectedDateKey((prev) => {
      const d = new Date(prev)
      return toKey(startOfWeek(d, { weekStartsOn }))
    });
  }, [weekStartsOn]);

  // Don't eagerly create plans - just find existing ones
  // Plans are created lazily when user adds a meal
  useEffect(() => {
    const existingPlan = mealPlans.find((plan) =>
      isSameWeek(ensureDate(plan.weekStartDate), currentWeekStart, { weekStartsOn })
    );

    if (existingPlan) {
      setActivePlanId(existingPlan.id);
    } else {
      // No plan for this week yet - that's OK, will be created when user adds a meal
      setActivePlanId(null);
    }
    setIsEnsuringPlan(false);
  }, [currentWeekStart, mealPlans, weekStartsOn]);

  const activePlan: MealPlanWeek | null = useMemo(() => {
    if (activePlanId) {
      const plan = mealPlans.find((item) => item.id === activePlanId);
      if (plan) {
        return plan;
      }
    }

    return (
      mealPlans.find((plan) =>
        isSameWeek(ensureDate(plan.weekStartDate), currentWeekStart, { weekStartsOn }),
      ) ?? null
    );
  }, [activePlanId, mealPlans, currentWeekStart, weekStartsOn]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart],
  );

  const plannedMeals = activePlan?.meals ?? [];
  const mealsByDate: Record<string, PlannedMeal[]> = useMemo(() => {
    return plannedMeals.reduce<Record<string, PlannedMeal[]>>((accumulator, meal) => {
      const key = toKey(ensureDate(meal.date));
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(meal);
      return accumulator;
    }, {});
  }, [plannedMeals]);

  const handleImportRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!importUrl.trim()) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const recipe = await fetchClippedRecipe(importUrl.trim());
      setImportDraft(recipe);
      setImportUrl('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import recipe.';
      setImportError(message);
    } finally {
      setIsImporting(false);
    }
  };

  const saveImportedRecipe = async () => {
    if (!importDraft) return;
    try {
      await addRecipe(importDraft);
      setImportDraft(null);
    } catch (e) {
      setImportError('Failed to save recipe');
    }
  };

  // v1: omit plan scheduling integration; we only save clipped recipe

  const saveImportedAsNote = async () => {
    if (!importDraft) return;
    try {
      const title = importDraft.name || 'Imported Recipe';
      const lines: string[] = [];
      lines.push(`# ${title}`);
      if (importDraft.sourceUrl) {
        lines.push('');
        lines.push(`Source: ${importDraft.sourceUrl}`);
      }
      if (importDraft.description) {
        lines.push('');
        lines.push(importDraft.description);
      }
      if (Array.isArray(importDraft.ingredients) && importDraft.ingredients.length) {
        lines.push('');
        lines.push('## Ingredients');
        for (const ing of importDraft.ingredients) {
          lines.push(`- ${ing.name}`);
        }
      }
      if (Array.isArray(importDraft.instructions) && importDraft.instructions.length) {
        lines.push('');
        lines.push('## Instructions');
        importDraft.instructions.forEach((step, idx) => {
          lines.push(`${idx + 1}. ${step}`);
        });
      }
      const content = lines.join('\n');
      await addNote({ title, content, tags: ['recipe', 'youtube', 'imported'] });
      setImportDraft(null);
    } catch (e) {
      setImportError('Failed to save as note');
    }
  };

  const handleScheduleMeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activePlan) {
      setScheduleError('Create or load a meal plan first.');
      return;
    }
    if (!selectedRecipeId) {
      setScheduleError('Select a recipe to schedule.');
      return;
    }

    const recipe = recipes.find((item) => item.id === selectedRecipeId);
    if (!recipe) {
      setScheduleError('Recipe not found.');
      return;
    }

    setIsScheduling(true);
    setScheduleError(null);
    try {
      await addPlannedMeal(activePlan.id, {
        date: new Date(selectedDateKey),
        mealType: selectedMealType,
        recipeId: recipe.id,
        customMeal: undefined,
        servings,
        peopleCount: servings,
        status: 'planned',
        notes: undefined,
        preparedAt: undefined,
        consumedAt: undefined,
      });
      setSelectedRecipeId('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to schedule meal.';
      setScheduleError(message);
    } finally {
      setIsScheduling(false);
    }
  };

  const plannedCount = plannedMeals.length;
  const completedCount = plannedMeals.filter((meal) => meal.status === 'eaten').length;

  const isLoading = mealPlansLoading || isEnsuringPlan;

  // Multi-cell selection handlers
  const makeCellKey = (dateKey: string, mealType: string): CellKey => `${dateKey}:${mealType}`;

  const handleCellClick = (dateKey: string, mealType: string, event: React.MouseEvent) => {
    const cellKey = makeCellKey(dateKey, mealType);

    if (event.metaKey || event.ctrlKey) {
      // Toggle selection with Cmd/Ctrl
      setIsSelectionMode(true);
      setSelectedCells(prev => {
        const next = new Set(prev);
        if (next.has(cellKey)) {
          next.delete(cellKey);
        } else {
          next.add(cellKey);
        }
        // Exit selection mode if no cells selected
        if (next.size === 0) {
          setIsSelectionMode(false);
        }
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedCells(new Set());
    setIsSelectionMode(false);
  };

  const addMealToSelectedCells = async (recipeId: string, customMeal?: string) => {
    if (!activePlan || selectedCells.size === 0) return;

    try {
      const promises = Array.from(selectedCells).map(cellKey => {
        const [dateKey, mealType] = cellKey.split(':');
        return addPlannedMeal(activePlan.id, {
          date: parseLocalDateKey(dateKey),
          mealType,
          recipeId: recipeId || undefined,
          customMeal: customMeal || undefined,
          servings: 4,
          peopleCount: 4,
          status: 'planned',
          notes: undefined,
          preparedAt: undefined,
          consumedAt: undefined,
        });
      });

      await Promise.all(promises);
      showGlobalToast(`Added meal to ${selectedCells.size} cells`, 'success');
      clearSelection();
    } catch (error) {
      console.error('Failed to add meals to selected cells:', error);
      showGlobalToast('Failed to add meals', 'error');
    }
  };

  // Enhanced grocery list with status tracking
  type GroceryItemStatus = 'needed' | 'at_home' | 'in_cart' | 'purchased';

  interface GroceryItem {
    id: string;
    name: string;
    amount?: string;
    unit?: string;
    recipes: string[];
    status: GroceryItemStatus;
  }

  // Load grocery item statuses from localStorage for current week
  const groceryStorageKey = `grocery-statuses-${toKey(currentWeekStart)}`;
  const [groceryItemStatuses, setGroceryItemStatuses] = useState<Map<string, GroceryItemStatus>>(() => {
    try {
      const stored = localStorage.getItem(groceryStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load grocery statuses:', error);
    }
    return new Map();
  });

  // Persist grocery statuses to localStorage whenever they change
  useEffect(() => {
    try {
      const obj = Object.fromEntries(groceryItemStatuses);
      localStorage.setItem(groceryStorageKey, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save grocery statuses:', error);
    }
  }, [groceryItemStatuses, groceryStorageKey]);

  // Generate grocery list from current week's recipes
  const groceryList = useMemo(() => {
    const ingredientMap = new Map<string, { name: string; amount?: string; unit?: string; recipes: string[] }>();

    plannedMeals.forEach(meal => {
      if (meal.recipeId) {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            const existing = ingredientMap.get(key);

            if (existing) {
              if (!existing.recipes.includes(recipe.name)) {
                existing.recipes.push(recipe.name);
              }
            } else {
              ingredientMap.set(key, {
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                recipes: [recipe.name]
              });
            }
          });
        }
      }
    });

    const items: GroceryItem[] = Array.from(ingredientMap.values()).map(item => {
      const itemKey = item.name.toLowerCase().trim();
      return {
        id: itemKey,
        ...item,
        status: groceryItemStatuses.get(itemKey) || 'needed'
      };
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [plannedMeals, recipes, groceryItemStatuses]);

  const updateGroceryItemStatus = (itemId: string, status: GroceryItemStatus) => {
    setGroceryItemStatuses(prev => {
      const next = new Map(prev);
      next.set(itemId, status);
      return next;
    });
  };

  const getStatusColor = (status: GroceryItemStatus) => {
    switch (status) {
      case 'at_home': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_cart': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'purchased': return 'bg-gray-100 text-gray-600 border-gray-300 line-through';
      default: return 'bg-white text-slate-900 border-slate-200';
    }
  };

  const neededItems = groceryList.filter(item => item.status === 'needed');
  const atHomeItems = groceryList.filter(item => item.status === 'at_home');
  const inCartItems = groceryList.filter(item => item.status === 'in_cart');
  const purchasedItems = groceryList.filter(item => item.status === 'purchased');

  // Filter recipes based on search query and favorites
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // Filter by favorites first
    if (showFavoritesOnly) {
      result = result.filter(recipe => recipe.isFavorite === true);
    }

    // Then filter by search query
    if (recipeSearchQuery.trim()) {
      const query = recipeSearchQuery.toLowerCase().trim();
      result = result.filter(recipe => {
        // Search in name
        if (recipe.name.toLowerCase().includes(query)) return true;

        // Search in tags
        if (recipe.tags?.some(tag => tag.toLowerCase().includes(query))) return true;

        // Search in cuisine
        if (recipe.cuisine?.toLowerCase().includes(query)) return true;

        // Search in difficulty
        if (recipe.difficulty?.toLowerCase().includes(query)) return true;

        return false;
      });
    }

    return result;
  }, [recipes, recipeSearchQuery, showFavoritesOnly]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meal planning</h1>
          <p className="text-sm text-slate-600">Plan your week, import recipes, and keep dinner decisions simple.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date picker popover to anchor the week */}
          <DatePickerPopover
            value={currentWeekStart}
            onChange={(d) => setCurrentWeekStart(startOfWeek(d, { weekStartsOn }))}
            weekStartsOn={weekStartsOn}
          />
          <button
            type="button"
            onClick={() => setCurrentWeekStart((date) => addDays(date, -7))}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn }))}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setCurrentWeekStart((date) => addDays(date, 7))}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setShowGroceryList(true)}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            title="Generate grocery list from recipes"
          >
            Grocery List
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            title="Print weekly plan"
          >
            Print
          </button>
        </div>
      </header>

      {/* Selection toolbar */}
      {isSelectionMode && selectedCells.size > 0 && (
        <section className="rounded-lg border-2 border-indigo-500 bg-indigo-50 p-4 shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold text-sm">
                  {selectedCells.size}
                </div>
                <span className="text-sm font-medium text-indigo-900">
                  {selectedCells.size} cell{selectedCells.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <span className="text-xs text-indigo-600">
                Cmd/Ctrl + click to select more cells
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type meal name..."
                className="w-64 rounded-md border border-indigo-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      await addMealToSelectedCells('', value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-md border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Weekly overview moved to top */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm order-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <CalendarDays className="h-5 w-5 text-sky-500" />
          Weekly overview
        </h2>

        {isLoading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading meal plan…
          </div>
        )}

        {!isLoading && weekDays.length > 0 && (
          <div className="mt-6">
            <div className="overflow-x-auto">
              {/* Header row */}
              <div className="grid" style={{ gridTemplateColumns: `140px repeat(4, minmax(160px, 1fr))` }}>
                <div className="p-3 border-b border-r border-slate-200 sticky left-0 bg-white z-20" />
                {MEAL_TYPES.map((mealType) => (
                  <div
                    key={mealType}
                    className="p-3 border-b border-r border-slate-200 text-sm font-semibold text-slate-900 bg-white text-center capitalize"
                  >
                    {mealType}
                  </div>
                ))}
              </div>
              {/* Day rows */}
              {weekDays.map((d) => {
                const key = toKey(d);
                const today = new Date();
                const highlight = isSameDay(d, today);
                return (
                  <div key={key} className="grid" style={{ gridTemplateColumns: `140px repeat(4, minmax(160px, 1fr))` }}>
                    {/* Day label */}
                    <div className={`relative p-3 border-b border-r border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 flex flex-col justify-center sticky left-0 z-10`}>
                      {highlight && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500 rounded-r-sm" aria-hidden />
                      )}
                      <div className={highlight ? 'text-indigo-700 font-semibold' : ''}>
                        {format(d, 'EEE')}
                      </div>
                      <div className="text-xs text-slate-500">{format(d, 'MMM d')}</div>
                    </div>
                    {MEAL_TYPES.map((mealType) => {
                      const dayMeals = (mealsByDate[key] ?? []).filter((m) => m.mealType === mealType);
                      const cellKey = makeCellKey(key, mealType);
                      const isSelected = selectedCells.has(cellKey);
                      const hasContent = dayMeals.length > 0;

                      return (
                        <div
                          key={`${key}-${mealType}`}
                          className={`relative p-3 border-b border-l border-r border-slate-200 overflow-hidden cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-400' : ''
                          } ${hasContent ? 'bg-amber-50/30' : ''}`}
                          onClick={(e) => handleCellClick(key, mealType, e)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            if (!activePlan) return;
                            const optionName = e.dataTransfer.getData('text/meal-option');
                            if (optionName) {
                              await addPlannedMeal(activePlan.id, {
                                date: parseLocalDateKey(key),
                                mealType,
                                recipeId: undefined,
                                customMeal: optionName,
                                servings: 4,
                                peopleCount: 4,
                                status: 'planned',
                                notes: undefined,
                                preparedAt: undefined,
                                consumedAt: undefined,
                              });
                              return;
                            }

                            const recipeDragged = e.dataTransfer.getData('text/recipe-id');
                            if (recipeDragged) {
                              await addPlannedMeal(activePlan.id, {
                                date: parseLocalDateKey(key),
                                mealType,
                                recipeId: recipeDragged,
                                customMeal: undefined,
                                servings: 4,
                                peopleCount: 4,
                                status: 'planned',
                                notes: undefined,
                                preparedAt: undefined,
                                consumedAt: undefined,
                              });
                              return;
                            }

                            const mealId = e.dataTransfer.getData('text/meal-id');
                            if (!mealId) return;
                            if (e.altKey) {
                              // Copy
                              const source = plannedMeals.find((m) => m.id === mealId);
                              if (!source) return;
                              await addPlannedMeal(activePlan.id, {
                                date: parseLocalDateKey(key),
                                mealType,
                                recipeId: source.recipeId,
                                customMeal: source.customMeal,
                                servings: source.servings ?? 4,
                                peopleCount: source.peopleCount ?? source.servings ?? 4,
                                status: 'planned',
                                notes: undefined,
                                preparedAt: undefined,
                                consumedAt: undefined,
                              });
                            } else {
                              // Move
                              await updatePlannedMeal(mealId, { date: parseLocalDateKey(key), mealType });
                            }
                          }}
                        >
                          {highlight && (
                            <div className="absolute inset-y-0 left-0 w-1 bg-indigo-300" aria-hidden />
                          )}
                          {/* Chef hat indicator for populated cells */}
                          {hasContent && (
                            <div className="absolute top-1 right-1 z-10">
                              <ChefHat className="w-4 h-4 text-amber-600" />
                            </div>
                          )}
                          <div className="h-full overflow-auto space-y-2 group/cell relative">
                            {dayMeals.length > 0 ? (
                              <CellWithMeals
                                dateKey={key}
                                mealType={mealType}
                                dayMeals={dayMeals}
                                recipes={recipes}
                              />
                            ) : (
                              <AddMealControl
                                dateKey={key}
                                mealType={mealType}
                                showByDefault={true}
                                compact={false}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {null}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* v2: Meal Options manager */}
        {/* <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Meal options</h2>
          <p className="text-sm text-slate-600">Curate quick-pick options for each meal. These appear first when typing in the weekly planner.</p>
          <MealOptionsManager />
        </div> */}

        {/* Video → Recipe (YouTube) */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
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
          }}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Youtube className="h-5 w-5 text-rose-600" />
            Video to Recipe
          </h2>
          <p className="mt-1 text-sm text-slate-600">Paste a YouTube link. We’ll extract the title, thumbnail, ingredients and steps from the description.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={videoLang}
              onChange={(e) => setVideoLang(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              title="Caption language"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="hi">Hindi</option>
              <option value="ja">Japanese</option>
            </select>
            <button
              type="submit"
              disabled={isVideoImporting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-60"
            >
              {isVideoImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Convert
            </button>
          </div>
          {videoImportError && <p className="mt-3 text-sm text-rose-600">{videoImportError}</p>}

          {isVideoImporting && !videoDraft && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 animate-pulse">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-6 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-40 w-full rounded bg-slate-200" />
                <div className="mt-3 h-3 w-5/6 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="mt-3 h-9 w-full rounded bg-slate-200" />
                <div className="mt-2 h-9 w-1/2 rounded bg-slate-200" />
                <div className="mt-4 h-9 w-32 rounded-full bg-slate-200" />
              </div>
            </div>
          )}

          {videoDraft && (
            <div className={`mt-6 grid gap-4 ${videoDraft.instructions.length > 0 ? 'sm:grid-cols-2' : ''}`}>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><ChefHat className="h-4 w-4 text-amber-500" /> Preview</h3>
                <p className="mt-2 text-base font-medium text-slate-900">{videoDraft.name}</p>
                {videoDraft.image && (
                  <img src={videoDraft.image} alt="Recipe thumbnail" className="mt-2 w-full rounded" />
                )}
                {videoDraft.description && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-4">{videoDraft.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">Prep {videoDraft.prepTime} min • Cook {videoDraft.cookTime} min • Serves {videoDraft.servings}</p>
                <div className={`mt-3 grid gap-4 ${videoDraft.instructions.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Ingredients</p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
                      {videoDraft.ingredients.map((i, idx) => <li key={idx}>{i.name}</li>)}
                    </ul>
                  </div>
                  {videoDraft.instructions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Steps</p>
                      <ol className="mt-1 list-decimal pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
                        {videoDraft.instructions.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Add to recipes</h3>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!videoDraft) return;
                      try { await addRecipe(videoDraft); setVideoDraft(null); }
                      catch { setVideoImportError('Failed to save recipe'); }
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    <Save className="h-4 w-4" /> Save recipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoDraft(null)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        <form onSubmit={handleImportRecipe} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            Clip from URL
          </h2>
          <p className="mt-1 text-sm text-slate-600">Paste a recipe link. We’ll fetch title, image, ingredients and steps.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={importUrl}
              onChange={(event) => setImportUrl(event.target.value)}
              placeholder="https://example.com/recipe/..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Clip recipe
            </button>
          </div>
          {importError && <p className="mt-3 text-sm text-rose-600">{importError}</p>}

          {isImporting && !importDraft && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 animate-pulse">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-6 w-3/4 rounded bg-slate-200" />
                <div className="mt-3 h-40 w-full rounded bg-slate-200" />
                <div className="mt-3 h-3 w-5/6 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="mt-3 h-9 w-full rounded bg-slate-200" />
                <div className="mt-2 h-9 w-1/2 rounded bg-slate-200" />
                <div className="mt-4 h-9 w-32 rounded-full bg-slate-200" />
              </div>
            </div>
          )}

          {importDraft && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><ChefHat className="h-4 w-4 text-amber-500" /> Preview</h3>
                <p className="mt-2 text-base font-medium text-slate-900">{importDraft.name}</p>
                {importDraft.image && (
                  <img src={importDraft.image} alt="Recipe thumbnail" className="mt-2 w-full rounded" />
                )}
                {importDraft.description && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-4">{importDraft.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">Prep {importDraft.prepTime} min • Cook {importDraft.cookTime} min • Serves {importDraft.servings}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Save</h3>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={saveImportedRecipe}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    <Save className="h-4 w-4" /> Save recipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportDraft(null)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Paste Text → Recipe */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
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
          }}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ChefHat className="h-5 w-5 text-amber-600" />
            Paste Text
          </h2>
          <p className="mt-1 text-sm text-slate-600">Paste any recipe text. We’ll extract ingredients and directions heuristically.</p>
          <div className="mt-3 grid gap-3">
            <input
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="Optional title"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={textImageUrl}
              onChange={(e) => setTextImageUrl(e.target.value)}
              placeholder="Optional image URL"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <textarea
              rows={8}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ingredients and directions..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isTextParsing}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isTextParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Parse text
            </button>
            <button
              type="button"
              onClick={() => { setTextInput(''); setTextTitle(''); setTextImageUrl(''); setTextError(null); setTextDraft(null); }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
          {textError && <p className="mt-3 text-sm text-rose-600">{textError}</p>}

          {textDraft && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><ChefHat className="h-4 w-4 text-amber-500" /> Preview</h3>
                <p className="mt-2 text-base font-medium text-slate-900">{textDraft.name}</p>
                { (textDraft.image || textImageUrl) && (
                  <img src={textDraft.image || textImageUrl} alt="Recipe" className="mt-2 w-full rounded object-cover" />
                )}
                {textDraft.description && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-4">{textDraft.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">Prep {textDraft.prepTime} min • Cook {textDraft.cookTime} min • Serves {textDraft.servings}</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Ingredients</p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 max-h-36 overflow-auto">
                      {textDraft.ingredients.map((i, idx) => <li key={idx}>{i.name}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Steps</p>
                    <ol className="mt-1 list-decimal pl-4 text-xs text-slate-600 max-h-36 overflow-auto">
                      {textDraft.instructions.map((s, idx) => <li key={idx}>{s}</li>)}
                    </ol>
                  </div>
                </div>
                {(textDraft.tags?.some(t => t.startsWith('equip:')) || textDraft.notes) && (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {textDraft.tags?.some(t => t.startsWith('equip:')) && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Equipment</p>
                        <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 max-h-28 overflow-auto">
                          {textDraft.tags.filter(t => t.startsWith('equip:')).map((t, i) => <li key={i}>{t.replace('equip:','')}</li>)}
                        </ul>
                      </div>
                    )}
                    {textDraft.notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Tips</p>
                        <div className="mt-1 text-xs text-slate-600 whitespace-pre-wrap max-h-28 overflow-auto">{textDraft.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-900">Add to recipes</h3>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!textDraft) return;
                      try {
                        await addRecipe({ ...textDraft, image: (textDraft.image || textImageUrl) || undefined });
                        setTextDraft(null);
                        setTextImageUrl('');
                      } catch (e) {
                        console.error('Save recipe failed', e);
                        const msg = e instanceof Error ? e.message : 'Failed to save recipe';
                        setTextError(msg);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    <Save className="h-4 w-4" /> Save recipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextDraft(null)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Removed Schedule a meal form (inline add and drag/drop now available in the grid above) */}
      </section>

      {/* Removed duplicate weekly overview (moved to top) */}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Saved recipes</h2>
          <div className="flex items-center gap-2">
            {recipes.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
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
                  onClick={async () => {
                    if (confirm('Delete ALL saved recipes? This cannot be undone.')) {
                      try {
                        await useAppStore.getState().deleteAllRecipes?.()
                      } catch (e) {
                        console.error('Failed to delete all recipes', e)
                      }
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
          {recipes.length === 0 ? 'Your clipped recipes.' : `${filteredRecipes.length} of ${recipes.length} recipes${showFavoritesOnly ? ' (favorites)' : ''}`}
        </p>

        {recipes.length > 0 && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={recipeSearchQuery}
              onChange={(e) => setRecipeSearchQuery(e.target.value)}
              placeholder="Search recipes by name, tags, cuisine, or difficulty..."
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {recipeSearchQuery && (
              <button
                type="button"
                onClick={() => setRecipeSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Clip a recipe above to get started.
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            No recipes match your search. Try different keywords.
          </div>
        ) : (
          <>
            <SavedRecipesList recipes={filteredRecipes} />
          </>
        )}
      </section>

      {/* Enhanced Interactive Grocery List Modal */}
      {showGroceryList && (
        <ModalShell
          title="Smart Grocery List"
          subtitle={`Week of ${format(currentWeekStart, 'MMM d, yyyy')}`}
          onClose={() => setShowGroceryList(false)}
          maxWidthClass="max-w-4xl"
        >
            <div className="space-y-4">
              {/* Status Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <div className="text-2xl font-bold text-slate-900">{neededItems.length}</div>
                  <div className="text-xs text-slate-600">Needed</div>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{atHomeItems.length}</div>
                  <div className="text-xs text-green-600">At Home</div>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-700">{inCartItems.length}</div>
                  <div className="text-xs text-indigo-600">In Cart</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">{purchasedItems.length}</div>
                  <div className="text-xs text-gray-500">Purchased</div>
                </div>
              </div>

              {groceryList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <ChefHat className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-lg font-medium">No recipes with ingredients in this week's plan.</p>
                  <p className="mt-1 text-sm">Add some recipes to your meal plan to generate a grocery list.</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-auto">
                  {/* Needed Items */}
                  {neededItems.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-slate-700 mb-2 sticky top-0 bg-white py-2">
                        Items to Buy ({neededItems.length})
                      </h3>
                      <ul className="space-y-2">
                        {neededItems.map((item) => (
                          <li key={item.id} className={`flex items-start gap-3 rounded-lg border p-3 transition ${getStatusColor(item.status)}`}>
                            <div className="flex-1">
                              <div className="font-medium">
                                {item.amount && item.unit ? `${item.amount} ${item.unit} ` : item.amount ? `${item.amount} ` : ''}
                                {item.name}
                              </div>
                              <div className="mt-0.5 text-xs opacity-70">
                                For: {item.recipes.join(', ')}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => updateGroceryItemStatus(item.id, 'at_home')}
                                className="rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200"
                                title="Mark as at home"
                              >
                                At Home
                              </button>
                              <button
                                type="button"
                                onClick={() => updateGroceryItemStatus(item.id, 'in_cart')}
                                className="rounded px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                title="Add to cart"
                              >
                                Add to Cart
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* In Cart Items */}
                  {inCartItems.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-indigo-700 mb-2 sticky top-0 bg-white py-2">
                        In Your Cart ({inCartItems.length})
                      </h3>
                      <ul className="space-y-2">
                        {inCartItems.map((item) => (
                          <li key={item.id} className={`flex items-start gap-3 rounded-lg border p-3 transition ${getStatusColor(item.status)}`}>
                            <div className="flex-1">
                              <div className="font-medium">
                                {item.amount && item.unit ? `${item.amount} ${item.unit} ` : item.amount ? `${item.amount} ` : ''}
                                {item.name}
                              </div>
                              <div className="mt-0.5 text-xs opacity-70">
                                For: {item.recipes.join(', ')}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => updateGroceryItemStatus(item.id, 'needed')}
                                className="rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                                title="Move back to needed"
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                onClick={() => updateGroceryItemStatus(item.id, 'purchased')}
                                className="rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                                title="Mark as purchased"
                              >
                                Purchased
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* At Home Items */}
                  {atHomeItems.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-green-700 mb-2 sticky top-0 bg-white py-2">
                        Already at Home ({atHomeItems.length})
                      </h3>
                      <ul className="space-y-2">
                        {atHomeItems.map((item) => (
                          <li key={item.id} className={`flex items-start gap-3 rounded-lg border p-3 transition ${getStatusColor(item.status)}`}>
                            <div className="flex-1">
                              <div className="font-medium">
                                {item.amount && item.unit ? `${item.amount} ${item.unit} ` : item.amount ? `${item.amount} ` : ''}
                                {item.name}
                              </div>
                              <div className="mt-0.5 text-xs opacity-70">
                                For: {item.recipes.join(', ')}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateGroceryItemStatus(item.id, 'needed')}
                              className="rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                              title="Move back to needed"
                            >
                              Need to Buy
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{groceryList.length}</span> total items •
                <span className="font-medium text-indigo-600"> {inCartItems.length}</span> in cart
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = inCartItems.map(item => {
                      const amount = item.amount && item.unit ? `${item.amount} ${item.unit}` : item.amount || '';
                      return `☐ ${amount} ${item.name}`.trim();
                    }).join('\n');
                    navigator.clipboard.writeText(text);
                    showGlobalToast('Shopping list copied to clipboard!', 'success');
                  }}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Copy Cart List
                </button>
                <button
                  type="button"
                  onClick={() => setShowGroceryList(false)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            </div>
        </ModalShell>
      )}
    </div>
  );
};

function SavedRecipesList({ recipes }: { recipes: Recipe[] }) {
  const { deleteRecipe } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const editRecipe = useMemo(() => recipes.find((r) => r.id === editingId) || null, [editingId, recipes]);
  const viewRecipe = useMemo(() => recipes.find((r) => r.id === viewingId) || null, [viewingId, recipes]);
  return (
    <>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <RecipeCard
            key={r.id}
            recipe={r}
            onView={() => setViewingId(r.id!)}
            onEdit={() => setEditingId(r.id!)}
            onDelete={() => void deleteRecipe(r.id!)}
          />
        ))}
      </ul>
      {viewRecipe && <RecipeViewModal recipe={viewRecipe} onClose={() => setViewingId(null)} onEdit={() => { setEditingId(viewRecipe.id!); setViewingId(null); }} />}
      {editRecipe && <RecipeEditModal recipe={editRecipe} onClose={() => setEditingId(null)} />}
    </>
  );
}

export default MealPlanning;

// Compact recipe card with image header, overlay title, domain + quick actions
function RecipeCard({ recipe, onView, onEdit, onDelete }: { recipe: Recipe; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const { updateRecipe } = useAppStore();
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const domain = useMemo(() => {
    try { return recipe.sourceUrl ? new URL(recipe.sourceUrl).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
  }, [recipe.sourceUrl]);
  const favicon = domain ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}` : '';

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recipe.id) return;
    try {
      await updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <li
      onClick={onView}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-200 cursor-pointer flex flex-col"
    >
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
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
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
                >
                  <span>{domain}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              {totalTime > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm"><Clock className="h-3 w-3" /> {totalTime} min</span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm"><Users className="h-3 w-3" /> {recipe.servings || 1}</span>
            </div>
          </div>
        </div>
        <div className="absolute right-2 top-2 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
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
            onClick={() => onEdit()}
            className="rounded-md bg-white p-1.5 text-slate-700 hover:bg-slate-100 shadow-lg border border-slate-200"
            title="Edit recipe"
            aria-label="Edit recipe"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete()}
            className="rounded-md bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
            title="Delete recipe"
            aria-label="Delete recipe"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-3 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
              {recipe.name || 'Untitled Recipe'}
            </h3>
            {recipe.rating && (
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 ${i < recipe.rating! ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-xs text-slate-600 dark:text-slate-400 ml-1">({recipe.rating})</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={toggleFavorite}
              className={`rounded p-1.5 transition ${
                recipe.isFavorite
                  ? 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-5 w-5 ${recipe.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  console.log('[Globe] Fetching recipe for:', recipe.name);
                  const { updateRecipe } = useAppStore.getState();
                  const draft = await fetchRecipeFromGoogle(recipe.name);
                  console.log('[Globe] Fetched draft:', draft);

                  if (!draft) {
                    useAppStore.getState().showGlobalToast('❌ No recipe data received', 'error');
                    return;
                  }

                  if (!recipe.id) {
                    useAppStore.getState().showGlobalToast('❌ Recipe ID missing', 'error');
                    return;
                  }

                  console.log('[Globe] Updating recipe with ID:', recipe.id);
                  await updateRecipe(recipe.id, {
                    ...draft,
                    name: recipe.name, // Keep original name
                  });
                  console.log('[Globe] Recipe updated successfully');
                  useAppStore.getState().showGlobalToast('✅ Recipe updated!', 'success');
                } catch (error) {
                  console.error('[Globe] Failed to fetch recipe:', error);
                  const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                  useAppStore.getState().showGlobalToast(`❌ Failed: ${errorMsg}`, 'error');
                }
              }}
              className="rounded p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Fetch recipe from Google"
              aria-label="Fetch recipe from Google"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onEdit()}
              className="rounded p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Edit recipe"
              aria-label="Edit recipe"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete()}
              className="rounded p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete recipe"
              aria-label="Delete recipe"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <p className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
          {recipe.description || 'No description available'}
        </p>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

// ========= Recipe View (organized sections) =========
function RecipeViewModal({ recipe, onClose, onEdit }: { recipe: Recipe; onClose: () => void; onEdit: () => void }) {
  const [servingsView, setServingsView] = useState<number>(recipe.servings || 1);
  const factor = Math.max(0.25, (servingsView || 1) / Math.max(1, recipe.servings || 1));

  const scaleNumber = (n: number) => {
    const val = n * factor;
    // Format: prefer 1 decimal if needed
    return Math.abs(val - Math.round(val)) < 0.05 ? String(Math.round(val)) : String(Math.round(val * 10) / 10);
  };

  const scaleLine = (line: string): string => {
    const src = normalizeFractions(line);
    // Match patterns like: 1 1/2, 1/2, 2-3, 2 to 3, 2.5
    const patterns: RegExp[] = [
      /^(\d+)[\s-](\d)\/(\d)/, // mixed number at start e.g., 1 1/2
      /^(\d+)\/(\d+)/, // simple fraction
      /^(\d+(?:\.\d+)?)/, // decimal or integer
    ];
    for (const re of patterns) {
      const m = src.match(re);
      if (m) {
        if (re === patterns[0]) {
          const whole = parseInt(m[1], 10);
          const num = parseInt(m[2], 10);
          const den = parseInt(m[3], 10);
          const base = whole + num / den;
          const scaled = scaleNumber(base);
          return src.replace(re, scaled);
        }
        if (re === patterns[1]) {
          const num = parseInt(m[1], 10);
          const den = parseInt(m[2], 10);
          const base = num / den;
          const scaled = scaleNumber(base);
          return src.replace(re, scaled);
        }
        if (re === patterns[2]) {
          const base = parseFloat(m[1]);
          const scaled = scaleNumber(base);
          return src.replace(re, scaled);
        }
      }
    }
    return src; // fallback unchanged
  };

  const equipmentFromText = useMemo(() => {
    const tools = ['pan', 'pot', 'oven', 'skillet', 'bowl', 'whisk', 'knife', 'cutting board', 'blender', 'mixer', 'baking sheet', 'saucepan', 'spatula', 'tray', 'foil', 'tongs'];
    const text = `${(recipe.instructions || []).join(' ')} ${(recipe.description || '')}`.toLowerCase();
    const found: string[] = [];
    for (const t of tools) { if (text.includes(t) && !found.includes(t)) found.push(t); }
    // Also include equipment from tags: equip:*
    const equipTags = (recipe.tags || []).filter(t => t.startsWith('equip:')).map(t => t.replace('equip:',''));
    for (const e of equipTags) { if (!found.includes(e)) found.push(e); }
    return found;
  }, [recipe.instructions, recipe.description, recipe.tags]);

  return (
    <ModalShell
      title={recipe.name}
      subtitle="Recipe"
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      headerRight={
        <button onClick={onEdit} className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-800 hover:bg-slate-50">Edit</button>
      }
    >
        <div className="grid gap-4 md:grid-cols-2">
          {recipe.image && (
            <div className="md:col-span-2">
              <img src={recipe.image} alt={recipe.name} className="w-full h-56 object-cover rounded-lg border border-slate-200" />
            </div>
          )}
          {/* Directions */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Directions</h4>
            {recipe.instructions && recipe.instructions.length > 0 ? (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {recipe.instructions.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No directions provided.</p>
            )}
          </section>

          {/* Ingredients + Portion size */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Ingredients</h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Portion size</span>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={servingsView}
                  onChange={(e) => setServingsView(Math.max(0.25, Number(e.target.value) || recipe.servings || 1))}
                  className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing.amount ? `${scaleNumber(Number(ing.amount))} ${ing.unit ?? ''} ${ing.name}`.trim() : scaleLine(ing.name)}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No ingredients listed.</p>
            )}
          </section>

          {/* Duration */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Duration</h4>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-slate-700">
              <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="text-xs text-slate-500">Prep</div>
                <div className="font-medium">{recipe.prepTime ?? 0} min</div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="text-xs text-slate-500">Cook</div>
                <div className="font-medium">{recipe.cookTime ?? 0} min</div>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2 text-center">
                <div className="text-xs text-slate-500">Total</div>
                <div className="font-medium">{(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min</div>
              </div>
            </div>
          </section>

          {/* Equipment */}
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-900">Equipment</h4>
            {equipmentFromText.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {equipmentFromText.map((t) => <li key={t}>{t}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No equipment detected.</p>
            )}
          </section>

          {/* Tips */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
            <h4 className="text-sm font-semibold text-slate-900">Tips</h4>
            {recipe.notes ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{recipe.notes}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No tips yet.</p>
            )}
          </section>
        </div>
    </ModalShell>
  );
}
