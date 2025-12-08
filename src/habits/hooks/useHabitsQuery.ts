/**
 * Habits React Query Hooks
 *
 * Comprehensive hooks for Habits domain with optimistic updates,
 * habit entry logging, and streak tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { HabitData, HabitEntryData } from '@/services/types';
import { logger } from '@/services/logger';
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitEntries,
  getHabitEntriesForHabit,
  createHabitEntry,
  updateHabitEntry,
  deleteHabitEntry,
  deleteHabitEntriesForDate,
} from '@/api/habitsAPI';

// ==================== Types ====================

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetValue?: number;
  unit?: string;
  goalMode?: 'daily-target' | 'total-goal' | 'course-completion';
  goalTarget?: number;
  goalUnit?: string;
  currentProgress?: number;
  color?: string;
  icon?: string;
  streakCount: number;
  bestStreak: number;
  isActive: boolean;
  reminderTime?: string;
  reminderEnabled: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: Date;
  value?: number;
  notes?: string;
  mood?: string;
  createdAt: Date;
}

export type HabitInput = Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streakCount' | 'bestStreak' | 'currentProgress'>;
export type HabitUpdate = Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>;
export type HabitEntryInput = Omit<HabitEntry, 'id' | 'createdAt'>;
export type HabitEntryUpdate = Partial<Omit<HabitEntry, 'id' | 'habitId' | 'createdAt'>>;

export interface HabitFilters {
  isActive?: boolean;
  category?: string;
  frequency?: Habit['frequency'];
}

export interface HabitEntryFilters {
  habitId?: string;
  startDate?: string;
  endDate?: string;
}

export interface HabitAnalytics {
  total: number;
  active: number;
  inactive: number;
  byFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalStreaks: number;
  longestStreak: number;
  averageStreak: number;
  completionRate: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
}

// ==================== Query Keys ====================

export const habitsKeys = {
  all: ['habits'] as const,
  lists: () => [...habitsKeys.all, 'list'] as const,
  list: (filters?: HabitFilters) => [...habitsKeys.lists(), { filters }] as const,
  details: () => [...habitsKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitsKeys.details(), id] as const,
  entries: (habitId: string) => [...habitsKeys.all, 'entries', habitId] as const,
  allEntries: (filters?: HabitEntryFilters) => [...habitsKeys.all, 'allEntries', { filters }] as const,
  analytics: () => [...habitsKeys.all, 'analytics'] as const,
};

// ==================== Mappers ====================

const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitize = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

function mapHabitDataToHabit(data: HabitData): Habit {
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    description: data.description ?? undefined,
    category: data.category ?? undefined,
    frequency: (data.frequency as Habit['frequency']) ?? 'daily',
    targetValue: data.target_value ?? undefined,
    unit: data.unit ?? undefined,
    goalMode: (data.goal_mode as Habit['goalMode']) ?? undefined,
    goalTarget: data.goal_target ?? undefined,
    goalUnit: data.goal_unit ?? undefined,
    currentProgress: data.current_progress ?? 0,
    color: data.color ?? undefined,
    icon: data.icon ?? undefined,
    streakCount: data.streak_count ?? 0,
    bestStreak: data.best_streak ?? 0,
    isActive: data.is_active ?? true,
    reminderTime: data.reminder_time ?? undefined,
    reminderEnabled: data.reminder_enabled ?? false,
    createdAt: toDate(data.created_at) ?? new Date(),
    updatedAt: toDate(data.updated_at),
  };
}

function mapHabitEntryDataToHabitEntry(data: HabitEntryData): HabitEntry {
  return {
    id: data.id ?? crypto.randomUUID(),
    habitId: data.habit_id,
    date: toDate(data.date) ?? new Date(),
    value: data.value ?? undefined,
    notes: data.notes ?? undefined,
    mood: data.mood ?? undefined,
    createdAt: toDate(data.created_at) ?? new Date(),
  };
}

function buildHabitInsertPayload(
  input: Partial<HabitInput>
): Omit<HabitData, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return sanitize({
    name: input.name ?? 'Untitled Habit',
    description: input.description ?? undefined,
    category: input.category ?? undefined,
    frequency: input.frequency ?? 'daily',
    target_value: input.targetValue ?? null,
    unit: input.unit ?? undefined,
    goal_mode: input.goalMode ?? null,
    goal_target: input.goalTarget ?? null,
    goal_unit: input.goalUnit ?? undefined,
    current_progress: 0,
    color: input.color ?? undefined,
    icon: input.icon ?? undefined,
    streak_count: 0,
    best_streak: 0,
    is_active: input.isActive ?? true,
    reminder_time: input.reminderTime ?? null,
    reminder_enabled: input.reminderEnabled ?? false,
  });
}

function buildHabitUpdatePayload(updates: HabitUpdate): Partial<HabitData> {
  return sanitize({
    name: updates.name,
    description: updates.description,
    category: updates.category,
    frequency: updates.frequency,
    target_value: updates.targetValue,
    unit: updates.unit,
    goal_mode: updates.goalMode,
    goal_target: updates.goalTarget,
    goal_unit: updates.goalUnit,
    current_progress: updates.currentProgress,
    color: updates.color,
    icon: updates.icon,
    streak_count: updates.streakCount,
    best_streak: updates.bestStreak,
    is_active: updates.isActive,
    reminder_time: updates.reminderTime,
    reminder_enabled: updates.reminderEnabled,
  });
}

function buildHabitEntryInsertPayload(
  input: HabitEntryInput
): Omit<HabitEntryData, 'id' | 'created_at'> {
  return sanitize({
    habit_id: input.habitId,
    date: input.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
    value: input.value ?? undefined,
    notes: input.notes ?? undefined,
    mood: input.mood ?? undefined,
  });
}

function buildHabitEntryUpdatePayload(updates: HabitEntryUpdate): Partial<HabitEntryData> {
  return sanitize({
    date: updates.date ? updates.date.toISOString().split('T')[0] : undefined,
    value: updates.value,
    notes: updates.notes,
    mood: updates.mood,
  });
}

// ==================== Queries ====================

/**
 * Fetch all habits with optional filters
 */
