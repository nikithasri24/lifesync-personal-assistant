/**
 * Logger Service
 *
 * Centralized logging utility that:
 * - Only logs in development mode
 * - Provides consistent log formatting
 * - Can be extended to send logs to error tracking services (Sentry, LogRocket, etc.)
 * - Prevents logging sensitive data in production
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

type LogContext = Record<string, unknown>;

class Logger {
  private serviceName: string = 'LifeSync';

  /**
   * Format log message with timestamp and domain
   */
  private format(level: LogLevel, domain: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${domain}] ${message}`;
  }

  /**
   * Debug logs - only in development
   */
  debug(domain: string, message: string, context?: LogContext): void {
    if (isDev) {
      console.log(this.format(LogLevel.DEBUG, domain, message), context ?? '');
    }
  }

  /**
   * Info logs - only in development
   */
  info(domain: string, message: string, context?: LogContext): void {
    if (isDev) {
      console.info(this.format(LogLevel.INFO, domain, message), context ?? '');
    }
  }

  /**
   * Warning logs - shown in both dev and production
   */
  warn(domain: string, message: string, context?: LogContext): void {
    if (isDev) {
      console.warn(this.format(LogLevel.WARN, domain, message), context ?? '');
    } else {
      // In production: Send to error tracking service
      this.sendToErrorTracking(LogLevel.WARN, domain, message, context);
    }
  }

  /**
   * Error logs - shown in both dev and production
   */
  error(domain: string, error: Error | string, context?: LogContext): void {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    if (isDev) {
      console.error(this.format(LogLevel.ERROR, domain, message), {
        ...context,
        stack,
      });
    } else {
      // In production: Send to error tracking service
      this.sendToErrorTracking(LogLevel.ERROR, domain, message, {
        ...context,
        stack,
      });
    }
  }

  /**
   * Log API requests - useful for debugging
   */
  api(method: string, url: string, data?: unknown): void {
    if (isDev) {
      console.log(
        this.format(LogLevel.DEBUG, 'API', `${method} ${url}`),
        data ?? ''
      );
    }
  }

  /**
   * Log API responses
   */
  apiResponse(method: string, url: string, status: number, data?: unknown): void {
    if (isDev) {
      const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
      console.log(
        this.format(level, 'API', `${method} ${url} - ${status}`),
        data ?? ''
      );
    }
  }

  /**
   * Log performance metrics
   */
  perf(domain: string, operation: string, durationMs: number): void {
    if (isDev) {
      console.log(
        this.format(LogLevel.INFO, domain, `${operation} took ${durationMs}ms`)
      );
    }
  }

  /**
   * Group logs together (for complex operations)
   */
  group(label: string): void {
    if (isDev) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (isDev) {
      console.groupEnd();
    }
  }

  /**
   * Send logs to error tracking service (Sentry, LogRocket, etc.)
   * Override this method to integrate with your error tracking service
   */
  private sendToErrorTracking(
    level: LogLevel,
    domain: string,
    message: string,
    context?: LogContext
  ): void {
    // TODO: Integrate with Sentry or other error tracking service
    // Example:
    // Sentry.captureMessage(message, {
    //   level: level.toLowerCase(),
    //   tags: { domain },
    //   extra: context,
    // });

    // For now, just log to console in production
    if (isProd && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      console.error(`[${level}] [${domain}]`, message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (domain: string, message: string, context?: LogContext): void =>
  logger.debug(domain, message, context);

export const logInfo = (domain: string, message: string, context?: LogContext): void =>
  logger.info(domain, message, context);

export const logWarn = (domain: string, message: string, context?: LogContext): void =>
  logger.warn(domain, message, context);

export const logError = (domain: string, error: Error | string, context?: LogContext): void =>
  logger.error(domain, error, context);

export const logApi = (method: string, url: string, data?: unknown): void =>
  logger.api(method, url, data);

export const logApiResponse = (method: string, url: string, status: number, data?: unknown): void =>
  logger.apiResponse(method, url, status, data);

export const logPerf = (domain: string, operation: string, durationMs: number): void =>
  logger.perf(domain, operation, durationMs);