/**
 * API Response Validation Utilities
 *
 * Centralized validation functions using Zod schemas for runtime type safety.
 * These utilities ensure API responses match expected schemas and provide
 * detailed error reporting when validation fails.
 */

import { z } from 'zod';
import { logger } from '@/services/logger';
import { ValidationError } from '@/lib/errors';

/**
 * Validates API response data against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Description of what's being validated (for error messages)
 * @returns Validated data with proper type inference
 * @throws ValidationError if data doesn't match schema
 *
 * @example
 * const tasks = validateApiResponse(
 *   TaskDataArraySchema,
 *   data,
 *   'getTasks'
 * );
 */
export function validateApiResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Format error messages for logging
    const errors = result.error.errors.map(e =>
      `${e.path.join('.')}: ${e.message}`
    ).join(', ');

    // Create field-level error map
    const fieldErrors: Record<string, string> = {};
    result.error.errors.forEach(e => {
      const path = e.path.join('.');
      fieldErrors[path] = e.message;
    });

    // Log detailed validation error
    logger.error('Validation', `API validation failed for ${context}`, {
      errors: result.error.errors,
      validationContext: context,
      receivedDataSample: Array.isArray(data)
        ? `Array with ${data.length} items`
        : typeof data,
      fieldErrors,
    });

    // Throw ValidationError with detailed information
    throw new ValidationError(
      `API validation failed (${context}): ${errors}`,
      fieldErrors,
      {
        context,
        errors: result.error.errors,
        zodError: result.error,
      }
    );
  }

  return result.data;
}

/**
 * Validates an array and filters out invalid items
 *
 * Instead of throwing on the first invalid item, this function:
 * - Validates each item individually
 * - Logs warnings for invalid items
 * - Returns only valid items
 *
 * Useful when you want to be resilient to partial data corruption.
 *
 * @param itemSchema - Zod schema for individual array items
 * @param data - Array of data to validate
 * @param context - Description of what's being validated
 * @returns Array of validated items (invalid items filtered out)
 *
 * @example
 * const validTasks = validateArrayWithFilter(
 *   TaskDataSchema,
 *   rawData,
 *   'getTasks'
 * );
 */
export function validateArrayWithFilter<T>(
  itemSchema: z.ZodSchema<T>,
  data: unknown[],
  context: string
): T[] {
  if (!Array.isArray(data)) {
    logger.error('Validation', `Expected array but got ${typeof data}`, { context });
    throw new ValidationError(
      `Expected array for ${context} but got ${typeof data}`,
      {},
      { context, receivedType: typeof data }
    );
  }

  const validated: T[] = [];
  const errors: Array<{ index: number; error: string; item: unknown }> = [];

  data.forEach((item, index) => {
    const result = itemSchema.safeParse(item);

    if (result.success) {
      validated.push(result.data);
    } else {
      const errorMsg = result.error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      ).join(', ');

      errors.push({
        index,
        error: errorMsg,
        item: item
      });

      logger.warn('Validation', `Filtered invalid item at index ${index}`, {
        context,
        index,
        errors: result.error.errors,
        itemSample: typeof item === 'object' && item !== null
          ? Object.keys(item).slice(0, 5)
          : typeof item,
      });
    }
  });

  // Log summary if any items were filtered
  if (errors.length > 0) {
    const errorRate = (errors.length / data.length * 100).toFixed(1);

    logger.warn('Validation', `Filtered ${errors.length} invalid items from ${context}`, {
      context,
      totalItems: data.length,
      validItems: validated.length,
      invalidItems: errors.length,
      errorRate: `${errorRate}%`,
      sampleErrors: errors.slice(0, 3), // Log first 3 errors as examples
    });
  }

  return validated;
}

/**
 * Validates a single item with optional fallback
 *
 * Similar to validateApiResponse but allows providing a fallback value
 * instead of throwing an error.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Description of what's being validated
 * @param fallback - Optional fallback value if validation fails
 * @returns Validated data or fallback value
 *
 * @example
 * const config = validateWithFallback(
 *   ConfigSchema,
 *   rawConfig,
 *   'userConfig',
 *   DEFAULT_CONFIG
 * );
 */
export function validateWithFallback<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string,
  fallback?: T
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (fallback !== undefined) {
      logger.warn('Validation', `Validation failed for ${context}, using fallback`, {
        context,
        errors: result.error.errors,
      });
      return fallback;
    }

    // If no fallback, throw like validateApiResponse
    const errors = result.error.errors.map(e =>
      `${e.path.join('.')}: ${e.message}`
    ).join(', ');

    throw new ValidationError(
      `Validation failed (${context}): ${errors}`,
      {},
      { context, errors: result.error.errors }
    );
  }

  return result.data;
}

/**
 * Partial validation - validates only provided fields
 *
 * Useful for PATCH operations where not all fields are required.
 *
 * @param schema - Base Zod schema (will be made partial)
 * @param data - Partial data to validate
 * @param context - Description of what's being validated
 * @returns Validated partial data
 *
 * @example
 * const updates = validatePartial(
 *   TaskDataSchema,
 *   { status: 'done', completed_at: new Date().toISOString() },
 *   'updateTask'
 * );
 */
export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  data: unknown,
  context: string
): Partial<z.infer<T>> {
  const partialSchema = schema.partial();
  return validateApiResponse(partialSchema, data, context);
}
