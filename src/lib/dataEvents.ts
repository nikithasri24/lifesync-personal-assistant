/**
 * DataEvents - Typed Event Emitter for Data Synchronization
 *
 * Provides a pub/sub system for data changes across the application.
 * Producers (mutations) emit events, consumers (DataSyncProvider, services)
 * subscribe to invalidate caches and react to changes.
 *
 * Benefits:
 * - Decoupled: Producers don't need to know about consumers
 * - Type-safe: Full TypeScript support for event payloads
 * - Scalable: New consumers can subscribe without modifying producers
 */

import type { TaskData, HabitData, HabitEntryData } from '@/services/types';

// =====================================================
// EVENT PAYLOAD TYPES
// =====================================================

/** Payload for task-related events */
export interface TaskEventPayload {
  taskId: string;
  task?: TaskData;
  changes?: Partial<TaskData>;
}

/** Payload for habit-related events */
export interface HabitEventPayload {
  habitId: string;
  habit?: HabitData;
  changes?: Partial<HabitData>;
}

/** Payload for habit entry events */
export interface HabitEntryEventPayload {
  habitId: string;
  date: string;
  completed: boolean;
  entry?: HabitEntryData;
}

/** Payload for calendar events */
export interface CalendarEventPayload {
  eventId: string;
  date?: string;
}

/** Payload for scheduling events */
export interface ScheduleEventPayload {
  date: string;
  taskIds?: string[];
  blockId?: string;
}

/** Payload for goal events */
export interface GoalEventPayload {
  goalId: string;
  milestoneId?: string;
}

/** Payload for finance events */
export interface FinanceEventPayload {
  transactionId?: string;
  accountId?: string;
  budgetId?: string;
}

/** Payload for batch updates affecting multiple domains */
export interface BatchUpdatePayload {
  domains: Array<'tasks' | 'habits' | 'calendar' | 'goals' | 'finance' | 'scheduling'>;
  reason?: string;
}

// =====================================================
// EVENT MAP - All possible events and their payloads
// =====================================================

/**
 * Complete map of all data events in the application.
 * Each key is an event name, value is the payload type.
 */
export interface DataEventMap {
  // Index signature for generic access
  [key: string]: unknown;
  // Task events
  'task:created': TaskEventPayload;
  'task:updated': TaskEventPayload;
  'task:deleted': TaskEventPayload & { permanent: boolean };
  'task:completed': TaskEventPayload;
  'task:restored': TaskEventPayload;
  'task:scheduled': TaskEventPayload & { date: string };

  // Habit events
  'habit:created': HabitEventPayload;
  'habit:updated': HabitEventPayload;
  'habit:deleted': HabitEventPayload;
  'habit:entry-logged': HabitEntryEventPayload;
  'habit:streak-changed': HabitEventPayload & { streak: number };

  // Calendar events
  'calendar:created': CalendarEventPayload;
  'calendar:updated': CalendarEventPayload;
  'calendar:deleted': CalendarEventPayload;

  // Scheduling events
  'schedule:block-created': ScheduleEventPayload;
  'schedule:block-updated': ScheduleEventPayload;
  'schedule:block-deleted': ScheduleEventPayload;
  'schedule:auto-scheduled': ScheduleEventPayload;
  'schedule:day-changed': ScheduleEventPayload;

  // Goal events
  'goal:created': GoalEventPayload;
  'goal:updated': GoalEventPayload;
  'goal:deleted': GoalEventPayload;
  'goal:milestone-completed': GoalEventPayload;
  'goal:progress-updated': GoalEventPayload;

  // Finance events
  'finance:transaction-created': FinanceEventPayload;
  'finance:transaction-updated': FinanceEventPayload;
  'finance:transaction-deleted': FinanceEventPayload;
  'finance:budget-updated': FinanceEventPayload;

  // Batch/generic events
  'data:batch-update': BatchUpdatePayload;
  'data:sync-required': { reason: string };
}

// =====================================================
// TYPED EVENT EMITTER
// =====================================================

type EventCallback<T> = (payload: T) => void;

