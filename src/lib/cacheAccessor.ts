/**
 * Cache Accessor - Unified Data Access with React Query Cache Integration
 *
 * Provides a way for services (outside React components) to access data
 * with React Query cache support. This ensures:
 * - Services benefit from cached data when available
 * - Cache stays consistent across the application
 * - Services can work in both React and non-React contexts
 *
 * Usage:
 *   const accessor = createCacheAccessor(queryClient);
 *   const tasks = await accessor.getTasks({ status: 'todo' });
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryClient as defaultQueryClient, queryKeys } from './react-query';
import { getTasks, getTask } from '@/api/tasksAPI';
import { getHabits, getHabit, getHabitEntries, getHabitEntriesForDate } from '@/api/habitsAPI';
import { getCalendarEvents, getCalendarEvent } from '@/api/calendarAPI';
import { getGoals, getGoal } from '@/api/goalsAPI';
import { getFocusSessions } from '@/api/focusAPI';
import { getJournalEntries } from '@/api/journalAPI';
import type { TaskData, HabitData, HabitEntryData, FocusSessionData, CalendarEvent } from '@/services/types';
import type { JournalEntry, Goal } from '@/types';
import { logger } from '@/services/logger';

interface CacheOptions {
  /** Force a fresh fetch, ignoring cache */
  forceRefresh?: boolean;
  /** Maximum age of cached data to consider valid (ms) */
  maxAge?: number;
}

/**
 * Creates a cache-aware data accessor bound to a QueryClient.
 * Services can use this to fetch data with automatic cache integration.
 */
export function createCacheAccessor(client: QueryClient = defaultQueryClient) {
  const fetchWithCache = async <TData, TFilters>(
    queryKey: readonly unknown[],
    fetcher: (filters?: TFilters) => Promise<TData>,
    filters?: TFilters,
    options: CacheOptions = {}
  ): Promise<TData> => {
    const { forceRefresh = false, maxAge } = options;

    // Try to get from cache first (if not forcing refresh)
    if (!forceRefresh) {
      const cached = client.getQueryData<TData>(queryKey);
      if (cached !== undefined) {
        // Check if cache is still valid based on maxAge
        const state = client.getQueryState(queryKey);
        if (state?.dataUpdatedAt) {
          const age = Date.now() - state.dataUpdatedAt;
          if (!maxAge || age < maxAge) {
            logger.debug('CacheAccessor', 'Cache hit', { queryKey, age });
            return cached;
          }
        }
      }
    }

    // Cache miss or stale - fetch fresh data
    logger.debug('CacheAccessor', 'Cache miss, fetching', { queryKey, forceRefresh });

    // Use fetchQuery to populate the cache
    const data = await client.fetchQuery({
      queryKey,
      queryFn: () => fetcher(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return data;
  };

  return {
    // ===== TASKS =====
    getTasks: async (filters?: Parameters<typeof getTasks>[0], options?: CacheOptions) => {
      return fetchWithCache<TaskData[], typeof filters>(
        queryKeys.tasks.list(filters),
        getTasks,
        filters,
        options
      );
    },

    getTask: async (id: string, options?: CacheOptions) => {
      return fetchWithCache<TaskData | null, string>(
        queryKeys.tasks.detail(id),
        () => getTask(id),
        undefined,
        options
      );
    },

    // ===== HABITS =====
    getHabits: async (filters?: Parameters<typeof getHabits>[0], options?: CacheOptions) => {
      return fetchWithCache<HabitData[], typeof filters>(
        queryKeys.habits.list(filters),
        getHabits,
        filters,
        options
      );
    },

    getHabit: async (id: string, options?: CacheOptions) => {
      return fetchWithCache<HabitData | null, string>(
        queryKeys.habits.detail(id),
        () => getHabit(id),
        undefined,
        options
      );
    },

    getHabitEntries: async (filters?: Parameters<typeof getHabitEntries>[0], options?: CacheOptions) => {
      const key = ['habits', 'entries', filters] as const;
      return fetchWithCache<HabitEntryData[], typeof filters>(key, getHabitEntries, filters, options);
    },

    getHabitEntriesForDate: async (date: string, options?: CacheOptions) => {
      const key = ['habits', 'entries', 'date', date] as const;
      return fetchWithCache<HabitEntryData[], string>(
        key,
        () => getHabitEntriesForDate(date),
        undefined,
        options
      );
    },

    // ===== CALENDAR =====
    getCalendarEvents: async (filters?: Parameters<typeof getCalendarEvents>[0], options?: CacheOptions) => {
      return fetchWithCache<CalendarEvent[], typeof filters>(
        queryKeys.calendar.list(filters),
        getCalendarEvents,
        filters,
        options
      );
    },

    getCalendarEvent: async (id: string, options?: CacheOptions) => {
      return fetchWithCache<CalendarEvent | null, string>(
        queryKeys.calendar.detail(id),
        () => getCalendarEvent(id),
        undefined,
        options
      );
    },

    // ===== GOALS =====
    getGoals: async (options?: CacheOptions) => {
      return fetchWithCache<Goal[], undefined>(
        queryKeys.goals.list(),
        getGoals as () => Promise<Goal[]>,
        undefined,
        options
      );
    },

    getGoal: async (id: string, options?: CacheOptions) => {
      return fetchWithCache<Goal | null, string>(
        queryKeys.goals.detail(id),
        () => getGoal(id) as Promise<Goal | null>,
        undefined,
        options
      );
    },

    // ===== FOCUS SESSIONS =====
    getFocusSessions: async (filters?: Parameters<typeof getFocusSessions>[0], options?: CacheOptions) => {
      const key = ['focus', 'sessions', filters] as const;
      return fetchWithCache<FocusSessionData[], typeof filters>(key, getFocusSessions, filters, options);
    },

    // ===== JOURNAL =====
    getJournalEntries: async (filters?: Parameters<typeof getJournalEntries>[0], options?: CacheOptions) => {
      return fetchWithCache<JournalEntry[], typeof filters>(
        queryKeys.journal.list(filters as Record<string, unknown>),
        getJournalEntries as (f?: typeof filters) => Promise<JournalEntry[]>,
        filters,
        options
      );
    },

    // ===== UTILITY =====
    /**
     * Invalidate specific query keys to force refetch
     */
    invalidate: async (queryKey: readonly unknown[]) => {
      await client.invalidateQueries({ queryKey: queryKey as unknown[] });
    },

    /**
     * Get the underlying QueryClient for advanced operations
     */
    getQueryClient: () => client,
  };
}

/**
 * Default cache accessor using the global queryClient.
 * Can be used directly in services without needing to pass a QueryClient.
 */
export const cacheAccessor = createCacheAccessor();

/**
 * Type for the cache accessor
 */
export type CacheAccessor = ReturnType<typeof createCacheAccessor>;

