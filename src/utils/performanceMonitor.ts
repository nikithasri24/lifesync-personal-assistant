/**
 * Performance Monitoring Utility
 * 
 * Tracks route transitions, component render times, and other performance metrics
 */

import { logger } from '../services/logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private enabled: boolean;

  constructor() {
    // Enable in development or if explicitly enabled
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  /**
   * Start measuring a performance metric
   */
  start(name: string): void {
    if (!this.enabled) return;
    
    this.marks.set(name, performance.now());
  }

  /**
   * End measuring a performance metric
   */
  end(name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn('PerformanceMonitor', `No start mark found for: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.marks.delete(name);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      logger.warn('PerformanceMonitor', `Slow operation detected: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...metadata,
      });
    } else if (import.meta.env.DEV) {
      // Log all metrics in development
      logger.debug('PerformanceMonitor', `${name}: ${duration.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Measure a route transition
   */
  measureRouteTransition(from: string, to: string): void {
    if (!this.enabled) return;

    const markName = `route-transition:${from}->${to}`;
    this.start(markName);

    // Use requestIdleCallback to measure after the route has rendered
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.end(markName, { from, to });
      });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(() => {
        this.end(markName, { from, to });
      }, 0);
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByPattern(pattern: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name.includes(pattern));
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const matchingMetrics = this.metrics.filter(m => m.name === name);
    if (matchingMetrics.length === 0) return 0;

    const total = matchingMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / matchingMetrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    slowOperations: number;
    averageRouteTransition: number;
  } {
    const slowOperations = this.metrics.filter(m => m.duration > 1000).length;
    const routeTransitions = this.getMetricsByPattern('route-transition');
    const averageRouteTransition = routeTransitions.length > 0
      ? routeTransitions.reduce((sum, m) => sum + m.duration, 0) / routeTransitions.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      slowOperations,
      averageRouteTransition,
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

