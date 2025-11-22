import { logger } from '../../services/logger';
import type { Recipe } from '../../types';

// Generic clipper: fetch via server-side endpoint that parses JSON-LD/OG tags
export async function fetchClippedRecipe(url: string): Promise<Omit<Recipe, 'id' | 'createdAt'>> {
  const clipperBase = import.meta.env.VITE_RECIPE_CLIPPER_URL?.trim() || '/api/clip/recipe';
  const apiUrl = `${clipperBase}${clipperBase.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`;
  let response: Response;
  try {
    response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
  } catch (_e) {
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
    logger.warn('RecipeUtils', 'Failed to fetch recipe from Google. Using scaffold:', error);
    return scaffold(mealName);
  }
}
