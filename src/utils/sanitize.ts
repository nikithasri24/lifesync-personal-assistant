/**
 * Input Sanitization Utilities
 * Protects against XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving safe formatting
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return '';

  // Configure DOMPurify to allow basic formatting but block scripts
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize plain text by removing all HTML tags
 * Use this for content that should be plain text only
 */
export function sanitizeText(dirty: string | undefined | null): string {
  if (!dirty) return '';

  // Strip all HTML tags
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize user input for recipe names, titles, etc.
 * Removes HTML and trims whitespace
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);
  return sanitized.trim();
}

/**
 * Sanitize recipe instructions allowing basic formatting
 * Preserves line breaks and basic formatting tags
 */
export function sanitizeRecipeContent(content: string | undefined | null): string {
  if (!content) return '';

  return sanitizeHtml(content);
}

/**
 * Sanitize an array of strings (for ingredients, steps, etc.)
 */
export function sanitizeArray(items: (string | undefined | null)[] | undefined | null): string[] {
  if (!items) return [];

  return items
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeInput(item));
}

/**
 * Check if a string contains potentially dangerous content
 * Returns true if suspicious patterns are detected
 */
export function containsDangerousContent(input: string | undefined | null): boolean {
  if (!input) return false;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}
