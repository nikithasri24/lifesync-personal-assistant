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
  | 'habits'
  | 'goals'
  | 'journal'
  | 'notes'
  | 'finances'
  | 'analytics'
  | 'mood'
  | 'calendar'
  | 'meals'
  | 'shopping'
  | 'travel'
  | 'personal'
  | 'skincare'
  | 'health';

export interface UISlice {
  // State
  activeView: ViewKey;
  sidebarCollapsed: boolean;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setWeekStartsOn: (day: 0 | 1) => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  // Initial state
  activeView: 'dashboard',
  sidebarCollapsed: false,
  weekStartsOn: 0,

  // Actions
  setActiveView: (view) => set({ activeView: view }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setWeekStartsOn: (day) => set({ weekStartsOn: day }),
});
