/**
 * Command Bus Middleware
 * 
 * Cross-cutting concerns for command processing:
 * - Logging
 * - Analytics
 * - Undo/Redo support
 */

import { logger } from '@/services/logger';
import type { Command, CommandResult, CommandMiddleware } from './types';

// =====================================================
// LOGGING MIDDLEWARE
// =====================================================

/**
 * Logs all commands with timing information
 */
export const loggingMiddleware: CommandMiddleware = async (command, next) => {
  const startTime = Date.now();
  
  logger.debug('CommandBus:Logging', `→ ${command.type}`, {
    source: command.source,
    timestamp: command.timestamp,
  });

  const result = await next();

  const duration = Date.now() - startTime;
  logger.debug('CommandBus:Logging', `← ${command.type}`, {
    success: result.success,
    duration: `${duration}ms`,
    error: result.error,
  });

  return result;
};

// =====================================================
// ANALYTICS MIDDLEWARE
// =====================================================

type AnalyticsEvent = {
  event: string;
  properties: Record<string, unknown>;
  timestamp: Date;
};

let analyticsQueue: AnalyticsEvent[] = [];

/**
 * Tracks command usage for analytics
 */
export const analyticsMiddleware: CommandMiddleware = async (command, next) => {
  const result = await next();

  // Queue analytics event
  analyticsQueue.push({
    event: `command:${command.type.toLowerCase()}`,
    properties: {
      source: command.source,
      success: result.success,
      error: result.error ? 'error' : undefined,
    },
    timestamp: new Date(),
  });

  // Flush queue periodically (in production, send to analytics service)
  if (analyticsQueue.length >= 10) {
    logger.debug('CommandBus:Analytics', `Flushing ${analyticsQueue.length} events`);
    analyticsQueue = [];
  }

  return result;
};

// =====================================================
// UNDO MIDDLEWARE
// =====================================================

interface UndoableCommand {
  command: Command;
  result: CommandResult;
  undoData?: unknown;
}

const undoStack: UndoableCommand[] = [];
const MAX_UNDO_STACK = 50;

// Commands that support undo
const UNDOABLE_COMMANDS = [
  'CREATE_TASK',
  'UPDATE_TASK',
  'DELETE_TASK',
  'COMPLETE_TASK',
  'CREATE_HABIT',
  'UPDATE_HABIT',
  'DELETE_HABIT',
  'CREATE_SCHEDULE_BLOCK',
  'UPDATE_SCHEDULE_BLOCK',
  'DELETE_SCHEDULE_BLOCK',
];

/**
 * Tracks undoable commands for undo/redo support
 */
export const undoMiddleware: CommandMiddleware = async (command, next) => {
  const result = await next();

  // Only track successful undoable commands
  if (result.success && UNDOABLE_COMMANDS.includes(command.type)) {
    undoStack.push({
      command,
      result,
      undoData: result.data, // Store result data for potential undo
    });

    // Limit stack size
    if (undoStack.length > MAX_UNDO_STACK) {
      undoStack.shift();
    }

    logger.debug('CommandBus:Undo', `Tracked ${command.type} (stack: ${undoStack.length})`);
  }

  return result;
};

/**
 * Get the last undoable command
 */
export function getLastUndoableCommand(): UndoableCommand | undefined {
  return undoStack[undoStack.length - 1];
}

/**
 * Pop the last undoable command from the stack
 */
export function popUndoStack(): UndoableCommand | undefined {
  return undoStack.pop();
}

/**
 * Clear the undo stack
 */
export function clearUndoStack(): void {
  undoStack.length = 0;
}

// =====================================================
// VALIDATION MIDDLEWARE
// =====================================================

/**
 * Validates commands before execution
 */
export const validationMiddleware: CommandMiddleware = async (command, next) => {
  // Ensure required fields
  if (!command.type) {
    return { success: false, error: 'Command type is required' };
  }

  if (!command.source) {
    return { success: false, error: 'Command source is required' };
  }

  // Validate payload exists for commands that need it
  if ('payload' in command && !command.payload) {
    return { success: false, error: 'Command payload is required' };
  }

  return next();
};

