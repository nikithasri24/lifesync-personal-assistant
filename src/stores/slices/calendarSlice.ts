/**
 * Calendar Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, selected date, filters, etc.)
 * All server data (calendar events, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useCalendarQuery.ts:
 * - useCalendarEventsQuery() - Get all calendar events
 * - useCalendarEventQuery(id) - Get single event
 * - useCreateCalendarEventMutation() - Create event
 * - useUpdateCalendarEventMutation() - Update event
 * - useDeleteCalendarEventMutation() - Delete event
 * - useFindFreeSlotsQuery() - Find free time slots
 * - useConvertTaskToEventMutation() - Convert task to calendar event
 *
 * Additional React Query Features:
 * - Event recurrence management
 * - Conflict detection hooks
 * - Time zone handling
 * - Calendar sync hooks
 *
 * Benefits of React Query:
 * - Better calendar data caching and synchronization
 * - Optimistic updates for event changes
 * - Automatic invalidation when events change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface CalendarSlice {
  // UI State only - no server data!
  calendarViewMode: 'day' | 'week' | 'month' | 'agenda';
  calendarSelectedDate: string; // ISO date string
  calendarFilterCategory: string | null;
  calendarFilterEventType: 'all' | 'task' | 'event' | 'reminder';
  calendarShowWeekends: boolean;
  calendarShowCompleted: boolean;
  calendarTimeFormat: '12h' | '24h';
  calendarWeekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  calendarSelectedEvent: string | null;

  // UI Actions
  setCalendarViewMode: (mode: 'day' | 'week' | 'month' | 'agenda') => void;
  setCalendarSelectedDate: (date: string) => void;
  setCalendarFilterCategory: (category: string | null) => void;
  setCalendarFilterEventType: (type: 'all' | 'task' | 'event' | 'reminder') => void;
  setCalendarShowWeekends: (show: boolean) => void;
  setCalendarShowCompleted: (show: boolean) => void;
  setCalendarTimeFormat: (format: '12h' | '24h') => void;
  setCalendarWeekStartsOn: (day: 0 | 1) => void;
  setCalendarSelectedEvent: (eventId: string | null) => void;
  resetCalendarFilters: () => void;
  navigateToToday: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
}

export const createCalendarSlice: StateCreator<CalendarSlice, [], [], CalendarSlice> = (set, get) => ({
  // Initial UI state
  calendarViewMode: 'week',
  calendarSelectedDate: new Date().toISOString().split('T')[0],
  calendarFilterCategory: null,
  calendarFilterEventType: 'all',
  calendarShowWeekends: true,
  calendarShowCompleted: false,
  calendarTimeFormat: '12h',
  calendarWeekStartsOn: 0, // Sunday
  calendarSelectedEvent: null,

  // UI Actions
  setCalendarViewMode: (mode) => set({ calendarViewMode: mode }),
  setCalendarSelectedDate: (date) => set({ calendarSelectedDate: date }),
  setCalendarFilterCategory: (category) => set({ calendarFilterCategory: category }),
  setCalendarFilterEventType: (type) => set({ calendarFilterEventType: type }),
  setCalendarShowWeekends: (show) => set({ calendarShowWeekends: show }),
  setCalendarShowCompleted: (show) => set({ calendarShowCompleted: show }),
  setCalendarTimeFormat: (format) => set({ calendarTimeFormat: format }),
  setCalendarWeekStartsOn: (day) => set({ calendarWeekStartsOn: day }),
  setCalendarSelectedEvent: (eventId) => set({ calendarSelectedEvent: eventId }),
  resetCalendarFilters: () =>
    set({
      calendarFilterCategory: null,
      calendarFilterEventType: 'all',
      calendarShowCompleted: false,
      calendarSelectedEvent: null,
    }),
  navigateToToday: () => set({ calendarSelectedDate: new Date().toISOString().split('T')[0] }),
  navigateNext: () => {
    const { calendarSelectedDate, calendarViewMode } = get();
    const currentDate = new Date(calendarSelectedDate);
    let newDate: Date;
    
    switch (calendarViewMode) {
      case 'day':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        break;
      case 'week':
        newDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
        break;
      case 'month':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      default:
        newDate = currentDate;
    }
    
    set({ calendarSelectedDate: newDate.toISOString().split('T')[0] });
  },
  navigatePrevious: () => {
    const { calendarSelectedDate, calendarViewMode } = get();
    const currentDate = new Date(calendarSelectedDate);
    let newDate: Date;
    
    switch (calendarViewMode) {
      case 'day':
        newDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
        break;
      case 'week':
        newDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case 'month':
        newDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        break;
      default:
        newDate = currentDate;
    }
    
    set({ calendarSelectedDate: newDate.toISOString().split('T')[0] });
  },
});
