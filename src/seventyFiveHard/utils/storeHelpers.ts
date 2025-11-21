/**
 * Store helper utilities for 75 Hard actions
 */

import { useRealAppStore } from '../../stores/useRealAppStore';

/**
 * Helper to get current store state
 */
export const getStore = () => useRealAppStore.getState();

/**
 * Helper to set store state
 */
export const setStore = (updates: any) => useRealAppStore.setState(updates);
