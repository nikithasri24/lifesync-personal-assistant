/**
 * Inbox React Query Hooks
 * Provides data fetching and mutations for the quick capture inbox
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInboxItems,
  createInboxItem,
  dismissInboxItem,
  markAsProcessed,
  deleteInboxItem,
  getPendingCount,
  getInboxStats,
} from '@/services/inbox';
import type { InboxItem, CreateInboxItemInput, InboxStats } from '@/services/inbox';
import { queryOptions } from '@/lib/react-query';

// Query keys
const inboxKeys = {
  all: ['inbox'] as const,
  items: (status?: string) => [...inboxKeys.all, 'items', status] as const,
  pending: () => [...inboxKeys.all, 'pending'] as const,
  stats: () => [...inboxKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch inbox items
 */
export function useInboxItems(status?: 'pending' | 'processed' | 'dismissed') {
  return useQuery({
    queryKey: inboxKeys.items(status),
    queryFn: () => getInboxItems(status),
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to get pending inbox count (for badges)
 */
export function usePendingInboxCount() {
  return useQuery({
    queryKey: inboxKeys.pending(),
    queryFn: getPendingCount,
    staleTime: 30 * 1000, // 30 seconds - check frequently for new items
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to get inbox statistics
 */
export function useInboxStats() {
  return useQuery({
    queryKey: inboxKeys.stats(),
    queryFn: getInboxStats,
    staleTime: queryOptions.user.staleTime,
    gcTime: queryOptions.user.gcTime,
  });
}

/**
 * Hook to create a new inbox item (quick capture)
 */
export function useCreateInboxItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateInboxItemInput) => createInboxItem(input),
    onSuccess: () => {
      // Invalidate all inbox queries
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

/**
 * Hook to dismiss an inbox item
 */
export function useDismissInboxItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemId: string) => dismissInboxItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

/**
 * Hook to mark inbox item as processed
 */
export function useMarkInboxProcessed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, processedToType, processedToId }: {
      itemId: string;
      processedToType: string;
      processedToId: string;
    }) => markAsProcessed(itemId, processedToType, processedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

/**
 * Hook to delete an inbox item
 */
export function useDeleteInboxItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemId: string) => deleteInboxItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

