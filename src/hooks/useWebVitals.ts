/**
 * Web Vitals Hook
 * Tracks Core Web Vitals for production performance monitoring
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - INP (Interaction to Next Paint) - Interactivity (replaces FID)
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - FCP (First Contentful Paint) - Initial render
 * - TTFB (Time to First Byte) - Server response time
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   useWebVitals({ enabled: true });
 *   return <YourApp />;
 * }
 * ```
 */

import { useEffect } from 'react';
import { logger } from '../services/logger';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface WebVitalsOptions {
  enabled?: boolean;
  reportToAnalytics?: boolean;
  logToConsole?: boolean;
}

/**
 * Get rating for a metric based on Web Vitals thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
    INP: { good: 200, poor: 500 },        // Interaction to Next Paint (replaces FID)
    CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
    TTFB: { good: 800, poor: 1800 },      // Time to First Byte
  };

  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics service
 */
function reportToAnalytics(metric: WebVitalsMetric): void {
  // In production, send to your analytics service
  // Example: Google Analytics, Datadog, New Relic, etc.
  
  if (typeof window !== 'undefined' && (window as any).gtag) {
    // Google Analytics 4
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  }

  // Log to our logger for debugging
  logger.info('WebVitals', `${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`, {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
}

/**
 * Hook to track Web Vitals metrics
 */
export function useWebVitals(options: WebVitalsOptions = {}): void {
  const {
    enabled = true,
    reportToAnalytics: shouldReportToAnalytics = true,
    logToConsole = import.meta.env.DEV,
  } = options;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Dynamically import web-vitals library
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const handleMetric = (metric: { name: string; value: number; delta: number; id: string }) => {
        const webVitalsMetric: WebVitalsMetric = {
          name: metric.name,
          value: metric.value,
          rating: getRating(metric.name, metric.value),
          delta: metric.delta,
          id: metric.id,
        };

        if (logToConsole) {
          const emoji = webVitalsMetric.rating === 'good' ? '✅' : 
                       webVitalsMetric.rating === 'needs-improvement' ? '⚠️' : '❌';
          console.log(
            `${emoji} ${webVitalsMetric.name}: ${webVitalsMetric.value.toFixed(2)}ms (${webVitalsMetric.rating})`
          );
        }

        if (shouldReportToAnalytics) {
          reportToAnalytics(webVitalsMetric);
        }
      };

      // Track all Core Web Vitals
      onCLS(handleMetric);  // Cumulative Layout Shift
      onFCP(handleMetric);  // First Contentful Paint
      onLCP(handleMetric);  // Largest Contentful Paint
      onTTFB(handleMetric); // Time to First Byte
      onINP(handleMetric);  // Interaction to Next Paint (replaces FID)
    }).catch((error) => {
      logger.error('WebVitals', error instanceof Error ? error : new Error('Failed to load web-vitals library'));
    });
  }, [enabled, shouldReportToAnalytics, logToConsole]);
}

/**
 * Get current Web Vitals metrics (for debugging)
 */
export async function getWebVitalsSnapshot(): Promise<Record<string, number>> {
  if (typeof window === 'undefined') return {};

  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    const metrics: Record<string, number> = {};

    await Promise.all([
      new Promise<void>((resolve) => onCLS((metric: { value: number }) => { metrics.CLS = metric.value; resolve(); })),
      new Promise<void>((resolve) => onFCP((metric: { value: number }) => { metrics.FCP = metric.value; resolve(); })),
      new Promise<void>((resolve) => onLCP((metric: { value: number }) => { metrics.LCP = metric.value; resolve(); })),
      new Promise<void>((resolve) => onTTFB((metric: { value: number }) => { metrics.TTFB = metric.value; resolve(); })),
      new Promise<void>((resolve) => onINP((metric: { value: number }) => { metrics.INP = metric.value; resolve(); })),
    ]);

    return metrics;
  } catch (error) {
    logger.error('WebVitals', error instanceof Error ? error : new Error('Failed to get Web Vitals snapshot'));
    return {};
  }
}

