/**
 * useDraftStorage Hook
 *
 * Generic auto-save hook for form drafts using localStorage.
 * Automatically loads, saves, and clears drafts for any form data.
 *
 * @example
 * ```typescript
 * const [draft, saveDraft, clearDraft] = useDraftStorage('task_form', {
 *   title: '',
 *   description: '',
 * }, isEditing);
 *
 * // Use draft.title, draft.description in your form
 * // Auto-saves on every change
 * // Call clearDraft() after successful submit
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/logger';

export interface UseDraftStorageOptions {
  /**
   * If true, disables auto-save (useful when editing existing items)
   * @default false
   */
  disabled?: boolean;

  /**
   * Debounce delay in milliseconds before saving to localStorage
   * @default 300
   */
  debounceMs?: number;
}

/**
 * Hook for managing form draft state with localStorage persistence
 *
 * @param key - Unique localStorage key for this draft
 * @param initialValue - Default value when no draft exists
 * @param options - Configuration options
 * @returns [currentValue, updateValue, clearDraft, hasDraft]
 */
export function useDraftStorage<T extends Record<string, any>>(
  key: string,
  initialValue: T,
  options: UseDraftStorageOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const { disabled = false, debounceMs = 300 } = options;

  // Load draft from localStorage on mount
  const loadDraft = useCallback((): T | null => {
    if (disabled) return null;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        logger.debug('DraftStorage', `Draft loaded for ${key}`, { hasData: true });
        return parsed;
      }
    } catch (error) {
      logger.error('DraftStorage', error as Error, {
        context: 'Failed to load draft',
        key
      });
    }
    return null;
  }, [key, disabled]);

  // Initialize state with draft or initial value
  const [value, setValue] = useState<T>(() => {
    const draft = loadDraft();
    return draft !== null ? draft : initialValue;
  });

  const [hasDraft] = useState<boolean>(() => {
    if (disabled) return false;
    try {
      const saved = localStorage.getItem(key);
      return saved !== null;
    } catch {
      return false;
    }
  });

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (disabled) return;

    // Check if value has any non-empty fields
    const hasContent = Object.values(value).some(v => {
      if (typeof v === 'string') return v.trim().length > 0;
      if (typeof v === 'number') return true;
      if (typeof v === 'boolean') return v !== false;
      if (Array.isArray(v)) return v.length > 0;
      if (v === null || v === undefined) return false;
      return true;
    });

    if (!hasContent) {
      // Don't save empty drafts
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        logger.debug('DraftStorage', `Draft saved for ${key}`);
      } catch (error) {
        logger.error('DraftStorage', error as Error, {
          context: 'Failed to save draft',
          key
        });
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, key, disabled, debounceMs]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      logger.debug('DraftStorage', `Draft cleared for ${key}`);
    } catch (error) {
      logger.error('DraftStorage', error as Error, {
        context: 'Failed to clear draft',
        key
      });
    }
  }, [key]);

  // Update value function (supports both direct value and updater function)
  const updateValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(newValue);
  }, []);

  return [value, updateValue, clearDraft, hasDraft];
}

/**
 * Simple wrapper for single field drafts (e.g., quick add modals)
 *
 * @example
 * ```typescript
 * const [text, setText, clearText] = useSimpleDraft('quick_add_text', '');
 * ```
 */
export function useSimpleDraft(
  key: string,
  initialValue: string = '',
  disabled: boolean = false
): [string, (value: string) => void, () => void, boolean] {
  const [draft, updateDraft, clearDraft, hasDraft] = useDraftStorage(
    key,
    { value: initialValue },
    { disabled }
  );

  const setValue = useCallback((newValue: string) => {
    updateDraft({ value: newValue });
  }, [updateDraft]);

  return [draft.value, setValue, clearDraft, hasDraft];
}
