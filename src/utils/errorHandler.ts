/**
 * Enhanced Error Handling Utilities
 * Provides actionable error messages with retry capabilities
 */

export interface ErrorDetails {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
  suggestion?: string;
}

/**
 * Parse error and return user-friendly details with actionable guidance
 */
export function parseError(error: unknown): ErrorDetails {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      title: 'Connection Error',
      message: 'Unable to reach the server',
      suggestion: 'Check your internet connection and try again',
      action: 'Retry',
      canRetry: true,
    };
  }

  // Supabase/API errors
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // 400 Bad Request
    if (err.code === '400' || err.status === 400) {
      return {
        title: 'Invalid Request',
        message: 'The data provided was invalid',
        suggestion: 'Please check your input and try again',
        action: 'Retry',
        canRetry: true,
      };
    }

    // 401 Unauthorized
    if (err.code === '401' || err.status === 401 || err.code === 'PGRST301') {
      return {
        title: 'Session Expired',
        message: 'Your session has expired',
        suggestion: 'Please log in again to continue',
        action: 'Log In',
        canRetry: false,
      };
    }

    // 403 Forbidden / RLS policy violation
    if (err.code === '403' || err.status === 403 || err.code === 'PGRST301') {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action',
        suggestion: 'This might be a database permissions issue. Please contact support.',
        action: undefined,
        canRetry: false,
      };
    }

    // 404 Not Found / Table doesn't exist
    if (err.code === '404' || err.status === 404 || err.code === '42P01') {
      return {
        title: 'Resource Not Found',
        message: 'The requested resource doesn\'t exist',
        suggestion: 'The database might not be properly set up. Please contact support.',
        action: undefined,
        canRetry: false,
      };
    }

    // 409 Conflict / Duplicate
    if (err.code === '409' || err.status === 409 || err.code === '23505') {
      return {
        title: 'Duplicate Entry',
        message: 'This item already exists',
        suggestion: 'Try updating the existing item instead',
        action: undefined,
        canRetry: false,
      };
    }

    // 500 Server Error
    if (err.code === '500' || err.status === 500) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end',
        suggestion: 'Please try again in a few moments',
        action: 'Retry',
        canRetry: true,
      };
    }

    // Rate limiting
    if (err.code === '429' || err.status === 429) {
      return {
        title: 'Too Many Requests',
        message: 'You\'re doing that too fast',
        suggestion: 'Please wait a moment and try again',
        action: 'Retry',
        canRetry: true,
      };
    }

    // Supabase specific errors
    if (err.message && typeof err.message === 'string') {
      const message = err.message.toLowerCase();

      if (message.includes('jwt') || message.includes('token')) {
        return {
          title: 'Authentication Error',
          message: 'Your session is invalid',
          suggestion: 'Please log in again',
          action: 'Log In',
          canRetry: false,
        };
      }

      if (message.includes('network') || message.includes('offline')) {
        return {
          title: 'No Internet Connection',
          message: 'You appear to be offline',
          suggestion: 'Check your internet connection and try again',
          action: 'Retry',
          canRetry: true,
        };
      }

      if (message.includes('timeout')) {
        return {
          title: 'Request Timeout',
          message: 'The request took too long',
          suggestion: 'Your connection might be slow. Try again?',
          action: 'Retry',
          canRetry: true,
        };
      }
    }
  }

  // Error object with message
  if (error instanceof Error) {
    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      suggestion: 'Please try again or contact support if the problem persists',
      action: 'Retry',
      canRetry: true,
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      suggestion: 'Please try again',
      action: 'Retry',
      canRetry: true,
    };
  }

  // Unknown error
  return {
    title: 'Unexpected Error',
    message: 'Something went wrong',
    suggestion: 'Please try again or contact support if the problem persists',
    action: 'Retry',
    canRetry: true,
  };
}

/**
 * Format error for display in toast
 */
export function formatErrorMessage(error: unknown): string {
  const details = parseError(error);
  let message = details.message;

  if (details.suggestion) {
    message += `. ${details.suggestion}`;
  }

  return message;
}
