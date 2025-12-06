/**
 * Type-safe validation utilities to replace 'as any' assertions
 */

/**
 * Validates that a string value is one of the allowed enum values
 * @param value - The value to validate
 * @param validValues - Array of valid enum values
 * @param defaultValue - Default value to return if validation fails
 * @returns The validated value or default
 */
export function validateEnum<T extends string>(
  value: string,
  validValues: readonly T[],
  defaultValue: T
): T {
  return validValues.includes(value as T) ? (value as T) : defaultValue;
}

/**
 * Type guard to check if a value is a valid enum value
 * @param value - The value to check
 * @param validValues - Array of valid enum values
 * @returns True if value is in validValues
 */
export function isValidEnum<T extends string>(
  value: string,
  validValues: readonly T[]
): value is T {
  return validValues.includes(value as T);
}

/**
 * Creates a type-safe enum validator for a specific enum type
 * @param validValues - Array of valid enum values
 * @param defaultValue - Default value to return if validation fails
 * @returns A validator function
 */
export function createEnumValidator<T extends string>(
  validValues: readonly T[],
  defaultValue: T
) {
  return (value: string): T => validateEnum(value, validValues, defaultValue);
}
