/**
 * Mock for useHabitsQuery hooks
 * Used by Habits page tests
 */
import { vi } from 'vitest';

export const useHabits = vi.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
}));

export const useHabit = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
}));

export const useHabitEntries = vi.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
}));

export const useHabitEntriesForHabit = vi.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
}));

export const useCreateHabit = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useUpdateHabit = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useDeleteHabit = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useCreateHabitEntry = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useUpdateHabitEntry = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useDeleteHabitEntry = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useDeleteHabitEntriesForDate = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useDeleteHabitEntriesForDateRange = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

export const useDeleteAllHabitEntries = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
}));
