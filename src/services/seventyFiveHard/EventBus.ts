/**
 * Event Bus Implementation
 *
 * Simple in-memory event bus for emitting and subscribing to domain events.
 * Allows decoupling of side effects from core business logic.
 */

import type { ChallengeEvent } from '../../types/seventyFiveHard';
import type { IEventBus } from './ChallengeService';

type EventHandler<T extends ChallengeEvent = ChallengeEvent> = (event: T) => void | Promise<void>;

type EventType = ChallengeEvent['type'];

export class EventBus implements IEventBus {
  private subscribers = new Map<EventType, Set<EventHandler>>();
  private globalSubscribers = new Set<EventHandler>();

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends EventType>(
    eventType: T,
    handler: EventHandler<Extract<ChallengeEvent, { type: T }>>
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const handlers = this.subscribers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(handler: EventHandler): () => void {
    this.globalSubscribers.add(handler);

    // Return unsubscribe function
    return () => {
      this.globalSubscribers.delete(handler);
    };
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: ChallengeEvent): Promise<void> {
    const eventType = event.type;

    // Get specific subscribers
    const specificHandlers = this.subscribers.get(eventType) || new Set();

    // Combine specific and global handlers
    const allHandlers = [...specificHandlers, ...this.globalSubscribers];

    // Execute all handlers (in parallel for async handlers)
    const promises = allHandlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Error in event handler for ${eventType}:`, error);
        // Don't throw - we don't want one failing handler to break others
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clear(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }

  /**
   * Get subscriber count for debugging
   */
  getSubscriberCount(eventType?: EventType): number {
    if (eventType) {
      return this.subscribers.get(eventType)?.size || 0;
    }
    // Total count across all event types
    let total = this.globalSubscribers.size;
    for (const handlers of this.subscribers.values()) {
      total += handlers.size;
    }
    return total;
  }
}

/**
 * Singleton instance for app-wide use
 */
export const globalEventBus = new EventBus();

/**
 * Hook up event handlers for side effects
 */
export function setupEventHandlers(eventBus: EventBus, deps: {
  ensureSFHTasksForToday?: () => Promise<void>;
  cleanupChallengeTasks?: (challengeId: string) => Promise<void>;
  logAnalytics?: (event: ChallengeEvent) => void;
}) {
  // Challenge created -> create tasks for today
  if (deps.ensureSFHTasksForToday) {
    eventBus.subscribe('challenge_created', async (event) => {
      console.log('[EventBus] Challenge created, ensuring tasks for today');
      try {
        await deps.ensureSFHTasksForToday?.();
      } catch (error) {
        console.error('[EventBus] Failed to create tasks:', error);
      }
    });
  }

  // Challenge paused -> cleanup tasks
  if (deps.cleanupChallengeTasks) {
    eventBus.subscribe('challenge_paused', async (event) => {
      console.log('[EventBus] Challenge paused, cleaning up tasks');
      try {
        await deps.cleanupChallengeTasks?.(event.challengeId);
      } catch (error) {
        console.error('[EventBus] Failed to cleanup tasks:', error);
      }
    });
  }

  // Challenge resumed -> create tasks
  if (deps.ensureSFHTasksForToday) {
    eventBus.subscribe('challenge_resumed', async (event) => {
      console.log('[EventBus] Challenge resumed, ensuring tasks for today');
      try {
        await deps.ensureSFHTasksForToday?.();
      } catch (error) {
        console.error('[EventBus] Failed to create tasks:', error);
      }
    });
  }

  // Day completed -> log analytics
  if (deps.logAnalytics) {
    eventBus.subscribe('day_completed', (event) => {
      deps.logAnalytics?.(event);
    });
  }

  // Challenge completed -> log analytics
  if (deps.logAnalytics) {
    eventBus.subscribe('challenge_completed', (event) => {
      deps.logAnalytics?.(event);
    });
  }

  // Global event logger for debugging
  if (process.env.NODE_ENV === 'development') {
    eventBus.subscribeAll((event) => {
      console.log(`[EventBus] Event: ${event.type}`, event);
    });
  }
}
