/**
 * Unit tests for useTogetherRealtime hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTogetherRealtime } from '../useTogetherRealtime';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(),
  },
}));
vi.mock('@/hooks/useToast');
vi.mock('@/services/logger');

// Mock console.log to suppress output during tests
const originalConsoleLog = console.log;

describe('useTogetherRealtime', () => {
  let queryClient: QueryClient;
  const mockShowToast = vi.fn();
  const mockUnsubscribe = vi.fn();
  const mockOn = vi.fn();
  const mockSubscribe = vi.fn();
  const mockChannel = vi.fn();

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn(); // Suppress console.log during tests

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(useToast).mockReturnValue({
      showToast: mockShowToast,
      toast: vi.fn(),
    });

    // Setup Supabase channel mocks
    mockOn.mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    });

    mockSubscribe.mockImplementation((callback) => {
      // Call the callback with SUBSCRIBED status immediately
      if (typeof callback === 'function') {
        callback('SUBSCRIBED');
      }
      return {
        unsubscribe: mockUnsubscribe,
      };
    });

    mockChannel.mockReturnValue({
      on: mockOn,
      subscribe: mockSubscribe,
    });

    vi.mocked(supabase.channel).mockImplementation(mockChannel);

    // Mock timers for heartbeat interval
    vi.useFakeTimers();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.useRealTimers();
  });

  describe('Setup and teardown', () => {
    it('should not set up subscriptions when userId is missing', () => {
      renderHook(() => useTogetherRealtime(undefined, 'partner-123'), {
        wrapper: createWrapper(),
      });

      expect(mockChannel).not.toHaveBeenCalled();
    });

    it('should not set up subscriptions when partnerId is missing', () => {
      renderHook(() => useTogetherRealtime('user-123', undefined), {
        wrapper: createWrapper(),
      });

      expect(mockChannel).not.toHaveBeenCalled();
    });

    it('should set up subscriptions when both userId and partnerId are provided', () => {
      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Should create 3 channels: messages, milestones, rewards
      expect(mockChannel).toHaveBeenCalledWith('partner-messages-changes');
      expect(mockChannel).toHaveBeenCalledWith('milestones-changes');
      expect(mockChannel).toHaveBeenCalledWith('achievement-rewards-changes');
      expect(mockChannel).toHaveBeenCalledTimes(3);
    });

    it('should unsubscribe from all channels on unmount', () => {
      const { unmount } = renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });

    it('should clear heartbeat interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Partner messages subscriptions', () => {
    it('should subscribe to partner messages table', () => {
      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      expect(mockChannel).toHaveBeenCalledWith('partner-messages-changes');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_messages',
        },
        expect.any(Function)
      );
    });

    it('should show toast for incoming revealed message', () => {
      let messageCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'partner_messages') {
          messageCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate incoming revealed message
      messageCallback?.({
        eventType: 'INSERT',
        new: {
          id: 'msg-1',
          sender_id: 'partner-456',
          recipient_id: 'user-123',
          title: 'Love Note',
          status: 'revealed',
        },
        old: null,
      });

      expect(mockShowToast).toHaveBeenCalledWith('💌 Love Note', 'success');
    });

    it('should show toast for incoming scheduled message', () => {
      let messageCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'partner_messages') {
          messageCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate incoming scheduled message
      messageCallback?.({
        eventType: 'INSERT',
        new: {
          id: 'msg-2',
          sender_id: 'partner-456',
          recipient_id: 'user-123',
          title: 'Birthday Surprise',
          status: 'scheduled',
        },
        old: null,
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        '📅 Your partner scheduled a surprise message: "Birthday Surprise"',
        'info'
      );
    });

    it('should not show toast for messages sent by current user', () => {
      let messageCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'partner_messages') {
          messageCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate message sent by current user
      messageCallback?.({
        eventType: 'INSERT',
        new: {
          id: 'msg-3',
          sender_id: 'user-123',
          recipient_id: 'partner-456',
          title: 'My Message',
          status: 'revealed',
        },
        old: null,
      });

      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('should invalidate partner messages query on updates', () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      let messageCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'partner_messages') {
          messageCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate message update
      messageCallback?.({
        eventType: 'UPDATE',
        new: { id: 'msg-1', status: 'read' },
        old: { id: 'msg-1', status: 'revealed' },
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['partner-messages'],
      });
    });
  });

  describe('Milestones subscriptions', () => {
    it('should subscribe to milestones table', () => {
      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      expect(mockChannel).toHaveBeenCalledWith('milestones-changes');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
        },
        expect.any(Function)
      );
    });

    it('should show toast for new milestones', () => {
      let milestoneCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'milestones') {
          milestoneCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate new milestone
      milestoneCallback?.({
        eventType: 'INSERT',
        new: {
          id: 'milestone-1',
          name: 'Anniversary',
        },
        old: null,
      });

      expect(mockShowToast).toHaveBeenCalledWith('🎉 Milestone added: Anniversary', 'success');
    });

    it('should invalidate milestones query on updates', () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      let milestoneCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'milestones') {
          milestoneCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate milestone update
      milestoneCallback?.({
        eventType: 'UPDATE',
        new: { id: 'milestone-1' },
        old: { id: 'milestone-1' },
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['milestones'],
      });
    });
  });

  describe('Achievement rewards subscriptions', () => {
    it('should subscribe to achievement_rewards table', () => {
      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      expect(mockChannel).toHaveBeenCalledWith('achievement-rewards-changes');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievement_rewards',
        },
        expect.any(Function)
      );
    });

    it('should show toast for incoming rewards', () => {
      let rewardCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'achievement_rewards') {
          rewardCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate incoming reward
      rewardCallback?.({
        eventType: 'INSERT',
        new: {
          id: 'reward-1',
          recipient_id: 'user-123',
          title: 'Workout Challenge',
        },
        old: null,
      });

      expect(mockShowToast).toHaveBeenCalledWith('🏆 Workout Challenge', 'success');
    });

    it('should not show toast for rewards where user is not recipient', () => {
      let rewardCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'achievement_rewards') {
          rewardCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate reward for someone else
      rewardCallback?.({
        eventType: 'INSERT',
        new: {
          id: 'reward-2',
          recipient_id: 'partner-456',
          title: 'Challenge',
        },
        old: null,
      });

      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('should invalidate achievement rewards query on updates', () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
      let rewardCallback: Function | null = null;

      mockOn.mockImplementation((event, config, callback) => {
        if (config.table === 'achievement_rewards') {
          rewardCallback = callback;
        }
        return { on: mockOn, subscribe: mockSubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Simulate reward update
      rewardCallback?.({
        eventType: 'UPDATE',
        new: { id: 'reward-1' },
        old: { id: 'reward-1' },
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['achievement-rewards'],
      });
    });
  });

  describe('Subscription status handling', () => {
    it('should handle CHANNEL_ERROR status', () => {
      mockSubscribe.mockImplementation((callback) => {
        if (typeof callback === 'function') {
          callback('CHANNEL_ERROR', new Error('Channel error'));
        }
        return { unsubscribe: mockUnsubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Should not throw error, just log it
      expect(mockChannel).toHaveBeenCalledTimes(3);
    });

    it('should handle TIMED_OUT status', () => {
      mockSubscribe.mockImplementation((callback) => {
        if (typeof callback === 'function') {
          callback('TIMED_OUT');
        }
        return { unsubscribe: mockUnsubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Should not throw error, just log it
      expect(mockChannel).toHaveBeenCalledTimes(3);
    });

    it('should handle CLOSED status', () => {
      mockSubscribe.mockImplementation((callback) => {
        if (typeof callback === 'function') {
          callback('CLOSED');
        }
        return { unsubscribe: mockUnsubscribe };
      });

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      // Should not throw error, just log it
      expect(mockChannel).toHaveBeenCalledTimes(3);
    });
  });

  describe('Heartbeat', () => {
    it('should set up heartbeat interval', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should log heartbeat every 30 seconds', () => {
      const debugSpy = vi.mocked(logger.debug);
      debugSpy.mockClear();

      renderHook(() => useTogetherRealtime('user-123', 'partner-456'), {
        wrapper: createWrapper(),
      });

      const callsBefore = debugSpy.mock.calls.length;

      // Advance time by 30 seconds to trigger the heartbeat interval
      vi.advanceTimersByTime(30000);

      // logger.debug should have been called at least once more (heartbeat)
      expect(debugSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  describe('Re-subscription on parameter change', () => {
    it('should unsubscribe and resubscribe when userId changes', () => {
      const { rerender } = renderHook(
        ({ userId, partnerId }) => useTogetherRealtime(userId, partnerId),
        {
          wrapper: createWrapper(),
          initialProps: { userId: 'user-123', partnerId: 'partner-456' },
        }
      );

      expect(mockChannel).toHaveBeenCalledTimes(3);
      mockChannel.mockClear();

      // Change userId
      rerender({ userId: 'user-999', partnerId: 'partner-456' });

      // Should unsubscribe old channels
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);

      // Should subscribe to new channels
      expect(mockChannel).toHaveBeenCalledTimes(3);
    });

    it('should unsubscribe and resubscribe when partnerId changes', () => {
      const { rerender } = renderHook(
        ({ userId, partnerId }) => useTogetherRealtime(userId, partnerId),
        {
          wrapper: createWrapper(),
          initialProps: { userId: 'user-123', partnerId: 'partner-456' },
        }
      );

      expect(mockChannel).toHaveBeenCalledTimes(3);
      mockChannel.mockClear();

      // Change partnerId
      rerender({ userId: 'user-123', partnerId: 'partner-999' });

      // Should unsubscribe old channels
      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);

      // Should subscribe to new channels
      expect(mockChannel).toHaveBeenCalledTimes(3);
    });
  });
});