export function useHabitsQuery(filters?: HabitFilters): ReturnType<typeof useQuery<Habit[]>> {
  return useQuery({
    queryKey: habitsKeys.list(filters),
    queryFn: async () => {
      const data = await getHabits(filters);
      return data.map(mapHabitDataToHabit);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single habit by ID
 */
export function useHabitQuery(habitId: string | undefined): ReturnType<typeof useQuery<Habit>> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: habitsKeys.detail(habitId ?? ''),
    queryFn: async () => {
      // Try to get from cache first
      const cachedHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list());
      if (cachedHabits) {
        const cached = cachedHabits.find(h => h.id === habitId);
        if (cached) return cached;
      }

      // Fetch from API
      if (!habitId) throw new Error('Habit ID is required');
      const data = await getHabit(habitId);
      return mapHabitDataToHabit(data);
    },
    enabled: !!habitId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetch habit entries for a specific habit
 */
export function useHabitEntriesQuery(habitId: string | undefined): ReturnType<typeof useQuery<HabitEntry[]>> {
  return useQuery({
    queryKey: habitsKeys.entries(habitId ?? ''),
    queryFn: async () => {
      if (!habitId) throw new Error('Habit ID is required');
      const data = await getHabitEntriesForHabit(habitId);
      return data.map(mapHabitEntryDataToHabitEntry);
    },
    enabled: !!habitId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch all habit entries with filters
 */
export function useAllHabitEntriesQuery(filters?: HabitEntryFilters): ReturnType<typeof useQuery<HabitEntry[]>> {
  return useQuery({
    queryKey: habitsKeys.allEntries(filters),
    queryFn: async () => {
      const data = await getHabitEntries(filters);
      return data.map(mapHabitEntryDataToHabitEntry);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get habit analytics
 */
export function useHabitAnalyticsQuery(): ReturnType<typeof useQuery<HabitAnalytics>> {
  const { data: habits = [] } = useHabitsQuery();
  const { data: allEntries = [] } = useAllHabitEntriesQuery();

  return useQuery({
    queryKey: habitsKeys.analytics(),
    queryFn: () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);

      const totalExpectedEntries = habits.length * 7; // Assuming daily habits for simplicity
      const actualEntriesThisWeek = allEntries.filter(e => e.date >= weekStart).length;

      return {
        total: habits.length,
        active: habits.filter(h => h.isActive).length,
        inactive: habits.filter(h => !h.isActive).length,
        byFrequency: {
          daily: habits.filter(h => h.frequency === 'daily').length,
          weekly: habits.filter(h => h.frequency === 'weekly').length,
          monthly: habits.filter(h => h.frequency === 'monthly').length,
        },
        totalStreaks: habits.reduce((sum, h) => sum + h.streakCount, 0),
        longestStreak: Math.max(...habits.map(h => h.bestStreak), 0),
        averageStreak: habits.length > 0
          ? habits.reduce((sum, h) => sum + h.streakCount, 0) / habits.length
          : 0,
        completionRate: totalExpectedEntries > 0
          ? (actualEntriesThisWeek / totalExpectedEntries) * 100
          : 0,
        entriesThisWeek: actualEntriesThisWeek,
        entriesThisMonth: allEntries.filter(e => e.date >= monthStart).length,
      };
    },
    enabled: habits.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ==================== Mutations ====================

/**
 * Create a new habit with optimistic updates
 */
export function useCreateHabitMutation(): ReturnType<typeof useMutation<Habit, Error, Partial<HabitInput>, { previousHabits?: Habit[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<HabitInput>) => {
      logger.debug('Creating habit', { name: input.name });
      const payload = buildHabitInsertPayload(input);
      const created = await createHabit(payload);
      return mapHabitDataToHabit(created);
    },
    onMutate: async (input) => {
      logger.debug('Optimistic update: create habit', { name: input.name });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list());

      // Optimistically add new habit
      const optimisticHabit: Habit = {
        id: `temp-${Date.now()}`,
        name: input.name ?? 'Untitled Habit',
        description: input.description,
        category: input.category,
        frequency: input.frequency ?? 'daily',
        targetValue: input.targetValue,
        unit: input.unit,
        goalMode: input.goalMode,
        goalTarget: input.goalTarget,
        goalUnit: input.goalUnit,
        currentProgress: 0,
        color: input.color,
        icon: input.icon,
        streakCount: 0,
        bestStreak: 0,
        isActive: input.isActive ?? true,
        reminderTime: input.reminderTime,
        reminderEnabled: input.reminderEnabled ?? false,
        createdAt: new Date(),
      };

      queryClient.setQueryData<Habit[]>(habitsKeys.list(), (old) => {
        if (!old) return [optimisticHabit];
        return [optimisticHabit, ...old];
      });

      return { previousHabits };
    },
    onError: (err: Error, input, context) => {
      logger.error('Failed to create habit', { error: err.message, name: input.name });
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits);
      }
    },
    onSuccess: (newHabit) => {
      logger.info('Habit created successfully', { id: newHabit.id, name: newHabit.name });
      // Replace temp habit with real one
      queryClient.setQueryData<Habit[]>(habitsKeys.list(), (old) => {
        if (!old) return [newHabit];
        return old.map((h) => (h.id.startsWith('temp-') ? newHabit : h));
      });
      // Invalidate analytics
      void queryClient.invalidateQueries({ queryKey: habitsKeys.analytics() });
    },
  });
}

/**
 * Update an existing habit
 */
export function useUpdateHabitMutation(): ReturnType<typeof useMutation<Habit, Error, { habitId: string; updates: HabitUpdate }, { previousHabits?: Habit[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, updates }: { habitId: string; updates: HabitUpdate }) => {
      logger.debug('Updating habit', { habitId, updates });
      const payload = buildHabitUpdatePayload(updates);
      const updated = await updateHabit(habitId, payload);
      return mapHabitDataToHabit(updated);
    },
    onMutate: async ({ habitId, updates }) => {
      logger.debug('Optimistic update: habit', { habitId, updates });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list());

      // Optimistically update
      queryClient.setQueryData<Habit[]>(habitsKeys.list(), (old) => {
        if (!old) return [];
        return old.map((h) =>
          h.id === habitId
            ? { ...h, ...updates, updatedAt: new Date() }
            : h
        );
      });

      return { previousHabits };
    },
    onError: (err: Error, { habitId }, context) => {
      logger.error('Failed to update habit', { error: err.message, habitId });
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits);
      }
    },
    onSuccess: (updatedHabit) => {
      logger.info('Habit updated successfully', { id: updatedHabit.id, name: updatedHabit.name });
      // Update with server response
      queryClient.setQueryData<Habit[]>(habitsKeys.list(), (old) => {
        if (!old) return [updatedHabit];
        return old.map((h) => (h.id === updatedHabit.id ? updatedHabit : h));
      });
      // Invalidate analytics
      void queryClient.invalidateQueries({ queryKey: habitsKeys.analytics() });
    },
  });
}

