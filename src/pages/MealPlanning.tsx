import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays, format, isSameWeek, startOfWeek } from 'date-fns';
import { CalendarDays, ChefHat, Loader2, Plus, Trash2, Youtube, Save, FileText, Pencil } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { MealPlanWeek, PlannedMeal, Recipe } from '../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');
const ensureDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

// Parse a yyyy-MM-dd key into a local Date at midnight (avoid UTC shift)
function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((s) => Number(s));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function AddMealControl({ dateKey, mealType, onAdded }: { dateKey: string; mealType: string; onAdded?: () => void }) {
  const { recipes, addPlannedMeal, mealPlans, ensureMealPlanForWeek, mealOptions } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [showList, setShowList] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const opts = mealOptions[mealType as 'breakfast'|'lunch'|'dinner'|'snack'] || []
    const optionMatches = (q ? opts.filter(o => o.toLowerCase().includes(q)) : opts).slice(0, 5).map((name) => ({ id: `__opt__:${name}`, name }))
    const recipeMatches = (q ? recipes.filter(r => r.name.toLowerCase().includes(q)) : recipes).slice(0, 6)
    // Merge: options first, then recipes
    return [...optionMatches, ...recipeMatches]
  }, [query, recipes, mealOptions, mealType]);

  const add = async (recipeId?: string, customMeal?: string) => {
    const plan = mealPlans.find(p => isSameWeek(ensureDate(p.weekStartDate), startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn: 0 })))
      || await ensureMealPlanForWeek(startOfWeek(parseLocalDateKey(dateKey), { weekStartsOn: 0 }));
    if (!plan) return;
    await addPlannedMeal(plan.id, {
      date: parseLocalDateKey(dateKey),
      mealType,
      recipeId,
      customMeal,
      servings: 4,
      peopleCount: 4,
      status: 'planned',
      notes: undefined,
      preparedAt: undefined,
      consumedAt: undefined,
    });
    setQuery('');
    setShowList(false);
    onAdded?.();
  };

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matches.length > 0 && query.trim().toLowerCase() === (matches[0] as any).name.toLowerCase()) {
        const first = matches[0] as any
        if (String(first.id).startsWith('__opt__:')) await add(undefined, first.name)
        else await add(first.id)
      } else if (matches.length > 0 && query.trim().length > 0) {
        const first = matches[0] as any
        if (String(first.id).startsWith('__opt__:')) await add(undefined, first.name)
        else await add(first.id)
      } else if (query.trim()) {
        await add(undefined, query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowList(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onKeyDown={onKeyDown}
        placeholder="Type to add…"
        className="w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm md:text-base shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {showList && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {matches.length === 0 && query.trim().length > 0 ? (
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(undefined, query)}
            >
              + Add “{query.trim()}”
            </button>
          ) : (
            matches.map((r: any) => (
              <button
                key={r.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (String(r.id).startsWith('__opt__:') ? add(undefined, r.name) : add(r.id))}
                title={r.name}
              >
                {String(r.id).startsWith('__opt__:') ? `• ${r.name}` : r.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    // youtu.be/<id>
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
    // youtube.com/shorts/<id>
    if (parsed.pathname.startsWith('/shorts/')) {
      const parts = parsed.pathname.split('/');
      return parts[2] || null;
    }
    // youtube.com/watch?v=<id>
    const v = parsed.searchParams.get('v');
    if (v) return v;
    // last attempt: regex for 11-char id
    const match = url.match(/[?&]v=([0-9A-Za-z_-]{11})|(?:youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/);
    if (match) return (match[1] || match[2]) ?? null;
    return null;
  } catch (error) {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  }
}

function parseDescription(description: string) {
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ingredients: string[] = [];
  const instructions: string[] = [];
  let inIngredients = false;
  let inInstructions = false;

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (lower.includes('ingredient')) {
      inIngredients = true;
      inInstructions = false;
      return;
    }
    if (lower.includes('instruction') || lower.includes('direction')) {
      inInstructions = true;
      inIngredients = false;
      return;
    }

    if (inIngredients) {
      ingredients.push(line);
    } else if (inInstructions) {
      instructions.push(line);
    }
  });

  return {
    ingredients,
    instructions,
    summary: lines[0],
  };
}

// Parse timecodes like 1:23, 12:34, 1:02:03, or [00:45] and map to seconds
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

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function extractFlowFromDescription(description: string): { titles: string[]; steps: { title: string; description: string }[] } | null {
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Try timecoded lines first
  const timecoded: Array<{ t: number; text: string }> = [];
  for (const line of lines) {
    const t = parseTimecodeToSeconds(line);
    if (t != null) {
      // Remove leading timecode and separators like ' - ' or ':' after the time
      const text = line
        .replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–—:]?\s*/i, '')
        .trim();
      if (text) timecoded.push({ t, text });
    }
  }
  if (timecoded.length >= 2) {
    timecoded.sort((a, b) => a.t - b.t);
    const steps = timecoded.map((entry, idx) => {
      const nextT = timecoded[idx + 1]?.t;
      const approx = nextT ? Math.max(1, Math.round((nextT - entry.t) / 60)) : undefined;
      const desc = `Starts at ${formatSeconds(entry.t)}${approx ? ` • ~${approx} min` : ''}`;
      return { title: entry.text, description: desc };
    });
    return { titles: timecoded.map((e) => e.text), steps };
  }

  // Fallback: enumerated or bulleted steps from general instructions-like lines
  const numbered = lines
    .map((l) => l.replace(/^\d+\.|^[-*•]\s*/, '').trim())
    .filter((l) => l.length > 0);
  if (numbered.length >= 2) {
    const steps = numbered.map((text, i) => ({ title: text, description: `Step ${i + 1}` }));
    return { titles: numbered, steps };
  }
  return null;
}

