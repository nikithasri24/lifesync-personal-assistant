/**
 * Route Performance Tracking Hook
 * 
 * Automatically tracks route transitions and performance metrics
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '../services/logger';
import { performanceMonitor } from '../utils/performanceMonitor';

export function useRoutePerformance() {
  const location = useLocation();
  const previousPath = useRef<string>(location.pathname);

  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = previousPath.current;

    // Track route transition if path changed
    if (currentPath !== prevPath) {
      performanceMonitor.measureRouteTransition(prevPath, currentPath);
      previousPath.current = currentPath;
    }

    // Track initial page load
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navTiming = navigationEntries[0];
        
        // Log key performance metrics
        const metrics = {
          domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
          loadComplete: navTiming.loadEventEnd - navTiming.loadEventStart,
          domInteractive: navTiming.domInteractive - navTiming.fetchStart,
        };

        if (import.meta.env.DEV) {
          logger.debug('Hooks', 'Page Load Performance:', metrics);
        }
      }
    }
  }, [location.pathname]);
}

