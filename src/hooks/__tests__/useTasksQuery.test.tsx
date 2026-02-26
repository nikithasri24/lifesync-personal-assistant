import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  usePermanentlyDeleteTask,
  useRestoreTask,
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../useTasksQuery';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        is: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'test-user-id' } },
          error: null,
        })
      ),
    },
  },
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

// Mock toast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('useTasksQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Query Hooks Structure', () => {
    it('useTasks should return useQuery result', () => {
      const { result } = renderHook(() => useTasks(), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('error');
    });

    it('useTask should return useQuery result', () => {
      const { result } = renderHook(() => useTask('task-123'), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
    });

    it('useTask should not fetch when ID is undefined', () => {
      const { result } = renderHook(() => useTask(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('useProjects should return useQuery result', () => {
      const { result } = renderHook(() => useProjects(), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
    });

    it('useProject should return useQuery result', () => {
      const { result } = renderHook(() => useProject('project-123'), { wrapper });

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isError');
    });
  });

  describe('Mutation Hooks Structure', () => {
    it('useCreateTask should return useMutation result', () => {
      const { result } = renderHook(() => useCreateTask(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
    });

    it('useUpdateTask should return useMutation result', () => {
      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('isSuccess');
    });

    it('useDeleteTask should return useMutation result', () => {
      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isError');
    });

    it('usePermanentlyDeleteTask should return useMutation result', () => {
      const { result } = renderHook(() => usePermanentlyDeleteTask(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });

    it('useRestoreTask should return useMutation result', () => {
      const { result } = renderHook(() => useRestoreTask(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });

    it('useCreateProject should return useMutation result', () => {
      const { result } = renderHook(() => useCreateProject(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });

    it('useUpdateProject should return useMutation result', () => {
      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });

    it('useDeleteProject should return useMutation result', () => {
      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      expect(result.current).toHaveProperty('mutate');
      expect(result.current).toHaveProperty('isPending');
    });
  });

  describe('Hook Integration', () => {
    it('useTasks should accept filter parameters', () => {
      const { result } = renderHook(
        () => useTasks({ status: 'todo', priority: 'high' }),
        { wrapper }
      );

      expect(result.current).toHaveProperty('data');
    });

    it('useProjects should accept filter parameters', () => {
      const { result } = renderHook(
        () => useProjects({ archived: false }),
        { wrapper }
      );

      expect(result.current).toHaveProperty('data');
    });
  });
});
