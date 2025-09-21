import React, { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays, format, isSameWeek, startOfWeek } from 'date-fns';
import { CalendarDays, ChefHat, Loader2, Plus, Trash2, Youtube } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { MealPlanWeek, PlannedMeal, Recipe } from '../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');
const ensureDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
    return parsed.searchParams.get('v');
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

async function fetchYoutubeRecipe(url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    throw new Error('Unable to extract YouTube video ID.');
  }

  const proxyBaseUrl = import.meta.env.VITE_YOUTUBE_SNIPPET_PROXY_URL?.trim();
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
  const ingredients = parsed.ingredients.length
    ? parsed.ingredients.map((line) => ({ name: line }))
    : [{ name: 'Ingredient 1' }, { name: 'Ingredient 2' }];

  const instructions = parsed.instructions.length
    ? parsed.instructions
    : ['Review the video steps and follow along.', 'Season to taste and serve.'];

  const flowChart = instructions.map((step, index) => ({
    id: `step-${index + 1}`,
    step: index + 1,
    title: `Step ${index + 1}`,
    description: step,
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
    deletePlannedMeal,
  } = useAppStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isEnsuringPlan, setIsEnsuringPlan] = useState(false);

  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string>(MEAL_TYPES[2]);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toKey(startOfWeek(new Date(), { weekStartsOn: 1 }))); // Monday
  const [servings, setServings] = useState(4);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    void loadRecipes();
    void loadMealPlans();
  }, [loadRecipes, loadMealPlans]);

  useEffect(() => {
    setSelectedDateKey(toKey(currentWeekStart));
  }, [currentWeekStart]);

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
        isSameWeek(ensureDate(plan.weekStartDate), currentWeekStart, { weekStartsOn: 1 }),
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
      await addRecipe(recipe);
      setImportUrl('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import recipe.';
      setImportError(message);
    } finally {
      setIsImporting(false);
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
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Week of</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{format(currentWeekStart, 'MMM d, yyyy')}</p>
          <p className="text-xs text-slate-500">{format(addDays(currentWeekStart, 6), 'MMM d')}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meals planned</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{plannedCount}</p>
          <p className="text-xs text-slate-500">{completedCount} eaten</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipes saved</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{recipes.length}</p>
          <p className="text-xs text-slate-500">Add more via YouTube imports or manual entries.</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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
        </form>

        <form onSubmit={handleScheduleMeal} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ChefHat className="h-5 w-5 text-amber-500" />
            Schedule a meal
          </h2>
          <p className="mt-1 text-sm text-slate-600">Choose a recipe, date, and meal type to add it to this week&apos;s plan.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Recipe</span>
              <select
                value={selectedRecipeId}
                onChange={(event) => setSelectedRecipeId(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select a recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Meal type</span>
              <select
                value={selectedMealType}
                onChange={(event) => setSelectedMealType(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Servings</span>
              <input
                type="number"
                min={1}
                value={servings}
                onChange={(event) => setServings(Number(event.target.value) || 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Date</span>
              <input
                type="date"
                value={selectedDateKey}
                onChange={(event) => setSelectedDateKey(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={isScheduling}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add to plan
            </button>
            {scheduleError && <p className="text-sm text-rose-600">{scheduleError}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {weekDays.map((date) => {
              const key = toKey(date);
              const dayMeals = mealsByDate[key] ?? [];
              return (
                <div key={key} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{format(date, 'EEEE')}</p>
                    <p className="text-xs text-slate-500">{format(date, 'MMM d')}</p>
                  </div>
                  {dayMeals.length === 0 ? (
                    <p className="text-sm text-slate-500">No meals planned yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {dayMeals.map((meal) => {
                        const recipe = recipes.find((item) => item.id === meal.recipeId);
                        return (
                          <li key={meal.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-slate-900">{recipe?.name ?? meal.customMeal ?? 'Meal'}</p>
                                <p className="text-xs text-slate-500">
                                  {meal.mealType} • Serves {meal.servings} • Status: {meal.status}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => deletePlannedMeal(meal.id)}
                                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100"
                                aria-label="Remove meal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Saved recipes</h2>
        <p className="text-sm text-slate-600">A quick reference list for meals you can schedule.</p>
        {recipes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Import a recipe above to get started.
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <li key={recipe.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <p className="font-semibold text-slate-900">{recipe.name}</p>
                {recipe.description && <p className="mt-1 text-xs text-slate-600">{recipe.description}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  Prep {recipe.prepTime} min • Cook {recipe.cookTime} min • Serves {recipe.servings}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MealPlanning;
