/**
 * UI Slice
 *
 * Manages UI-only state (not persisted data):
 * - Active view/page
 * - Sidebar state
 * - Theme
 * - Week starts on preference
 */

import { type StateCreator } from 'zustand';

export type ViewKey =
  | 'dashboard'
  | 'focus'
  | 'tasks'
  | 'todos'
  | 'habits'
  | 'goals'
  | 'journal'
  | 'notes'
  | 'finances'
  | 'analytics'
  | 'mood'
  | 'calendar'
  | 'meals'
  | 'nutrition'
  | 'shopping'
  | 'travel'
  | 'personal'
  | 'skincare'
  | 'health'
  | 'visa'
  | 'projects'
  | 'assistant'
  | 'scheduler'
  | 'trip-planner'
  | 'shared';

export interface UISlice {
  // State
  activeView: ViewKey;
  sidebarCollapsed: boolean;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  mealOptions: { breakfast: string[]; lunch: string[]; dinner: string[]; snack: string[] };

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setWeekStartsOn: (day: 0 | 1) => void;
  addMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void;
  removeMealOption: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', name: string) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  // Initial state
  activeView: 'dashboard',
  sidebarCollapsed: false,
  weekStartsOn: 0,
  mealOptions: { breakfast: [], lunch: [], dinner: [], snack: [] },

  // Actions
  setActiveView: (view) => set({ activeView: view }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setWeekStartsOn: (day) => set({ weekStartsOn: day }),

  addMealOption: (mealType, name) => {
    const cleaned = name.trim();
    if (!cleaned) return;
    set((state) => {
      const next = { ...state.mealOptions };
      const list = new Set(next[mealType]);
      list.add(cleaned);
      next[mealType] = Array.from(list);
      return { mealOptions: next };
    });
  },

  removeMealOption: (mealType, name) => {
    set((state) => {
      const next = { ...state.mealOptions };
      next[mealType] = (next[mealType] || []).filter((n) => n !== name);
      return { mealOptions: next };
    });
  },
});
