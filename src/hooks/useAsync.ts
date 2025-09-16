import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute, reset };
}

// Hook for debounced async operations
export function useDebouncedAsync<T>(
  asyncFunction: () => Promise<T>,
  delay: number = 300,
  immediate = false
): UseAsyncReturn<T> & { debounce: () => void } {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const asyncHook = useAsync(asyncFunction, immediate);

  const debounce = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      asyncHook.execute();
    }, delay);

    setTimeoutId(newTimeoutId);
  }, [asyncHook.execute, delay, timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return { ...asyncHook, debounce };
}

// Hook for polling data
export function usePolling<T>(
  asyncFunction: () => Promise<T>,
  interval: number = 5000,
  enabled = true
): UseAsyncReturn<T> & { startPolling: () => void; stopPolling: () => void } {
  const [isPolling, setIsPolling] = useState(enabled);
  const asyncHook = useAsync(asyncFunction, true);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(() => {
      asyncHook.execute();
    }, interval);

    return () => clearInterval(intervalId);
  }, [isPolling, interval, asyncHook.execute]);

  return { ...asyncHook, startPolling, stopPolling };
}