/**
 * Goals Domain Constants
 */

import type { LifeGoal, LifeDream } from './types/lifeGoals';

export const GOAL_CATEGORIES: LifeGoal['category'][] = [
  'personal',
  'health',
  'career',
  'financial',
  'fitness'
];

export const GOAL_PRIORITIES: LifeGoal['priority'][] = [
  'low',
  'medium',
  'high',
  'critical'
];

export const DREAM_CATEGORIES: LifeDream['category'][] = [
  'travel',
  'experiences',
  'possessions',
  'achievements',
  'relationships',
  'lifestyle'
];

export const DREAM_PRIORITIES: LifeDream['priority'][] = [
  'someday',
  'within-5-years',
  'within-10-years',
  'lifetime'
];

export const DREAM_STATUSES: LifeDream['status'][] = [
  'dreaming',
  'planning',
  'in-progress',
  'achieved',
  'no-longer-interested'
];