/**
 * Delete a habit
 */
export function useDeleteHabitMutation(): ReturnType<typeof useMutation<string, Error, string, { previousHabits?: Habit[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      logger.debug('Deleting habit', { habitId });
      await deleteHabit(habitId);
      return habitId;
    },
    onMutate: async (habitId) => {
      logger.debug('Optimistic update: delete habit', { habitId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() });

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list());

      // Optimistically remove
      queryClient.setQueryData<Habit[]>(habitsKeys.list(), (old) => {
        if (!old) return [];
        return old.filter((h) => h.id !== habitId);
      });

      return { previousHabits };
    },
    onError: (err: Error, habitId, context) => {
      logger.error('Failed to delete habit', { error: err.message, habitId });
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits);
      }
    },
    onSuccess: (habitId) => {
      logger.info('Habit deleted successfully', { id: habitId });
      // Remove entries cache
      queryClient.removeQueries({ queryKey: habitsKeys.entries(habitId) });
      // Invalidate to ensure consistency
      void queryClient.invalidateQueries({ queryKey: habitsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: habitsKeys.analytics() });
    },
  });
}

/**
 * Log a habit entry (check-in)
 */
export function useLogHabitMutation(): ReturnType<typeof useMutation<HabitEntry, Error, HabitEntryInput, { previousEntries?: HabitEntry[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HabitEntryInput) => {
      logger.debug('Logging habit entry', { habitId: input.habitId, date: input.date });
      const payload = buildHabitEntryInsertPayload(input);
      const created = await createHabitEntry(payload);
      return mapHabitEntryDataToHabitEntry(created);
    },
    onMutate: async (input) => {
      logger.debug('Optimistic update: log habit entry', { habitId: input.habitId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitsKeys.entries(input.habitId) });

      // Snapshot previous value
      const previousEntries = queryClient.getQueryData<HabitEntry[]>(habitsKeys.entries(input.habitId));

      // Optimistically add new entry
      const optimisticEntry: HabitEntry = {
        id: `temp-${Date.now()}`,
        habitId: input.habitId,
        date: input.date,
        value: input.value,
        notes: input.notes,
        mood: input.mood,
        createdAt: new Date(),
      };

      queryClient.setQueryData<HabitEntry[]>(habitsKeys.entries(input.habitId), (old) => {
        if (!old) return [optimisticEntry];
        return [optimisticEntry, ...old];
      });

      return { previousEntries };
    },
    onError: (err: Error, input, context) => {
      logger.error('Failed to log habit entry', { error: err.message, habitId: input.habitId });
      // Rollback on error
      if (context?.previousEntries) {
        queryClient.setQueryData(habitsKeys.entries(input.habitId), context.previousEntries);
      }
    },
    onSuccess: (newEntry) => {
      logger.info('Habit entry logged successfully', { id: newEntry.id, habitId: newEntry.habitId });
      // Replace temp entry with real one
      queryClient.setQueryData<HabitEntry[]>(habitsKeys.entries(newEntry.habitId), (old) => {
        if (!old) return [newEntry];
        return old.map((e) => (e.id.startsWith('temp-') ? newEntry : e));
      });
      // Invalidate habit to update streaks
      void queryClient.invalidateQueries({ queryKey: habitsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: habitsKeys.analytics() });
    },
  });
}

