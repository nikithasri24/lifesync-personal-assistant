/**
 * Command Handlers Index
 *
 * Exports all command handlers and provides a function to register them with the command bus.
 */

import { commandBus } from '../CommandBus';
import { taskHandlers } from './taskHandlers';
import { habitHandlers } from './habitHandlers';
import { scheduleHandlers } from './scheduleHandlers';
import { goalHandlers } from './goalHandlers';
import { inboxHandlers } from './inboxHandlers';
import { notificationHandlers } from './notificationHandlers';
import { loggingMiddleware, validationMiddleware, analyticsMiddleware, undoMiddleware } from '../middleware';
import { logger } from '@/services/logger';

export { taskHandlers } from './taskHandlers';
export { habitHandlers } from './habitHandlers';
export { scheduleHandlers } from './scheduleHandlers';
export { goalHandlers } from './goalHandlers';
export { inboxHandlers } from './inboxHandlers';
export { notificationHandlers } from './notificationHandlers';

/**
 * All handlers combined
 */
export const allHandlers = {
  ...taskHandlers,
  ...habitHandlers,
  ...scheduleHandlers,
  ...goalHandlers,
  ...inboxHandlers,
  ...notificationHandlers,
};

/**
 * Initialize the command bus with all handlers and middleware
 */
export function initializeCommandBus(): void {
  // Add middleware (order matters - first added is first executed)
  commandBus.use(validationMiddleware);
  commandBus.use(loggingMiddleware);
  commandBus.use(analyticsMiddleware);
  commandBus.use(undoMiddleware);

  // Register all handlers
  commandBus.registerHandlers(allHandlers);

  logger.info('CommandBus', 'Initialized with handlers', {
    handlers: Object.keys(allHandlers),
    middlewareCount: 4,
  });
}

