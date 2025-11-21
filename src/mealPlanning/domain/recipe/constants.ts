/**
 * Recipe Domain Constants
 */

export const DEFAULT_SERVINGS = 4;
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

export const MIN_PREP_TIME = 0;
export const MAX_PREP_TIME = 480; // 8 hours

export const MIN_COOK_TIME = 0;
export const MAX_COOK_TIME = 480; // 8 hours

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const CUISINE_TYPES = [
  'american',
  'italian',
  'mexican',
  'chinese',
  'indian',
  'japanese',
  'thai',
  'mediterranean',
  'french',
  'korean',
  'other',
] as const;
export type CuisineType = typeof CUISINE_TYPES[number];

export const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'keto',
  'paleo',
  'low-carb',
] as const;
export type DietaryRestriction = typeof DIETARY_RESTRICTIONS[number];

export const SOURCE_TYPES = ['manual', 'video', 'url', 'api'] as const;
export type SourceType = typeof SOURCE_TYPES[number];
