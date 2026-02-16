/**
 * Generic Modal State Hook
 *
 * A reusable hook for managing multiple modal states without boilerplate.
 * Replaces the pattern of creating individual useState + open/close handlers
 * for each modal in a component.
 *
 * @example
 * ```typescript
 * // Before (100+ lines of boilerplate):
 * const [showQuickAdd, setShowQuickAdd] = useState(false);
 * const [quickAddText, setQuickAddText] = useState('');
 * const [editingTask, setEditingTask] = useState<string | null>(null);
 * const openQuickAdd = () => setShowQuickAdd(true);
 * const closeQuickAdd = () => { setShowQuickAdd(false); setQuickAddText(''); };
 * // ... repeat for each modal
 *
 * // After (10 lines with useModalState):
 * const modals = useModalState({
 *   quickAdd: false,
 *   quickAddText: '',
 *   editingTask: null,
 *   editTaskText: '',
 *   showFilters: false,
 * });
 *
 * // Usage:
 * {modals.state.quickAdd && <QuickAddModal />}
 * <button onClick={() => modals.open('quickAdd')}>Add Task</button>
 * <button onClick={() => modals.close('quickAdd')}>Close</button>
 * modals.set('quickAddText', 'New value');
 * ```
 */

import { useState, useCallback } from 'react';

export interface ModalStateAPI<T extends Record<string, any>> {
  /** Current state of all modals */
  state: T;

  /** Open a modal (set to true) */
  open: (key: keyof T) => void;

  /** Close a modal (set to false) */
  close: (key: keyof T) => void;

  /** Toggle a modal state */
  toggle: (key: keyof T) => void;

  /** Set a specific value for any modal state */
  set: <K extends keyof T>(key: K, value: T[K]) => void;

  /** Reset all modals to initial state */
  reset: () => void;

  /** Batch update multiple modal states at once */
  batch: (updates: Partial<T>) => void;
}

/**
 * Hook for managing modal states with minimal boilerplate
 *
 * @param initialState - Object defining initial state for all modals
 * @returns API object with state and helper methods
 *
 * @example
 * ```typescript
 * const modals = useModalState({
 *   confirmDelete: false,
 *   selectedItemId: null as string | null,
 *   editMode: false,
 * });
 *
 * // Open modal
 * modals.open('confirmDelete');
 *
 * // Close modal
 * modals.close('confirmDelete');
 *
 * // Set specific value
 * modals.set('selectedItemId', '123');
 *
 * // Batch update
 * modals.batch({ confirmDelete: true, selectedItemId: '123' });
 *
 * // Access state
 * if (modals.state.confirmDelete) {
 *   return <ConfirmDeleteModal itemId={modals.state.selectedItemId} />;
 * }
 * ```
 */
export function useModalState<T extends Record<string, any>>(
  initialState: T
): ModalStateAPI<T> {
  const [state, setState] = useState<T>(initialState);

  const open = useCallback((key: keyof T) => {
    setState(prev => ({ ...prev, [key]: true }));
  }, []);

  const close = useCallback((key: keyof T) => {
    setState(prev => ({ ...prev, [key]: false }));
  }, []);

  const toggle = useCallback((key: keyof T) => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const batch = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    state,
    open,
    close,
    toggle,
    set,
    reset,
    batch,
  };
}

/**
 * Type-safe helper for creating modal state with proper typing
 *
 * @example
 * ```typescript
 * interface TaskModals {
 *   quickAdd: boolean;
 *   quickAddText: string;
 *   editingTask: string | null;
 *   showFilters: boolean;
 * }
 *
 * const modals = useModalState<TaskModals>({
 *   quickAdd: false,
 *   quickAddText: '',
 *   editingTask: null,
 *   showFilters: false,
 * });
 * ```
 */
export type ModalState<T> = T;
