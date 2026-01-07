/**
 * API Wrapper Utilities
 * 
 * Provides standardized error handling for all API calls
 * Ensures consistent error types, logging, and context
 */

import { logger } from '@/services/logger';
import {
  parseToLifeSyncError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  DatabaseError,
  LifeSyncError,
} from '@/lib/errors';
import { supabase } from '@/lib/supabase';

/**
 * API call context for logging and error tracking
 */
export interface APIContext {
  domain: string; // e.g., 'TasksAPI', 'HabitsAPI'
  operation: string; // e.g., 'getTask', 'createHabit'
  data?: Record<string, unknown>; // Additional context data
}

/**
 * Wrapper for API calls that ensures consistent error handling
 * 
 * @param operation - The async operation to execute
 * @param context - Context for logging and error tracking
 * @returns The result of the operation
 * @throws LifeSyncError - Standardized error with proper context
 * 
 * @example
 * ```typescript
 * export async function getTask(id: string): Promise<TaskData> {
 *   return apiCall(
 *     async () => {
 *       const { data: { user } } = await supabase.auth.getUser();
 *       if (!user) throw new AuthenticationError('Not authenticated');
 *       
 *       const { data, error } = await supabase
 *         .from('tasks')
 *         .select('*')
 *         .eq('id', id)
 *         .eq('user_id', user.id)
 *         .single();
 *       
 *       if (error) throw error;
 *       if (!data) throw new NotFoundError('Task', id);
 *       return data as TaskData;
 *     },
 *     { domain: 'TasksAPI', operation: 'getTask', data: { id } }
 *   );
 * }
 * ```
 */
export async function apiCall<T>(
  operation: () => Promise<T>,
  context: APIContext
): Promise<T> {
  try {
    logger.debug(context.domain, `Starting ${context.operation}`, context.data);
    const result = await operation();
    logger.debug(context.domain, `Completed ${context.operation}`, context.data);
    return result;
  } catch (error) {
    const lifeSyncError = parseToLifeSyncError(error);
    
    // Add context to the error
    const enhancedError = new LifeSyncError(lifeSyncError.message, {
      code: lifeSyncError.code,
      statusCode: lifeSyncError.statusCode,
      context: {
        ...lifeSyncError.context,
        domain: context.domain,
        operation: context.operation,
        ...context.data,
      },
      canRetry: lifeSyncError.canRetry,
      userMessage: lifeSyncError.userMessage,
    });

    // Log the error with full context
    logger.error(context.domain, enhancedError, {
      operation: context.operation,
      code: enhancedError.code,
      statusCode: enhancedError.statusCode,
      ...context.data,
    });

    throw enhancedError;
  }
}

/**
 * Check if user is authenticated and return user
 * Throws AuthenticationError if not authenticated
 */
export async function requireAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new AuthenticationError('Failed to get user session', { error: error.message });
  }
  
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }
  
  return user;
}

/**
 * Handle Supabase query response
 * Throws appropriate errors based on response
 */
export function handleSupabaseResponse<T>(
  response: { data: T | null; error: unknown },
  resourceName: string,
  resourceId?: string
): T {
  if (response.error) {
    // Check for specific error codes
    const error = response.error as { code?: string; message?: string };
    
    // Duplicate key violation
    if (error.code === '23505') {
      throw new ConflictError(
        error.message || `${resourceName} already exists`,
        { code: error.code, resourceName, resourceId }
      );
    }
    
    // Foreign key violation
    if (error.code === '23503') {
      throw new ValidationError(
        error.message || 'Invalid reference',
        undefined,
        { code: error.code, resourceName, resourceId }
      );
    }
    
    // RLS policy violation
    if (error.code === 'PGRST301' || error.code === '42501') {
      throw new AuthorizationError(
        error.message || 'Access denied',
        { code: error.code, resourceName, resourceId }
      );
    }
    
    // Generic database error
    throw new DatabaseError(
      error.message || 'Database operation failed',
      { code: error.code, resourceName, resourceId }
    );
  }
  
  if (!response.data) {
    throw new NotFoundError(resourceName, resourceId);
  }
  
  return response.data;
}

