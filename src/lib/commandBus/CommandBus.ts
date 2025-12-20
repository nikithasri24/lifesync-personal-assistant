/**
 * Command Bus
 * 
 * Central dispatcher for all application commands.
 * Provides a unified interface for voice, UI, CLI, and mobile to trigger actions.
 * Supports middleware for cross-cutting concerns like logging, analytics, and undo.
 */

import { logger } from '@/services/logger';
import type { Command, CommandResult, CommandMiddleware, CommandHandler } from './types';

export class CommandBus {
  private handlers: Map<string, CommandHandler> = new Map();
  private middlewares: CommandMiddleware[] = [];
  private eventListeners: Map<string, Array<(command: Command, result: CommandResult) => void>> = new Map();

  /**
   * Register a handler for a specific command type
   */
  registerHandler<T extends Command>(
    commandType: T['type'],
    handler: CommandHandler<T>
  ): void {
    if (this.handlers.has(commandType)) {
      logger.warn('CommandBus', `Handler for ${commandType} already registered, overwriting`);
    }
    this.handlers.set(commandType, handler as CommandHandler);
    logger.debug('CommandBus', `Registered handler for ${commandType}`);
  }

  /**
   * Register multiple handlers at once
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerHandlers(handlers: Record<string, CommandHandler<any>>): void {
    Object.entries(handlers).forEach(([type, handler]) => {
      this.registerHandler(type as Command['type'], handler);
    });
  }

  /**
   * Add middleware to the command pipeline
   * Middleware is executed in order of registration
   */
  use(middleware: CommandMiddleware): void {
    this.middlewares.push(middleware);
    logger.debug('CommandBus', `Added middleware (total: ${this.middlewares.length})`);
  }

  /**
   * Subscribe to command completion events
   */
  on(
    event: 'command:completed' | 'command:failed' | string,
    listener: (command: Command, result: CommandResult) => void
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }

  /**
   * Dispatch a command through the middleware pipeline to its handler
   */
  async dispatch<T extends Command>(command: T): Promise<CommandResult> {
    const startTime = Date.now();
    
    // Ensure command has timestamp
    if (!command.timestamp) {
      command.timestamp = new Date();
    }

    logger.info('CommandBus', `Dispatching ${command.type}`, {
      source: command.source,
      hasPayload: 'payload' in command,
    });

    // Check if handler exists
    const handler = this.handlers.get(command.type);
    if (!handler) {
      const error = `No handler registered for command type: ${command.type}`;
      logger.error('CommandBus', error);
      return { success: false, error };
    }

    // Build middleware chain
    const executeHandler = async (): Promise<CommandResult> => {
      try {
        return await handler(command);
      } catch (error) {
        logger.error('CommandBus', `Handler error for ${command.type}`, { error });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    };

    // Execute through middleware chain
    let result: CommandResult;
    try {
      result = await this.executeWithMiddleware(command, executeHandler, 0);
    } catch (error) {
      logger.error('CommandBus', `Middleware error for ${command.type}`, { error });
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Middleware error',
      };
    }

    // Log completion
    const duration = Date.now() - startTime;
    logger.info('CommandBus', `Completed ${command.type}`, {
      success: result.success,
      duration: `${duration}ms`,
    });

    // Emit events
    this.emit(result.success ? 'command:completed' : 'command:failed', command, result);
    this.emit(`command:${command.type}`, command, result);

    return result;
  }

  /**
   * Execute command through middleware chain recursively
   */
  private async executeWithMiddleware(
    command: Command,
    finalHandler: () => Promise<CommandResult>,
    index: number
  ): Promise<CommandResult> {
    if (index >= this.middlewares.length) {
      return finalHandler();
    }

    const middleware = this.middlewares[index];
    return middleware(command, () => 
      this.executeWithMiddleware(command, finalHandler, index + 1)
    );
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: string, command: Command, result: CommandResult): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(command, result);
        } catch (error) {
          logger.error('CommandBus', `Event listener error for ${event}`, { error });
        }
      });
    }
  }

  /**
   * Get list of registered command types
   */
  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a handler is registered for a command type
   */
  hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
  }
}

// Singleton instance
export const commandBus = new CommandBus();

