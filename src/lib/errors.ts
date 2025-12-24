/**
 * Custom Error Classes for LifeSync
 * 
 * Provides typed error classes for better error handling and debugging
 */

/**
 * Base error class for all LifeSync errors
 */
export class LifeSyncError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly context?: Record<string, unknown>;
  public readonly canRetry: boolean;
  public readonly userMessage: string;

  constructor(
    message: string,
    options: {
      code: string;
      statusCode?: number;
      context?: Record<string, unknown>;
      canRetry?: boolean;
      userMessage?: string;
    }
  ) {
    super(message);
    this.name = 'LifeSyncError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.context = options.context;
    this.canRetry = options.canRetry ?? false;
    this.userMessage = options.userMessage ?? message;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Network-related errors (connection issues, timeouts, etc.)
 */
export class NetworkError extends LifeSyncError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'NETWORK_ERROR',
      statusCode: 0,
      context,
      canRetry: true,
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
    });
    this.name = 'NetworkError';
  }
}

/**
 * Authentication errors (invalid token, expired session, etc.)
 */
export class AuthenticationError extends LifeSyncError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'AUTH_ERROR',
      statusCode: 401,
      context,
      canRetry: false,
      userMessage: 'Your session has expired. Please log in again.',
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization errors (insufficient permissions, RLS policy violations, etc.)
 */
export class AuthorizationError extends LifeSyncError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      context,
      canRetry: false,
      userMessage: 'You don\'t have permission to perform this action.',
    });
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation errors (invalid input, missing required fields, etc.)
 */
export class ValidationError extends LifeSyncError {
  public readonly fields?: Record<string, string>;

  constructor(
    message: string,
    fields?: Record<string, string>,
    context?: Record<string, unknown>
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      context,
      canRetry: true,
      userMessage: 'The data provided was invalid. Please check your input and try again.',
    });
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends LifeSyncError {
  constructor(resource: string, id?: string, context?: Record<string, unknown>) {
    super(`${resource} not found${id ? `: ${id}` : ''}`, {
      code: 'NOT_FOUND',
      statusCode: 404,
      context: { ...context, resource, id },
      canRetry: false,
      userMessage: `The ${resource} you're looking for doesn't exist or has been removed.`,
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict errors (duplicate entries, concurrent modifications, etc.)
 */
export class ConflictError extends LifeSyncError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'CONFLICT_ERROR',
      statusCode: 409,
      context,
      canRetry: false,
      userMessage: 'This item already exists or there was a conflict. Please try updating the existing item instead.',
    });
    this.name = 'ConflictError';
  }
}

/**
 * Rate limiting errors (too many requests)
 */
export class RateLimitError extends LifeSyncError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, context?: Record<string, unknown>) {
    super(message, {
      code: 'RATE_LIMIT_ERROR',
      statusCode: 429,
      context,
      canRetry: true,
      userMessage: 'You\'re doing that too fast. Please wait a moment and try again.',
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Server errors (500, 502, 503, etc.)
 */
export class ServerError extends LifeSyncError {
  constructor(message: string, statusCode: number = 500, context?: Record<string, unknown>) {
    super(message, {
      code: 'SERVER_ERROR',
      statusCode,
      context,
      canRetry: true,
      userMessage: 'Something went wrong on our end. Please try again in a few moments.',
    });
    this.name = 'ServerError';
  }
}

/**
 * Database errors (connection issues, query failures, etc.)
 */
export class DatabaseError extends LifeSyncError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'DATABASE_ERROR',
      statusCode: 500,
      context,
      canRetry: true,
      userMessage: 'A database error occurred. Please try again.',
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Parse unknown error into a LifeSyncError
 */
export function parseToLifeSyncError(error: unknown): LifeSyncError {
  // Already a LifeSyncError
  if (error instanceof LifeSyncError) {
    return error;
  }

  // Network errors (fetch failures)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError(error.message);
  }

  // Handle Supabase/PostgrestError
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Authentication errors
    if (
      err.code === '401' ||
      err.status === 401 ||
      err.code === 'PGRST301' ||
      (typeof err.message === 'string' && (err.message.includes('JWT') || err.message.includes('token')))
    ) {
      return new AuthenticationError(
        typeof err.message === 'string' ? err.message : 'Authentication failed',
        err as Record<string, unknown>
      );
    }

    // Authorization errors (RLS policy violations)
    if (err.code === '403' || err.status === 403 || err.code === 'PGRST301') {
      return new AuthorizationError(
        typeof err.message === 'string' ? err.message : 'Access denied',
        err as Record<string, unknown>
      );
    }

    // Validation errors
    if (err.code === '400' || err.status === 400) {
      return new ValidationError(
        typeof err.message === 'string' ? err.message : 'Validation failed',
        undefined,
        err as Record<string, unknown>
      );
    }

    // Not found errors (including table not found)
    if (err.code === '404' || err.status === 404 || err.code === '42P01' || err.code === 'PGRST205') {
      return new NotFoundError(
        'Resource',
        undefined,
        err as Record<string, unknown>
      );
    }

    // Conflict errors (duplicate key)
    if (err.code === '409' || err.status === 409 || err.code === '23505') {
      return new ConflictError(
        typeof err.message === 'string' ? err.message : 'Conflict occurred',
        err as Record<string, unknown>
      );
    }

    // Rate limiting
    if (err.code === '429' || err.status === 429) {
      return new RateLimitError(
        typeof err.message === 'string' ? err.message : 'Rate limit exceeded',
        undefined,
        err as Record<string, unknown>
      );
    }

    // Server errors
    if (
      err.code === '500' ||
      err.status === 500 ||
      err.code === '502' ||
      err.status === 502 ||
      err.code === '503' ||
      err.status === 503
    ) {
      return new ServerError(
        typeof err.message === 'string' ? err.message : 'Server error',
        typeof err.status === 'number' ? err.status : 500,
        err as Record<string, unknown>
      );
    }

    // Database-specific errors
    if (typeof err.code === 'string' && err.code.startsWith('P')) {
      return new DatabaseError(
        typeof err.message === 'string' ? err.message : 'Database error',
        err as Record<string, unknown>
      );
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return new LifeSyncError(error.message, {
      code: 'UNKNOWN_ERROR',
      canRetry: true,
      userMessage: 'An unexpected error occurred. Please try again.',
    });
  }

  // String error
  if (typeof error === 'string') {
    return new LifeSyncError(error, {
      code: 'UNKNOWN_ERROR',
      canRetry: true,
      userMessage: error,
    });
  }

  // Unknown error type
  return new LifeSyncError('An unknown error occurred', {
    code: 'UNKNOWN_ERROR',
    canRetry: true,
    userMessage: 'Something went wrong. Please try again.',
  });
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const lifeSyncError = parseToLifeSyncError(error);
  return lifeSyncError.canRetry;
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  const lifeSyncError = parseToLifeSyncError(error);
  return lifeSyncError.userMessage;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof AuthenticationError || parseToLifeSyncError(error) instanceof AuthenticationError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || parseToLifeSyncError(error) instanceof NetworkError;
}

