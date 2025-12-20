/**
 * Register All AI Tools
 * 
 * Centralizes registration of all feature tools with the tool registry.
 * Import this file at app startup to ensure all tools are available.
 */

import { toolRegistry } from './toolRegistry';
import { logger } from '@/services/logger';

// Feature tools
import { taskTools } from '@/todos/tools';
import { habitTools } from '@/habits/tools';
import { goalTools } from '@/goals/tools';
import { schedulerTools } from '@/scheduler/tools';
import { intelligenceTools } from './intelligenceTools';

// Import additional tools as they're created
// import { financeTools } from '@/finance/tools';
// import { journalTools } from '@/journal/tools';
// import { calendarTools } from '@/calendar/tools';

let registered = false;

/**
 * Register all AI tools with the tool registry
 * Safe to call multiple times - only registers once
 */
export function registerAllTools(): void {
  if (registered) {
    logger.debug('RegisterAllTools', 'Tools already registered, skipping');
    return;
  }

  logger.info('RegisterAllTools', 'Registering all AI tools...');

  // Register all tools
  toolRegistry.register([
    ...taskTools,
    ...habitTools,
    ...goalTools,
    ...schedulerTools,
    ...intelligenceTools,
    // Add more tools here as they're created
  ]);

  registered = true;

  const summary = toolRegistry.getSummary();
  logger.info('RegisterAllTools', `Registered ${summary.total} tools`, {
    total: summary.total,
    byFeature: summary.byFeature
  });
}

/**
 * Check if tools have been registered
 */
export function areToolsRegistered(): boolean {
  return registered;
}

// Auto-register on import (side effect)
registerAllTools();

