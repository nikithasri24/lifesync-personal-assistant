/**
 * Focus Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (timer state, view modes, filters, etc.)
 * All server data (focus sessions, stats, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useFocusQuery.ts:
 * - useFocusSessionsQuery() - Get all focus sessions
 * - useFocusSessionQuery(id) - Get single session
 * - useFocusStatsQuery() - Get focus statistics
 * - useCreateFocusSessionMutation() - Create session
 * - useUpdateFocusSessionMutation() - Update session
 * - useCompleteFocusSessionMutation() - Complete session
 * - useAbandonFocusSessionMutation() - Abandon session
 *
 * Additional React Query Features:
 * - Productivity analytics hooks
 * - Streak tracking hooks
 * - Time-of-day analysis hooks
 * - Focus goal tracking
 *
 * Benefits of React Query:
 * - Better session data caching and synchronization
 * - Optimistic updates for session completion
 * - Automatic invalidation when sessions change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface FocusSlice {
  // UI State only - no server data!
  focusViewMode: 'timer' | 'sessions' | 'stats' | 'calendar';
  focusTimerState: 'idle' | 'running' | 'paused' | 'break';
  focusTimerDuration: number; // in seconds
  focusTimerElapsed: number; // in seconds
  focusBreakDuration: number; // in seconds
  focusFilterDateRange: { start: string; end: string } | null;
  focusFilterStatus: 'all' | 'completed' | 'abandoned';
  focusSortBy: 'start_time' | 'duration' | 'productivity_score';
  focusSortOrder: 'asc' | 'desc';
  focusSelectedSession: string | null;
  focusShowBreaks: boolean;

  // UI Actions
  setFocusViewMode: (mode: 'timer' | 'sessions' | 'stats' | 'calendar') => void;
  setFocusTimerState: (state: 'idle' | 'running' | 'paused' | 'break') => void;
  setFocusTimerDuration: (duration: number) => void;
  setFocusTimerElapsed: (elapsed: number) => void;
  setFocusBreakDuration: (duration: number) => void;
  setFocusFilterDateRange: (range: { start: string; end: string } | null) => void;
  setFocusFilterStatus: (status: 'all' | 'completed' | 'abandoned') => void;
  setFocusSortBy: (sortBy: 'start_time' | 'duration' | 'productivity_score') => void;
  setFocusSortOrder: (order: 'asc' | 'desc') => void;
  setFocusSelectedSession: (sessionId: string | null) => void;
  setFocusShowBreaks: (show: boolean) => void;
  resetFocusFilters: () => void;
  resetFocusTimer: () => void;
}

export const createFocusSlice: StateCreator<FocusSlice, [], [], FocusSlice> = (set) => ({
  // Initial UI state
  focusViewMode: 'timer',
  focusTimerState: 'idle',
  focusTimerDuration: 25 * 60, // 25 minutes default
  focusTimerElapsed: 0,
  focusBreakDuration: 5 * 60, // 5 minutes default
  focusFilterDateRange: null,
  focusFilterStatus: 'all',
  focusSortBy: 'start_time',
  focusSortOrder: 'desc',
  focusSelectedSession: null,
  focusShowBreaks: true,

  // UI Actions
  setFocusViewMode: (mode) => set({ focusViewMode: mode }),
  setFocusTimerState: (state) => set({ focusTimerState: state }),
  setFocusTimerDuration: (duration) => set({ focusTimerDuration: duration }),
  setFocusTimerElapsed: (elapsed) => set({ focusTimerElapsed: elapsed }),
  setFocusBreakDuration: (duration) => set({ focusBreakDuration: duration }),
  setFocusFilterDateRange: (range) => set({ focusFilterDateRange: range }),
  setFocusFilterStatus: (status) => set({ focusFilterStatus: status }),
  setFocusSortBy: (sortBy) => set({ focusSortBy: sortBy }),
  setFocusSortOrder: (order) => set({ focusSortOrder: order }),
  setFocusSelectedSession: (sessionId) => set({ focusSelectedSession: sessionId }),
  setFocusShowBreaks: (show) => set({ focusShowBreaks: show }),
  resetFocusFilters: () =>
    set({
      focusFilterDateRange: null,
      focusFilterStatus: 'all',
      focusSelectedSession: null,
    }),
  resetFocusTimer: () =>
    set({
      focusTimerState: 'idle',
      focusTimerElapsed: 0,
    }),
});
