/**
 * Store helper utilities for 75 Hard actions
 */

import { useRealAppStore, type RealAppState } from '../../stores/useRealAppStore';

/**
 * Helper to get current store state
 */
export const getStore = (): RealAppState => useRealAppStore.getState();

/**
 * Helper to set store state
 */
export const setStore = (updates: RealAppState | Partial<RealAppState> | ((state: RealAppState) => RealAppState | Partial<RealAppState>)): void => useRealAppStore.setState(updates);
