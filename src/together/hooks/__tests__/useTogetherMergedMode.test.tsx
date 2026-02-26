/**
 * Unit tests for useTogetherMergedMode hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useMergedMilestonesConnection,
  useMergedMessagesConnection,
  useMergedChallengesConnection,
  clearTogetherMergedConnectionCache,
  getTogetherMergedConnection,
} from '../useTogetherMergedMode';
import { getMergedConnectionId } from '@/shared/api/SharedDataProvider';

// Mock dependencies
vi.mock('@/shared/api/SharedDataProvider');
vi.mock('@/services/logger');

describe('useTogetherMergedMode', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearTogetherMergedConnectionCache();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1, // Allow 1 retry to match hook configuration
          retryDelay: 0, // No delay for faster tests
        },
        mutations: { retry: false },
      },
    });
  });

  describe('getTogetherMergedConnection', () => {
    it('should return merged connection when available', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const result = await getTogetherMergedConnection('milestones');

      expect(result).toEqual(mockConnection);
      expect(getMergedConnectionId).toHaveBeenCalledWith('goals');
    });

    it('should return null when no merged connection', async () => {
      vi.mocked(getMergedConnectionId).mockResolvedValue(null);

      const result = await getTogetherMergedConnection('messages');

      expect(result).toBeNull();
    });

    it('should cache results to avoid repeated API calls', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      // First call
      const result1 = await getTogetherMergedConnection('milestones');
      expect(result1).toEqual(mockConnection);
      expect(getMergedConnectionId).toHaveBeenCalledTimes(1);

      // Second call (should use cache)
      const result2 = await getTogetherMergedConnection('milestones');
      expect(result2).toEqual(mockConnection);
      expect(getMergedConnectionId).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should use separate cache for different modules', async () => {
      const mockConnection1 = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };
      const mockConnection2 = {
        connectionId: 'conn-789',
        partnerId: 'user-999',
      };

      vi.mocked(getMergedConnectionId)
        .mockResolvedValueOnce(mockConnection1)
        .mockResolvedValueOnce(mockConnection2);

      const result1 = await getTogetherMergedConnection('milestones');
      const result2 = await getTogetherMergedConnection('messages');

      expect(result1).toEqual(mockConnection1);
      expect(result2).toEqual(mockConnection2);
      expect(getMergedConnectionId).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when clearTogetherMergedConnectionCache is called', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      // First call
      await getTogetherMergedConnection('milestones');
      expect(getMergedConnectionId).toHaveBeenCalledTimes(1);

      // Clear cache
      clearTogetherMergedConnectionCache();

      // Second call (should not use cache)
      await getTogetherMergedConnection('milestones');
      expect(getMergedConnectionId).toHaveBeenCalledTimes(2);
    });
  });

  describe('useMergedMilestonesConnection', () => {
    it('should fetch merged connection for milestones', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const { result } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConnection);
      expect(getMergedConnectionId).toHaveBeenCalledWith('goals');
    });

    it('should return null when no connection', async () => {
      vi.mocked(getMergedConnectionId).mockResolvedValue(null);

      const { result } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Connection failed');
      vi.mocked(getMergedConnectionId).mockRejectedValue(error);

      const { result } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should use React Query cache', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const { result: result1 } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      expect(getMergedConnectionId).toHaveBeenCalledTimes(1);

      // Second hook should use React Query cache
      const { result: result2 } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should not call getMergedConnectionId again (uses React Query cache)
      expect(getMergedConnectionId).toHaveBeenCalledTimes(1);
      expect(result2.current.data).toEqual(mockConnection);
    });
  });

  describe('useMergedMessagesConnection', () => {
    it('should fetch merged connection for messages', async () => {
      const mockConnection = {
        connectionId: 'conn-456',
        partnerId: 'user-789',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const { result } = renderHook(() => useMergedMessagesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConnection);
    });

    it('should return null when no connection', async () => {
      vi.mocked(getMergedConnectionId).mockResolvedValue(null);

      const { result } = renderHook(() => useMergedMessagesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      vi.mocked(getMergedConnectionId).mockRejectedValue(error);

      const { result } = renderHook(() => useMergedMessagesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useMergedChallengesConnection', () => {
    it('should fetch merged connection for challenges', async () => {
      const mockConnection = {
        connectionId: 'conn-999',
        partnerId: 'user-111',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const { result } = renderHook(() => useMergedChallengesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConnection);
    });

    it('should return null when no connection', async () => {
      vi.mocked(getMergedConnectionId).mockResolvedValue(null);

      const { result } = renderHook(() => useMergedChallengesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      vi.mocked(getMergedConnectionId).mockRejectedValue(error);

      const { result } = renderHook(() => useMergedChallengesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Query configuration', () => {
    it('should use correct staleTime and gcTime', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const { result } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Data should be cached and not refetched immediately
      const { result: result2 } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should only call once due to staleTime
      expect(getMergedConnectionId).toHaveBeenCalledTimes(1);
    });

    it('should retry once on failure', async () => {
      vi.mocked(getMergedConnectionId)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({
          connectionId: 'conn-123',
          partnerId: 'user-456',
        });

      const { result } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have retried once
      expect(getMergedConnectionId).toHaveBeenCalledTimes(2);
    });
  });

  describe('Module-specific query keys', () => {
    it('should use unique query keys for each module', async () => {
      const mockConnection = {
        connectionId: 'conn-123',
        partnerId: 'user-456',
      };

      vi.mocked(getMergedConnectionId).mockResolvedValue(mockConnection);

      const { result: milestonesResult } = renderHook(() => useMergedMilestonesConnection(), {
        wrapper: createWrapper(),
      });

      const { result: messagesResult } = renderHook(() => useMergedMessagesConnection(), {
        wrapper: createWrapper(),
      });

      const { result: challengesResult } = renderHook(() => useMergedChallengesConnection(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(milestonesResult.current.isSuccess).toBe(true);
        expect(messagesResult.current.isSuccess).toBe(true);
        expect(challengesResult.current.isSuccess).toBe(true);
      });

      // Should call getMergedConnectionId three times (once per module due to module-level cache)
      expect(getMergedConnectionId).toHaveBeenCalledTimes(3);

      // All should have same data
      expect(milestonesResult.current.data).toEqual(mockConnection);
      expect(messagesResult.current.data).toEqual(mockConnection);
      expect(challengesResult.current.data).toEqual(mockConnection);
    });
  });
});
