import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { logger } from '../services/logger';

// Memoization hook for expensive calculations
export function useMemoizedCalculation<T>(
  calculateFn: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(() => calculateFn(), dependencies);
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300
): T {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: unknown[]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: unknown[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Previous value hook for comparison
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Mount status hook
export function useIsMounted(): React.MutableRefObject<boolean> {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}): {
  visibleItems: { item: T; index: number }[];
  totalHeight: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
} {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string): void {
  const startTime = useRef<number>(performance.now());

  useEffect(() => {
    startTime.current = performance.now();
  });

  useEffect(() => {
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      logger.debug('Optimization', `${name} render time: ${duration.toFixed(2)}ms`);
    };
  });
}

// Memory usage monitoring (development only)
export function useMemoryMonitor(componentName: string): void {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const memoryInfo = (performance as { memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
      if (memoryInfo) {
        logger.debug('Optimization', `${componentName} Memory Usage`, {
          used: Math.round(memoryInfo.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memoryInfo.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }
    }
  });
}
