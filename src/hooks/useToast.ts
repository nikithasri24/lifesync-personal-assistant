import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastKind = 'info' | 'success' | 'error' | 'warning';

export interface ToastAction {
  label: string;
  icon?: 'retry' | 'login' | 'none';
  onAction: () => void;
}

export interface ToastState {
  message: string;
  type?: ToastKind;
  title?: string;
  action?: ToastAction;
}

export interface ShowToastOptions {
  title?: string;
  action?: ToastAction;
  duration?: number;
}

export const useToast = (defaultDuration = 4000): {
  toast: ToastState | null;
  showToast: (message: string, type?: ToastKind, options?: ShowToastOptions) => void;
  showError: (error: unknown, retryFn?: () => void) => void;
  dismissToast: () => void;
} => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismissToast = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const showToast = useCallback(
    (message: string, type: ToastKind = 'info', options?: ShowToastOptions) => {
      clearTimer();
      const duration = options?.duration ?? defaultDuration;

      setToast({
        message,
        type,
        title: options?.title,
        action: options?.action,
      });

      // Don't auto-dismiss if there's an action button (user needs to act)
      if (!options?.action) {
        timeoutRef.current = setTimeout(() => {
          setToast(null);
          timeoutRef.current = null;
        }, duration);
      }
    },
    [clearTimer, defaultDuration],
  );

  const showError = useCallback(
    (error: unknown, retryFn?: () => void) => {
      // Import parseError dynamically to avoid circular dependencies
      import('../utils/errorHandler').then(({ parseError, formatErrorMessage }) => {
        const details = parseError(error);
        const message = formatErrorMessage(error);

        showToast(message, 'error', {
          title: details.title,
          action: details.canRetry && retryFn ? {
            label: details.action || 'Retry',
            icon: 'retry',
            onAction: retryFn,
          } : undefined,
          duration: 6000, // Longer duration for errors
        });
      });
    },
    [showToast],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { toast, showToast, showError, dismissToast };
};
