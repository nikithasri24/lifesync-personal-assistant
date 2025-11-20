/**
 * UI Store Slice
 *
 * Manages global UI state including navigation, settings, and toast messages.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';

// View keys for navigation
export type ViewKey =
  | 'dashboard'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'period'
  | 'todos'
  | 'notes'
  | 'projects'
  | 'journal'
  | 'goals'
  | 'travel'
  | 'visa'
  | 'trip-planner'
  | 'finances'
  | 'shopping'
  | 'meals'
  | 'shared'
  | 'seventy-five-hard'
  | 'skincare';

// State interface
export interface UISlice {
  // State - Navigation
  activeView: ViewKey;
  sidebarCollapsed: boolean;

  // State - Global Settings
  weekStartsOn: 0 | 1;
  mealOptions: { breakfast: string[]; lunch: string[]; dinner: string[]; snack: string[] };

  // State - Loading indicators
  loading: boolean;

  // State - Toast notifications
  globalToast: { message: string; type?: 'info' | 'success' | 'error' } | null;

  // Actions - Navigation
  setActiveView: (view: ViewKey) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions - Settings
  setWeekStartsOn: (ws: 0 | 1) => void;
  addMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void;
  removeMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void;

  // Actions - Toast
  showGlobalToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearGlobalToast: () => void;
}

// Create the slice
export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  // Initial state - Navigation
  activeView: (() => {
    try {
      const raw = localStorage.getItem('lifesync:activeView');
      return (raw as ViewKey) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  })(),
  sidebarCollapsed: false,

  // Initial state - Settings
  weekStartsOn: (() => {
    try {
      const raw = localStorage.getItem('lifesync:settings:weekStartsOn');
      const n = raw == null ? 0 : Number(raw);
      return n === 1 ? 1 : 0;
    } catch {
      return 0;
    }
  })(),
  mealOptions: (() => {
    try {
      const raw = localStorage.getItem('lifesync:mealOptions');
      const parsed = raw ? JSON.parse(raw) : null;
      const empty = { breakfast: [], lunch: [], dinner: [], snack: [] as string[] };
      if (!parsed) return empty;
      return { ...empty, ...parsed };
    } catch {
      return { breakfast: [], lunch: [], dinner: [], snack: [] };
    }
  })(),

  // Initial state - Loading
  loading: false,

  // Initial state - Toast
  globalToast: null,

  // ==================== Navigation ====================

  setActiveView: (view) => {
    set({ activeView: view });
    try {
      localStorage.setItem('lifesync:activeView', view);
    } catch {}
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // ==================== Settings ====================

  setWeekStartsOn: (ws: 0 | 1) => {
    set({ weekStartsOn: ws });
    try {
      localStorage.setItem('lifesync:settings:weekStartsOn', String(ws));
    } catch {}
  },

  addMealOption: (mealType, name) => {
    set((state) => {
      const cleaned = name.trim();
      if (!cleaned) return {};
      const next = { ...state.mealOptions };
      const list = new Set(next[mealType]);
      list.add(cleaned);
      next[mealType] = Array.from(list);
      try {
        localStorage.setItem('lifesync:mealOptions', JSON.stringify(next));
      } catch {}
      return { mealOptions: next };
    });
  },

  removeMealOption: (mealType, name) => {
    set((state) => {
      const next = { ...state.mealOptions };
      next[mealType] = (next[mealType] || []).filter((n) => n !== name);
      try {
        localStorage.setItem('lifesync:mealOptions', JSON.stringify(next));
      } catch {}
      return { mealOptions: next };
    });
  },

  // ==================== Toast ====================

  showGlobalToast: (message, type = 'info') => set({ globalToast: { message, type } }),
  clearGlobalToast: () => set({ globalToast: null }),
});
