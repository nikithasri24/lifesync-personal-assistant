/**
 * React Query Configuration
 *
 * Centralized setup for TanStack Query (React Query)
 * Used for server state management (data from Supabase)
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, isRetryableError, isAuthError } from '@/lib/errors';

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
 * Create Query Client with sensible defaults and global error handling
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

      // Retry failed requests based on error type
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (isAuthError(error)) {
          return false;
        }

        // Retry retryable errors up to 2 times
        if (isRetryableError(error) && failureCount < 2) {
          return true;
        }

        return false;
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (disabled by default, enable per-query if needed)
      refetchOnWindowFocus: false,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Refetch on mount (only if stale)
      refetchOnMount: true,

      // Note: Global error handler removed - use throwOnError or individual query error handlers instead
    },
    mutations: {
      // Retry failed mutations based on error type
      retry: (failureCount, error) => {
        // Don't retry auth errors or validation errors
        if (isAuthError(error)) {
          return false;
        }

        // Retry retryable errors once
        if (isRetryableError(error) && failureCount < 1) {
          return true;
        }

        return false;
      },

      // Retry delay for mutations
      retryDelay: 1000,

      // Global error handler for mutations
      onError: (error) => {
        const lifeSyncError = parseToLifeSyncError(error);
        logger.error('ReactQuery:Mutation', lifeSyncError, {
          code: lifeSyncError.code,
          statusCode: lifeSyncError.statusCode,
          context: lifeSyncError.context,
        });
      },
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

  // List Items (for list-type notes)
  listItems: {
    all: ['listItems'] as const,
    lists: (noteId: string) => [...queryKeys.listItems.all, 'list', noteId] as const,
    list: (noteId: string) => [...queryKeys.listItems.lists(noteId)] as const,
    details: () => [...queryKeys.listItems.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.listItems.details(), id] as const,
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

  // Calendar Events
  calendar: {
    all: ['calendar'] as const,
    lists: () => [...queryKeys.calendar.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.calendar.lists(), filters] as const,
    details: () => [...queryKeys.calendar.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calendar.details(), id] as const,
  },

  // Schedule Blocks
  scheduleBlocks: {
    all: ['schedule-blocks'] as const,
    lists: () => [...queryKeys.scheduleBlocks.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.scheduleBlocks.lists(), filters] as const,
  },

  // Skincare
  skincare: {
    all: ['skincare'] as const,
    products: {
      all: () => [...queryKeys.skincare.all, 'products'] as const,
      lists: () => [...queryKeys.skincare.products.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.skincare.products.lists(), filters] as const,
      details: () => [...queryKeys.skincare.products.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.skincare.products.details(), id] as const,
    },
    routines: {
      all: () => [...queryKeys.skincare.all, 'routines'] as const,
      lists: () => [...queryKeys.skincare.routines.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.skincare.routines.lists(), filters] as const,
      details: () => [...queryKeys.skincare.routines.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.skincare.routines.details(), id] as const,
      forDay: (dayOfWeek: number, timeSlot: string) =>
        [...queryKeys.skincare.routines.all(), 'day', dayOfWeek, timeSlot] as const,
    },
    logs: {
      all: () => [...queryKeys.skincare.all, 'logs'] as const,
      lists: () => [...queryKeys.skincare.logs.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.skincare.logs.lists(), filters] as const,
      details: () => [...queryKeys.skincare.logs.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.skincare.logs.details(), id] as const,
    },
    weekly: {
      all: () => [...queryKeys.skincare.all, 'weekly'] as const,
      list: () => [...queryKeys.skincare.weekly.all(), 'list'] as const,
    },
    stats: (startDate: string, endDate: string) =>
      [...queryKeys.skincare.all, 'stats', startDate, endDate] as const,
    streaks: () => [...queryKeys.skincare.all, 'streaks'] as const,
  },

  // Travel
  travel: {
    all: ['travel'] as const,
    trips: {
      all: () => [...queryKeys.travel.all, 'trips'] as const,
      lists: () => [...queryKeys.travel.trips.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.travel.trips.lists(), filters] as const,
      details: () => [...queryKeys.travel.trips.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.travel.trips.details(), id] as const,
    },
    tripDays: {
      all: () => [...queryKeys.travel.all, 'tripDays'] as const,
      lists: () => [...queryKeys.travel.tripDays.all(), 'list'] as const,
      list: (tripId: string) => [...queryKeys.travel.tripDays.lists(), tripId] as const,
    },
    documents: {
      all: () => [...queryKeys.travel.all, 'documents'] as const,
      lists: () => [...queryKeys.travel.documents.all(), 'list'] as const,
      list: (tripId?: string) => [...queryKeys.travel.documents.lists(), tripId] as const,
    },
    packingLists: {
      all: () => [...queryKeys.travel.all, 'packingLists'] as const,
      lists: () => [...queryKeys.travel.packingLists.all(), 'list'] as const,
      list: (tripId?: string) => [...queryKeys.travel.packingLists.lists(), tripId] as const,
    },
    budget: (tripId: string) => [...queryKeys.travel.all, 'budget', tripId] as const,
  },

  // Bills
  bills: {
    all: ['bills'] as const,
    lists: () => [...queryKeys.bills.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.bills.lists(), filters] as const,
    details: () => [...queryKeys.bills.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bills.details(), id] as const,
    upcoming: (days?: number) => [...queryKeys.bills.all, 'upcoming', days] as const,
  },

  // Briefing
  briefing: {
    all: ['briefing'] as const,
    daily: (date?: string) => [...queryKeys.briefing.all, 'daily', date] as const,
    weekly: (weekStart?: string) => [...queryKeys.briefing.all, 'weekly', weekStart] as const,
  },

  // Connections
  connections: {
    all: ['connections'] as const,
    lists: () => [...queryKeys.connections.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.connections.lists(), filters] as const,
    details: () => [...queryKeys.connections.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.connections.details(), id] as const,
    pending: () => [...queryKeys.connections.all, 'pending'] as const,
  },

  // Focus Sessions
  focus: {
    all: ['focus'] as const,
    sessions: {
      all: () => [...queryKeys.focus.all, 'sessions'] as const,
      lists: () => [...queryKeys.focus.sessions.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.focus.sessions.lists(), filters] as const,
      details: () => [...queryKeys.focus.sessions.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.focus.sessions.details(), id] as const,
    },
    stats: (period?: string) => [...queryKeys.focus.all, 'stats', period] as const,
    active: () => [...queryKeys.focus.all, 'active'] as const,
  },

  // Gamification
  gamification: {
    all: ['gamification'] as const,
    profile: () => [...queryKeys.gamification.all, 'profile'] as const,
    achievements: () => [...queryKeys.gamification.all, 'achievements'] as const,
    leaderboard: () => [...queryKeys.gamification.all, 'leaderboard'] as const,
    streaks: () => [...queryKeys.gamification.all, 'streaks'] as const,
  },

  // Important Dates
  importantDates: {
    all: ['importantDates'] as const,
    lists: () => [...queryKeys.importantDates.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.importantDates.lists(), filters] as const,
    details: () => [...queryKeys.importantDates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.importantDates.details(), id] as const,
    upcoming: (days?: number) => [...queryKeys.importantDates.all, 'upcoming', days] as const,
  },

  // Inbox
  inbox: {
    all: ['inbox'] as const,
    lists: () => [...queryKeys.inbox.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.inbox.lists(), filters] as const,
    details: () => [...queryKeys.inbox.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inbox.details(), id] as const,
    unprocessed: () => [...queryKeys.inbox.all, 'unprocessed'] as const,
  },

  // Life Goals
  lifeGoals: {
    all: ['lifeGoals'] as const,
    lists: () => [...queryKeys.lifeGoals.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.lifeGoals.lists(), filters] as const,
    details: () => [...queryKeys.lifeGoals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.lifeGoals.details(), id] as const,
    byCategory: (category: string) => [...queryKeys.lifeGoals.all, 'category', category] as const,
  },

  // Meal Planning
  mealPlanning: {
    all: ['mealPlanning'] as const,
    plans: {
      all: () => [...queryKeys.mealPlanning.all, 'plans'] as const,
      lists: () => [...queryKeys.mealPlanning.plans.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.mealPlanning.plans.lists(), filters] as const,
      details: () => [...queryKeys.mealPlanning.plans.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.mealPlanning.plans.details(), id] as const,
      week: (weekStart: string) => [...queryKeys.mealPlanning.plans.all(), 'week', weekStart] as const,
    },
    recipes: {
      all: () => [...queryKeys.mealPlanning.all, 'recipes'] as const,
      lists: () => [...queryKeys.mealPlanning.recipes.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.mealPlanning.recipes.lists(), filters] as const,
      details: () => [...queryKeys.mealPlanning.recipes.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.mealPlanning.recipes.details(), id] as const,
    },
    pantry: {
      all: () => [...queryKeys.mealPlanning.all, 'pantry'] as const,
      lists: () => [...queryKeys.mealPlanning.pantry.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.mealPlanning.pantry.lists(), filters] as const,
    },
  },

  // Nutrition
  nutrition: {
    all: ['nutrition'] as const,
    logs: {
      all: () => [...queryKeys.nutrition.all, 'logs'] as const,
      lists: () => [...queryKeys.nutrition.logs.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.nutrition.logs.lists(), filters] as const,
      today: () => [...queryKeys.nutrition.logs.all(), 'today'] as const,
      week: (weekStart?: string) => [...queryKeys.nutrition.logs.all(), 'week', weekStart] as const,
    },
    goals: () => [...queryKeys.nutrition.all, 'goals'] as const,
    stats: (period?: string) => [...queryKeys.nutrition.all, 'stats', period] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    milestones: (projectId: string) => [...queryKeys.projects.all, 'milestones', projectId] as const,
    analytics: () => [...queryKeys.projects.all, 'analytics'] as const,
  },

  // Scheduling
  scheduling: {
    all: ['scheduling'] as const,
    blocks: {
      all: () => [...queryKeys.scheduling.all, 'blocks'] as const,
      lists: () => [...queryKeys.scheduling.blocks.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.scheduling.blocks.lists(), filters] as const,
      forDate: (date: string) => [...queryKeys.scheduling.blocks.all(), 'date', date] as const,
    },
    freeSlots: (date: string) => [...queryKeys.scheduling.all, 'freeSlots', date] as const,
    preferences: () => [...queryKeys.scheduling.all, 'preferences'] as const,
  },

  // Shopping
  shopping: {
    all: ['shopping'] as const,
    lists: {
      all: () => [...queryKeys.shopping.all, 'lists'] as const,
      lists: () => [...queryKeys.shopping.lists.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.shopping.lists.lists(), filters] as const,
      details: () => [...queryKeys.shopping.lists.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.shopping.lists.details(), id] as const,
    },
    items: (listId: string) => [...queryKeys.shopping.all, 'items', listId] as const,
  },

  // Personal Care
  personalCare: {
    all: ['personalCare'] as const,
    categories: {
      all: () => [...queryKeys.personalCare.all, 'categories'] as const,
      lists: () => [...queryKeys.personalCare.categories.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.personalCare.categories.lists(), filters] as const,
      details: () => [...queryKeys.personalCare.categories.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.personalCare.categories.details(), id] as const,
    },
    items: {
      all: () => [...queryKeys.personalCare.all, 'items'] as const,
      lists: () => [...queryKeys.personalCare.items.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.personalCare.items.lists(), filters] as const,
      details: () => [...queryKeys.personalCare.items.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.personalCare.items.details(), id] as const,
      scheduled: () => [...queryKeys.personalCare.items.all(), 'scheduled'] as const,
    },
    products: {
      all: () => [...queryKeys.personalCare.all, 'products'] as const,
      lists: () => [...queryKeys.personalCare.products.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.personalCare.products.lists(), filters] as const,
      details: () => [...queryKeys.personalCare.products.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.personalCare.products.details(), id] as const,
      forItem: (itemId: string) => [...queryKeys.personalCare.products.all(), 'item', itemId] as const,
    },
    logs: {
      all: () => [...queryKeys.personalCare.all, 'logs'] as const,
      lists: () => [...queryKeys.personalCare.logs.all(), 'list'] as const,
      list: (filters?: QueryFilters) => [...queryKeys.personalCare.logs.lists(), filters] as const,
      forItem: (itemId: string) => [...queryKeys.personalCare.logs.all(), 'item', itemId] as const,
    },
    schedule: {
      all: () => [...queryKeys.personalCare.all, 'schedule'] as const,
      month: (year: number, month: number) => [...queryKeys.personalCare.schedule.all(), year, month] as const,
    },
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
