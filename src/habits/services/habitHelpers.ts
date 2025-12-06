/**
 * Habit Helper Functions
 */

import type { HabitData } from '../../services/types';
import type { HabitDraft } from '../types';

export const createDraft = (): HabitDraft => ({
  name: '',
  description: '',
  frequency: 'daily',
  category: 'general',
  color: '#22c55e',
  targetValue: '1',
});

export const toHabitDraft = (habit: HabitData): HabitDraft => ({
  name: habit.name,
  description: habit.description ?? '',
  frequency: (habit.frequency ?? 'daily'),
  category: habit.category ?? 'general',
  color: habit.color ?? '#22c55e',
  targetValue: String(habit.target_value ?? 1),
});