/**
 * Update a habit entry
 */
export function useUpdateHabitEntryMutation(): ReturnType<typeof useMutation<HabitEntry, Error, { entryId: string; habitId: string; updates: HabitEntryUpdate }, { previousEntries?: HabitEntry[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, updates }: { entryId: string; habitId: string; updates: HabitEntryUpdate }) => {
      logger.debug('Updating habit entry', { entryId, updates });
      const payload = buildHabitEntryUpdatePayload(updates);
      const updated = await updateHabitEntry(entryId, payload);
      return mapHabitEntryDataToHabitEntry(updated);
    },
    onMutate: async ({ entryId, habitId, updates }) => {
      logger.debug('Optimistic update: habit entry', { entryId, updates });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitsKeys.entries(habitId) });

      // Snapshot previous value
      const previousEntries = queryClient.getQueryData<HabitEntry[]>(habitsKeys.entries(habitId));

      // Optimistically update
      queryClient.setQueryData<HabitEntry[]>(habitsKeys.entries(habitId), (old) => {
        if (!old) return [];
        return old.map((e) =>
          e.id === entryId
            ? { ...e, ...updates }
            : e
        );
      });

      return { previousEntries };
    },
    onError: (err: Error, { entryId, habitId }, context) => {
      logger.error('Failed to update habit entry', { error: err.message, entryId });
      // Rollback on error
      if (context?.previousEntries) {
        queryClient.setQueryData(habitsKeys.entries(habitId), context.previousEntries);
      }
    },
    onSuccess: (updatedEntry) => {
      logger.info('Habit entry updated successfully', { id: updatedEntry.id });
      // Update with server response
      queryClient.setQueryData<HabitEntry[]>(habitsKeys.entries(updatedEntry.habitId), (old) => {
        if (!old) return [updatedEntry];
        return old.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
      });
    },
  });
}

