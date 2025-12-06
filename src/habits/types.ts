/**
 * Habits Domain Types
 */

import type { HabitData } from '../services/types';

export type HabitDraft = {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  color: string;
  targetValue: string;
};

export type HabitWithStats = {
  habit: HabitData;
  todayCompletions: number;
  targetCount: number;
  hasReachedTarget: boolean;
  currentStreak: number;
  totalCompletions: number;
};
