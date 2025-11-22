/**
 * React Query Configuration
 *
 * Centralized setup for TanStack Query (React Query)
 * Used for server state management (data from Supabase)
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Type for filters used in query keys
 */
type QueryFilters = Record<string, unknown> | undefined;

/**
 * Type for infinite query page data
 */
interface PageData {
  hasMore?: boolean;
  [key: string]: unknown;
}

/**
 * Create Query Client with sensible defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      // 5 minutes for most data
      staleTime: 5 * 60 * 1000,

      // Cache time: How long inactive data stays in cache
      // 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry failed requests
      retry: 1,

      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (disabled by default, enable per-query if needed)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount (only if stale)
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,

      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

/**
 * Query Keys Factory
 *
 * Centralized query keys for type-safe invalidation
 */
export const queryKeys = {
  // Notes
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.notes.lists(), filters] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },

  // Journal
  journal: {
    all: ['journal'] as const,
    lists: () => [...queryKeys.journal.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.journal.lists(), filters] as const,
    details: () => [...queryKeys.journal.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.journal.details(), id] as const,
  },

  // Goals
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.goals.lists(), filters] as const,
    details: () => [...queryKeys.goals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.goals.details(), id] as const,
  },

  // Dreams
  dreams: {
    all: ['dreams'] as const,
    lists: () => [...queryKeys.dreams.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.dreams.lists(), filters] as const,
    details: () => [...queryKeys.dreams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.dreams.details(), id] as const,
  },

  // Tasks (TODO: Add when tasks slice is created)
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },

  // Habits (TODO: Add when habits slice is created)
  habits: {
    all: ['habits'] as const,
    lists: () => [...queryKeys.habits.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.habits.lists(), filters] as const,
    details: () => [...queryKeys.habits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.habits.details(), id] as const,
  },

  // Finance (TODO: Add when finance slice is created)
  finance: {
    transactions: ['finance', 'transactions'] as const,
    budgets: ['finance', 'budgets'] as const,
    categories: ['finance', 'categories'] as const,
  },
} as const;

/**
 * Common query options for different data types
 */
export const queryOptions = {
  // Real-time data (refetch frequently)
  realtime: {
    staleTime: 0,
    refetchInterval: 10000, // 10 seconds
    refetchOnWindowFocus: true,
  },

  // Static data (rarely changes)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },

  // User data (moderate freshness)
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // Infinite query defaults
  infinite: {
    initialPageParam: 0,
    getNextPageParam: (lastPage: PageData, allPages: PageData[]): number | undefined => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
  },
};
