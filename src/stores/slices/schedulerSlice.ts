/**
 * Scheduler Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, selected date, filters, etc.)
 * All server data (schedule blocks, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useSchedulerQuery.ts (if exists) or create them:
 * - useScheduleBlocksQuery() - Get all schedule blocks
 * - useScheduleBlockQuery(id) - Get single block
 * - useScheduleForDateQuery(date) - Get blocks for specific date
 * - useCreateScheduleBlockMutation() - Create block
 * - useUpdateScheduleBlockMutation() - Update block
 * - useDeleteScheduleBlockMutation() - Delete block
 * - useFindFreeTimeSlotsQuery() - Find free time slots
 *
 * Additional React Query Features:
 * - Recurring block management
 * - Conflict detection hooks
 * - Time optimization hooks
 * - Schedule templates
 *
 * Benefits of React Query:
 * - Better schedule data caching and synchronization
 * - Optimistic updates for block changes
 * - Automatic invalidation when schedule changes
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface SchedulerSlice {
  // UI State only - no server data!
  schedulerViewMode: 'day' | 'week' | 'timeline';
  schedulerSelectedDate: string; // ISO date string
  schedulerFilterCategory: string | null;
  schedulerFilterBlockType: 'all' | 'work' | 'personal' | 'break' | 'meeting';
  schedulerShowCompleted: boolean;
  schedulerTimeFormat: '12h' | '24h';
  schedulerSelectedBlock: string | null;
  schedulerDraggedBlock: string | null;

  // UI Actions
  setSchedulerViewMode: (mode: 'day' | 'week' | 'timeline') => void;
  setSchedulerSelectedDate: (date: string) => void;
  setSchedulerFilterCategory: (category: string | null) => void;
  setSchedulerFilterBlockType: (type: 'all' | 'work' | 'personal' | 'break' | 'meeting') => void;
  setSchedulerShowCompleted: (show: boolean) => void;
  setSchedulerTimeFormat: (format: '12h' | '24h') => void;
  setSchedulerSelectedBlock: (blockId: string | null) => void;
  setSchedulerDraggedBlock: (blockId: string | null) => void;
  resetSchedulerFilters: () => void;
}

export const createSchedulerSlice: StateCreator<SchedulerSlice, [], [], SchedulerSlice> = (set) => ({
  // Initial UI state
  schedulerViewMode: 'day',
  schedulerSelectedDate: new Date().toISOString().split('T')[0],
  schedulerFilterCategory: null,
  schedulerFilterBlockType: 'all',
  schedulerShowCompleted: false,
  schedulerTimeFormat: '12h',
  schedulerSelectedBlock: null,
  schedulerDraggedBlock: null,

  // UI Actions
  setSchedulerViewMode: (mode) => set({ schedulerViewMode: mode }),
  setSchedulerSelectedDate: (date) => set({ schedulerSelectedDate: date }),
  setSchedulerFilterCategory: (category) => set({ schedulerFilterCategory: category }),
  setSchedulerFilterBlockType: (type) => set({ schedulerFilterBlockType: type }),
  setSchedulerShowCompleted: (show) => set({ schedulerShowCompleted: show }),
  setSchedulerTimeFormat: (format) => set({ schedulerTimeFormat: format }),
  setSchedulerSelectedBlock: (blockId) => set({ schedulerSelectedBlock: blockId }),
  setSchedulerDraggedBlock: (blockId) => set({ schedulerDraggedBlock: blockId }),
  resetSchedulerFilters: () =>
    set({
      schedulerFilterCategory: null,
      schedulerFilterBlockType: 'all',
      schedulerShowCompleted: false,
      schedulerSelectedBlock: null,
    }),
});
