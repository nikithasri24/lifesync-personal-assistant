/**
 * Habits Domain Constants
 */

export const CATEGORIES = [
  'general',
  'health',
  'fitness',
  'learning',
  'work',
  'personal',
  'creative',
  'social'
] as const;

export type HabitCategory = typeof CATEGORIES[number];