async function fetchYoutubeRecipe(url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    throw new Error('Unable to extract YouTube video ID.');
  }

  const proxyBaseUrl = import.meta.env.VITE_YOUTUBE_SNIPPET_PROXY_URL?.trim() || '/api/youtube/snippet';
  const apiUrl = proxyBaseUrl
    ? `${proxyBaseUrl}${proxyBaseUrl.includes('?') ? '&' : '?'}videoId=${encodeURIComponent(videoId)}`
    : `https://yt.lemnoslife.com/videos?part=snippet&id=${encodeURIComponent(videoId)}`;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    throw new Error('Unable to reach the recipe metadata service.');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch video metadata.');
  }

  const data = await response.json();
  const snippet = data?.items?.[0]?.snippet;
  if (!snippet) {
    throw new Error('Video metadata not available.');
  }

  const parsed = parseDescription(snippet.description ?? '');
  const flowExtract = extractFlowFromDescription(snippet.description ?? '');
  const ingredients = parsed.ingredients.length
    ? parsed.ingredients.map((line) => ({ name: line }))
    : [{ name: 'Ingredient 1' }, { name: 'Ingredient 2' }];

  const instructions = flowExtract?.titles?.length
    ? flowExtract.titles
    : parsed.instructions.length
      ? parsed.instructions
      : ['Review the video steps and follow along.', 'Season to taste and serve.'];

  const flowChart = (flowExtract?.steps || instructions.map((step) => ({ title: step, description: '' }))).map((item, index) => ({
    id: `step-${index + 1}`,
    step: index + 1,
    title: item.title || `Step ${index + 1}`,
    description: item.description || '',
  }));

  const prepTime = Math.max(15, ingredients.length * 3);
  const cookTime = Math.max(20, instructions.length * 4);

  return {
    name: snippet.title ?? 'YouTube Recipe',
    description: parsed.summary ?? snippet.description?.split('\n')[0] ?? '',
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings: 4,
    difficulty: 'medium',
    tags: ['imported', 'youtube'],
    rating: undefined,
    notes: undefined,
    image: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
    flowChart,
    sourceType: 'youtube',
    sourceUrl: url,
    authorName: snippet.channelTitle ?? undefined,
    videoThumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? undefined,
  };
}

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

  const [form, setForm] = useState({
    name: recipe.name || '',
    description: recipe.description || '',
    servings: String(recipe.servings ?? 1),
    prepTime: String(recipe.prepTime ?? 0),
    cookTime: String(recipe.cookTime ?? 0),
    difficulty: recipe.difficulty || 'medium',
    tags: (recipe.tags || []).join(', '),
    instructions: (recipe.instructions || []).join('\n'),
  });

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Edit recipe</h3>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
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
            <span className="font-medium text-slate-700">Instructions (one per line)</span>
            <textarea
              rows={6}
              value={form.instructions}
              onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  } = useAppStore();

  const { weekStartsOn, setWeekStartsOn } = useAppStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn }));
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isEnsuringPlan, setIsEnsuringPlan] = useState(false);

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

  useEffect(() => {
    void loadRecipes();
    void loadMealPlans();
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

  useEffect(() => {
    let isActive = true;
    setIsEnsuringPlan(true);
    ensureMealPlanForWeek(currentWeekStart)
      .then((plan) => {
        if (isActive) {
          setActivePlanId(plan.id);
        }
      })
      .catch((error) => {
        console.error('Failed to ensure meal plan', error);
      })
      .finally(() => {
        if (isActive) {
          setIsEnsuringPlan(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [currentWeekStart, ensureMealPlanForWeek]);

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
  }, [activePlanId, mealPlans, currentWeekStart]);

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
      const recipe = await fetchYoutubeRecipe(importUrl.trim());
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

  const saveAndScheduleImported = async () => {
    if (!importDraft || !activePlan) return;
    try {
      const saved = await addRecipe(importDraft);
      await addPlannedMeal(activePlan.id, {
        date: parseLocalDateKey(importScheduleDateKey),
        mealType: importScheduleType,
        recipeId: saved.id,
        customMeal: undefined,
        servings: importDraft.servings ?? 4,
        peopleCount: importDraft.servings ?? 4,
        status: 'planned',
        notes: undefined,
        preparedAt: undefined,
        consumedAt: undefined,
      });
      setImportDraft(null);
    } catch (e) {
      setImportError('Failed to save & schedule');
    }
  };

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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meal planning</h1>
          <p className="text-sm text-slate-600">Plan your week, import recipes, and keep dinner decisions simple.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentWeekStart((date) => addDays(date, -7))}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            title="Print weekly plan"
          >
            Print
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
        </div>
      </header>

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
          <div className="mt-6 overflow-x-hidden print:overflow-visible">
            <div className="w-full">
              {/* Header row */}
              <div className="grid" style={{ gridTemplateColumns: `150px repeat(7, minmax(0, 1fr))` }}>
                <div className="p-3 border-b border-r border-slate-200 sticky left-0 bg-white z-20" />
                {weekDays.map((d) => (
                  <div key={toKey(d)} className="p-3 border-b border-r border-slate-200 text-sm font-semibold text-slate-900 sticky top-0 bg-white z-10 text-center overflow-hidden">
                    <div title={format(d, 'EEEE')}>{format(d, 'EEE')}</div>
                    <div className="text-xs text-slate-500">{format(d, 'MMM d')}</div>
                  </div>
                ))}
              </div>
              {/* Meal rows */}
              {MEAL_TYPES.map((mealType) => (
                <div key={mealType} className="grid" style={{ gridTemplateColumns: `150px repeat(7, minmax(0, 1fr))` }}>
                  {/* Row label */}
                  <div className="p-3 border-b border-r border-slate-200 bg-slate-50 text-sm font-medium capitalize text-slate-800 flex items-center sticky left-0 z-10">
                    {mealType}
                  </div>
                  {weekDays.map((d) => {
                    const key = toKey(d);
                    const dayMeals = (mealsByDate[key] ?? []).filter((m) => m.mealType === mealType);
                    return (
                      <div
                        key={`${key}-${mealType}`}
                        className="p-3 border-b border-l border-r border-slate-200 h-[160px] overflow-hidden"
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
                        <div className="h-full overflow-auto space-y-2">
                          {dayMeals.length === 0 ? (
                            <AddMealControl dateKey={key} mealType={mealType} />
                          ) : (
                            <ul className="space-y-1">
                              {dayMeals.map((meal) => {
                                const recipe = recipes.find((item) => item.id === meal.recipeId);
                                return (
                                  <li
                                    key={meal.id}
                                    className="group text-xs rounded border border-slate-200 bg-white px-2 py-1 flex items-center justify-between gap-2"
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/meal-id', meal.id);
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    title="Drag to another cell (hold Alt to copy)"
                                  >
                                    <span className="truncate" title={recipe?.name ?? meal.customMeal ?? 'Meal'}>
                                      {recipe?.name ?? meal.customMeal ?? 'Meal'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => deletePlannedMeal(meal.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                      aria-label="Remove meal"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {null}

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Meal Options manager */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Meal options</h2>
          <p className="text-sm text-slate-600">Curate quick-pick options for each meal. These appear first when typing in the weekly planner.</p>
          <MealOptionsManager />
        </div>
        
        <form onSubmit={handleImportRecipe} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Youtube className="h-5 w-5 text-rose-500" />
            Import from YouTube
          </h2>
          <p className="mt-1 text-sm text-slate-600">Paste a video link and we will parse the description into ingredients and steps.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={importUrl}
              onChange={(event) => setImportUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Import recipe
            </button>
          </div>
          {importError && <p className="mt-3 text-sm text-rose-600">{importError}</p>}

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
                <h3 className="text-sm font-semibold text-slate-900">Save & schedule (optional)</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Meal type</span>
                    <select
                      value={importScheduleType}
                      onChange={(e) => setImportScheduleType(e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Date</span>
                    <input
                      type="date"
                      value={importScheduleDateKey}
                      onChange={(e) => setImportScheduleDateKey(e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>
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
                    onClick={saveAndScheduleImported}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    <Plus className="h-4 w-4" /> Save + add to plan
                  </button>
                  <button
                    type="button"
                    onClick={saveImportedAsNote}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    title="Save ingredients and steps as a note"
                  >
                    <FileText className="h-4 w-4" /> Save as note
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

        {/* Removed Schedule a meal form (inline add and drag/drop now available in the grid above) */}
      </section>

      {/* Removed duplicate weekly overview (moved to top) */}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Saved recipes</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                  // Enhance existing YouTube recipes by extracting steps from description
                  const updateRecipe = useAppStore.getState().updateRecipe;
                  const showGlobalToast = useAppStore.getState().showGlobalToast;
                  const vids = recipes.filter((r) => r.sourceType === 'youtube' && !!r.sourceUrl);
                  if (vids.length === 0) {
                    showGlobalToast?.('No YouTube recipes found to enhance', 'info');
                    return;
                  }
                  let success = 0;
                  let fail = 0;
                  for (const r of vids) {
                    try {
                      const id = extractYoutubeId(r.sourceUrl!);
                      if (!id) { fail++; continue; }
                      const proxyBaseUrl = import.meta.env.VITE_YOUTUBE_SNIPPET_PROXY_URL?.trim() || '/api/youtube/snippet';
                      const apiUrl = `${proxyBaseUrl}${proxyBaseUrl.includes('?') ? '&' : '?'}videoId=${encodeURIComponent(id)}`;
                      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
                      if (!res.ok) { fail++; continue; }
                      const data = await res.json();
                      const snippet = data?.items?.[0]?.snippet;
                      if (!snippet) { fail++; continue; }
                      const flowExtract = extractFlowFromDescription(snippet.description ?? '');
                      const parsed = parseDescription(snippet.description ?? '');
                      const instructions = (flowExtract?.titles?.length ? flowExtract.titles : (parsed.instructions.length ? parsed.instructions : r.instructions)) as string[];
                      if (instructions && instructions.length) {
                        await updateRecipe(r.id!, { instructions });
                        success++;
                      } else {
                        fail++;
                      }
                    } catch (err) {
                      console.error('Enhance recipe failed', r.id, err);
                      fail++;
                    }
                  }
                  showGlobalToast?.(`Updated steps for ${success}/${vids.length} recipes`, fail ? 'info' : 'success');
                }}
              className="text-xs rounded-md px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              title="Generate steps from video descriptions for YouTube recipes"
            >
              Generate steps for YouTube recipes
            </button>
            <button
              type="button"
              onClick={async () => {
                // Fallback: derive steps from existing descriptions for all recipes
                const updateRecipe = useAppStore.getState().updateRecipe;
                const showGlobalToast = useAppStore.getState().showGlobalToast;
                if (!recipes.length) {
                  showGlobalToast?.('No recipes found', 'info');
                  return;
                }
                let success = 0;
                for (const r of recipes) {
                  const flow = extractFlowFromDescription(r.description || '');
                  const parsed = parseDescription(r.description || '');
                  const instructions = (flow?.titles?.length ? flow.titles : parsed.instructions) as string[];
                  if (instructions && instructions.length) {
                    try { await updateRecipe(r.id!, { instructions }); success++; } catch {}
                  }
                }
                showGlobalToast?.(`Updated steps for ${success}/${recipes.length} recipes`, 'info');
              }}
              className="text-xs rounded-md px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              title="Generate steps using current recipe descriptions"
            >
              Generate steps from descriptions
            </button>
            {recipes.length > 0 && (
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
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600">A quick reference list for meals you can schedule.</p>
        {recipes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Import a recipe above to get started.
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mt-2">Tip: Drag a recipe into the weekly planner to add it.</p>
            <SavedRecipesList recipes={recipes} />
          </>
        )}
      </section>
    </div>
  );
};

function SavedRecipesList({ recipes }: { recipes: Recipe[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const recipe = useMemo(() => recipes.find((r) => r.id === editingId) || null, [editingId, recipes]);
  return (
    <>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <li
            key={r.id}
            className="group relative rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/recipe-id', r.id!);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            title="Drag into a day/meal cell to add"
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setEditingId(r.id!); }}
              className="absolute right-2 top-2 rounded-md bg-indigo-600 p-1 text-white shadow-sm hover:bg-indigo-500"
              title="Edit recipe"
              aria-label="Edit recipe"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <p className="font-semibold text-slate-900 pr-8">{r.name}</p>
            {r.description && <p className="mt-1 text-xs text-slate-600">{r.description}</p>}
            <p className="mt-2 text-xs text-slate-500">
              Prep {r.prepTime} min • Cook {r.cookTime} min • Serves {r.servings}
            </p>
            <RecipeMealTypeChips recipe={r} />
          </li>
        ))}
      </ul>
      {recipe && <RecipeEditModal recipe={recipe} onClose={() => setEditingId(null)} />}
    </>
  );
}

export default MealPlanning;
