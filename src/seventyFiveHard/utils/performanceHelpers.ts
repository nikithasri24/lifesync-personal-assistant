/**
 * Performance monitoring utilities for 75 Hard actions
 */

import { logger } from '../../services/logger';

/**
 * Performance monitoring utility
 */
export function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  return fn().then(result => {
    const duration = performance.now() - start;
    logger.info('Perf', `${name}: ${duration.toFixed(2)}ms`);
    return result;
  });
}