/**
 * Delete a habit entry
 */
export function useDeleteHabitEntryMutation(): ReturnType<typeof useMutation<string, Error, { entryId: string; habitId: string }, { previousEntries?: HabitEntry[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, habitId }: { entryId: string; habitId: string }) => {
      logger.debug('Deleting habit entry', { entryId, habitId });
      await deleteHabitEntry(entryId, habitId);
      return entryId;
    },
    onMutate: async ({ entryId, habitId }) => {
      logger.debug('Optimistic update: delete habit entry', { entryId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitsKeys.entries(habitId) });

      // Snapshot previous value
      const previousEntries = queryClient.getQueryData<HabitEntry[]>(habitsKeys.entries(habitId));

      // Optimistically remove
      queryClient.setQueryData<HabitEntry[]>(habitsKeys.entries(habitId), (old) => {
        if (!old) return [];
        return old.filter((e) => e.id !== entryId);
      });

      return { previousEntries };
    },
    onError: (err: Error, { entryId, habitId }, context) => {
      logger.error('Failed to delete habit entry', { error: err.message, entryId });
      // Rollback on error
      if (context?.previousEntries) {
        queryClient.setQueryData(habitsKeys.entries(habitId), context.previousEntries);
      }
    },
    onSuccess: (entryId, { habitId }) => {
      logger.info('Habit entry deleted successfully', { id: entryId });
      // Invalidate habit to update streaks
      void queryClient.invalidateQueries({ queryKey: habitsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: habitsKeys.analytics() });
    },
  });
}

// ==================== Helper Hooks ====================

/**
 * Get active habits
 */
export function useActiveHabits(): { data: Habit[] } & Omit<ReturnType<typeof useHabitsQuery>, 'data'> {
  const { data: habits = [], ...rest } = useHabitsQuery({ isActive: true });

  return { data: habits, ...rest };
}

/**
 * Get habits by frequency
 */
export function useHabitsByFrequency(frequency: Habit['frequency']): { data: Habit[] } & Omit<ReturnType<typeof useHabitsQuery>, 'data'> {
  const { data: habits = [], ...rest } = useHabitsQuery({ frequency });

  return { data: habits, ...rest };
}

/**
 * Get habits by category
 */
export function useHabitsByCategory(category: string): { data: Habit[] } & Omit<ReturnType<typeof useHabitsQuery>, 'data'> {
  const { data: habits = [], ...rest } = useHabitsQuery({ category });

  return { data: habits, ...rest };
}

/**
 * Get habit completion status for a specific date
 */
export function useHabitCompletionForDate(habitId: string, date: Date): { data: HabitEntry | undefined; isCompleted: boolean } & Omit<ReturnType<typeof useHabitEntriesQuery>, 'data'> {
  const { data: entries = [], ...rest } = useHabitEntriesQuery(habitId);

  const dateStr = date.toISOString().split('T')[0];
  const entry = entries.find(e => e.date.toISOString().split('T')[0] === dateStr);

  return { data: entry, isCompleted: !!entry, ...rest };
}