/**
 * Type-safe event emitter for data synchronization.
 * Provides compile-time checking for event names and payloads.
 */
class TypedEventEmitter<TEventMap extends { [key: string]: unknown }> {
  private listeners = new Map<keyof TEventMap, Set<EventCallback<unknown>>>();
  private onceListeners = new Map<keyof TEventMap, Set<EventCallback<unknown>>>();

  /**
   * Subscribe to an event.
   * @returns Unsubscribe function
   */
  on<K extends keyof TEventMap>(
    event: K,
    callback: EventCallback<TEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event for one-time execution.
   * Automatically unsubscribes after first call.
   */
  once<K extends keyof TEventMap>(
    event: K,
    callback: EventCallback<TEventMap[K]>
  ): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(callback as EventCallback<unknown>);

    return () => {
      this.onceListeners.get(event)?.delete(callback as EventCallback<unknown>);
    };
  }

  /**
   * Unsubscribe from an event.
   */
  off<K extends keyof TEventMap>(
    event: K,
    callback: EventCallback<TEventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
    this.onceListeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  /**
   * Emit an event with payload.
   * All subscribers will be called synchronously.
   */
  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
    // Call regular listeners
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[DataEvents] Error in listener for ${String(event)}:`, error);
        }
      });
    }

    // Call once listeners and remove them
    const onceCallbacks = this.onceListeners.get(event);
    if (onceCallbacks) {
      onceCallbacks.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[DataEvents] Error in once listener for ${String(event)}:`, error);
        }
      });
      this.onceListeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event, or all events if no event specified.
   */
  clear(event?: keyof TEventMap): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: keyof TEventMap): number {
    const regular = this.listeners.get(event)?.size ?? 0;
    const once = this.onceListeners.get(event)?.size ?? 0;
    return regular + once;
  }

  /**
   * Get all registered event names.
   */
  eventNames(): Array<keyof TEventMap> {
    const names = new Set<keyof TEventMap>();
    this.listeners.forEach((_, key) => names.add(key));
    this.onceListeners.forEach((_, key) => names.add(key));
    return Array.from(names);
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

/**
 * Global data events instance.
 * Use this to emit and subscribe to data change events.
 *
 * @example
 * // Emit an event (in a mutation)
 * dataEvents.emit('task:updated', { taskId: '123', changes: { status: 'done' } });
 *
 * @example
 * // Subscribe to an event (in a provider/service)
 * const unsubscribe = dataEvents.on('task:updated', (payload) => {
 *   queryClient.invalidateQueries({ queryKey: ['tasks'] });
 * });
 */
export const dataEvents = new TypedEventEmitter<DataEventMap>();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Emit a task event with common patterns.
 */
export function emitTaskEvent(
  type: 'created' | 'updated' | 'deleted' | 'completed' | 'restored',
  payload: TaskEventPayload & { permanent?: boolean }
): void {
  const eventName = `task:${type}` as keyof DataEventMap;
  dataEvents.emit(eventName, payload as DataEventMap[typeof eventName]);
}

/**
 * Emit a habit event with common patterns.
 */
export function emitHabitEvent(
  type: 'created' | 'updated' | 'deleted',
  payload: HabitEventPayload
): void {
  const eventName = `habit:${type}` as keyof DataEventMap;
  dataEvents.emit(eventName, payload as DataEventMap[typeof eventName]);
}

/**
 * Emit a calendar event with common patterns.
 */
export function emitCalendarEvent(
  type: 'created' | 'updated' | 'deleted',
  payload: CalendarEventPayload
): void {
  const eventName = `calendar:${type}` as keyof DataEventMap;
  dataEvents.emit(eventName, payload as DataEventMap[typeof eventName]);
}

/**
 * Emit a scheduling event.
 */
export function emitScheduleEvent(
  type: 'block-created' | 'block-updated' | 'block-deleted' | 'auto-scheduled' | 'day-changed',
  payload: ScheduleEventPayload
): void {
  const eventName = `schedule:${type}` as keyof DataEventMap;
  dataEvents.emit(eventName, payload as DataEventMap[typeof eventName]);
}

