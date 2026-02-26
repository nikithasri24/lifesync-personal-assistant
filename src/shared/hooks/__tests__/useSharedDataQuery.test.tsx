/**
 * Unit tests for useSharedDataQuery hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSharedDataQuery } from '../useSharedDataQuery';
import * as SharedDataProvider from '../../api/SharedDataProvider';
import type { SharedData } from '../../api/SharedDataProvider';

// Mock SharedDataProvider
vi.mock('../../api/SharedDataProvider', () => ({
  fetchSharedDashboardData: vi.fn(),
}));

// Mock logger
vi.mock('@/services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSharedDataQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch shared data successfully', async () => {
    const mockData: SharedData = {
      meals: [
        {
          id: 'meal-1',
          name: 'Breakfast Plan',
          sharedBy: {
            id: 'partner-123',
            name: 'Partner',
          },
        },
      ],
      todos: [
        {
          id: 'task-1',
          title: 'Buy groceries',
          sharedBy: {
            id: 'partner-123',
            name: 'Partner',
          },
        },
      ],
    };

    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.data?.meals).toHaveLength(1);
    expect(result.current.data?.todos).toHaveLength(1);
  });

  it('should handle empty shared data', async () => {
    const mockData: SharedData = {};

    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({});
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch shared data');

    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should show loading state initially', () => {
    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should use correct query key', () => {
    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue({});

    renderHook(() => useSharedDataQuery(), { wrapper });

    const queries = queryClient.getQueryCache().getAll();
    expect(queries).toHaveLength(1);
    expect(queries[0].queryKey).toEqual(['shared-data']);
  });

  it('should have 5 minute stale time', async () => {
    const mockData: SharedData = {};

    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const query = queryClient.getQueryCache().find({ queryKey: ['shared-data'] });
    expect(query?.options.staleTime).toBe(1000 * 60 * 5);
  });

  it('should be enabled by default', async () => {
    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue({});

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(SharedDataProvider.fetchSharedDashboardData).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple modules in shared data', async () => {
    const mockData: SharedData = {
      meals: [
        {
          id: 'meal-1',
          name: 'Breakfast',
          sharedBy: { id: 'partner-1', name: 'Partner' },
        },
      ],
      shopping: [
        {
          id: 'list-1',
          name: 'Groceries',
          sharedBy: { id: 'partner-1', name: 'Partner' },
        },
      ],
      todos: [
        {
          id: 'task-1',
          title: 'Task 1',
          sharedBy: { id: 'partner-1', name: 'Partner' },
        },
      ],
      goals: [
        {
          id: 'goal-1',
          title: 'Goal 1',
          sharedBy: { id: 'partner-1', name: 'Partner' },
        },
      ],
      habits: [
        {
          id: 'habit-1',
          name: 'Habit 1',
          sharedBy: { id: 'partner-1', name: 'Partner' },
        },
      ],
    };

    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.meals).toHaveLength(1);
    expect(result.current.data?.shopping).toHaveLength(1);
    expect(result.current.data?.todos).toHaveLength(1);
    expect(result.current.data?.goals).toHaveLength(1);
    expect(result.current.data?.habits).toHaveLength(1);
  });

  it('should refetch when invalidated', async () => {
    const mockData: SharedData = {
      meals: [
        {
          id: 'meal-1',
          name: 'Breakfast',
          sharedBy: { id: 'partner-1', name: 'Partner' },
        },
      ],
    };

    vi.mocked(SharedDataProvider.fetchSharedDashboardData).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSharedDataQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(SharedDataProvider.fetchSharedDashboardData).toHaveBeenCalledTimes(1);

    // Invalidate and refetch
    await queryClient.invalidateQueries({ queryKey: ['shared-data'] });

    await waitFor(() => {
      expect(SharedDataProvider.fetchSharedDashboardData).toHaveBeenCalledTimes(2);
    });
  });
});
