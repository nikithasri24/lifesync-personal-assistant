/**
 * Habits Zustand Slice
 *
 * MIGRATION STATUS: React Query hooks available
 * - New React Query hooks: /src/habits/hooks/useHabitsQuery.ts
 * - Recommended: Use React Query hooks for new features
 * - This slice is maintained for backward compatibility
 *
 * Migration Guide:
 * - Replace `loadHabits()` with `useHabitsQuery()`
 * - Replace `loadHabitEntries()` with `useAllHabitEntriesQuery()`
 * - Replace `loadHabitEntriesForHabit()` with `useHabitEntriesQuery(habitId)`
 * - Replace `addHabit()` with `useCreateHabitMutation()`
 * - Replace `updateHabit()` with `useUpdateHabitMutation()`
 * - Replace `deleteHabit()` with `useDeleteHabitMutation()`
 * - Replace `addHabitEntry()` with `useLogHabitMutation()`
 * - Replace `updateHabitEntry()` with `useUpdateHabitEntryMutation()`
 * - Replace `deleteHabitEntry()` with `useDeleteHabitEntryMutation()`
 *
 * Benefits of React Query:
 * - Automatic streak calculation updates
 * - Optimistic updates for instant UI feedback
 * - Better cache management for habit entries
 * - Automatic refetch on window focus
 */

import type { StateCreator } from 'zustand';
import type { HabitData, HabitEntryData } from '@/services/types';
import {
  createHabit,
  createHabitEntry,
  deleteHabit,
  deleteHabitEntry,
  deleteHabitEntriesForDate,
  getHabit,
  getHabitEntries,
  getHabitEntriesForHabit,
  getHabits,
  updateHabit,
  updateHabitEntry,
} from '@/api/habitsAPI';

export type HabitInput = Omit<HabitData, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type HabitEntryInput = Omit<HabitEntryData, 'id' | 'created_at'>;

export interface HabitsSlice {
  habits: HabitData[];
  habitsLoaded: boolean;
  habitsLoading: boolean;
  habitsError: string | null;

  habitEntries: Record<string, HabitEntryData[]>;
  habitEntriesLoading: boolean;

  loadHabits: (filters?: Parameters<typeof getHabits>[0]) => Promise<void>;
  loadHabitEntries: (filters?: Parameters<typeof getHabitEntries>[0]) => Promise<void>;
  loadHabitEntriesForHabit: (habitId: string) => Promise<void>;
  addHabit: (habit: HabitInput) => Promise<HabitData>;
  updateHabit: (id: string, updates: Partial<HabitData>) => Promise<HabitData>;
  deleteHabit: (id: string) => Promise<void>;
  addHabitEntry: (entry: HabitEntryInput) => Promise<HabitEntryData>;
  updateHabitEntry: (id: string, updates: Partial<HabitEntryData>) => Promise<HabitEntryData>;
  deleteHabitEntry: (id: string, habitId: string) => Promise<void>;
  deleteHabitEntryForDate: (habitId: string, date: string) => Promise<void>;
  getHabitById: (id: string) => HabitData | undefined;
}

export const createHabitsSlice: StateCreator<HabitsSlice, [], [], HabitsSlice> = (set, get) => ({
  habits: [],
  habitsLoaded: false,
  habitsLoading: false,
  habitsError: null,
  habitEntries: {},
  habitEntriesLoading: false,

  loadHabits: async (filters) => {
    if (get().habitsLoading) return;
    set({ habitsLoading: true, habitsError: null });
    try {
      const habits = await getHabits(filters);
      set({ habits, habitsLoaded: true, habitsLoading: false });
    } catch (error) {
      set({
        habitsError: error instanceof Error ? error.message : 'Failed to load habits',
        habitsLoading: false,
      });
      throw error;
    }
  },

  loadHabitEntries: async (filters) => {
    set({ habitEntriesLoading: true });
    try {
      const entries = await getHabitEntries(filters);
      // Group by habit_id
      const grouped = entries.reduce<Record<string, HabitEntryData[]>>((acc, entry) => {
        const key = entry.habit_id;
        acc[key] = acc[key] ? [...acc[key], entry] : [entry];
        return acc;
      }, {});
      set((state) => ({ habitEntries: { ...state.habitEntries, ...grouped }, habitEntriesLoading: false }));
    } catch (error) {
      set({ habitEntriesLoading: false });
      throw error;
    }
  },

  loadHabitEntriesForHabit: async (habitId) => {
    set({ habitEntriesLoading: true });
    try {
      const entries = await getHabitEntriesForHabit(habitId);
      set((state) => ({
        habitEntries: { ...state.habitEntries, [habitId]: entries },
        habitEntriesLoading: false,
      }));
    } catch (error) {
      set({ habitEntriesLoading: false });
      throw error;
    }
  },

  addHabit: async (habit) => {
    const created = await createHabit(habit);
    set((state) => ({ habits: [created, ...state.habits] }));
    return created;
  },

  updateHabit: async (id, updates) => {
    const updated = await updateHabit(id, updates);
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updated } : h)),
    }));
    return updated;
  },

  deleteHabit: async (id) => {
    await deleteHabit(id);
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      habitEntries: Object.fromEntries(Object.entries(state.habitEntries).filter(([key]) => key !== id)),
    }));
  },

  addHabitEntry: async (entry) => {
    const created = await createHabitEntry(entry);
    set((state) => {
      const list = state.habitEntries[created.habit_id] ?? [];
      return { habitEntries: { ...state.habitEntries, [created.habit_id]: [created, ...list] } };
    });
    return created;
  },

  updateHabitEntry: async (id, updates) => {
    const updated = await updateHabitEntry(id, updates);
    set((state) => {
      const habitId = updated.habit_id;
      const list = state.habitEntries[habitId] ?? [];
      return {
        habitEntries: {
          ...state.habitEntries,
          [habitId]: list.map((entry) => (entry.id === id ? { ...entry, ...updated } : entry)),
        },
      };
    });
    return updated;
  },

  deleteHabitEntry: async (id, habitId) => {
    await deleteHabitEntry(id, habitId);
    set((state) => {
      const list = state.habitEntries[habitId] ?? [];
      return {
        habitEntries: {
          ...state.habitEntries,
          [habitId]: list.filter((entry) => entry.id !== id),
        },
      };
    });
  },

  deleteHabitEntryForDate: async (habitId, date) => {
    await deleteHabitEntriesForDate(habitId, date);
    set((state) => {
      const list = state.habitEntries[habitId] ?? [];
      return {
        habitEntries: {
          ...state.habitEntries,
          [habitId]: list.filter((entry) => entry.date !== date),
        },
      };
    });
  },

  getHabitById: (id) => get().habits.find((h) => h.id === id),
});
