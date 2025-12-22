/**
 * Habits Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (habits, entries, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useHabitsQuery.ts:
 * - useHabits() - Get all habits
 * - useHabit(id) - Get single habit
 * - useHabitEntries(habitId) - Get entries for a habit
 * - useAllHabitEntries() - Get all habit entries
 * - useCreateHabit() - Create habit
 * - useUpdateHabit() - Update habit
 * - useDeleteHabit() - Delete habit
 * - useLogHabit() - Log habit entry
 * - useUpdateHabitEntry() - Update habit entry
 * - useDeleteHabitEntry() - Delete habit entry
 *
 * Benefits of React Query:
 * - Automatic streak calculation updates
 * - Optimistic updates for instant UI feedback
 * - Better cache management for habit entries
 * - Automatic refetch on window focus
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import type { StateCreator } from 'zustand';

export interface HabitsSlice {
  // UI State only - no server data!
  habitsViewMode: 'grid' | 'list' | 'calendar';
  habitsFilterFrequency: 'all' | 'daily' | 'weekly' | 'monthly';
  habitsShowArchived: boolean;
  habitsSelectedDate: string | null;
  habitsSelectedCategory: string | null;
  habitsSortBy: 'name' | 'streak' | 'created_at';
  habitsSortOrder: 'asc' | 'desc';

  // UI Actions
  setHabitsViewMode: (mode: 'grid' | 'list' | 'calendar') => void;
  setHabitsFilterFrequency: (frequency: 'all' | 'daily' | 'weekly' | 'monthly') => void;
  setHabitsShowArchived: (show: boolean) => void;
  setHabitsSelectedDate: (date: string | null) => void;
  setHabitsSelectedCategory: (category: string | null) => void;
  setHabitsSortBy: (sortBy: 'name' | 'streak' | 'created_at') => void;
  setHabitsSortOrder: (order: 'asc' | 'desc') => void;
  resetHabitsFilters: () => void;
}

export const createHabitsSlice: StateCreator<HabitsSlice, [], [], HabitsSlice> = (set) => ({
  // Initial UI state
  habitsViewMode: 'grid',
  habitsFilterFrequency: 'all',
  habitsShowArchived: false,
  habitsSelectedDate: null,
  habitsSelectedCategory: null,
  habitsSortBy: 'name',
  habitsSortOrder: 'asc',

  // UI Actions
  setHabitsViewMode: (mode) => set({ habitsViewMode: mode }),
  setHabitsFilterFrequency: (frequency) => set({ habitsFilterFrequency: frequency }),
  setHabitsShowArchived: (show) => set({ habitsShowArchived: show }),
  setHabitsSelectedDate: (date) => set({ habitsSelectedDate: date }),
  setHabitsSelectedCategory: (category) => set({ habitsSelectedCategory: category }),
  setHabitsSortBy: (sortBy) => set({ habitsSortBy: sortBy }),
  setHabitsSortOrder: (order) => set({ habitsSortOrder: order }),
  resetHabitsFilters: () =>
    set({
      habitsFilterFrequency: 'all',
      habitsShowArchived: false,
      habitsSelectedDate: null,
      habitsSelectedCategory: null,
    }),
});
