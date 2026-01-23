/**
 * HTML Sanitization Utility
 *
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify if available, otherwise falls back to basic sanitization.
 *
 * To enable full sanitization, install DOMPurify:
 * npm install dompurify
 * npm install @types/dompurify --save-dev
 */

// DOMPurify instance - dynamically loaded if available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DOMPurify: any = null;

// Attempt to load DOMPurify dynamically
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DOMPurify = require('dompurify');
} catch {
  // DOMPurify not installed, will use fallback
}

/**
 * Allowed HTML tags for journal content
 */
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'strike', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'span', 'div',
];

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTRS = ['href', 'target', 'rel', 'class', 'id'];

/**
 * Basic HTML sanitization fallback
 * Removes script tags and event handlers
 */
function basicSanitize(html: string): string {
  return html
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\s*on\w+=\S+/gi, '')
    // Remove javascript: URLs
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")
    // Remove data: URLs (potential XSS vector)
    .replace(/href\s*=\s*"data:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'data:[^']*'/gi, "href='#'");
}

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Use DOMPurify if available
  if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ALLOWED_ATTRS,
      ALLOW_DATA_ATTR: false,
    });
  }

  // Fallback to basic sanitization
  return basicSanitize(html);
}

export default sanitizeHtml;

