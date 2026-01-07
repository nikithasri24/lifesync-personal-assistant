/**
 * DataSyncProvider - Centralized Data Synchronization
 *
 * Subscribes to data events and invalidates React Query cache accordingly.
 * This ensures all parts of the app stay in sync when data changes.
 *
 * Benefits:
 * - Mutations only need to emit events, not know about all affected queries
 * - New queries automatically benefit from existing event subscriptions
 * - Centralized place to manage cache invalidation logic
 */

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { dataEvents, type DataEventMap, type BatchUpdatePayload, type ScheduleEventPayload } from '@/lib/dataEvents';
import { queryKeys } from '@/lib/react-query';
import { schedulingKeys } from '@/hooks/useSchedulingQuery';
import { logger } from '@/services/logger';

// =====================================================
// EVENT TO QUERY KEY MAPPING
// =====================================================

/**
 * Maps each event to the query keys that should be invalidated.
 * The function receives the event payload and returns an array of query keys.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryKeyMapper = (payload: any, queryClient: QueryClient) => ReadonlyArray<readonly unknown[]>;

/**
 * Complete mapping of events to affected query keys.
 * When an event is emitted, all listed queries will be invalidated.
 */
const eventToQueryKeys: Record<string, QueryKeyMapper> = {
  // ===== TASK EVENTS =====
  'task:created': () => [
    queryKeys.tasks.lists(),
    queryKeys.scheduling.all,
    ['analytics'],
  ],

  'task:updated': ({ taskId }) => [
    queryKeys.tasks.lists(),
    queryKeys.tasks.detail(taskId),
    queryKeys.scheduling.all,
    ['analytics'],
    ['predictions'],
  ],

  'task:deleted': ({ taskId }) => [
    queryKeys.tasks.lists(),
    queryKeys.tasks.detail(taskId),
    queryKeys.scheduling.all,
    ['analytics'],
  ],

  'task:completed': ({ taskId }) => [
    queryKeys.tasks.lists(),
    queryKeys.tasks.detail(taskId),
    queryKeys.scheduling.all,
    ['analytics'],
    queryKeys.gamification.all,
    ['predictions'],
  ],

  'task:restored': ({ taskId }) => [
    queryKeys.tasks.lists(),
    queryKeys.tasks.detail(taskId),
  ],

  'task:scheduled': ({ taskId, date }) => [
    queryKeys.tasks.lists(),
    queryKeys.tasks.detail(taskId),
    queryKeys.scheduling.all,
    schedulingKeys.daySchedule(date),
    schedulingKeys.freeSlots(date),
  ],

  // ===== HABIT EVENTS =====
  'habit:created': () => [
    queryKeys.habits.lists(),
    ['analytics'],
  ],

  'habit:updated': ({ habitId }) => [
    queryKeys.habits.lists(),
    queryKeys.habits.detail(habitId),
    ['analytics'],
  ],

  'habit:deleted': ({ habitId }) => [
    queryKeys.habits.lists(),
    queryKeys.habits.detail(habitId),
    ['analytics'],
  ],

  'habit:entry-logged': ({ habitId }) => [
    queryKeys.habits.lists(),
    queryKeys.habits.detail(habitId),
    ['analytics'],
    queryKeys.gamification.all,
  ],

  'habit:streak-changed': ({ habitId }) => [
    queryKeys.habits.detail(habitId),
    queryKeys.gamification.streaks(),
    ['predictions'],
  ],

  // ===== CALENDAR EVENTS =====
  'calendar:created': () => [
    queryKeys.calendar.lists(),
    queryKeys.scheduling.all,
  ],

  'calendar:updated': ({ eventId }) => [
    queryKeys.calendar.lists(),
    queryKeys.calendar.detail(eventId),
    queryKeys.scheduling.all,
  ],

  'calendar:deleted': ({ eventId }) => [
    queryKeys.calendar.lists(),
    queryKeys.calendar.detail(eventId),
    queryKeys.scheduling.all,
  ],

  // ===== SCHEDULING EVENTS =====
  'schedule:block-created': ({ date }) => [
    queryKeys.scheduling.blocks.all(),
    schedulingKeys.daySchedule(date),
    schedulingKeys.freeSlots(date),
  ],

  'schedule:block-updated': ({ date }) => [
    queryKeys.scheduling.blocks.all(),
    schedulingKeys.daySchedule(date),
    schedulingKeys.freeSlots(date),
  ],

  'schedule:block-deleted': ({ date }) => [
    queryKeys.scheduling.blocks.all(),
    schedulingKeys.daySchedule(date),
    schedulingKeys.freeSlots(date),
  ],

  'schedule:auto-scheduled': ({ date, taskIds }: ScheduleEventPayload) => [
    queryKeys.tasks.lists(),
    ...(taskIds?.map((id: string) => queryKeys.tasks.detail(id)) ?? []),
    schedulingKeys.daySchedule(date),
    schedulingKeys.freeSlots(date),
    queryKeys.scheduling.all,
  ],

  'schedule:day-changed': ({ date }) => [
    schedulingKeys.daySchedule(date),
    schedulingKeys.freeSlots(date),
    queryKeys.scheduling.all,
  ],

  // ===== GOAL EVENTS =====
  'goal:created': () => [
    queryKeys.goals.lists(),
    queryKeys.lifeGoals.lists(),
  ],

  'goal:updated': ({ goalId }) => [
    queryKeys.goals.lists(),
    queryKeys.goals.detail(goalId),
    queryKeys.lifeGoals.lists(),
    queryKeys.lifeGoals.detail(goalId),
  ],

  'goal:deleted': ({ goalId }) => [
    queryKeys.goals.lists(),
    queryKeys.goals.detail(goalId),
    queryKeys.lifeGoals.lists(),
    queryKeys.lifeGoals.detail(goalId),
  ],

  'goal:milestone-completed': ({ goalId }) => [
    queryKeys.goals.detail(goalId),
    queryKeys.lifeGoals.detail(goalId),
    queryKeys.gamification.all,
  ],

  'goal:progress-updated': ({ goalId }) => [
    queryKeys.goals.detail(goalId),
    queryKeys.lifeGoals.detail(goalId),
    ['analytics'],
  ],

  // ===== FINANCE EVENTS =====
  'finance:transaction-created': () => [
    queryKeys.finance.transactions,
    ['analytics'],
  ],

  'finance:transaction-updated': () => [
    queryKeys.finance.transactions,
    ['analytics'],
  ],

  'finance:transaction-deleted': () => [
    queryKeys.finance.transactions,
    ['analytics'],
  ],

  'finance:budget-updated': () => [
    queryKeys.finance.budgets,
    ['analytics'],
  ],

  // ===== BATCH/GENERIC EVENTS =====
  'data:batch-update': ({ domains }: BatchUpdatePayload) => {
    const keys: Array<readonly unknown[]> = [];
    if (domains.includes('tasks')) {
      keys.push(queryKeys.tasks.all);
    }
    if (domains.includes('habits')) {
      keys.push(queryKeys.habits.all);
    }
    if (domains.includes('calendar')) {
      keys.push(queryKeys.calendar.all);
    }
    if (domains.includes('goals')) {
      keys.push(queryKeys.goals.all, queryKeys.lifeGoals.all);
    }
    if (domains.includes('finance')) {
      keys.push(queryKeys.finance.transactions, queryKeys.finance.budgets);
    }
    if (domains.includes('scheduling')) {
      keys.push(queryKeys.scheduling.all);
    }
    return keys;
  },

  'data:sync-required': () => [
    // Invalidate everything - nuclear option
    queryKeys.tasks.all,
    queryKeys.habits.all,
    queryKeys.calendar.all,
    queryKeys.goals.all,
    queryKeys.scheduling.all,
  ],
};

