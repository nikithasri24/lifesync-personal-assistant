/**
 * Unit tests for useMilestoneReminders hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMilestoneReminders } from '../useMilestoneReminders';
import { useToast } from '@/hooks/useToast';
import type { Milestone } from '../../types';

// Import mocked dependencies after vi.mock declarations
import { useUpcomingMilestones } from '../useMilestonesQuery';

// Mock dependencies
vi.mock('../useMilestonesQuery', () => ({
  useUpcomingMilestones: vi.fn(),
}));
vi.mock('@/hooks/useToast');
vi.mock('@/services/logger');
vi.mock('../utils/dateHelpers', () => ({
  getDaysUntil: vi.fn((dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useMilestoneReminders', () => {
  let queryClient: QueryClient;
  const mockToast = vi.fn();

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      showToast: vi.fn(),
    });

    // Mock current date to 2024-06-01 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Reminder notifications', () => {
    it('should show reminder for milestone happening today with reminder_day_of', async () => {
      const milestone: Milestone = {
        id: 'milestone-1',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01', // Today
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Today: Anniversary! 🎉', 'info');
      });

      // Check localStorage was set
      const key = `milestone_reminder_${milestone.id}_2024-06-01`;
      expect(localStorageMock.getItem(key)).toBe('true');
    });

    it('should show reminder for milestone tomorrow with reminder_1d', async () => {
      const milestone: Milestone = {
        id: 'milestone-2',
        user_id: 'user-123',
        connection_id: null,
        title: 'Birthday',
        milestone_date: '2024-06-02', // Tomorrow
        milestone_type: 'birthday',
        for_whom: 'me',
        is_recurring: true,
        reminder_day_of: false,
        reminder_1d: true,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Tomorrow: Birthday', 'info');
      });
    });

    it('should show reminder for milestone in 7 days with reminder_7d', async () => {
      const milestone: Milestone = {
        id: 'milestone-3',
        user_id: 'user-123',
        connection_id: null,
        title: 'Trip',
        milestone_date: '2024-06-08', // 7 days from now
        milestone_type: 'custom',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: false,
        reminder_1d: false,
        reminder_7d: true,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('In 1 week: Trip', 'info');
      });
    });

    it('should show reminder for milestone in 30 days with reminder_30d', async () => {
      const milestone: Milestone = {
        id: 'milestone-4',
        user_id: 'user-123',
        connection_id: null,
        title: 'Vacation',
        milestone_date: '2024-07-01', // 30 days from now
        milestone_type: 'custom',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: false,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('In 30 days: Vacation', 'info');
      });
    });

    it('should not show reminder if reminder flag is false', async () => {
      const milestone: Milestone = {
        id: 'milestone-5',
        user_id: 'user-123',
        connection_id: null,
        title: 'No Reminder',
        milestone_date: '2024-06-01', // Today
        milestone_type: 'custom',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: false, // Disabled
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate prevention', () => {
    it('should not show reminder twice for the same milestone on the same day', async () => {
      const milestone: Milestone = {
        id: 'milestone-6',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01',
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      // First render
      const { unmount } = renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Today: Anniversary! 🎉', 'info');
      });

      unmount();
      mockToast.mockClear();

      // Second render (should not show toast again)
      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('Configuration options', () => {
    it('should not run when enabled is false', async () => {
      const milestone: Milestone = {
        id: 'milestone-7',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01',
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: false }), {
        wrapper: createWrapper(),
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should check reminders at custom interval', async () => {
      const milestone: Milestone = {
        id: 'milestone-8',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01',
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      const checkIntervalMs = 5000; // 5 seconds
      renderHook(() => useMilestoneReminders({ enabled: true, checkIntervalMs }), {
        wrapper: createWrapper(),
      });

      // Should call immediately
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledTimes(1);
      });

      mockToast.mockClear();
      localStorageMock.clear();

      // Advance time by interval
      await vi.advanceTimersByTimeAsync(checkIntervalMs);

      // Should call again
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledTimes(1);
      });
    });

    it('should not run if toast is not available', async () => {
      const milestone: Milestone = {
        id: 'milestone-9',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01',
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      vi.mocked(useToast).mockReturnValue({
        toast: null,
        showToast: vi.fn(),
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up old reminder flags from localStorage', async () => {
      // Add old reminder flags (8 days ago)
      const oldDate = new Date('2024-05-24').toISOString().split('T')[0];
      localStorageMock.setItem(`milestone_reminder_old-1_${oldDate}`, 'true');
      localStorageMock.setItem(`milestone_reminder_old-2_${oldDate}`, 'true');

      // Add recent reminder flag (1 day ago)
      const recentDate = new Date('2024-05-31').toISOString().split('T')[0];
      localStorageMock.setItem(`milestone_reminder_recent-1_${recentDate}`, 'true');

      const milestone: Milestone = {
        id: 'milestone-10',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01',
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      // Old reminders should be removed
      expect(localStorageMock.getItem(`milestone_reminder_old-1_${oldDate}`)).toBeNull();
      expect(localStorageMock.getItem(`milestone_reminder_old-2_${oldDate}`)).toBeNull();

      // Recent reminder should still exist
      expect(localStorageMock.getItem(`milestone_reminder_recent-1_${recentDate}`)).toBe('true');
    });

    it('should clear interval on unmount', async () => {
      const milestone: Milestone = {
        id: 'milestone-11',
        user_id: 'user-123',
        connection_id: null,
        title: 'Anniversary',
        milestone_date: '2024-06-01',
        milestone_type: 'anniversary',
        for_whom: 'both',
        is_recurring: false,
        reminder_day_of: true,
        reminder_1d: false,
        reminder_7d: false,
        reminder_30d: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [milestone],
        isLoading: false,
        isError: false,
      } as any);

      const { unmount } = renderHook(() => useMilestoneReminders({ enabled: true, checkIntervalMs: 1000 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledTimes(1);
      });

      unmount();
      mockToast.mockClear();
      localStorageMock.clear();

      // Advance time by interval
      await vi.advanceTimersByTimeAsync(1000);

      // Should not call after unmount
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty milestones array', async () => {
      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should handle undefined milestones', async () => {
      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await vi.advanceTimersByTimeAsync(100);

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should handle multiple milestones with different reminder settings', async () => {
      const milestones: Milestone[] = [
        {
          id: 'milestone-today',
          user_id: 'user-123',
          connection_id: null,
          title: 'Today Event',
          milestone_date: '2024-06-01',
          milestone_type: 'custom',
          for_whom: 'both',
          is_recurring: false,
          reminder_day_of: true,
          reminder_1d: false,
          reminder_7d: false,
          reminder_30d: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'milestone-tomorrow',
          user_id: 'user-123',
          connection_id: null,
          title: 'Tomorrow Event',
          milestone_date: '2024-06-02',
          milestone_type: 'custom',
          for_whom: 'both',
          is_recurring: false,
          reminder_day_of: false,
          reminder_1d: true,
          reminder_7d: false,
          reminder_30d: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useUpcomingMilestones).mockReturnValue({
        data: milestones,
        isLoading: false,
        isError: false,
      } as any);

      renderHook(() => useMilestoneReminders({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith('Today: Today Event! 🎉', 'info');
        expect(mockToast).toHaveBeenCalledWith('Tomorrow: Tomorrow Event', 'info');
        expect(mockToast).toHaveBeenCalledTimes(2);
      });
    });
  });
});
