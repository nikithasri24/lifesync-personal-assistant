import { logger } from '../../services/logger';
import type { Recipe } from '../../types';

// Type guard for checking if value is a string
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Type guard for checking if value is an array of strings
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

// Type guard for checking if value is an array of ingredient objects
function isIngredientArray(value: unknown): value is Array<{ name: string }> {
  return Array.isArray(value) && value.every(
    (item: unknown) => typeof item === 'object' && item !== null && 'name' in item && typeof (item as { name: unknown }).name === 'string'
  );
}

// Interface for recipe data from API
interface RecipeApiResponse {
  name?: unknown;
  description?: unknown;
  ingredients?: unknown;
  instructions?: unknown;
  prepTime?: unknown;
  cookTime?: unknown;
  servings?: unknown;
  tags?: unknown;
  image?: unknown;
}

// Generic clipper: fetch via server-side endpoint that parses JSON-LD/OG tags
export async function fetchClippedRecipe(url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const envUrl: unknown = import.meta.env.VITE_RECIPE_CLIPPER_URL;
  const clipperBase: string = (isString(envUrl) ? envUrl.trim() : null) ?? '/api/clip/recipe';
  const apiUrl = `${clipperBase}${clipperBase.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`;
  let response: Response;
  try {
    response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
  } catch (_e) {
    throw new Error('Unable to reach the recipe clipper service.');
  }
  if (!response.ok) throw new Error('Failed to clip recipe.');
  const data: unknown = await response.json();
  const apiData = data as RecipeApiResponse;

  const ingredients = isIngredientArray(apiData.ingredients) && apiData.ingredients.length > 0
    ? apiData.ingredients
    : [{ name: 'Ingredient 1' }, { name: 'Ingredient 2' }];
  const instructions: string[] = isStringArray(apiData.instructions) && apiData.instructions.length > 0
    ? apiData.instructions
    : ['Follow the steps on the source page.'];

  const name = isString(apiData.name) ? apiData.name : null;
  const description = isString(apiData.description) ? apiData.description : null;
  const image = isString(apiData.image) ? apiData.image : null;

  const prepTime = Number.isFinite(Number(apiData.prepTime)) ? Number(apiData.prepTime) : 10;
  const cookTime = Number.isFinite(Number(apiData.cookTime)) ? Number(apiData.cookTime) : 20;
  const servings = Number.isFinite(Number(apiData.servings)) ? Number(apiData.servings) : 2;

  const tags = isStringArray(apiData.tags) ? apiData.tags : ['clipped'];

  return {
    name: name ?? 'Clipped Recipe',
    description: description ?? '',
    ingredients,
    instructions,
    prepTime,
    cookTime,
    servings,
    difficulty: 'medium',
    tags,
    rating: undefined,
    notes: undefined,
    image: image ?? undefined,
    isFavorite: false,
    calories: undefined,
    cuisine: 'other',
    dietaryRestrictions: [],
    nutritionInfo: undefined,
    flowChart: undefined,
    sourceType: 'manual',
    sourceUrl: url,
    videoThumbnail: undefined,
  };
}

// Auto-fetch recipe from Google search
export async function fetchRecipeFromGoogle(mealName: string): Promise<Omit<Recipe, 'id' | 'createdAt'> | null> {
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
    const apiUrl = `/api/recipe/search?q=${encodeURIComponent(mealName)}`;
    const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      logger.warn('RecipeUtils', 'Recipe search failed (non-OK). Using scaffold.');
      return scaffold(mealName);
    }

    const data: unknown = await response.json();
    const apiData = data as RecipeApiResponse;

    const ingredients = isIngredientArray(apiData.ingredients) && apiData.ingredients.length > 0
      ? apiData.ingredients
      : [{ name: 'Add ingredients...' }];
    const instructions: string[] = isStringArray(apiData.instructions) && apiData.instructions.length > 0
      ? apiData.instructions
      : ['Add instructions...'];

    const name = isString(apiData.name) ? apiData.name : null;
    const description = isString(apiData.description) ? apiData.description : null;
    const image = isString(apiData.image) ? apiData.image : null;

    const prepTime = Number.isFinite(Number(apiData.prepTime)) ? Number(apiData.prepTime) : undefined;
    const cookTime = Number.isFinite(Number(apiData.cookTime)) ? Number(apiData.cookTime) : undefined;
    const servings = Number.isFinite(Number(apiData.servings)) ? Number(apiData.servings) : 4;

    const tags = isStringArray(apiData.tags) ? apiData.tags : ['auto-fetched'];

    return {
      name: name ?? mealName,
      description: description ?? '',
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty: 'medium',
      tags,
      rating: undefined,
      notes: undefined,
      image: image ?? undefined,
      isFavorite: false,
      calories: undefined,
      cuisine: 'other',
      dietaryRestrictions: [],
      nutritionInfo: undefined,
    };
  } catch (error) {
    logger.warn('RecipeUtils', 'Failed to fetch recipe from Google. Using scaffold', { error: error as Error });
    return scaffold(mealName);
  }
}