// =====================================================
// PROVIDER COMPONENT
// =====================================================

interface DataSyncProviderProps {
  children: React.ReactNode;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Provider that listens to data events and invalidates React Query cache.
 * Wrap your app with this inside QueryClientProvider.
 *
 * @example
 * <QueryClientProvider client={queryClient}>
 *   <DataSyncProvider>
 *     <App />
 *   </DataSyncProvider>
 * </QueryClientProvider>
 */
export function DataSyncProvider({
  children,
  debug = import.meta.env.DEV,
}: DataSyncProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    // Subscribe to all mapped events
    for (const [eventName, getQueryKeys] of Object.entries(eventToQueryKeys)) {
      const unsub = dataEvents.on(
        eventName as keyof DataEventMap,
        (payload: DataEventMap[keyof DataEventMap]) => {
          // Get the query keys to invalidate
          const keysToInvalidate = getQueryKeys(payload, queryClient);

          if (debug) {
            logger.debug('DataSync', 'Invalidating queries', {
              event: eventName,
              payload,
              queryKeys: keysToInvalidate.length,
            });
          }

          // Invalidate each query key
          keysToInvalidate.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key as unknown[] });
          });
        }
      );

      unsubscribes.push(unsub);
    }

    if (debug) {
      logger.info('DataSync', 'Initialized', {
        subscribedEvents: Object.keys(eventToQueryKeys).length,
      });
    }

    // Cleanup on unmount
    return () => {
      unsubscribes.forEach((fn) => fn());
      if (debug) {
        logger.info('DataSync', 'Cleanup', { unsubscribed: unsubscribes.length });
      }
    };
  }, [queryClient, debug]);

  return <>{children}</>;
}

