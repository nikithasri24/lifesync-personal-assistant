/**
 * Habits Store Slice
 *
 * Manages habits state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import { apiClient } from '../../services/apiClient';
import type { Habit, HabitCategory } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isSameDay } from 'date-fns';

const createId = () => Math.random().toString(36).substring(2, 15);

// Helper types from apiClient
type HabitData = Awaited<ReturnType<typeof apiClient.getHabits>>[number];
type HabitEntryData = Awaited<ReturnType<typeof apiClient.getHabitEntries>>[number];

// Helper: Convert habit entry data to HabitCompletion
const mapHabitEntryToCompletions = (entry: HabitEntryData) => {
  const count = Number(entry.value ?? 1);
  let completedAt: Date;

  if (entry.date) {
    const parsed = new Date(entry.date);
    completedAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    completedAt = entry.created_at ? new Date(entry.created_at) : new Date();
  }

  return Array.from({ length: count }, (_, index) => ({
    id: entry.id ? `${entry.id}-${index}` : createId(),
    completedAt,
    notes: entry.notes ?? undefined,
  }));
};

// Helper: Map HabitData to Habit
const mapHabitDataToHabit = (habit: HabitData, entries: HabitEntryData[]): Habit => ({
  id: habit.id ?? createId(),
  name: habit.name,
  description: habit.description ?? '',
  frequency: (habit.frequency as Habit['frequency']) ?? 'daily',
  targetCount: habit.target_value ?? 1,
  goalMode: (habit.goal_mode as Habit['goalMode']) ?? 'daily-target',
  goalTarget: habit.goal_target ?? undefined,
  goalUnit: habit.goal_unit ?? undefined,
  currentProgress: habit.current_progress ?? 0,
  color: habit.color ?? '#22c55e',
  categoryId: habit.category ?? 'general',
  reminder: habit.reminder_enabled
    ? {
        enabled: true,
        time: habit.reminder_time ?? '08:00',
        days: [1, 2, 3, 4, 5, 6, 7],
        title: habit.name,
      }
    : undefined,
  completions: entries.flatMap(mapHabitEntryToCompletions),
  createdAt: habit.created_at ? new Date(habit.created_at) : new Date(),
  streak: habit.streak_count ?? 0,
});

// Helper: Build insert payload
const buildHabitInsertPayload = (
  habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>
): Omit<HabitData, 'id' | 'created_at' | 'updated_at'> => {
  const sanitize = (obj: any) => {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) clean[k] = v;
    }
    return clean;
  };

  return sanitize({
    name: habit.name,
    description: habit.description ?? '',
    frequency: habit.frequency ?? 'daily',
    target_value: habit.targetCount ?? 1,
    goal_mode: habit.goalMode ?? 'daily-target',
    goal_target: habit.goalTarget ?? null,
    goal_unit: habit.goalUnit ?? null,
    current_progress: habit.currentProgress ?? 0,
    color: habit.color ?? '#22c55e',
    category: habit.categoryId ?? 'general',
    reminder_time: habit.reminder?.time ?? null,
    reminder_enabled: habit.reminder?.enabled ?? false,
    streak_count: habit.streak ?? 0,
    icon: (habit as unknown as { icon?: string }).icon ?? null,
  });
};

// Helper: Build update payload
const buildHabitUpdatePayload = (updates: Partial<Habit>): Partial<HabitData> => {
  const sanitize = (obj: any) => {
    const clean: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) clean[k] = v;
    }
    return clean;
  };

  return sanitize({
    name: updates.name,
    description: updates.description,
    frequency: updates.frequency,
    target_value: updates.targetCount,
    goal_mode: updates.goalMode,
    goal_target: updates.goalTarget,
    goal_unit: updates.goalUnit,
    current_progress: updates.currentProgress,
    color: updates.color,
    category: updates.categoryId,
    reminder_time: updates.reminder?.time,
    reminder_enabled: updates.reminder?.enabled,
    streak_count: updates.streak,
  });
};

// Helper: Derive habit categories from habits
const deriveHabitCategories = (habits: Habit[]): HabitCategory[] => {
  if (!habits.length) {
    return [
      { id: 'wellness', name: 'Wellness', description: 'Mind & body routines', color: '#22c55e' },
      { id: 'growth', name: 'Growth', description: 'Learning and development', color: '#f97316' },
    ];
  }

  const map = new Map<string, HabitCategory>();
  habits.forEach((habit) => {
    const key = habit.categoryId ?? 'general';
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        description: '',
        color: habit.color,
      });
    }
  });

  return Array.from(map.values());
};

// State interface
export interface HabitsSlice {
  // State
  habits: Habit[];
  habitCategories: HabitCategory[];

  // Actions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string, options?: { value?: number; notes?: string }) => Promise<void>;
  resetHabit: (id: string) => Promise<void>;
  resetHabitToday: (id: string) => Promise<void>;
  resetHabitHistory: (id: string) => Promise<void>;

  // Internal setters
  _setHabits: (habits: Habit[]) => void;
  _updateUserStats: () => void; // Callback to update user stats in parent store
}

// Create the slice
export const createHabitsSlice: StateCreator<HabitsSlice> = (set, get) => ({
  // Initial state
  habits: [],
  habitCategories: [],

  // Internal setters (used by initializeData)
  _setHabits: (habits) => {
    const habitCategories = deriveHabitCategories(habits);
    set({ habits, habitCategories });
  },

  _updateUserStats: () => {
    // This will be implemented by the main store to update userStats
    // based on tasks and habits
  },

  // ==================== Habits ====================

  addHabit: async (habitInput) => {
    if (!isSupabaseConfigured) {
      const habit: Habit = {
        ...habitInput,
        id: createId(),
        createdAt: new Date(),
        completions: [],
        currentProgress: habitInput.currentProgress ?? 0,
        streak: habitInput.streak ?? 0,
      };
      const habits = [...get().habits, habit];
      const habitCategories = deriveHabitCategories(habits);
      set({ habits, habitCategories });
      get()._updateUserStats();
      return habit;
    }

    try {
      const payload = buildHabitInsertPayload(habitInput);
      const created = await apiClient.createHabit(payload);
      const habit = mapHabitDataToHabit(created, []);
      const habits = [...get().habits, habit];
      const habitCategories = deriveHabitCategories(habits);
      set({ habits, habitCategories });
      get()._updateUserStats();
      return habit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  },

  updateHabit: async (id, updates) => {
    if (!isSupabaseConfigured) {
      const habits = get().habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              ...updates,
            }
          : habit
      );
      const habitCategories = deriveHabitCategories(habits);
      set({ habits, habitCategories });
      get()._updateUserStats();
      return;
    }

    try {
      const payload = buildHabitUpdatePayload(updates);
      const updated = await apiClient.updateHabit(id, payload);
      const completions = get().habits.find((habit) => habit.id === id)?.completions ?? [];
      const habit = mapHabitDataToHabit(
        updated,
        completions.map((completion) => ({
          id: completion.id,
          habit_id: id,
          date: completion.completedAt.toISOString(),
          created_at: completion.completedAt.toISOString(),
          notes: completion.notes,
        })) as HabitEntryData[]
      );
      const habits = get().habits.map((item) => (item.id === id ? habit : item));
      const habitCategories = deriveHabitCategories(habits);
      set({ habits, habitCategories });
      get()._updateUserStats();
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  deleteHabit: async (id) => {
    if (!isSupabaseConfigured) {
      const habits = get().habits.filter((habit) => habit.id !== id);
      const habitCategories = deriveHabitCategories(habits);
      set({ habits, habitCategories });
      get()._updateUserStats();
      return;
    }

    try {
      await apiClient.deleteHabit(id);
      const habits = get().habits.filter((habit) => habit.id !== id);
      const habitCategories = deriveHabitCategories(habits);
      set({ habits, habitCategories });
      get()._updateUserStats();
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },

  completeHabit: async (id, options) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    const completion = {
      id: createId(),
      completedAt: new Date(),
      notes: options?.notes,
    };

    if (isSupabaseConfigured) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const localDate = `${yyyy}-${mm}-${dd}`;

      await apiClient.addHabitEntry(id, {
        date: localDate,
        value: options?.value ?? 1,
        notes: options?.notes ?? undefined,
      });
      await apiClient.updateHabit(id, {
        current_progress: (habit.currentProgress ?? 0) + 1,
        streak_count: (habit.streak ?? 0) + 1,
      } as Partial<HabitData>);
    }

    const habits = get().habits.map((item) =>
      item.id === id
        ? {
            ...item,
            completions: [...item.completions, completion],
            currentProgress: (item.currentProgress ?? 0) + 1,
            streak: (item.streak ?? 0) + 1,
          }
        : item
    );
    const habitCategories = deriveHabitCategories(habits);
    set({ habits, habitCategories });
    get()._updateUserStats();
  },

  resetHabit: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const localDate = `${yyyy}-${mm}-${dd}`;

    if (isSupabaseConfigured) {
      try {
        await apiClient.deleteHabitEntryForDate(id, localDate);
      } catch (e) {
        console.warn('[Store] Failed to delete today\'s habit entry:', e);
      }
      try {
        await apiClient.updateHabit(id, {
          current_progress: 0 as any,
          streak_count: 0 as any
        } as Partial<HabitData>);
      } catch (e) {
        console.warn('[Store] Failed to reset habit counters:', e);
      }
    }

    const today = new Date();
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h;
      const pruned = h.completions.filter((c) => !isSameDay(c.completedAt, today));
      return {
        ...h,
        completions: pruned,
        currentProgress: 0,
        streak: 0,
      };
    });
    const habitCategories = deriveHabitCategories(habits);
    set({ habits, habitCategories });
    get()._updateUserStats();
  },

  resetHabitToday: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const localDate = `${yyyy}-${mm}-${dd}`;

    let decrement = 0;
    if (isSupabaseConfigured) {
      try {
        const entry = await apiClient.getHabitEntryForDate(id, localDate);
        decrement = Number(entry?.value ?? 0);
      } catch {}
      try {
        await apiClient.deleteHabitEntryForDate(id, localDate);
      } catch (e) {
        console.warn('[Store] Failed to delete today\'s habit entry:', e);
      }
      try {
        if (decrement > 0) {
          await apiClient.updateHabit(id, {
            current_progress: Math.max(0, (habit.currentProgress ?? 0) - decrement) as any
          } as Partial<HabitData>);
        }
      } catch (e) {
        console.warn('[Store] Failed to update habit progress after today reset:', e);
      }
    }

    const today = new Date();
    const habits = get().habits.map((h) => {
      if (h.id !== id) return h;
      const todayRemoved = h.completions.filter((c) => isSameDay(c.completedAt, today)).length;
      const pruned = h.completions.filter((c) => !isSameDay(c.completedAt, today));
      return {
        ...h,
        completions: pruned,
        currentProgress: Math.max(0, (h.currentProgress ?? 0) - (decrement || todayRemoved)),
      };
    });
    const habitCategories = deriveHabitCategories(habits);
    set({ habits, habitCategories });
    get()._updateUserStats();
  },

  resetHabitHistory: async (id) => {
    const habit = get().habits.find((h) => h.id === id);
    if (!habit) return;

    if (isSupabaseConfigured) {
      try {
        await apiClient.deleteAllHabitEntries(id);
      } catch (e) {
        console.warn('[Store] Failed to delete habit entries:', e);
      }
      try {
        await apiClient.updateHabit(id, {
          current_progress: 0 as any,
          streak_count: 0 as any
        } as Partial<HabitData>);
      } catch (e) {
        console.warn('[Store] Failed to reset habit counters:', e);
      }
    }

    const habits = get().habits.map((h) =>
      h.id === id ? { ...h, completions: [], currentProgress: 0, streak: 0 } : h
    );
    const habitCategories = deriveHabitCategories(habits);
    set({ habits, habitCategories });
    get()._updateUserStats();
  },
});
