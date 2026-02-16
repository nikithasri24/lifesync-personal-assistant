/**
 * Owner Information Hooks
 *
 * Provides hooks for getting current user ID, partner name, and merged permission status.
 * Used across features for merged mode support.
 */

import { useQuery } from '@tanstack/react-query';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
import type { ShareableModule } from '../shared/types/connections';
import { supabase } from '../lib/supabase';

/**
 * Hook to get current user ID from Supabase auth
 */
export function useCurrentUserId() {
  return useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity, // User ID never changes during session
    gcTime: Infinity,
  });
}

/**
 * Hook to get merged connection for a specific module
 */
export function useMergedConnection(module: ShareableModule) {
  return useQuery({
    queryKey: ['mergedConnection', module],
    queryFn: () => getMergedConnectionId(module),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
    retry: 1,                   // Only retry once on failure
  });
}

/**
 * Hook to get partner's name from merged connection
 * For shopping module
 */
export function usePartnerName(module: ShareableModule = 'shopping') {
  return useQuery({
    queryKey: ['partnerName', module],
    queryFn: async () => {
      const connection = await getMergedConnectionId(module);
      return connection?.partnerName ?? 'Partner';
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to check if merged mode is enabled (has active connection)
 * For shopping module
 */
export function useHasMergedPermission(module: ShareableModule = 'shopping') {
  return useQuery({
    queryKey: ['hasMergedPermission', module],
    queryFn: async () => {
      const connection = await getMergedConnectionId(module);
      return !!connection?.connectionId;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,
  });
}
