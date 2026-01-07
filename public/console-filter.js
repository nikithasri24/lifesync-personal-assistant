/**
 * Console Filter - Suppress noisy browser internal messages
 * 
 * This script filters out harmless browser internal messages that we cannot
 * control from application code, such as CoreLocation errors.
 */

(function() {
  'use strict';

  // Only run in development mode
  if (import.meta && import.meta.env && import.meta.env.PROD) {
    return;
  }

  // List of patterns to filter out
  const FILTER_PATTERNS = [
    /CoreLocationProvider.*kCLErrorLocationUnknown/i,
    /CoreLocation framework reported/i,
  ];

  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  /**
   * Check if a message should be filtered
   */
  function shouldFilter(args) {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');

    return FILTER_PATTERNS.some(pattern => pattern.test(message));
  }

  /**
   * Filtered console.error
   */
  console.error = function(...args) {
    if (!shouldFilter(args)) {
      originalError.apply(console, args);
    }
  };

  /**
   * Filtered console.warn
   */
  console.warn = function(...args) {
    if (!shouldFilter(args)) {
      originalWarn.apply(console, args);
    }
  };

  /**
   * Filtered console.log
   */
  console.log = function(...args) {
    if (!shouldFilter(args)) {
      originalLog.apply(console, args);
    }
  };

  // Log that filtering is active (only once)
  console.info('[Console Filter] Filtering browser internal messages');
})();

